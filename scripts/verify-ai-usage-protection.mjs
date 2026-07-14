import { readFile } from 'node:fs/promises'
import handler, { isAllowedOrigin, isOutputTruncated, isSimpleRateLimited } from '../api/generate-plan.js'
import {
  AI_PLAN_DAILY_LIMIT,
  AI_PLAN_CACHE_STORAGE_KEY,
  AI_PLAN_COOLDOWN_STORAGE_KEY,
  createAiPlanCacheKey,
  getAiPlanCooldownSeconds,
  loadAiPlanCooldownUntil,
  loadAiPlanSessionCache,
  loadAiPlanUsage,
  saveAiPlanUsage,
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

const validCachedPlan = {
  title: 'テストプラン',
  concept: '無理のない旅程です。',
  summary: '散策と休憩を組み合わせるプランです。',
  days: [{
    day: 1,
    title: 'テスト日程',
    items: [{ time: '10:00', type: '散策', title: 'テスト散策', description: '周辺を歩いて楽しみます。' }],
  }],
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
if (!isOutputTruncated({ status: 'incomplete', incomplete_details: { reason: 'max_output_tokens' } })
  || !isOutputTruncated({ output: [{ status: 'incomplete' }] })
  || !isOutputTruncated({ choices: [{ finish_reason: 'length' }] })
  || isOutputTruncated({ status: 'completed' })) {
  failures.push('output truncation detection is invalid')
}

window.localStorage.setItem('droptrip-ai-plan-usage', '{broken')
if (loadAiPlanUsage('2026-07-13').count !== 0) failures.push('broken localStorage usage data was not handled')
if (AI_PLAN_DAILY_LIMIT !== 1) failures.push('AI plan daily limit must be one for the public release')
if (saveAiPlanUsage({ date: '2026-07-13', count: 3 }).count !== 1) failures.push('daily usage was not capped at one')
window.localStorage.setItem('droptrip-ai-plan-usage', JSON.stringify({ date: '2026-07-13', count: 1 }))
if (loadAiPlanUsage('2026-07-14').count !== 0) failures.push('daily usage was not reset for a new date')
window.sessionStorage.setItem(AI_PLAN_CACHE_STORAGE_KEY, '{broken')
if (loadAiPlanSessionCache(1_000) !== null) failures.push('broken session cache was not handled')
if (window.sessionStorage.getItem(AI_PLAN_CACHE_STORAGE_KEY) !== null) failures.push('broken session cache was not removed')
const cacheKey = createAiPlanCacheKey({ destinationId: '東京都-台東区', tripType: '日帰り' })
saveAiPlanSessionCache(cacheKey, validCachedPlan, 1_000)
if (loadAiPlanSessionCache(1_001)?.key !== cacheKey) failures.push('session cache was not restored')
window.sessionStorage.setItem(AI_PLAN_CACHE_STORAGE_KEY, JSON.stringify({ version: 2, key: cacheKey, plan: validCachedPlan, expiresAt: 2_000 }))
if (loadAiPlanSessionCache(1_001) !== null) failures.push('legacy cache version was not discarded')
if (window.sessionStorage.getItem(AI_PLAN_CACHE_STORAGE_KEY) !== null) failures.push('legacy cache version was not removed')
window.sessionStorage.setItem(AI_PLAN_CACHE_STORAGE_KEY, JSON.stringify({ version: 3, key: cacheKey, plan: JSON.stringify(validCachedPlan), expiresAt: 2_000 }))
if (loadAiPlanSessionCache(1_001) !== null || window.sessionStorage.getItem(AI_PLAN_CACHE_STORAGE_KEY) !== null) failures.push('string plan cache was not discarded')
window.sessionStorage.setItem(AI_PLAN_CACHE_STORAGE_KEY, JSON.stringify({ version: 3, key: cacheKey, plan: { ...validCachedPlan, isFallback: true }, expiresAt: 2_000 }))
if (loadAiPlanSessionCache(1_001) !== null || window.sessionStorage.getItem(AI_PLAN_CACHE_STORAGE_KEY) !== null) failures.push('fallback cache was not discarded')
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
if (!apiSource.includes('max_output_tokens: getMaxOutputTokens(travelType)') || !apiSource.includes('OUTPUT_TRUNCATED') || !apiSource.includes('temperature: 0.3')) failures.push('output cost controls are missing')
if (apiSource.includes('VITE_OPENAI_API_KEY')) failures.push('server source must not use a public OpenAI key')
if (!appSource.includes('aiPlanRequestInFlight.current') || !appSource.includes('createAiPlanCooldownUntil')) failures.push('client duplicate request or cooldown guard is missing')
if (!appSource.includes("const isAiPlanLimitReached = remainingAiPlanCount === 0") || !appSource.includes('isAiPlanLimitReached')) failures.push('client daily limit guard is missing')
if (appSource.includes('\u30d7\u30ec\u30df\u30a2\u30e0\u6a5f\u80fd\u306f\u4eca\u5f8c\u63d0\u4f9b\u4e88\u5b9a\u3067\u3059') || appSource.includes('togglePremiumStatus') || appSource.includes('isPremiumUser')) failures.push('production UI still depends on premium status')
if (!appSource.includes('showDevelopmentControls') || !appSource.includes('import.meta.env.DEV')) failures.push('development-only controls are not gated')
if (appSource.indexOf('const result = await generateOpenAiPlan') > appSource.indexOf('saveAiPlanUsage({')) failures.push('usage is recorded before a successful AI response')
if (!clientSource.includes("const SERVER_PLAN_API_URL = '/api/generate-plan'")) failures.push('client must use the relative AI API route')

if (failures.length > 0) {
  console.error(`AI利用保護検証に失敗しました。\n${failures.join('\n')}`)
  process.exitCode = 1
} else {
  console.log('AI利用保護検証OK: API入口、Origin、簡易制限、保存耐性、出力上限を確認しました。')
}
