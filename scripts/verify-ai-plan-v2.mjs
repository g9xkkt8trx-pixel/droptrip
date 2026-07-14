import { readFile } from 'node:fs/promises'
import { createAiPlanPrompt } from '../src/services/aiPlanPrompt.js'
import rawDestinations from '../src/data/destinations.json' with { type: 'json' }
import {
  AI_PLAN_V2_JSON_SCHEMA,
  createAiPlanTextFallback,
  isLikelyJsonAiPlanPayload,
  normalizeAiPlanResponse,
  parseAiPlanV2,
} from '../src/services/aiPlanV2.js'

const failures = []

const samplePlan = {
  title: '海辺をゆっくり歩く旅',
  concept: '景色と食事に余白を残す日帰りプラン',
  summary: '午前から夕方まで、無理なく海辺と街歩きを楽しむ流れです。',
  days: [{
    day: 1,
    title: '海辺と街歩き',
    items: [{
      time: '10:00', type: '散策', title: '港を歩く', description: '海辺の景色を楽しみます。',
      duration: '目安 60分', location: '港周辺', mapQuery: 'テスト港', photoTip: '朝の光を活かします。', caution: '通行を妨げないようにします。',
    }],
  }],
  recommendedPhotoSpots: [{ name: 'テスト展望台', reason: '海を見渡せるため。', bestTime: '午前' }],
  localFoodSuggestions: [{ name: '地元料理', description: '地域の食文化に触れる候補です。', note: '' }],
  budgetEstimate: { transport: '移動手段により変動', food: '店舗により変動', sightseeing: '', lodging: '', total: '旅程により変動' },
  rainPlan: [{ replace: '海辺の散策', with: '屋内の見学候補', reason: '天候を見て切り替えます。' }],
  tips: ['施設の最新情報を確認します。'],
  disclaimer: '営業状況や料金、移動時間は出発前に確認してください。',
}

if (!AI_PLAN_V2_JSON_SCHEMA?.properties?.days) failures.push('AI Plan V2 schema is missing days')
const parsedPlan = parseAiPlanV2(JSON.stringify(samplePlan))
if (!parsedPlan || parsedPlan.days.length !== 1 || parsedPlan.days[0].items.length !== 1) {
  failures.push('valid AI Plan V2 JSON could not be normalized')
}
if (parseAiPlanV2('{invalid json}')) failures.push('invalid JSON should not be parsed as an AI Plan V2')
if (parseAiPlanV2(JSON.stringify({ ...samplePlan, days: [] }))) failures.push('a plan without a day should be rejected')
const fallbackPlan = createAiPlanTextFallback('旧形式のプラン本文')
if (!fallbackPlan?.isFallback || fallbackPlan.summary !== '旧形式のプラン本文') failures.push('text fallback is invalid')
if (createAiPlanTextFallback(JSON.stringify(samplePlan)) !== null) failures.push('JSON-like text must not become a visible text fallback')

const normalizedVariants = [
  samplePlan,
  JSON.stringify(samplePlan),
  `\n\`\`\`json\n${JSON.stringify(samplePlan)}\n\`\`\`\n`,
  JSON.stringify(JSON.stringify(samplePlan)),
  { plan: JSON.stringify(samplePlan) },
  { content: JSON.stringify(samplePlan) },
  `生成結果です。\n${JSON.stringify(samplePlan)}\n以上です。`,
]
normalizedVariants.forEach((variant, index) => {
  const normalized = normalizeAiPlanResponse(variant)
  if (!normalized.ok || normalized.plan.title !== samplePlan.title || normalized.plan.days.length !== 1) {
    failures.push(`normalization variant ${index + 1} failed`)
  }
})
const missingSummary = normalizeAiPlanResponse({ ...samplePlan, summary: '' })
if (!missingSummary.ok || !missingSummary.plan.summary) failures.push('concept should safely supplement a missing summary')
const shortenedPlan = normalizeAiPlanResponse({
  ...samplePlan,
  days: [{
    ...samplePlan.days[0],
    items: Array.from({ length: 6 }, (_, index) => ({
      ...samplePlan.days[0].items[0],
      title: `予定${index + 1}`,
      description: '説明'.repeat(80),
    })),
  }],
})
if (!shortenedPlan.ok || shortenedPlan.plan.days[0].items.length !== 5 || shortenedPlan.plan.days[0].items[0].description.length > 100) {
  failures.push('output volume limits were not normalized')
}
for (const invalid of ['{invalid json}', '', null, [], { ...samplePlan, days: [] }, { __proto__: { polluted: true } }]) {
  if (normalizeAiPlanResponse(invalid).ok) failures.push('invalid AI payload was accepted')
}
const truncatedJson = JSON.stringify(samplePlan).slice(0, -8)
if (normalizeAiPlanResponse(truncatedJson).ok) failures.push('truncated JSON must not become a visible plan')
const concatenatedJson = `${JSON.stringify(samplePlan)}${JSON.stringify(samplePlan)}`
const concatenatedPlan = normalizeAiPlanResponse(concatenatedJson)
if (!concatenatedPlan.ok || concatenatedPlan.plan.days.length !== 1) failures.push('concatenated JSON should normalize to a single safe plan')
if (!isLikelyJsonAiPlanPayload('{invalid json}') || isLikelyJsonAiPlanPayload('旧形式のプラン本文')) {
  failures.push('JSON-like response detection is invalid')
}

const prompt = createAiPlanPrompt({
  departure: '東京駅',
  destination: {
    id: 'テスト県-テスト市', prefecture: 'テスト県', city: 'テスト市', region: 'テスト地方',
    tags: ['海'], touristSpots: [], localFoodCandidates: [], localFoodDetails: [], photoSpots: [],
  },
  tripType: '日帰り',
  tripSchedule: { label: '日帰り', nights: 0, days: 1 },
  season: '夏',
  budget: '時期により変動',
  photoSpots: [{ name: 'テスト展望台', category: '展望台', summary: '海を見渡す場所です。', mapQuery: 'テスト展望台' }],
})
if (!prompt.includes('destinationId: テスト県-テスト市') || !prompt.includes('テスト展望台') || !prompt.includes('JSON出力ルール')) {
  failures.push('prompt does not include destination or confirmed photo spot context')
}

const [appSource, serviceSource, apiSource] = await Promise.all([
  readFile(new URL('../src/App.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/services/openAiPlan.js', import.meta.url), 'utf8'),
  readFile(new URL('../api/generate-plan.js', import.meta.url), 'utf8'),
])
if (!appSource.includes("import('./data/photoSpots.js')")) failures.push('photo spots are not loaded on AI plan request')
if (!appSource.includes('aiPlanRequestInFlight.current')) failures.push('AI plan duplicate request guard is missing')
if (appSource.includes('setAiPlanNotice(error.message)')) failures.push('raw API error text must not be shown to users')
if (!serviceSource.includes("const SERVER_PLAN_API_URL = '/api/generate-plan'")) failures.push('AI plan client must use the relative server API route')
if (!serviceSource.includes("if (!import.meta.env.DEV || typeof window === 'undefined') return false")) failures.push('local direct fallback must be development-only')
if (!apiSource.includes("type: 'json_schema'")) failures.push('server does not request structured JSON output')
if (!apiSource.includes('MAX_DESTINATION_PAYLOAD_LENGTH')) failures.push('server destination payload cap is missing')
if (apiSource.includes('VITE_OPENAI_API_KEY')) failures.push('server source must not use a client OpenAI key')
if (appSource.includes('dangerouslySetInnerHTML')) failures.push('AI plan UI must not use dangerouslySetInnerHTML')
if (!appSource.includes("AI_INVALID_RESPONSE: '旅行プランの整理に失敗しました。もう一度生成してください。'")) failures.push('safe JSON parse failure message is missing')
if (!apiSource.includes("plan: parsedPlan")) failures.push('API success response must return an object plan')
if (!apiSource.includes('isOutputTruncated') || !apiSource.includes('OUTPUT_TRUNCATED') || !apiSource.includes('getMaxOutputTokens')) failures.push('server truncation safeguards are missing')
if (!apiSource.includes('日帰り: 2_200') || !apiSource.includes('1_500, 4_000')) failures.push('day-trip output token budget was not raised safely')
if (!appSource.includes("OUTPUT_TRUNCATED: '旅行プランの生成が途中で終了しました。もう一度お試しください。'")) failures.push('safe truncated output message is missing')
if (!appSource.includes('aiPlanResult.isFallback ? (') || !appSource.includes('<div className="ai-generated-content">{aiPlanResult.summary}</div>')) failures.push('legacy text fallback rendering is missing')
if (appSource.includes(['生成結果を読みやすく', '整理しています。'].join(''))) failures.push('obsolete raw JSON fallback copy remains in the UI')
if ((appSource.match(/ai-generated-content/g) ?? []).length !== 1) failures.push('legacy content is rendered in more than one place')
if (!appSource.includes('requestId === aiPlanRequestId.current')) failures.push('stale AI responses are not guarded by requestId')

const originalFetch = globalThis.fetch
const originalApiKey = process.env.OPENAI_API_KEY
process.env.OPENAI_API_KEY = 'test-key'
globalThis.fetch = async () => ({ ok: true, json: async () => ({ output_text: JSON.stringify(samplePlan) }) })
const { default: generatePlanHandler } = await import(`../api/generate-plan.js?normalization-test=${Date.now()}`)
const formalDestination = rawDestinations[0]
const response = {
  statusCode: 200,
  body: null,
  setHeader() {},
  status(code) { this.statusCode = code; return this },
  json(body) { this.body = body; return body },
}
await generatePlanHandler({
  method: 'POST',
  headers: { 'content-type': 'application/json', 'x-forwarded-for': 'normalization-test' },
  body: {
    prompt: 'テスト用の旅行プランをJSONで返してください。',
    travelType: '日帰り',
    destination: {
      id: `${formalDestination.prefecture}-${formalDestination.city}`,
      prefecture: formalDestination.prefecture,
      city: formalDestination.city,
      tags: [],
      touristSpots: [],
      localFoodDetails: [],
      localFoodCandidates: [],
      nearbyDestinationHints: [],
      nearbySuggestions: [],
      photoSpots: [],
      tripSchedule: { days: 1 },
    },
  },
}, response)
if (response.statusCode !== 200 || !response.body?.ok || !response.body.plan || typeof response.body.plan !== 'object' || typeof response.body.plan === 'string') {
  failures.push('API success response did not return a normalized plan object')
}

globalThis.fetch = async () => ({ ok: true, json: async () => ({ output_text: '{"title":"途中で切れたJSON"' }) })
const invalidResponse = {
  statusCode: 200,
  body: null,
  setHeader() {},
  status(code) { this.statusCode = code; return this },
  json(body) { this.body = body; return body },
}
await generatePlanHandler({
  method: 'POST',
  headers: { 'content-type': 'application/json', 'x-forwarded-for': 'normalization-test-invalid-json' },
  body: {
    prompt: 'テスト用の旅行プランをJSONで返してください。',
    travelType: '日帰り',
    destination: {
      id: `${formalDestination.prefecture}-${formalDestination.city}`,
      prefecture: formalDestination.prefecture,
      city: formalDestination.city,
      tags: [], touristSpots: [], localFoodDetails: [], localFoodCandidates: [], nearbyDestinationHints: [], nearbySuggestions: [], photoSpots: [], tripSchedule: { days: 1 },
    },
  },
}, invalidResponse)
if (invalidResponse.statusCode !== 502 || invalidResponse.body?.code !== 'AI_INVALID_RESPONSE' || invalidResponse.body?.plan) {
  failures.push('invalid JSON was incorrectly returned as a successful plan')
}

globalThis.fetch = async () => ({
  ok: true,
  json: async () => ({ status: 'incomplete', incomplete_details: { reason: 'max_output_tokens' }, output_text: JSON.stringify(samplePlan) }),
})
const truncatedResponse = {
  statusCode: 200,
  body: null,
  setHeader() {},
  status(code) { this.statusCode = code; return this },
  json(body) { this.body = body; return body },
}
await generatePlanHandler({
  method: 'POST',
  headers: { 'content-type': 'application/json', 'x-forwarded-for': 'normalization-test-truncated' },
  body: {
    prompt: 'テスト用の旅行プランをJSONで返してください。',
    travelType: '日帰り',
    destination: {
      id: `${formalDestination.prefecture}-${formalDestination.city}`,
      prefecture: formalDestination.prefecture,
      city: formalDestination.city,
      tags: [], touristSpots: [], localFoodDetails: [], localFoodCandidates: [], nearbyDestinationHints: [], nearbySuggestions: [], photoSpots: [], tripSchedule: { days: 1 },
    },
  },
}, truncatedResponse)
globalThis.fetch = originalFetch
if (originalApiKey === undefined) delete process.env.OPENAI_API_KEY
else process.env.OPENAI_API_KEY = originalApiKey
if (truncatedResponse.statusCode !== 502 || truncatedResponse.body?.code !== 'OUTPUT_TRUNCATED' || truncatedResponse.body?.plan) {
  failures.push('truncated OpenAI output was not rejected safely')
}

if (failures.length > 0) {
  console.error(`AIプランV2検証に失敗しました。\n${failures.join('\n')}`)
  process.exitCode = 1
} else {
  console.log('AIプランV2検証OK: JSON正規化、フォールバック、遅延映えスポット、サーバー境界を確認しました。')
}
