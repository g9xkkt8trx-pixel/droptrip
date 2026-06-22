const OPENAI_RESPONSES_API_URL = 'https://api.openai.com/v1/responses'
const DEFAULT_MODEL = 'gpt-4.1-mini'
const REQUEST_TIMEOUT_MS = 55_000
const MAX_PROMPT_LENGTH = 8_000
const MAX_OUTPUT_TOKENS = 1_200
const ALLOWED_TRAVEL_TYPES = new Set(['日帰り', '1泊2日', '2泊3日'])

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
  const destination = request.body?.destination
  const travelType = request.body?.travelType

  const hasDestination = typeof destination === 'string'
    ? destination.trim().length > 0 && destination.trim().length <= 120
    : destination
      && typeof destination === 'object'
      && typeof destination.city === 'string'
      && destination.city.trim().length > 0
      && destination.city.trim().length <= 80

  if (!prompt || prompt.length > MAX_PROMPT_LENGTH || !hasDestination || !ALLOWED_TRAVEL_TYPES.has(travelType)) {
    return response.status(400).json({ error: 'Invalid request' })
  }
  if (!apiKey) return response.status(503).json({ error: 'Information could not be retrieved' })

  // 一般公開時は、ここへ認証・サーバー側プレミアム判定・レート制限・利用回数管理を必ず追加する。

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
        max_output_tokens: MAX_OUTPUT_TOKENS,
      }),
      signal: controller.signal,
    })

    if (!openAiResponse.ok) {
      // APIレスポンス本文、プロンプト、キーはログやクライアントへ返さない。
      console.error('[generate-plan] OpenAI request failed', { status: openAiResponse.status })
      return response.status(502).json({ error: 'Information could not be retrieved' })
    }

    const plan = extractOutputText(await openAiResponse.json())
    if (!plan) {
      console.error('[generate-plan] OpenAI response was empty')
      return response.status(502).json({ error: 'Information could not be retrieved' })
    }

    return response.status(200).json({ plan, model })
  } catch (error) {
    console.error('[generate-plan] Request error', { name: error?.name ?? 'Error' })
    return response.status(502).json({ error: 'Information could not be retrieved' })
  } finally {
    clearTimeout(timeoutId)
  }
}
