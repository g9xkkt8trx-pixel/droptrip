import { getOpenAiApiKey } from './openAiConfig'

const OPENAI_RESPONSES_API_URL = 'https://api.openai.com/v1/responses'
const REQUEST_TIMEOUT_MS = 60000

// 低コストモデルを既定値にし、環境変数で差し替えられるようにする。
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

export const generateOpenAiPlan = async ({ prompt, storedApiKey = '' }) => {
  const apiKey = getOpenAiApiKey(storedApiKey)
  if (!apiKey) throw new Error('OpenAI API key is not configured')

  const controller = new AbortController()
  const timeoutId = globalThis.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(OPENAI_RESPONSES_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_PLAN_MODEL,
        input: prompt,
        max_output_tokens: 1800,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`OpenAI API request failed: ${response.status}`)
    }

    return extractOutputText(await response.json())
  } finally {
    globalThis.clearTimeout(timeoutId)
  }
}
