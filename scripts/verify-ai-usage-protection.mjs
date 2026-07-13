import { readFile } from 'node:fs/promises'
import handler, { isAllowedOrigin, isSimpleRateLimited } from '../api/generate-plan.js'
import {
  AI_PLAN_CACHE_STORAGE_KEY,
  AI_PLAN_COOLDOWN_STORAGE_KEY,
  createAiPlanCacheKey,
  getAiPlanCooldownSeconds,
  loadAiPlanCooldownUntil,
  loadAiPlanSessionCache,
  loadAiPlanUsage,
  saveAiPlanCooldownUntil,
  saveAiPlanSessionCache,
} from '../src/services/aiPlanUsageProtection.js'

const failures = []
const createStorage = () => {
  const values = new Map()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  }
}

globalThis.window = { localStorage: createStorage(), sessionStorage: createStorage() }

const invoke = async (request = {}) => {
  const result = { status: 200, headers: {}, body: null }
  const response = {
    setHeader: (name, value) => { result.headers[name] = value },
    status: (status) => {
      result.status = status
      return { json: (body) => { result.body = body; return result } }
    },
  }
  await handler({ headers: {}, ...request }, response)
  return result
}

const baseBody = {
  prompt: 'DROPTRIPの正式データだけを使って短い旅行プランをJSONで作成してください。',
  destination: { id: '東京都-台東区', prefecture: '東京都', city: '台東区', photoSpots: [] },
  travelType: '日帰り',
}

const methodResult = await invoke({ method: 'GET' })
if (methodResult.status !== 405 || methodResult.body?.code !== 'METHOD_NOT_ALLOWED') failures.push('non-POST request was not rejected')
const contentTypeResult = await invoke({ method: 'POST', headers: { 'content-type': 'text/plain' }, body: baseBody })
if (contentTypeResult.status !== 415 || contentTypeResult.body?.code !== 'INVALID_CONTENT_TYPE') failures.push('invalid content type was not rejected')
const invalidJsonResult = await invoke({ method: 'POST', headers: { 'content-type': 'application/json' }, body: '{bad json' })
if (invalidJsonResult.status !== 400 || invalidJsonResult.body?.code !== 'INVALID_JSON') failures.push('invalid JSON was not rejected')
const oversizedResult = await invoke({ method: 'POST', headers: { 'content-type': 'application/json', 'content-length': '18001' }, body: baseBody })
if (oversizedResult.status !== 413 || oversizedResult.body?.code !== 'PAYLOAD_TOO_LARGE') failures.push('oversized payload was not rejected')
const originResult = await invoke({ method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://unrelated.example' }, body: baseBody })
if (originResult.status !== 403 || originResult.body?.code !== 'ORIGIN_NOT_ALLOWED') failures.push('unrelated origin was not rejected')
const invalidInputResult = await invoke({
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: { ...baseBody, destination: { ...baseBody.destination, photoSpots: [{}, {}, {}, {}] } },
})
if (invalidInputResult.status !== 400 || invalidInputResult.body?.code !== 'INVALID_INPUT') failures.push('oversized photo spot list was not rejected')

if (!isAllowedOrigin('') || !isAllowedOrigin('https://droptrip.vercel.app') || isAllowedOrigin('https://unrelated.example')) {
  failures.push('origin allowlist behavior is invalid')
}
if (isSimpleRateLimited('test-rate-client', 1_000) || isSimpleRateLimited('test-rate-client', 2_000) || !isSimpleRateLimited('test-rate-client', 3_000)) {
  failures.push('simple in-memory rate limit behavior is invalid')
}

window.localStorage.setItem('droptrip-ai-plan-usage', '{broken')
if (loadAiPlanUsage('2026-07-13').count !== 0) failures.push('broken localStorage usage data was not handled')
window.sessionStorage.setItem(AI_PLAN_CACHE_STORAGE_KEY, '{broken')
if (loadAiPlanSessionCache(1_000) !== null) failures.push('broken session cache was not handled')
const cacheKey = createAiPlanCacheKey({ destinationId: '東京都-台東区', tripType: '日帰り' })
saveAiPlanSessionCache(cacheKey, { title: 'テストプラン' }, 1_000)
if (loadAiPlanSessionCache(1_001)?.key !== cacheKey) failures.push('session cache was not restored')
const cooldownUntil = Date.now() + 60_000
saveAiPlanCooldownUntil(cooldownUntil)
if (loadAiPlanCooldownUntil(Date.now()) !== cooldownUntil || getAiPlanCooldownSeconds(cooldownUntil, cooldownUntil - 60_000) !== 60) failures.push('cooldown persistence is invalid')
window.sessionStorage.removeItem(AI_PLAN_COOLDOWN_STORAGE_KEY)

const [apiSource, appSource, clientSource] = await Promise.all([
  readFile(new URL('../api/generate-plan.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/App.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/services/openAiPlan.js', import.meta.url), 'utf8'),
])
if (!apiSource.includes('MAX_BODY_BYTES') || !apiSource.includes('INVALID_CONTENT_TYPE') || !apiSource.includes('UPSTREAM_TIMEOUT')) failures.push('server input and timeout safeguards are missing')
if (!apiSource.includes('max_output_tokens: MAX_OUTPUT_TOKENS') || !apiSource.includes('temperature: 0.3')) failures.push('output cost controls are missing')
if (apiSource.includes('VITE_OPENAI_API_KEY')) failures.push('server source must not use a public OpenAI key')
if (!appSource.includes('aiPlanRequestInFlight.current') || !appSource.includes('createAiPlanCooldownUntil')) failures.push('client duplicate request or cooldown guard is missing')
if (!clientSource.includes("const SERVER_PLAN_API_URL = '/api/generate-plan'")) failures.push('client must use the relative AI API route')

if (failures.length > 0) {
  console.error(`AI利用保護検証に失敗しました。\n${failures.join('\n')}`)
  process.exitCode = 1
} else {
  console.log('AI利用保護検証OK: API入口、Origin、簡易制限、保存耐性、出力上限を確認しました。')
}
