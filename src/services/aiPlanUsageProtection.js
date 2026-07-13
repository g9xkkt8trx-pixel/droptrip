export const AI_PLAN_DAILY_LIMIT = 5
export const AI_PLAN_COOLDOWN_MS = 60_000
export const AI_PLAN_CACHE_TTL_MS = 10 * 60_000
export const AI_PLAN_USAGE_STORAGE_KEY = 'droptrip-ai-plan-usage'
export const AI_PLAN_COOLDOWN_STORAGE_KEY = 'droptrip-ai-plan-cooldown'
export const AI_PLAN_CACHE_STORAGE_KEY = 'droptrip-ai-plan-cache-v2'

export const getAiPlanLocalDateKey = (date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const safeParse = (value, fallback) => {
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

const getStorage = (name) => {
  if (typeof window === 'undefined') return null
  try {
    return window[name]
  } catch {
    return null
  }
}

export const loadAiPlanUsage = (date = getAiPlanLocalDateKey()) => {
  const storage = getStorage('localStorage')
  const saved = storage ? safeParse(storage.getItem(AI_PLAN_USAGE_STORAGE_KEY) ?? '{}', {}) : {}
  const count = Number.isInteger(saved?.count) && saved.count >= 0 ? saved.count : 0
  return { date, count: saved?.date === date ? Math.min(count, AI_PLAN_DAILY_LIMIT) : 0 }
}

export const saveAiPlanUsage = (usage = {}) => {
  const date = getAiPlanLocalDateKey()
  const count = Number.isInteger(usage.count) && usage.count >= 0 ? Math.min(usage.count, AI_PLAN_DAILY_LIMIT) : 0
  const nextUsage = { date, count }
  const storage = getStorage('localStorage')
  try {
    storage?.setItem(AI_PLAN_USAGE_STORAGE_KEY, JSON.stringify(nextUsage))
  } catch {
    // ストレージが使えない環境では、呼び出し元の画面内状態だけを利用する。
  }
  return nextUsage
}

export const loadAiPlanCooldownUntil = (now = Date.now()) => {
  const storage = getStorage('sessionStorage')
  const saved = storage ? safeParse(storage.getItem(AI_PLAN_COOLDOWN_STORAGE_KEY) ?? '{}', {}) : {}
  const until = Number(saved?.until)
  return Number.isFinite(until) && until > now && until - now <= AI_PLAN_COOLDOWN_MS * 2 ? until : 0
}

export const saveAiPlanCooldownUntil = (until = 0) => {
  const storage = getStorage('sessionStorage')
  const safeUntil = Number.isFinite(until) ? until : 0
  try {
    if (safeUntil > Date.now()) storage?.setItem(AI_PLAN_COOLDOWN_STORAGE_KEY, JSON.stringify({ until: safeUntil }))
    else storage?.removeItem(AI_PLAN_COOLDOWN_STORAGE_KEY)
  } catch {
    // セッションストレージが使えない環境でも、画面内状態は維持する。
  }
  return safeUntil
}

export const getAiPlanCooldownSeconds = (until = 0, now = Date.now()) => Math.max(0, Math.ceil((until - now) / 1000))

export const createAiPlanCooldownUntil = (now = Date.now()) => now + AI_PLAN_COOLDOWN_MS

export const createAiPlanCacheKey = (input = {}) => JSON.stringify(input)

export const loadAiPlanSessionCache = (now = Date.now()) => {
  const storage = getStorage('sessionStorage')
  const saved = storage ? safeParse(storage.getItem(AI_PLAN_CACHE_STORAGE_KEY) ?? '{}', {}) : {}
  if (typeof saved?.key !== 'string' || saved.key.length > 1_500 || !saved?.plan || typeof saved.plan !== 'object') return null
  if (!Number.isFinite(saved.expiresAt) || saved.expiresAt <= now || saved.expiresAt - now > AI_PLAN_CACHE_TTL_MS) return null
  return { key: saved.key, plan: saved.plan, expiresAt: saved.expiresAt }
}

export const saveAiPlanSessionCache = (key, plan, now = Date.now()) => {
  if (typeof key !== 'string' || key.length > 1_500 || !plan || typeof plan !== 'object') return null
  const entry = { key, plan, expiresAt: now + AI_PLAN_CACHE_TTL_MS }
  try {
    const serialized = JSON.stringify(entry)
    if (serialized.length > 16_000) return null
    getStorage('sessionStorage')?.setItem(AI_PLAN_CACHE_STORAGE_KEY, serialized)
    return entry
  } catch {
    return null
  }
}
