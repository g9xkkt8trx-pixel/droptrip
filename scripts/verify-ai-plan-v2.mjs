import { readFile } from 'node:fs/promises'
import { createAiPlanPrompt } from '../src/services/aiPlanPrompt.js'
import {
  AI_PLAN_V2_JSON_SCHEMA,
  createAiPlanTextFallback,
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
if (!fallbackPlan.isFallback || fallbackPlan.summary !== '旧形式のプラン本文') failures.push('text fallback is invalid')

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

if (failures.length > 0) {
  console.error(`AIプランV2検証に失敗しました。\n${failures.join('\n')}`)
  process.exitCode = 1
} else {
  console.log('AIプランV2検証OK: JSON正規化、フォールバック、遅延映えスポット、サーバー境界を確認しました。')
}
