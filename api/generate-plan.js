const OPENAI_RESPONSES_API_URL = 'https://api.openai.com/v1/responses'
const DEFAULT_MODEL = 'gpt-4.1-mini'
const REQUEST_TIMEOUT_MS = 55_000
const MAX_PROMPT_LENGTH = 14_000

const extractOutputText = (response) => {
  if (typeof response.output_text === 'string' && response.output_text.trim()) {
    return response.output_text.trim()
  }

  return response.output
    ?.flatMap((item) => item.content ?? [])
    .filter((content) => content.type === 'output_text' && typeof content.text === 'string')
    .map((content) => content.text)
    .join('\n')
    .trim() ?? ''
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return response.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim()
  const model = process.env.OPENAI_PLAN_MODEL?.trim() || DEFAULT_MODEL
  const prompt = typeof request.body?.prompt === 'string' ? request.body.prompt.trim() : ''

  if (!apiKey) {
    return response.status(503).json({ error: 'AI plan service is not configured' })
  }
  if (!prompt || prompt.length > MAX_PROMPT_LENGTH) {
    return response.status(400).json({ error: 'Invalid prompt' })
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const openAiResponse = await fetch(OPENAI_RESPONSES_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: prompt,
        max_output_tokens: 1800,
      }),
      signal: controller.signal,
    })

    if (!openAiResponse.ok) {
      // APIレスポンス本文やキーはクライアントへ返さない。
      return response.status(502).json({ error: 'AI plan generation failed' })
    }

    const plan = extractOutputText(await openAiResponse.json())
    if (!plan) return response.status(502).json({ error: 'AI response was empty' })

    return response.status(200).json({ plan, model })
  } catch {
    return response.status(502).json({ error: 'AI plan generation failed' })
  } finally {
    clearTimeout(timeoutId)
  }
}

