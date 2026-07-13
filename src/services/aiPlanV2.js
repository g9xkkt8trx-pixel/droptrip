const MAX_TEXT_LENGTH = 500
const MAX_ITEMS_PER_DAY = 6
const MAX_DAYS = 5
const MAX_PHOTO_SPOTS = 3
const MAX_FOOD_SUGGESTIONS = 4
const MAX_TIPS = 5

const asText = (value, maxLength = MAX_TEXT_LENGTH) => (
  typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
)

const asStringArray = (value, maxItems = MAX_TIPS) => (
  Array.isArray(value) ? value.map((item) => asText(item, 180)).filter(Boolean).slice(0, maxItems) : []
)

const asPlanItem = (item = {}) => ({
  time: asText(item.time, 16),
  type: asText(item.type, 20),
  title: asText(item.title, 120),
  description: asText(item.description, 420),
  duration: asText(item.duration, 80),
  location: asText(item.location, 160),
  mapQuery: asText(item.mapQuery, 180),
  photoTip: asText(item.photoTip, 240),
  caution: asText(item.caution, 240),
})

const asPhotoSpot = (item = {}) => ({
  name: asText(item.name, 120),
  reason: asText(item.reason, 260),
  bestTime: asText(item.bestTime, 120),
})

const asFoodSuggestion = (item = {}) => ({
  name: asText(item.name, 120),
  description: asText(item.description, 260),
  note: asText(item.note, 180),
})

const asRainPlan = (item = {}) => ({
  replace: asText(item.replace, 140),
  with: asText(item.with, 140),
  reason: asText(item.reason, 260),
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
    title: { type: 'string' },
    concept: { type: 'string' },
    summary: { type: 'string' },
    days: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['day', 'title', 'items'],
        properties: {
          day: { type: 'integer' },
          title: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['time', 'type', 'title', 'description', 'duration', 'location', 'mapQuery', 'photoTip', 'caution'],
              properties: {
                time: { type: 'string' }, type: { type: 'string' }, title: { type: 'string' }, description: { type: 'string' },
                duration: { type: 'string' }, location: { type: 'string' }, mapQuery: { type: 'string' },
                photoTip: { type: 'string' }, caution: { type: 'string' },
              },
            },
          },
        },
      },
    },
    recommendedPhotoSpots: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false, required: ['name', 'reason', 'bestTime'],
        properties: { name: { type: 'string' }, reason: { type: 'string' }, bestTime: { type: 'string' } },
      },
    },
    localFoodSuggestions: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false, required: ['name', 'description', 'note'],
        properties: { name: { type: 'string' }, description: { type: 'string' }, note: { type: 'string' } },
      },
    },
    budgetEstimate: {
      type: 'object', additionalProperties: false,
      required: ['transport', 'food', 'sightseeing', 'lodging', 'total'],
      properties: {
        transport: { type: 'string' }, food: { type: 'string' }, sightseeing: { type: 'string' },
        lodging: { type: 'string' }, total: { type: 'string' },
      },
    },
    rainPlan: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false, required: ['replace', 'with', 'reason'],
        properties: { replace: { type: 'string' }, with: { type: 'string' }, reason: { type: 'string' } },
      },
    },
    tips: { type: 'array', items: { type: 'string' } },
    disclaimer: { type: 'string' },
  },
}

export const normalizeAiPlanV2 = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null

  const days = Array.isArray(value.days)
    ? value.days.map((day, index) => ({
      day: Number.isInteger(day?.day) && day.day > 0 ? day.day : index + 1,
      title: asText(day?.title, 140),
      items: Array.isArray(day?.items) ? day.items.map(asPlanItem).filter((item) => item.title).slice(0, MAX_ITEMS_PER_DAY) : [],
    })).filter((day) => day.items.length > 0).slice(0, MAX_DAYS)
    : []

  const plan = {
    title: asText(value.title, 160),
    concept: asText(value.concept, 260),
    summary: asText(value.summary, 600),
    days,
    recommendedPhotoSpots: Array.isArray(value.recommendedPhotoSpots)
      ? value.recommendedPhotoSpots.map(asPhotoSpot).filter((item) => item.name).slice(0, MAX_PHOTO_SPOTS)
      : [],
    localFoodSuggestions: Array.isArray(value.localFoodSuggestions)
      ? value.localFoodSuggestions.map(asFoodSuggestion).filter((item) => item.name).slice(0, MAX_FOOD_SUGGESTIONS)
      : [],
    budgetEstimate: asBudgetEstimate(value.budgetEstimate),
    rainPlan: Array.isArray(value.rainPlan) ? value.rainPlan.map(asRainPlan).filter((item) => item.replace || item.with).slice(0, 3) : [],
    tips: asStringArray(value.tips),
    disclaimer: asText(value.disclaimer, 320),
  }

  return plan.title && plan.summary && plan.days.length > 0 ? plan : null
}

export const parseAiPlanV2 = (text) => {
  if (typeof text !== 'string' || !text.trim()) return null
  try {
    return normalizeAiPlanV2(JSON.parse(text))
  } catch {
    return null
  }
}

export const createAiPlanTextFallback = (text) => ({
  title: 'AIプラン案',
  concept: '生成結果を読みやすく整理しています。',
  summary: asText(text, 2_000),
  days: [],
  recommendedPhotoSpots: [],
  localFoodSuggestions: [],
  budgetEstimate: asBudgetEstimate(),
  rainPlan: [],
  tips: [],
  disclaimer: '施設の営業状況、料金、移動時間は出発前に公式情報やGoogle Mapsで確認してください。',
  isFallback: true,
})
