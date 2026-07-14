const MAX_TEXT_LENGTH = 180
const MAX_ITEMS_PER_DAY = 5
const MAX_DAYS = 3
const MAX_PHOTO_SPOTS = 3
const MAX_FOOD_SUGGESTIONS = 3
const MAX_TIPS = 3
const MAX_NORMALIZATION_PASSES = 3
const MAX_RAW_RESPONSE_LENGTH = 16_000
const WRAPPED_PLAN_KEYS = ['plan', 'content', 'text', 'output', 'result']

const asText = (value, maxLength = MAX_TEXT_LENGTH) => (
  typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
)

const isRecord = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

const hasUnsafeKeys = (value, depth = 0) => {
  if (depth > 8 || !value || typeof value !== 'object') return false
  if (Array.isArray(value)) return value.some((item) => hasUnsafeKeys(item, depth + 1))
  return Object.keys(value).some((key) => (
    ['__proto__', 'prototype', 'constructor'].includes(key) || hasUnsafeKeys(value[key], depth + 1)
  ))
}

const stripJsonCodeFence = (value) => value
  .trim()
  .replace(/^```(?:json|JSON)?\s*/u, '')
  .replace(/\s*```$/u, '')
  .trim()

const extractJsonObject = (value) => {
  const starts = [value.indexOf('{'), value.indexOf('[')].filter((index) => index >= 0)
  const start = starts.length > 0 ? Math.min(...starts) : -1
  if (start < 0) return ''
  const opening = value[start]
  const closing = opening === '{' ? '}' : ']'
  let depth = 0
  let quoted = false
  let escaped = false
  for (let index = start; index < value.length; index += 1) {
    const character = value[index]
    if (quoted) {
      if (escaped) escaped = false
      else if (character === '\\') escaped = true
      else if (character === '"') quoted = false
      continue
    }
    if (character === '"') quoted = true
    else if (character === opening) depth += 1
    else if (character === closing) {
      depth -= 1
      if (depth === 0) return value.slice(start, index + 1)
    }
  }
  return ''
}

export const isLikelyJsonAiPlanPayload = (value) => {
  if (typeof value !== 'string') return isRecord(value) || Array.isArray(value)
  const normalized = stripJsonCodeFence(value)
  return normalized.startsWith('{')
    || normalized.startsWith('[')
    || /"(?:title|days|items)"\s*:/u.test(normalized)
    || value.includes('```')
    || Boolean(extractJsonObject(normalized))
}

const unwrapAiPlanValue = (raw) => {
  let value = raw
  for (let pass = 0; pass < MAX_NORMALIZATION_PASSES; pass += 1) {
    if (typeof value === 'string') {
      const normalized = stripJsonCodeFence(value)
      if (!normalized || normalized.length > MAX_RAW_RESPONSE_LENGTH) return { ok: false, code: 'AI_PLAN_EMPTY_OR_TOO_LARGE' }
      try {
        const parsed = JSON.parse(normalized)
        if (typeof parsed === 'string' || isRecord(parsed)) {
          value = parsed
          continue
        }
      } catch {
        // 前後に説明文があるJSONは次の抽出処理で扱う。
      }
      const candidate = extractJsonObject(normalized)
      if (!candidate) return { ok: false, code: 'AI_PLAN_LEGACY_TEXT', legacyText: normalized }
      try {
        value = JSON.parse(candidate)
      } catch {
        return { ok: false, code: 'AI_PLAN_INVALID_JSON' }
      }
      continue
    }

    if (!isRecord(value)) return { ok: false, code: 'AI_PLAN_NOT_AN_OBJECT' }
    if (hasUnsafeKeys(value)) return { ok: false, code: 'AI_PLAN_UNSAFE_OBJECT' }
    const wrappedKey = WRAPPED_PLAN_KEYS.find((key) => Object.hasOwn(value, key) && (typeof value[key] === 'string' || isRecord(value[key])))
    if (!wrappedKey) return { ok: true, value }
    value = value[wrappedKey]
  }
  return { ok: false, code: 'AI_PLAN_PARSE_LIMIT' }
}

const asStringArray = (value, maxItems = MAX_TIPS) => (
  Array.isArray(value) ? value.map((item) => asText(item, 180)).filter(Boolean).slice(0, maxItems) : []
)

const asPlanItem = (item = {}) => ({
  time: asText(item.time, 16),
  type: asText(item.type, 20),
  title: asText(item.title, 100),
  description: asText(item.description, 100),
  duration: asText(item.duration, 80),
  location: asText(item.location, 160),
  mapQuery: asText(item.mapQuery, 180),
  photoTip: asText(item.photoTip, 60),
  caution: asText(item.caution, 60),
})

const asPhotoSpot = (item = {}) => ({
  name: asText(item.name, 120),
  reason: asText(item.reason, 260),
  bestTime: asText(item.bestTime, 120),
})

const asFoodSuggestion = (item = {}) => ({
  name: asText(item.name, 120),
  description: asText(item.description, 80),
  note: asText(item.note, 60),
})

const asRainPlan = (item = {}) => ({
  replace: asText(item.replace, 140),
  with: asText(item.with, 140),
  reason: asText(item.reason, 80),
})

const asBudgetEstimate = (value = {}) => ({
  transport: asText(value.transport, 120),
  food: asText(value.food, 120),
  sightseeing: asText(value.sightseeing, 120),
  lodging: asText(value.lodging, 120),
  total: asText(value.total, 140),
})

export const AI_PLAN_V2_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'title', 'concept', 'summary', 'days', 'recommendedPhotoSpots', 'localFoodSuggestions',
    'budgetEstimate', 'rainPlan', 'tips', 'disclaimer',
  ],
  properties: {
    title: { type: 'string', maxLength: 60 },
    concept: { type: 'string', maxLength: 120 },
    summary: { type: 'string', maxLength: 180 },
    days: {
      type: 'array', maxItems: 3,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['day', 'title', 'items'],
        properties: {
          day: { type: 'integer' },
          title: { type: 'string', maxLength: 100 },
          items: {
            type: 'array', maxItems: 5,
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['time', 'type', 'title', 'description', 'duration', 'location', 'mapQuery', 'photoTip', 'caution'],
              properties: {
                time: { type: 'string', maxLength: 16 }, type: { type: 'string', maxLength: 20 }, title: { type: 'string', maxLength: 100 }, description: { type: 'string', maxLength: 100 },
                duration: { type: 'string', maxLength: 80 }, location: { type: 'string', maxLength: 160 }, mapQuery: { type: 'string', maxLength: 180 },
                photoTip: { type: 'string', maxLength: 60 }, caution: { type: 'string', maxLength: 60 },
              },
            },
          },
        },
      },
    },
    recommendedPhotoSpots: {
      type: 'array', maxItems: 3,
      items: {
        type: 'object', additionalProperties: false, required: ['name', 'reason', 'bestTime'],
        properties: { name: { type: 'string', maxLength: 120 }, reason: { type: 'string', maxLength: 160 }, bestTime: { type: 'string', maxLength: 80 } },
      },
    },
    localFoodSuggestions: {
      type: 'array', maxItems: 3,
      items: {
        type: 'object', additionalProperties: false, required: ['name', 'description', 'note'],
        properties: { name: { type: 'string', maxLength: 120 }, description: { type: 'string', maxLength: 80 }, note: { type: 'string', maxLength: 60 } },
      },
    },
    budgetEstimate: {
      type: 'object', additionalProperties: false,
      required: ['transport', 'food', 'sightseeing', 'lodging', 'total'],
      properties: {
        transport: { type: 'string', maxLength: 80 }, food: { type: 'string', maxLength: 80 }, sightseeing: { type: 'string', maxLength: 80 },
        lodging: { type: 'string', maxLength: 80 }, total: { type: 'string', maxLength: 100 },
      },
    },
    rainPlan: {
      type: 'array', maxItems: 1,
      items: {
        type: 'object', additionalProperties: false, required: ['replace', 'with', 'reason'],
        properties: { replace: { type: 'string', maxLength: 100 }, with: { type: 'string', maxLength: 100 }, reason: { type: 'string', maxLength: 80 } },
      },
    },
    tips: { type: 'array', maxItems: 3, items: { type: 'string', maxLength: 100 } },
    disclaimer: { type: 'string', maxLength: 200 },
  },
}

export const normalizeAiPlanV2 = (value) => {
  if (!isRecord(value) || hasUnsafeKeys(value)) return null

  const days = Array.isArray(value.days)
    ? value.days.map((day, index) => ({
      day: Number.isInteger(day?.day) && day.day > 0 ? day.day : index + 1,
      title: asText(day?.title, 140) || `DAY ${index + 1}`,
      items: Array.isArray(day?.items) ? day.items.map(asPlanItem).filter((item) => item.title || item.description).slice(0, MAX_ITEMS_PER_DAY) : [],
    })).filter((day) => day.items.length > 0).slice(0, MAX_DAYS)
    : []

  const concept = asText(value.concept, 260)
  const summary = asText(value.summary, 600)
  const plan = {
    title: asText(value.title, 160),
    concept: concept || summary,
    summary: summary || concept,
    days,
    recommendedPhotoSpots: Array.isArray(value.recommendedPhotoSpots)
      ? value.recommendedPhotoSpots.map(asPhotoSpot).filter((item) => item.name).slice(0, MAX_PHOTO_SPOTS)
      : [],
    localFoodSuggestions: Array.isArray(value.localFoodSuggestions)
      ? value.localFoodSuggestions.map(asFoodSuggestion).filter((item) => item.name).slice(0, MAX_FOOD_SUGGESTIONS)
      : [],
    budgetEstimate: asBudgetEstimate(value.budgetEstimate),
    rainPlan: Array.isArray(value.rainPlan) ? value.rainPlan.map(asRainPlan).filter((item) => item.replace || item.with).slice(0, 1) : [],
    tips: asStringArray(value.tips),
    disclaimer: asText(value.disclaimer, 320),
  }

  return plan.title && (plan.concept || plan.summary) && plan.days.length > 0 ? plan : null
}

export const normalizeAiPlanResponse = (raw) => {
  if (raw === null || raw === undefined || raw === '') return { ok: false, code: 'AI_PLAN_EMPTY' }
  const unwrapped = unwrapAiPlanValue(raw)
  if (!unwrapped.ok) return unwrapped
  const plan = normalizeAiPlanV2(unwrapped.value)
  return plan ? { ok: true, plan } : { ok: false, code: 'AI_PLAN_SCHEMA_INVALID' }
}

export const parseAiPlanV2 = (text) => {
  const normalized = normalizeAiPlanResponse(text)
  return normalized.ok ? normalized.plan : null
}

export const createAiPlanTextFallback = (text) => {
  const summary = isLikelyJsonAiPlanPayload(text) ? '' : asText(text, 2_000)
  if (!summary) return null
  return {
    title: '旧形式のプラン',
    concept: '以前の文章形式のプランです。',
    summary,
    days: [],
    recommendedPhotoSpots: [],
    localFoodSuggestions: [],
    budgetEstimate: asBudgetEstimate(),
    rainPlan: [],
    tips: [],
    disclaimer: '施設の営業状況、料金、移動時間は出発前に公式情報やGoogle Mapsで確認してください。',
    isFallback: true,
  }
}
