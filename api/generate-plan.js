import { AI_PLAN_V2_JSON_SCHEMA, parseAiPlanV2 } from '../src/services/aiPlanV2.js'
import rawDestinations from '../src/data/destinations.json' with { type: 'json' }
import { supplementalDestinations } from '../src/data/supplementalDestinations.js'

const OPENAI_RESPONSES_API_URL = 'https://api.openai.com/v1/responses'
const DEFAULT_MODEL = 'gpt-4.1-mini'
const DEFAULT_TIMEOUT_MS = 30_000
const DEFAULT_MAX_OUTPUT_TOKENS = 2400
const MAX_PROMPT_LENGTH = 8_000
const MAX_BODY_BYTES = 18_000
const MAX_DESTINATION_PAYLOAD_LENGTH = 12_000
const MAX_ARRAY_ITEMS = {
  tags: 12,
  touristSpots: 7,
  localFoodDetails: 5,
  localFoodCandidates: 10,
  nearbyDestinationHints: 5,
  nearbySuggestions: 5,
  photoSpots: 3,
}
const ALLOWED_TRAVEL_TYPES = new Set(['日帰り', '1泊2日', '2泊3日'])
const OUTPUT_TOKENS_BY_TRAVEL_TYPE = {
  日帰り: 2_200,
  '1泊2日': 3_000,
  '2泊3日': 3_800,
}
const REQUEST_WINDOWS = [
  { durationMs: 60_000, maxRequests: 2 },
  { durationMs: 10 * 60_000, maxRequests: 5 },
]
const requestHistoryByClient = new Map()
const FORMAL_DESTINATION_IDS = new Set([...rawDestinations, ...supplementalDestinations].map((destination) => (
  `${destination.prefecture}-${destination.city}`
)))

const readBoundedInteger = (value, fallback, minimum, maximum) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isInteger(parsed) && parsed >= minimum && parsed <= maximum ? parsed : fallback
}

const REQUEST_TIMEOUT_MS = readBoundedInteger(process.env.AI_REQUEST_TIMEOUT_MS, DEFAULT_TIMEOUT_MS, 10_000, 30_000)
const CONFIGURED_MAX_OUTPUT_TOKENS = readBoundedInteger(process.env.AI_MAX_OUTPUT_TOKENS, DEFAULT_MAX_OUTPUT_TOKENS, 1_500, 4_000)

const safeError = (response, status, code, message) => response.status(status).json({ ok: false, code, error: message, message })

const getHeader = (request, name) => {
  const value = request.headers?.[name] ?? request.headers?.[name.toLowerCase()]
  return Array.isArray(value) ? value[0] ?? '' : String(value ?? '')
}

const normalizeText = (value) => typeof value === 'string'
  ? value.split('').filter((character) => {
    const code = character.charCodeAt(0)
    return code === 10 || code === 13 || code >= 32
  }).join('').replace(/\s{3,}/g, '  ').trim()
  : ''

const getBody = (request) => {
  if (request.body && typeof request.body === 'object' && !Array.isArray(request.body)) return request.body
  if (typeof request.body !== 'string') return null
  try {
    const body = JSON.parse(request.body)
    return body && typeof body === 'object' && !Array.isArray(body) ? body : null
  } catch {
    return null
  }
}

const getAllowedOrigins = () => new Set([
  'https://droptrip.vercel.app',
  process.env.VITE_PUBLIC_SITE_URL,
  process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`,
  process.env.VERCEL_BRANCH_URL && `https://${process.env.VERCEL_BRANCH_URL}`,
  process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter(Boolean))

export const isAllowedOrigin = (origin, environment = process.env.NODE_ENV ?? 'production') => {
  if (!origin) return true // サーバー間通信や同一環境のヘルスチェックはOriginを送らないことがある。
  if (getAllowedOrigins().has(origin)) return true
  if (environment !== 'production') {
    try {
      const url = new URL(origin)
      return ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    } catch {
      return false
    }
  }
  return false
}

const getClientIdentifier = (request) => {
  const forwarded = getHeader(request, 'x-vercel-forwarded-for') || getHeader(request, 'x-forwarded-for')
  const client = forwarded.split(',')[0]?.trim()
  return client && client.length <= 120 ? client : 'unknown-client'
}

export const isSimpleRateLimited = (clientId, now = Date.now()) => {
  const previous = (requestHistoryByClient.get(clientId) ?? []).filter((entry) => now - entry < 10 * 60_000)
  const isLimited = REQUEST_WINDOWS.some(({ durationMs, maxRequests }) => (
    previous.filter((entry) => now - entry < durationMs).length >= maxRequests
  ))
  if (!isLimited) requestHistoryByClient.set(clientId, [...previous, now])
  return isLimited
}

const hasOversizedArray = (destination) => Object.entries(MAX_ARRAY_ITEMS).some(([key, limit]) => (
  destination[key] !== undefined && (!Array.isArray(destination[key]) || destination[key].length > limit)
))

const hasValidDestination = (destination) => {
  if (!destination || typeof destination !== 'object' || Array.isArray(destination)) return false
  const id = normalizeText(destination.id ?? destination.destinationId)
  const city = normalizeText(destination.city)
  const prefecture = normalizeText(destination.prefecture)
  if (!id || id.length > 160 || !city || city.length > 80 || !prefecture || prefecture.length > 40) return false
  if (id !== `${prefecture}-${city}` || !FORMAL_DESTINATION_IDS.has(id)) return false
  if (hasOversizedArray(destination)) return false
  const scheduleDays = destination.tripSchedule?.days
  return scheduleDays === undefined || (Number.isInteger(scheduleDays) && scheduleDays >= 1 && scheduleDays <= 8)
}

const extractOutputText = (response) => {
  if (typeof response.output_text === 'string' && response.output_text.trim()) return response.output_text.trim()
  const content = response.output
    ?.flatMap((item) => item.content ?? [])
    .find((item) => item.type === 'output_text' && typeof item.text === 'string' && item.text.trim())
  return content?.text?.trim() ?? ''
}

export const isOutputTruncated = (response) => (
  response?.status === 'incomplete'
  || Boolean(response?.incomplete_details)
  || response?.output?.some((item) => item?.status === 'incomplete' || Boolean(item?.incomplete_details))
  || response?.choices?.some((choice) => choice?.finish_reason === 'length')
)

const getMaxOutputTokens = (travelType) => Math.max(
  OUTPUT_TOKENS_BY_TRAVEL_TYPE[travelType] ?? OUTPUT_TOKENS_BY_TRAVEL_TYPE.日帰り,
  CONFIGURED_MAX_OUTPUT_TOKENS,
)

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return safeError(response, 405, 'METHOD_NOT_ALLOWED', 'この操作は利用できません。')
  }

  const contentType = getHeader(request, 'content-type')
  if (!contentType.toLowerCase().startsWith('application/json')) {
    return safeError(response, 415, 'INVALID_CONTENT_TYPE', 'リクエスト形式が正しくありません。')
  }
  const contentLength = Number.parseInt(getHeader(request, 'content-length'), 10)
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return safeError(response, 413, 'PAYLOAD_TOO_LARGE', 'リクエストが大きすぎます。')
  }
  if (!isAllowedOrigin(getHeader(request, 'origin'))) {
    return safeError(response, 403, 'ORIGIN_NOT_ALLOWED', 'このリクエストは利用できません。')
  }

  const body = getBody(request)
  if (!body) return safeError(response, 400, 'INVALID_JSON', 'リクエスト形式が正しくありません。')
  const bodyLength = (() => {
    try {
      return JSON.stringify(body).length
    } catch {
      return Number.POSITIVE_INFINITY
    }
  })()
  if (bodyLength > MAX_BODY_BYTES) return safeError(response, 413, 'PAYLOAD_TOO_LARGE', 'リクエストが大きすぎます。')

  const promptRaw = body.prompt
  const prompt = normalizeText(promptRaw)
  const destination = body.destination
  const travelType = body.travelType
  const destinationPayloadLength = (() => {
    try {
      return JSON.stringify(destination).length
    } catch {
      return Number.POSITIVE_INFINITY
    }
  })()
  if (typeof promptRaw !== 'string' || promptRaw.length > MAX_PROMPT_LENGTH || !prompt || prompt.length > MAX_PROMPT_LENGTH || destinationPayloadLength > MAX_DESTINATION_PAYLOAD_LENGTH || !hasValidDestination(destination) || typeof travelType !== 'string' || !ALLOWED_TRAVEL_TYPES.has(travelType)) {
    return safeError(response, 400, 'INVALID_INPUT', '入力内容を確認してから再度お試しください。')
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim()
  const model = process.env.OPENAI_PLAN_MODEL?.trim() || DEFAULT_MODEL
  if (!apiKey) return safeError(response, 503, 'OPENAI_NOT_CONFIGURED', 'AIプランを準備できませんでした。')

  const clientId = getClientIdentifier(request)
  if (isSimpleRateLimited(clientId)) {
    return safeError(response, 429, 'RATE_LIMITED', '少し時間をおいてから再度お試しください。')
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const openAiResponse = await fetch(OPENAI_RESPONSES_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        input: prompt,
        max_output_tokens: getMaxOutputTokens(travelType),
        temperature: 0.3,
        text: { format: { type: 'json_schema', name: 'droptrip_ai_plan_v2', strict: true, schema: AI_PLAN_V2_JSON_SCHEMA } },
      }),
      signal: controller.signal,
    })
    if (!openAiResponse.ok) {
      console.error('[generate-plan] OpenAI request failed', { status: openAiResponse.status })
      const code = openAiResponse.status === 429 ? 'RATE_LIMITED' : 'UPSTREAM_ERROR'
      return safeError(response, openAiResponse.status === 429 ? 429 : 502, code, 'AIプランを生成できませんでした。')
    }

    const openAiPayload = await openAiResponse.json()
    const usage = openAiPayload?.usage
    if (usage && typeof usage === 'object') console.info('[generate-plan] OpenAI usage', { inputTokens: usage.input_tokens, outputTokens: usage.output_tokens })
    if (isOutputTruncated(openAiPayload)) {
      console.error('[generate-plan] OpenAI output was truncated', { status: openAiPayload?.status, reason: openAiPayload?.incomplete_details?.reason })
      return safeError(response, 502, 'OUTPUT_TRUNCATED', '旅行プランの生成が途中で終了しました。もう一度お試しください。')
    }
    const rawPlan = extractOutputText(openAiPayload)
    if (!rawPlan) return safeError(response, 502, 'UPSTREAM_ERROR', 'AIプランを生成できませんでした。')
    const parsedPlan = parseAiPlanV2(rawPlan)
    if (parsedPlan) return response.status(200).json({ ok: true, plan: parsedPlan, model, format: 'ai-plan-v2' })

    console.error('[generate-plan] OpenAI response could not be normalized')
    return safeError(response, 502, 'AI_INVALID_RESPONSE', '旅行プランの整理に失敗しました。もう一度生成してください。')
  } catch (error) {
    console.error('[generate-plan] Request error', { name: error?.name ?? 'Error' })
    return safeError(response, error?.name === 'AbortError' ? 504 : 502, error?.name === 'AbortError' ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_ERROR', error?.name === 'AbortError' ? 'AIプランの生成に時間がかかっています。' : 'AIプランを生成できませんでした。')
  } finally {
    clearTimeout(timeoutId)
  }
}
