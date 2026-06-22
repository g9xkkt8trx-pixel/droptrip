import { getOpenAiApiKey } from './openAiConfig'

const SERVER_PLAN_API_URL = '/api/generate-plan'
const OPENAI_RESPONSES_API_URL = 'https://api.openai.com/v1/responses'
const REQUEST_TIMEOUT_MS = 60000

// 公開版のモデルはサーバー側の OPENAI_PLAN_MODEL で管理する。
// この値はローカル直呼びフォールバック専用。
export const OPENAI_PLAN_MODEL = import.meta.env.VITE_OPENAI_PLAN_MODEL?.trim() || 'gpt-4.1-mini'

const extractOutputText = (response) => {
  if (typeof response.output_text === 'string' && response.output_text.trim()) {
    return response.output_text.trim()
  }

  const text = response.output
    ?.flatMap((item) => item.content ?? [])
    .filter((content) => content.type === 'output_text' && typeof content.text === 'string')
    .map((content) => content.text)
    .join('\n')
    .trim()

  if (!text) throw new Error('OpenAI API response did not include output text')
  return text
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
    const error = new Error(`AI plan server request failed: ${response.status}`)
    error.serverUnavailable = response.status === 404 || response.status === 405
    throw error
  }

  const data = await response.json()
  if (typeof data.plan !== 'string' || !data.plan.trim()) {
    throw new Error('AI plan server response did not include a plan')
  }
  return { text: data.plan.trim(), mode: 'server', model: data.model || 'server setting' }
}

const canUseLocalDirectFallback = () => {
  if (!import.meta.env.DEV || typeof window === 'undefined') return false
  return ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)
}

// 開発専用フォールバック。公開ビルドでは絶対にこの経路を使用しない。
const requestLocalDirectPlan = async (prompt, storedApiKey, signal) => {
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
      max_output_tokens: 1200,
    }),
    signal,
  })

  if (!response.ok) throw new Error(`OpenAI API request failed: ${response.status}`)
  return { text: extractOutputText(await response.json()), mode: 'local-direct', model: OPENAI_PLAN_MODEL }
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
      return await requestLocalDirectPlan(prompt, storedApiKey, controller.signal)
    }
  } finally {
    globalThis.clearTimeout(timeoutId)
  }
}
