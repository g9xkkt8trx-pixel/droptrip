import { getOpenAiApiKey } from './openAiConfig'
import { createAiPlanTextFallback, normalizeAiPlanResponse, normalizeAiPlanV2 } from './aiPlanV2'

const SERVER_PLAN_API_URL = '/api/generate-plan'
const OPENAI_RESPONSES_API_URL = 'https://api.openai.com/v1/responses'
const REQUEST_TIMEOUT_MS = 35_000

// 公開版のモデルはサーバー側の OPENAI_PLAN_MODEL で管理する。
// この値はローカル直呼びフォールバック専用。
export const OPENAI_PLAN_MODEL = import.meta.env.VITE_OPENAI_PLAN_MODEL?.trim() || 'gpt-4.1-mini'

const extractOutputText = (response) => {
  if (typeof response.output_text === 'string' && response.output_text.trim()) {
    return response.output_text.trim()
  }

  const text = response.output
    ?.flatMap((item) => item.content ?? [])
    .find((content) => content.type === 'output_text' && typeof content.text === 'string' && content.text.trim())
    ?.text
    ?.trim()

  if (!text) throw new Error('OpenAI API response did not include output text')
  return text
}

const toClientPlan = (rawPlan) => {
  const normalized = normalizeAiPlanResponse(rawPlan)
  if (normalized.ok) return { plan: normalized.plan, format: 'ai-plan-v2' }
  const fallback = createAiPlanTextFallback(rawPlan)
  if (fallback?.summary) return { plan: fallback, format: 'legacy-text' }
  const error = new Error('AI plan response could not be normalized')
  error.code = 'AI_INVALID_RESPONSE'
  throw error
}

const requestServerPlan = async ({ prompt, destination, travelType, signal }) => {
  let response
  try {
    response = await fetch(SERVER_PLAN_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, destination, travelType }),
      signal,
    })
  } catch (error) {
    error.serverUnavailable = true
    throw error
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    const error = new Error('AI plan server request failed')
    error.code = typeof data.code === 'string' ? data.code : 'AI_SERVICE_ERROR'
    error.status = response.status
    error.serverUnavailable = response.status === 404 || response.status === 405
    throw error
  }

  const data = await response.json().catch(() => ({}))
  if (!data?.ok || !data.plan || typeof data.plan !== 'object' || Array.isArray(data.plan)) {
    const error = new Error('AI plan server response did not include a plan')
    error.code = 'AI_INVALID_RESPONSE'
    throw error
  }
  const plan = normalizeAiPlanV2(data.plan)
  if (!plan) {
    const error = new Error('AI plan server response was invalid')
    error.code = 'AI_INVALID_RESPONSE'
    throw error
  }
  return {
    plan,
    mode: 'server',
    model: data.model || 'server setting',
    format: 'ai-plan-v2',
  }
}

const canUseLocalDirectFallback = () => {
  if (!import.meta.env.DEV || typeof window === 'undefined') return false
  return ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)
}

// 開発専用フォールバック。公開ビルドでは絶対にこの経路を使用しない。
const requestLocalDirectPlan = async (prompt, storedApiKey, signal, travelType) => {
  const apiKey = getOpenAiApiKey(storedApiKey)
  if (!apiKey) throw new Error('Local OpenAI API key is not configured')

  const response = await fetch(OPENAI_RESPONSES_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_PLAN_MODEL,
      input: prompt,
      max_output_tokens: travelType === '日帰り' ? 2200 : travelType === '1泊2日' ? 3000 : 3800,
    }),
    signal,
  })

  if (!response.ok) {
    const error = new Error('OpenAI API request failed')
    error.code = response.status === 429 ? 'AI_RATE_LIMIT' : 'AI_SERVICE_ERROR'
    error.status = response.status
    throw error
  }

  const text = extractOutputText(await response.json())
  const normalized = toClientPlan(text)
  return {
    plan: normalized.plan,
    mode: 'local-direct',
    model: OPENAI_PLAN_MODEL,
    format: normalized.format,
  }
}

export const getOpenAiCommunicationModeLabel = (mode = 'server') => (
  mode === 'local-direct' ? 'ローカル開発用キー' : 'サーバー経由'
)

export const generateOpenAiPlan = async ({ prompt, destination, travelType, storedApiKey = '' }) => {
  const controller = new AbortController()
  const timeoutId = globalThis.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    try {
      return await requestServerPlan({ prompt, destination, travelType, signal: controller.signal })
    } catch (error) {
      if (!error.serverUnavailable || !canUseLocalDirectFallback()) throw error
      return await requestLocalDirectPlan(prompt, storedApiKey, controller.signal, travelType)
    }
  } catch (error) {
    if (controller.signal.aborted && !error.code) error.code = 'AI_TIMEOUT'
    throw error
  } finally {
    globalThis.clearTimeout(timeoutId)
  }
}
