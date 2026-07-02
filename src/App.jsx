import { useEffect, useRef, useState } from 'react'
import './App.css'
import {
  createTransitFallback,
  getGoogleMapsApiKeySource,
  getGoogleMapsCommunicationModeLabel,
  getTravelInfo,
} from './services/travelTime'
import { createAiPlanPrompt } from './services/aiPlanPrompt'
import { getOpenAiApiKeySource } from './services/openAiConfig'
import { generateOpenAiPlan, getOpenAiCommunicationModeLabel, OPENAI_PLAN_MODEL } from './services/openAiPlan'
import {
  isPremiumEnabled,
  loadPremiumStatus,
  PREMIUM_STATUS_STORAGE_KEY,
  savePremiumStatus,
} from './services/premium'
import destinations from './data/destinations.js'
import {
  DEFAULT_TRAVEL_IMAGE,
  getDestinationImageCandidates,
  getImageCredit,
  getImageUrl,
  isValidImageUrl,
} from './data/destinationImages'
import { runDestinationQualityChecks } from './services/destinationQuality'
import { analyzeDrawBalance } from './services/drawBalance'
import {
  APP_API_MODE,
  APP_BETA_SCOPE,
  APP_DEPLOY_TARGET,
  APP_RELEASE_NOTE,
  APP_STAGE,
  APP_VERSION,
} from './config/appVersion'

const tripTypes = ['日帰り', '1泊2日', '自分で入力']
const storedTripTypes = [...tripTypes, '2泊3日']
const primaryTransportModes = ['車', '電車', '飛行機']
const transportModes = [...primaryTransportModes]
const seasonOptions = ['今の季節', '春', '夏', '秋', '冬', 'おまかせ']
const filterOptions = ['カップル', '一人旅', '友達', 'ファミリー', 'ペットあり']
const travelPurposeOptions = ['グルメ', '神社・歴史', '温泉', '自然・絶景', 'アクティビティ', '体験', '街歩き', 'ゆっくり']
const destinationTagOptions = ['温泉', '海', '山', 'グルメ', 'カップル向け']
const legacyFilterToPurposeMap = {
  温泉: '温泉',
  海: '自然・絶景',
  山: '自然・絶景',
  グルメ: 'グルメ',
  カップル向け: null,
}
const legacyFilterToStyleMap = {
  カップル向け: 'カップル',
}
const travelStyleProfiles = {
  カップル: {
    tags: ['温泉', '海', 'カップル向け'],
    keywords: ['温泉', '景色', '街歩き', '夜景', '海辺', '宿', 'カフェ', 'ゆっくり', 'レトロ'],
    cities: ['箱根町', '熱海市', '草津町', '横浜市', '小樽市', '軽井沢町', '白浜町'],
  },
  一人旅: {
    tags: ['グルメ', '山'],
    keywords: ['街歩き', '歴史', '自然', 'グルメ', '静か', '町並み', '散策', 'カフェ'],
    cities: ['金沢市', '鎌倉市', '尾道市', '倉敷市', '高山市', '松江市'],
  },
  友達: {
    tags: ['グルメ', '海'],
    keywords: ['グルメ', 'アクティビティ', '街歩き', '観光', '市場', '商店街', '体験'],
    cities: ['札幌市', '福岡市', '大阪市', '横浜市', '長崎市', '広島市'],
  },
  ファミリー: {
    tags: ['山', '海'],
    keywords: ['自然', '体験', '観光施設', '公園', '水族館', '牧場', '移動しやすい'],
    cities: ['富良野市', '日光市', '軽井沢町', '鳥取市', '白浜町', '那覇市'],
  },
  ペットあり: {
    tags: ['山', '海'],
    keywords: ['自然', '公園', '海辺', '高原', '散策', 'ドッグ', 'テラス'],
    cities: ['軽井沢町', '富良野市', '白浜町', '鎌倉市', '小樽市'],
  },
}
const travelPurposeProfiles = {
  グルメ: {
    tags: ['グルメ'],
    keywords: ['グルメ', '食', '海鮮', '寿司', 'カフェ', '市場', '屋台', 'ラーメン', '名物', '郷土料理', 'スイーツ'],
    cities: ['小樽市', '札幌市', '函館市', '金沢市', '福岡市', '長崎市', '広島市', '別府市'],
  },
  '神社・歴史': {
    tags: ['歴史', '神社', '寺社'],
    keywords: ['歴史', '寺', '神社', '文化', '城', '古都', '世界遺産', '町並み', 'レトロ'],
    cities: ['京都市', '奈良市', '鎌倉市', '伊勢市', '宮島', '日光市', '会津若松市', '松江市'],
  },
  温泉: {
    tags: ['温泉'],
    keywords: ['温泉', '湯', '湯けむり', '旅館', '外湯'],
    cities: ['箱根町', '熱海市', '草津町', '別府市', '白浜町', '由布市', '下呂市'],
  },
  '自然・絶景': {
    tags: ['山', '海', '自然'],
    keywords: ['自然', '絶景', '山', '海', '湖', '高原', '島', '砂浜', '滝', '森', '景色'],
    cities: ['富良野市', '石垣市', '松島町', '日光市', '軽井沢町', '白浜町'],
  },
  アクティビティ: {
    tags: ['海', '山'],
    keywords: ['海', '山', '島', 'アウトドア', '体験', '散策', 'ハイキング', '高原', '砂浜'],
    cities: ['石垣市', '富良野市', '日光市', '軽井沢町', '白浜町', '鳥取市'],
  },
  体験: {
    tags: ['グルメ', '温泉'],
    keywords: ['体験', '工芸', '文化', '食', '温泉街', '散策', '市場', 'カフェ', '町歩き'],
    cities: ['金沢市', '京都市', '倉敷市', '高山市', '小樽市', '別府市'],
  },
  街歩き: {
    tags: ['グルメ', 'カップル向け'],
    keywords: ['街歩き', '町並み', '港町', 'レトロ', 'カフェ', '散策', '夜景', '商店街'],
    cities: ['小樽市', '金沢市', '鎌倉市', '横浜市', '京都市', '尾道市', '倉敷市', '高山市'],
  },
  ゆっくり: {
    tags: ['温泉', '山', 'カップル向け'],
    keywords: ['温泉', '自然', '高原', 'カフェ', 'のんびり', '癒や', 'ゆっくり', '宿'],
    cities: ['箱根町', '草津町', '軽井沢町', '富良野市', '別府市', '松江市'],
  },
}
const movementRangeOptions = [
  { value: 'auto', label: 'おまかせ', maxHours: null, maxKm: null },
  { value: 'near', label: '近場', description: '気軽に行きやすい範囲', maxHours: 1.5, maxKm: 90 },
  { value: 'middle', label: '中距離', description: '少し足を伸ばす旅', maxHours: 4, maxKm: 260 },
  { value: 'far', label: '遠出', description: 'しっかり旅気分を味わう距離', maxHours: 8, maxKm: 560 },
  { value: 'unlimited', label: '制限なし', description: '全国から探す', maxHours: null, maxKm: null },
]
const TRAVEL_RANGE_RULES = {
  auto: { hardFilter: false },
  near: { maxApproxMinutes: 90, softMaxApproxMinutes: 120, maxApproxDistanceKm: 120, softMaxApproxDistanceKm: 160, hardFilter: true, relaxMultiplier: 1 },
  middle: { maxApproxMinutes: 360, maxApproxDistanceKm: 460, hardFilter: true, relaxMultiplier: 1.25 },
  far: { maxApproxMinutes: 720, maxApproxDistanceKm: 1000, hardFilter: false },
  unlimited: { hardFilter: false },
}
const prefectureRegionMap = {
  北海道: '北海道',
  青森県: '東北',
  岩手県: '東北',
  宮城県: '東北',
  秋田県: '東北',
  山形県: '東北',
  福島県: '東北',
  茨城県: '関東',
  栃木県: '関東',
  群馬県: '関東',
  埼玉県: '関東',
  千葉県: '関東',
  東京都: '関東',
  神奈川県: '関東',
  新潟県: '中部',
  富山県: '中部',
  石川県: '中部',
  福井県: '中部',
  山梨県: '中部',
  長野県: '中部',
  岐阜県: '中部',
  静岡県: '中部',
  愛知県: '中部',
  三重県: '関西',
  滋賀県: '関西',
  京都府: '関西',
  大阪府: '関西',
  兵庫県: '関西',
  奈良県: '関西',
  和歌山県: '関西',
  鳥取県: '中国',
  島根県: '中国',
  岡山県: '中国',
  広島県: '中国',
  山口県: '中国',
  徳島県: '四国',
  香川県: '四国',
  愛媛県: '四国',
  高知県: '四国',
  福岡県: '九州',
  佐賀県: '九州',
  長崎県: '九州',
  熊本県: '九州',
  大分県: '九州',
  宮崎県: '九州',
  鹿児島県: '九州',
  沖縄県: '沖縄',
}
const regionNeighbors = {
  北海道: ['北海道', '東北'],
  東北: ['北海道', '東北', '関東'],
  関東: ['東北', '関東', '中部'],
  中部: ['関東', '中部', '関西'],
  関西: ['中部', '関西', '中国', '四国'],
  中国: ['関西', '中国', '四国', '九州'],
  四国: ['関西', '中国', '四国'],
  九州: ['中国', '九州', '沖縄'],
  沖縄: ['九州', '沖縄'],
}
const originRegionHints = [
  { region: '北海道', keywords: ['北海道', '札幌', '函館', '小樽', '旭川', '新千歳'] },
  { region: '東北', keywords: ['仙台', '宮城', '青森', '盛岡', '秋田', '山形', '福島', '会津若松'] },
  { region: '関東', keywords: ['水戸', '土浦', '茨城', '東京', '上野', '品川', '新宿', '横浜', '大宮', '千葉', '宇都宮', '高崎', '前橋'] },
  { region: '中部', keywords: ['名古屋', '愛知', '静岡', '浜松', '金沢', '富山', '新潟', '長野', '軽井沢', '甲府', '岐阜'] },
  { region: '関西', keywords: ['大阪', '新大阪', '京都', '神戸', '奈良', '和歌山', '滋賀', '三重', '伊勢'] },
  { region: '中国', keywords: ['広島', '岡山', '倉敷', '松江', '鳥取', '山口', '尾道'] },
  { region: '四国', keywords: ['高松', '松山', '徳島', '高知'] },
  { region: '九州', keywords: ['福岡', '博多', '北九州', '佐賀', '長崎', '熊本', '大分', '別府', '宮崎', '鹿児島'] },
  { region: '沖縄', keywords: ['沖縄', '那覇', '石垣', '宮古'] },
]
const FAVORITES_STORAGE_KEY = 'droptrip-favorites'
const COMPARE_STORAGE_KEY = 'droptrip-compare'
const MAPS_API_KEY_STORAGE_KEY = 'droptrip-google-maps-api-key'
const OPENAI_API_KEY_STORAGE_KEY = 'droptrip-openai-api-key'
const AI_PLAN_USAGE_STORAGE_KEY = 'droptrip-ai-plan-usage'
const TRAVEL_CACHE_STORAGE_KEY = 'droptrip-travel-time-cache'
const DRAW_HISTORY_STORAGE_KEY = 'droptrip-draw-history'
const INPUT_STATE_STORAGE_KEY = 'droptrip-input-state'
const BETA_FEEDBACK_STORAGE_KEY = 'droptrip-beta-feedback'
const MAX_HISTORY_ITEMS = 20
const DAILY_AI_PLAN_LIMIT = 3
const betaTestCheckpoints = [
  '旅先の提案は自然か',
  '画像は魅力的か',
  '移動時間は納得できるか',
  '一覧ページは探しやすいか',
  '比較機能は使いやすいか',
  'お気に入り登録は分かりやすいか',
  'AIプラン案内は押し売り感がないか',
  'スマホで見づらい箇所はないか',
]
const destinationQualityReport = runDestinationQualityChecks(destinations)
const drawBalanceReport = analyzeDrawBalance(destinations)
const publicSecurityChecks = [
  { label: 'APIキー全文が画面に表示されない', passed: true, note: '設定状態と末尾4文字だけを表示します。' },
  { label: '.env がGit管理対象外', passed: true, note: '.gitignoreで .env と派生ファイルを除外しています。' },
  { label: '.env.example のみGit管理対象', passed: true, note: '変数名と安全な初期値だけを共有します。' },
  { label: 'OpenAI APIキーをサーバー側で管理', passed: false, note: '公開版へ移行する際に必須です。現在はローカル検証用です。' },
  { label: 'Google Maps API制限と経路APIの保護を設定', passed: false, note: 'Routes API制限に加え、/api/route-timeへ認証・レート制限を追加してください。' },
]
const DEBUG_STORAGE_KEYS = [
  FAVORITES_STORAGE_KEY,
  COMPARE_STORAGE_KEY,
  MAPS_API_KEY_STORAGE_KEY,
  OPENAI_API_KEY_STORAGE_KEY,
  AI_PLAN_USAGE_STORAGE_KEY,
  PREMIUM_STATUS_STORAGE_KEY,
  TRAVEL_CACHE_STORAGE_KEY,
  DRAW_HISTORY_STORAGE_KEY,
  INPUT_STATE_STORAGE_KEY,
  BETA_FEEDBACK_STORAGE_KEY,
]
const tripCompatibility = {
  日帰り: '見どころを絞って巡りやすく、朝出発・夜帰宅の気軽な旅と相性が良い場所です。',
  '1泊2日': '観光と食事を急がず楽しめ、現地で過ごす夜も旅の思い出にできます。',
  '2泊3日': '定番スポットから周辺エリアまで、余裕を持ってじっくり満喫できます。',
  '3泊4日以上': '周辺の旅先も組み合わせながら、ゆったり滞在しやすい日程です。',
}

const expectedTripDays = { 日帰り: 1, '1泊2日': 2, '2泊3日': 3, '3泊4日以上': 4 }
const destinyComments = {
  excellent: [
    '今のあなたにぴったりの旅先です',
    '条件との相性が非常に高いです',
    '運命に導かれたような旅になりそうです',
  ],
  great: [
    'あなたの希望にしっかり応えてくれる旅先です',
    '好きなことを存分に楽しめそうです',
    '心に残る旅になる予感があります',
  ],
  discovery: [
    '新しい発見が期待できます',
    '思いがけない魅力に出会えそうです',
    'いつもと少し違う旅を楽しめそうです',
  ],
}

const getCurrentSeason = (month = new Date().getMonth() + 1) => {
  if (month >= 3 && month <= 5) return '春'
  if (month >= 6 && month <= 8) return '夏'
  if (month >= 9 && month <= 11) return '秋'
  return '冬'
}

const resolveSeason = (travelSeason) => (
  travelSeason === '今の季節' ? getCurrentSeason() : travelSeason === 'おまかせ' ? null : travelSeason
)

const getSeasonCompatibility = (destination, travelSeason, tripType) => {
  const season = resolveSeason(travelSeason)
  if (!season) {
    return {
      season: 'おまかせ',
      stars: 4,
      starsLabel: '★★★★☆',
      isBest: false,
      description: `${destination.city}の季節ごとの魅力から、旅行時期に合わせて楽しみ方を選べます。`,
    }
  }

  const isBest = destination.bestSeasons.includes(season)
  const stars = isBest ? 5 : 3
  return {
    season,
    stars,
    starsLabel: `${'★'.repeat(stars)}${'☆'.repeat(5 - stars)}`,
    isBest,
    description: `${season}の${destination.city}は${destination.seasonHighlights[season]}ため、${tripType}の旅行先として${isBest ? '特に魅力が高い' : '新しい魅力を見つけやすい'}です。`,
  }
}

const originCoordinateHints = [
  { keyword: '札幌', latitude: 43.0618, longitude: 141.3545 },
  { keyword: '北海道', latitude: 43.0618, longitude: 141.3545 },
  { keyword: '仙台', latitude: 38.2682, longitude: 140.8694 },
  { keyword: '宮城', latitude: 38.2682, longitude: 140.8694 },
  { keyword: '水戸', latitude: 36.3659, longitude: 140.4714 },
  { keyword: '茨城', latitude: 36.3659, longitude: 140.4714 },
  { keyword: '高崎', latitude: 36.3222, longitude: 139.0033 },
  { keyword: '群馬', latitude: 36.3912, longitude: 139.0609 },
  { keyword: '東京', latitude: 35.6812, longitude: 139.7671 },
  { keyword: '新宿', latitude: 35.6909, longitude: 139.7003 },
  { keyword: '神奈川', latitude: 35.4437, longitude: 139.6380 },
  { keyword: '横浜', latitude: 35.4437, longitude: 139.6380 },
  { keyword: '名古屋', latitude: 35.1709, longitude: 136.8815 },
  { keyword: '愛知', latitude: 35.1709, longitude: 136.8815 },
  { keyword: '金沢', latitude: 36.5781, longitude: 136.6480 },
  { keyword: '京都', latitude: 34.9858, longitude: 135.7588 },
  { keyword: '大阪', latitude: 34.7025, longitude: 135.4959 },
  { keyword: '新大阪', latitude: 34.7335, longitude: 135.5002 },
  { keyword: '神戸', latitude: 34.6901, longitude: 135.1955 },
  { keyword: '広島', latitude: 34.3973, longitude: 132.4756 },
  { keyword: '高松', latitude: 34.3503, longitude: 134.0467 },
  { keyword: '松山', latitude: 33.8402, longitude: 132.7516 },
  { keyword: '博多', latitude: 33.5902, longitude: 130.4206 },
  { keyword: '福岡', latitude: 33.5902, longitude: 130.4206 },
  { keyword: '長崎', latitude: 32.7520, longitude: 129.8707 },
  { keyword: '熊本', latitude: 32.7898, longitude: 130.7417 },
  { keyword: '鹿児島', latitude: 31.5841, longitude: 130.5410 },
  { keyword: '那覇', latitude: 26.2124, longitude: 127.6809 },
  { keyword: '沖縄', latitude: 26.2124, longitude: 127.6809 },
]

const toRadians = (degrees) => degrees * (Math.PI / 180)

const getDistanceKm = (origin, destination) => {
  if (!origin || !destination) return null
  const earthRadiusKm = 6371
  const latitudeDistance = toRadians(destination.latitude - origin.latitude)
  const longitudeDistance = toRadians(destination.longitude - origin.longitude)
  const startLatitude = toRadians(origin.latitude)
  const endLatitude = toRadians(destination.latitude)
  const a = Math.sin(latitudeDistance / 2) ** 2
    + Math.cos(startLatitude) * Math.cos(endLatitude) * Math.sin(longitudeDistance / 2) ** 2
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const inferOriginCoordinates = (departure = '') => {
  const normalized = departure.trim()
  const destinationMatch = destinations.find((place) => (
    normalized.includes(place.city) || normalized.includes(place.prefecture)
  ))
  if (destinationMatch?.latitude && destinationMatch?.longitude) {
    return { latitude: destinationMatch.latitude, longitude: destinationMatch.longitude, label: `${destinationMatch.prefecture}${destinationMatch.city}` }
  }
  const hint = originCoordinateHints.find((item) => normalized.includes(item.keyword))
  if (hint) return { latitude: hint.latitude, longitude: hint.longitude, label: hint.keyword }
  return { latitude: 35.6812, longitude: 139.7671, label: '東京駅（概算）' }
}

const getDestinationRegion = (destination = {}) => (
  destination.region
  ?? destination.area
  ?? prefectureRegionMap[destination.prefecture]
  ?? '未判定'
)

const clampTripNights = (value) => Math.min(7, Math.max(0, Number.parseInt(value, 10) || 0))

const resolveTripSchedule = (tripType, customNights = 2, customDays = null) => {
  if (tripType === '日帰り') {
    return { tripType: '日帰り', label: '日帰り', nights: 0, days: 1, planKey: '日帰り', compatibilityKey: '日帰り', isCustom: false, suggestionCount: 0 }
  }
  if (tripType === '1泊2日') {
    return { tripType: '1泊2日', label: '1泊2日', nights: 1, days: 2, planKey: '1泊2日', compatibilityKey: '1泊2日', isCustom: false, suggestionCount: 0 }
  }

  const nights = tripType === '2泊3日' ? 2 : clampTripNights(customNights)
  const naturalDays = nights + 1
  const parsedDays = Number.parseInt(customDays, 10)
  const days = Number.isFinite(parsedDays) && parsedDays > 0
    ? Math.min(8, Math.max(1, parsedDays))
    : naturalDays
  if (nights <= 0) return { tripType: '日帰り', label: '日帰り', nights: 0, days: 1, planKey: '日帰り', compatibilityKey: '日帰り', isCustom: tripType !== '日帰り', suggestionCount: 0 }
  if (nights === 1) return { tripType: '1泊2日', label: '1泊2日', nights: 1, days: 2, planKey: '1泊2日', compatibilityKey: '1泊2日', isCustom: tripType !== '1泊2日', suggestionCount: 0 }

  return {
    tripType: '自分で入力',
    label: `${nights}泊${naturalDays}日`,
    nights,
    days: naturalDays,
    planKey: '2泊3日',
    compatibilityKey: nights >= 3 ? '3泊4日以上' : '2泊3日',
    isCustom: true,
    dayInputWasAdjusted: days !== naturalDays,
    suggestionCount: nights >= 5 ? 3 : nights >= 4 ? 2 : nights >= 3 ? 2 : 1,
  }
}

const normalizeStoredTripType = (tripType, customNights, customDays) => {
  if (tripType === '2泊3日') return { tripType: '自分で入力', customNights: '2', customDays: '3' }
  if (storedTripTypes.includes(tripType)) {
    const schedule = resolveTripSchedule(tripType, customNights, customDays)
    return { tripType: schedule.tripType, customNights: String(schedule.nights), customDays: String(schedule.days) }
  }
  return { tripType: '日帰り', customNights: '2', customDays: '3' }
}

const normalizeTravelStyles = (values = []) => [...new Set(values
  .map((value) => legacyFilterToStyleMap[value] ?? value)
  .filter((value) => filterOptions.includes(value)))]

const normalizeTravelPurposes = (values = [], legacyFilters = []) => [...new Set([
  ...values.filter((purpose) => travelPurposeOptions.includes(purpose)),
  ...legacyFilters.map((filter) => legacyFilterToPurposeMap[filter]).filter((purpose) => travelPurposeOptions.includes(purpose)),
])]

const getBudgetForSchedule = (destination = {}, schedule = {}) => (
  destination.budgets?.[schedule.label]
  ?? destination.budgets?.[schedule.planKey]
  ?? destination.budgets?.['2泊3日']
  ?? destination.budgets?.['1泊2日']
  ?? destination.budgets?.日帰り
  ?? '時期により変動'
)

const getPlansForSchedule = (destination = {}, schedule = {}) => (
  destination.plans?.[schedule.planKey]
  ?? destination.plans?.['2泊3日']
  ?? destination.plans?.['1泊2日']
  ?? destination.plans?.日帰り
  ?? []
)

const travelStyleFitKeys = {
  カップル: 'couple',
  一人旅: 'solo',
  友達: 'friends',
  ファミリー: 'family',
  ペットあり: 'pet',
}

const travelPurposeFitKeys = {
  グルメ: 'gourmet',
  '神社・歴史': 'history',
  温泉: 'onsen',
  '自然・絶景': 'nature',
  アクティビティ: 'activity',
  体験: 'experience',
  街歩き: 'walking',
  ゆっくり: 'relax',
}

const getTravelStyleMatch = (destination = {}, selectedStyles = []) => {
  if (!Array.isArray(selectedStyles) || selectedStyles.length === 0) {
    return { matchedStyles: [], score: 0, summary: '' }
  }
  const tags = destination.tags ?? []
  const searchableText = normalizeSearchText([
    destination.city,
    destination.prefecture,
    destination.recommendText,
    destination.recommendation,
    destination.highlights,
    destination.reason,
    Object.values(destination.seasonHighlights ?? {}).join(' '),
    tags.join(' '),
  ].join(' '))
  const matchedStyles = selectedStyles.filter((style) => {
    const profile = travelStyleProfiles[style]
    if (!profile) return false
    const fitKey = travelStyleFitKeys[style]
    const fitScore = Number(destination.companionFit?.[fitKey] ?? 0)
    return fitScore >= 55
      || profile.tags.some((tag) => tags.includes(tag))
      || profile.cities.some((city) => destination.city === city)
      || profile.keywords.some((keyword) => searchableText.includes(normalizeSearchText(keyword)))
  })
  return {
    matchedStyles,
    score: matchedStyles.reduce((total, style) => {
      const fitKey = travelStyleFitKeys[style]
      const fitScore = Number(destination.companionFit?.[fitKey] ?? 0)
      return total + Math.max(travelStyleProfiles[style]?.cities?.includes(destination.city) ? 18 : 13, Math.round(fitScore / 5))
    }, 0),
    summary: matchedStyles.length > 0 ? `${matchedStyles.slice(0, 2).join('・')}の旅に合わせやすい雰囲気です。` : '',
  }
}

const longStayHubCities = ['京都市', '大阪市', '福岡市', '金沢市', '札幌市', '長崎市', '広島市', '那覇市', '仙台市', '横浜市']

const getTripScheduleScore = (destination, schedule, movementRangeEstimate) => {
  const accessMinutes = Number.isFinite(destination.stationAccessMinutes) ? destination.stationAccessMinutes : 30
  const estimatedMinutes = movementRangeEstimate?.estimatedMinutes
  const stayFit = destination.stayFit ?? {}
  if (schedule.days <= 1) return (accessMinutes <= 45 ? 24 : accessMinutes <= 90 ? 14 : -8) + Math.round((stayFit.dayTrip ?? 0) / 8)
  if (schedule.days === 2) return (accessMinutes <= 90 ? 18 : 8) + Math.round((stayFit.oneNight ?? 0) / 8)
  const region = getDestinationRegion(destination)
  const isIslandStay = region === '沖縄' || ['石垣市', '那覇市'].includes(destination.city)
  const longStayTags = ['温泉', '山', '海', 'グルメ', '歴史', 'カップル向け'].filter((tag) => destination.tags?.includes(tag)).length
  const sameRegionCount = destinations.filter((place) => place.id !== destination.id && getDestinationRegion(place) === region).length
  let score = schedule.days >= 5 ? 20 : 13
  score += Math.round((destination.stayFit?.[schedule.days >= 5 ? 'longStay' : 'twoNights'] ?? 0) / 7)
  if (destination.goodForLongStay && schedule.days >= 5) score += 6
  score += Math.min(longStayTags, 4) * 4
  score += Math.min(sameRegionCount, 4) * (schedule.days >= 5 ? 2.5 : 1.5)
  if (longStayHubCities.includes(destination.city)) score += 8
  if (isIslandStay) score += 8
  if (Number.isFinite(estimatedMinutes) && estimatedMinutes > 360) score += schedule.days >= 3 ? 8 : -8
  return score
}

const getLongTripPacingItems = (schedule, hasSuggestions) => {
  if (schedule.days < 5) return []
  return [
    '1〜2日目：メイン旅先をゆっくり楽しむ',
    hasSuggestions ? '3日目：関連候補へ足を伸ばす' : '3日目：近隣散策や自然・グルメを深掘りする',
    '4〜5日目：旅の目的に合わせて街歩き・温泉・食を楽しむ',
    '最終日：帰路に合わせて軽めに観光する',
  ]
}

const getStayFocusedSuggestion = (mainDestination, schedule) => ({
  city: `${mainDestination.city}周辺`,
  prefecture: mainDestination.prefecture,
  reason: `${schedule.label}なら、無理に遠方を足さず、${mainDestination.city}周辺の自然・グルメ・街歩きを深く楽しむ滞在も相性が良いです。`,
  isStayFocus: true,
})

const getNearbyTripSuggestions = (mainDestination, destinationList, schedule, selectedPurposes = []) => {
  if (!mainDestination || schedule.suggestionCount <= 0) return []
  const mainRegion = getDestinationRegion(mainDestination)
  const mainTags = mainDestination.tags ?? []
  const hintWords = Array.isArray(mainDestination.nearbyDestinationHints) ? mainDestination.nearbyDestinationHints : []
  const allowedRegions = mainRegion === '沖縄' ? ['沖縄'] : (regionNeighbors[mainRegion] ?? [mainRegion])
  const suggestions = destinationList
    .filter((place) => place.id !== mainDestination.id && allowedRegions.includes(getDestinationRegion(place)))
    .map((place) => {
      const samePrefecture = place.prefecture === mainDestination.prefecture
      const sameRegion = getDestinationRegion(place) === mainRegion
      const purposeMatch = getTravelPurposeMatch(place, selectedPurposes)
      const sharedTags = (place.tags ?? []).filter((tag) => mainTags.includes(tag))
      const hintMatched = hintWords.some((hint) => hint.includes(place.city) || place.city.includes(hint) || hint.includes(place.prefecture?.replace('県', '') ?? ''))
      const score = (samePrefecture ? 26 : sameRegion ? 18 : 8)
        + Math.min(purposeMatch.score, 20)
        + Math.min(sharedTags.length, 3) * 6
        + (hintMatched ? 28 : 0)
        + Math.round((place.stayFit?.longStay ?? 0) / 12)
        + (longStayHubCities.includes(place.city) ? 4 : 0)
      const reasonParts = []
      if (hintMatched) reasonParts.push('周遊候補として相性が良い')
      if (samePrefecture) reasonParts.push('同じ都道府県で組み合わせやすい')
      else if (sameRegion) reasonParts.push('同じ地域内で移動しやすい')
      else reasonParts.push('近隣地方として足を伸ばしやすい')
      if (purposeMatch.matchedPurposes.length > 0) reasonParts.push(`${purposeMatch.matchedPurposes.slice(0, 2).join('・')}の目的にも合う`)
      if (sharedTags.length > 0) reasonParts.push(`${sharedTags.slice(0, 2).join('・')}のテーマが近い`)
      return {
        destination: place,
        score,
        reason: `${reasonParts.join('ため、')}候補です。`,
        purposeMatch,
        sharedTags,
        regionMatch: samePrefecture ? 'same-prefecture' : sameRegion ? 'same-region' : 'neighbor-region',
      }
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, schedule.suggestionCount)

  if (suggestions.length === 0 && schedule.days >= 5) {
    return [getStayFocusedSuggestion(mainDestination, schedule)]
  }
  return suggestions
}
const inferOriginRegion = (departure = '') => {
  const normalized = departure.trim()
  const prefectureMatch = Object.keys(prefectureRegionMap).find((prefecture) => normalized.includes(prefecture))
  if (prefectureMatch) return prefectureRegionMap[prefectureMatch]

  const destinationMatch = destinations.find((place) => (
    normalized.includes(place.city) || normalized.includes(place.nearestStation ?? '')
  ))
  if (destinationMatch) return getDestinationRegion(destinationMatch)

  const hint = originRegionHints.find((item) => (
    item.keywords.some((keyword) => normalized.includes(keyword))
  ))
  return hint?.region ?? '関東'
}

const getMovementRangeConfig = ({ movementRange, customRangeHours, customRangeKm }) => {
  const selected = movementRangeOptions.find((option) => option.value === movementRange) ?? movementRangeOptions[0]
  const customHours = Number(customRangeHours)
  const customKm = Number(customRangeKm)
  const rule = TRAVEL_RANGE_RULES[selected.value] ?? TRAVEL_RANGE_RULES.auto
  return {
    ...selected,
    maxHours: Number.isFinite(customHours) && customHours > 0 ? customHours : selected.maxHours,
    maxKm: Number.isFinite(customKm) && customKm > 0 ? customKm : selected.maxKm,
    ...rule,
  }
}

const estimateMovementRange = (destination, departure, rangeSettings) => {
  const origin = inferOriginCoordinates(departure)
  const originRegion = inferOriginRegion(departure)
  const destinationRegion = getDestinationRegion(destination)
  const nearbyRegions = regionNeighbors[originRegion] ?? [originRegion]
  const isSameRegion = originRegion === destinationRegion
  const isNeighborRegion = nearbyRegions.includes(destinationRegion)
  const directDistanceKm = getDistanceKm(origin, destination)
  if (!Number.isFinite(directDistanceKm)) {
    return {
      originLabel: origin?.label ?? '未判定',
      originRegion,
      destinationRegion,
      isSameRegion,
      isNeighborRegion,
      estimatedKm: null,
      estimatedHours: null,
      estimatedMinutes: null,
      isWithinRange: true,
      isHardExcluded: false,
      scoreEffect: 0,
      label: '概算不可',
    }
  }

  const estimatedKm = Math.round(directDistanceKm * 1.25)
  const estimatedHours = Math.round(((estimatedKm / 65) + 0.35) * 10) / 10
  const estimatedMinutes = Math.round(estimatedHours * 60)
  const maxMinutes = rangeSettings.maxApproxMinutes ?? (
    Number.isFinite(rangeSettings.maxHours) ? rangeSettings.maxHours * 60 : null
  )
  const maxKm = rangeSettings.maxApproxDistanceKm ?? rangeSettings.maxKm
  const hasLimit = Number.isFinite(maxMinutes) || Number.isFinite(maxKm)
  const minuteOver = Number.isFinite(maxMinutes) ? estimatedMinutes - maxMinutes : 0
  const kmOver = Number.isFinite(maxKm) ? estimatedKm - maxKm : 0
  const isWithinRange = !hasLimit || (minuteOver <= 0 && kmOver <= 0)
  const isFarOver = hasLimit && (minuteOver > 30 || kmOver > 80)
  const isRegionMismatchForNear = rangeSettings.value === 'near' && !isNeighborRegion
  const isHardExcluded = Boolean(
    rangeSettings.hardFilter
    && (
      isRegionMismatchForNear
      || minuteOver > 0
      || kmOver > 0
    ),
  )
  const scoreEffect = !hasLimit
    ? 0
    : isWithinRange && (rangeSettings.value !== 'near' || isNeighborRegion)
      ? 18
      : isFarOver ? -18 : -8

  return {
    originLabel: origin.label,
    originRegion,
    destinationRegion,
    isSameRegion,
    isNeighborRegion,
    estimatedKm,
    estimatedHours,
    estimatedMinutes,
    isWithinRange,
    isHardExcluded,
    scoreEffect,
    label: `${estimatedHours}時間 / ${estimatedKm}km目安`,
  }
}

const getMovementRangeCandidatePool = ({
  destinationList,
  departure,
  rangeSettings,
  minimumCandidateCount = 3,
}) => {
  const entries = destinationList
    .map((place) => ({
      place,
      estimate: estimateMovementRange(place, departure, rangeSettings),
    }))

  const rule = TRAVEL_RANGE_RULES[rangeSettings.value] ?? TRAVEL_RANGE_RULES.auto
  if (!rule.hardFilter) {
    return {
      candidates: entries.map((entry) => entry.place),
      entries,
      excludedCount: 0,
      strictCount: entries.length,
      relaxedCount: entries.length,
      finalCount: entries.length,
      relaxed: false,
      farCandidateCount: entries.filter((entry) => entry.estimate.isHardExcluded).length,
      note: '',
    }
  }

  const strictEntries = entries.filter((entry) => !entry.estimate.isHardExcluded)
  if (strictEntries.length >= minimumCandidateCount || strictEntries.length === entries.length) {
    return {
      candidates: strictEntries.map((entry) => entry.place),
      entries,
      excludedCount: entries.length - strictEntries.length,
      strictCount: strictEntries.length,
      relaxedCount: strictEntries.length,
      finalCount: strictEntries.length,
      relaxed: false,
      farCandidateCount: strictEntries.filter((entry) => entry.estimate.isHardExcluded).length,
      note: '',
    }
  }

  const maxMinutes = rule.softMaxApproxMinutes ?? (rule.maxApproxMinutes ? rule.maxApproxMinutes * (rule.relaxMultiplier ?? 1.25) : Infinity)
  const maxDistance = rule.softMaxApproxDistanceKm ?? (rule.maxApproxDistanceKm ? rule.maxApproxDistanceKm * (rule.relaxMultiplier ?? 1.25) : Infinity)
  const relaxedEntries = entries.filter(({ estimate }) => {
    const isSafeRegion = rangeSettings.value !== 'near' || estimate.isNeighborRegion
    const isSafeTime = !Number.isFinite(estimate.estimatedMinutes) || estimate.estimatedMinutes <= maxMinutes
    const isSafeDistance = !Number.isFinite(estimate.estimatedKm) || estimate.estimatedKm <= maxDistance
    return isSafeRegion && isSafeTime && isSafeDistance
  })
  const finalEntries = relaxedEntries.length > strictEntries.length ? relaxedEntries : strictEntries

  return {
    candidates: finalEntries.map((entry) => entry.place),
    entries,
    excludedCount: entries.length - finalEntries.length,
    strictCount: strictEntries.length,
    relaxedCount: relaxedEntries.length,
    finalCount: finalEntries.length,
    relaxed: finalEntries.length > strictEntries.length,
    farCandidateCount: finalEntries.filter((entry) => entry.estimate.isHardExcluded).length,
    note: finalEntries.length > strictEntries.length
      ? (rangeSettings.value === 'near' ? '条件に合う近場候補が少なかったため、少し範囲を広げて提案しています。' : '指定した移動範囲の候補が少なかったため、少し範囲を広げて提案しています。')
      : '',
  }
}

const calculateDestiny = (destination, selectedFilters, tripType, selectedTravelPurposes = [], tripSchedule = null) => {
  const schedule = tripSchedule ?? resolveTripSchedule(tripType)
  const styleMatch = getTravelStyleMatch(destination, selectedFilters)
  const matchingConditions = styleMatch.matchedStyles
  const conditionPoints = selectedFilters.length > 0
    ? Math.min(styleMatch.score, 34)
    : 22
  const planDays = getPlansForSchedule(destination, schedule).length
  const tripPoints = Math.min(planDays / expectedTripDays[schedule.planKey], 1) * 18 + Math.max(0, getTripScheduleScore(destination, schedule, null)) * 0.5
  const tagPoints = Math.min(destination.tags.length / 5, 1) * 12
  const purposeMatch = getTravelPurposeMatch(destination, selectedTravelPurposes)
  const purposePoints = Math.min(purposeMatch.score, 24)
  const score = Math.min(100, Math.round(conditionPoints + tripPoints + tagPoints + purposePoints))
  const commentGroup = score >= 90
    ? destinyComments.excellent
    : score >= 80
      ? destinyComments.great
      : destinyComments.discovery
  const commentIndex = Array.from(destination.city)
    .reduce((total, character) => total + character.codePointAt(0), 0) % commentGroup.length

  return {
    score,
    comment: commentGroup[commentIndex],
    matchingCount: matchingConditions.length,
  }
}

const calculateFeasibility = (durationMinutes, tripType, transportMode = '車', tripSchedule = null) => {
  const schedule = tripSchedule ?? resolveTripSchedule(tripType)
  const scheduleLabel = schedule.label
  const hours = durationMinutes / 60
  let stars = hours <= 2 ? 5 : hours <= 4 ? 4 : hours <= 6 ? 3 : hours <= 8 ? 2 : 1

  if (transportMode !== '電車') {
    if (tripType === '日帰り' && hours > 4) stars = Math.max(1, stars - 1)
    if (tripType === '1泊2日' && hours > 4 && hours <= 6) stars = Math.min(5, stars + 1)
    if (schedule.days >= 3 && hours > 6 && hours <= 8) stars = Math.min(5, stars + 1)
  }
  if (transportMode === '飛行機' && tripType !== '日帰り' && hours >= 6) {
    stars = Math.max(schedule.days >= 3 ? 4 : 3, stars)
  }

  const labels = {
    5: 'とても行きやすい',
    4: '十分現実的',
    3: 'やや遠いが旅行候補',
    2: '遠め。宿泊向き',
    1: 'かなり遠い。計画が必要',
  }

  let detail
  if (tripType === '日帰り') {
    detail = hours <= 4
      ? '日帰りでも余裕を持って楽しめる距離です。'
      : '日帰りにはやや遠いため、早朝出発にするか、宿泊へ変えて現地で歩く時間を確保してください。'
  } else if (tripType === '1泊2日') {
    detail = hours <= 6
      ? '1泊2日なら無理なく楽しめる距離です。'
      : '1泊2日でも移動が長いため、交通手段と出発時間の計画が必要です。'
  } else {
    detail = hours <= 8
      ? `${scheduleLabel}なら移動を含めてもゆっくり楽しめる距離です。`
      : `${scheduleLabel}でも長距離移動になるため、到着日は移動と食事を中心にして、観光を翌日に回すと無理が出にくいです。`
  }

  if (transportMode === '飛行機') {
    detail += tripType === '日帰り'
      ? ' 空港への移動や搭乗手続きを含め、時間に余裕が必要です。'
      : ' 長距離でも飛行機を使う旅行候補として評価しています。'
  }

  return {
    stars,
    starsLabel: `${'★'.repeat(stars)}${'☆'.repeat(5 - stars)}`,
    label: labels[stars],
    detail,
  }
}

const formatTrainEstimateDuration = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `約${minutes}分`
  if (minutes === 0) return `約${hours}時間`
  return `約${hours}時間${minutes}分`
}

const majorShinkansenPairs = new Set([
  '京都駅|東京駅', '新大阪駅|東京駅', '名古屋駅|東京駅', '仙台駅|東京駅',
  '東京駅|金沢駅', '博多駅|東京駅', '博多駅|新大阪駅', '京都駅|名古屋駅',
  '東京駅|軽井沢駅', '東京駅|那須塩原駅', '東京駅|熱海駅', '大阪駅|東京駅',
  '博多駅|大阪駅',
])

const normalizeStationName = (station) => station?.replace(/^JR/, '').replace(/\s/g, '') ?? ''
const createStationPairKey = (originStation, destinationStation) => (
  [normalizeStationName(originStation), normalizeStationName(destinationStation)].sort().join('|')
)
const isMajorShinkansenRoute = (originStation, destinationStation) => (
  majorShinkansenPairs.has(createStationPairKey(originStation, destinationStation))
)

const getTrainTimeEstimate = ({
  distanceKm,
  originStation,
  destinationStation,
  stationAccessMinutes = 0,
  stationAccessNote = '駅周辺',
}) => {
  if (!Number.isFinite(distanceKm)) return null

  const usesShinkansenCorrection = isMajorShinkansenRoute(originStation, destinationStation)
  const rule = usesShinkansenCorrection
    ? { averageSpeed: 220, additionalMinutes: 25, trainType: '新幹線中心' }
    : distanceKm < 100
      ? { averageSpeed: 50, additionalMinutes: 30, trainType: '普通列車・快速中心' }
      : distanceKm < 300
        ? { averageSpeed: 85, additionalMinutes: 45, trainType: '普通列車＋特急想定' }
        : distanceKm < 700
          ? { averageSpeed: 160, additionalMinutes: 60, trainType: '特急・新幹線想定' }
          : { averageSpeed: 200, additionalMinutes: 90, trainType: '新幹線中心・長距離鉄道想定' }
  const railMinutes = Math.max(1, Math.round((distanceKm / rule.averageSpeed) * 60 + rule.additionalMinutes))
  const durationMinutes = Math.max(
    1,
    railMinutes + Math.max(0, Number(stationAccessMinutes) || 0),
  )

  return {
    ...rule,
    railMinutes,
    durationMinutes,
    duration: formatTrainEstimateDuration(durationMinutes),
    label: '電車',
    usesShinkansenCorrection,
    stationAccessMinutes: Math.max(0, Number(stationAccessMinutes) || 0),
    stationAccessNote,
  }
}

const getTransportEvaluations = (travelInfo, tripType, destination = null) => {
  const car = travelInfo.car?.durationMinutes
    ? { durationMinutes: travelInfo.car.durationMinutes, duration: travelInfo.car.duration, label: '車' }
    : null
  const distanceMeters = travelInfo.car?.distanceMeters ?? travelInfo.publicTransit?.distanceMeters ?? null
  const distanceKm = distanceMeters ? distanceMeters / 1000 : null
  const trainEstimate = getTrainTimeEstimate({
    distanceKm,
    originStation: travelInfo.transitFallback?.origin,
    destinationStation: destination?.nearestStation ?? travelInfo.transitFallback?.destination,
    stationAccessMinutes: destination?.stationAccessMinutes,
    stationAccessNote: destination?.stationAccessNote,
  })
  const planeEstimate = distanceKm === null
    ? null
    : distanceKm < 500
      ? { durationMinutes: 600, duration: '基本おすすめしない', cost: null, range: '500km未満' }
      : distanceKm < 900
        ? { durationMinutes: 240, duration: '約3〜5時間', cost: 32500, range: '500〜900km' }
        : { durationMinutes: 300, duration: '約4〜6時間', cost: 50000, range: '900km以上' }
  const definitions = [
    {
      mode: '車',
      basis: car,
      isReference: false,
      estimatedCost: distanceKm === null ? null : distanceKm * 42,
    },
    {
      mode: '電車',
      basis: trainEstimate,
      isReference: true,
      estimatedCost: null,
      distanceKm,
    },
    {
      mode: '飛行機',
      basis: planeEstimate,
      isReference: true,
      estimatedCost: planeEstimate?.cost ?? null,
      distanceKm,
    },
  ]

  return definitions.map((item) => {
    let feasibility = item.basis
      ? calculateFeasibility(item.basis.durationMinutes, tripType, item.mode, resolveTripSchedule(tripType))
      : null
    if (item.mode === '飛行機' && distanceKm !== null && distanceKm < 500) {
      feasibility = {
        stars: 1,
        starsLabel: '★☆☆☆☆',
        label: '近距離ではおすすめしない',
        detail: '空港アクセスや搭乗手続きを含めると、近距離では効率が下がります。',
      }
    }
    const hours = item.basis ? item.basis.durationMinutes / 60 : 24
    const costPenalty = item.mode === '電車'
      ? 0
      : item.estimatedCost
        ? item.estimatedCost / 10000
        : 1.5
    let recommendationScore = feasibility ? feasibility.stars * 10 - hours - costPenalty : -100

    if (tripType === '日帰り') recommendationScore -= hours * 2
    if (item.mode === '飛行機' && distanceKm !== null && distanceKm < 500) recommendationScore -= 100
    if (item.mode === '飛行機' && distanceKm !== null && distanceKm >= 500 && tripType !== '日帰り') recommendationScore += 5
    if (item.mode === '飛行機' && distanceKm !== null && distanceKm >= 900 && resolveTripSchedule(tripType).days >= 3) recommendationScore += 15

    return { ...item, feasibility, recommendationScore }
  })
}

const shouldShowTransportEvaluation = (item = {}, travelInfo = {}) => {
  if (item.mode === '車') return Boolean(travelInfo.car?.durationMinutes)
  if (item.mode === '電車') return Boolean(item.basis?.durationMinutes && Number.isFinite(item.distanceKm))
  if (item.mode === '飛行機') return Boolean(item.basis?.durationMinutes && Number.isFinite(item.distanceKm) && item.distanceKm >= 500)
  return Boolean(item.basis?.durationMinutes)
}

const getVisibleTransportEvaluations = (evaluations = [], travelInfo = {}) => evaluations
  .filter((item) => shouldShowTransportEvaluation(item, travelInfo))

const getBestPrimaryTransport = (evaluations) => [...evaluations]
  .filter((item) => item.feasibility)
  .sort((a, b) => (
    b.recommendationScore - a.recommendationScore
    || b.feasibility.stars - a.feasibility.stars
  ))[0] ?? null

const formatEstimatedYen = (amount) => {
  if (!Number.isFinite(amount)) return null
  const rounded = Math.round(amount / 100) * 100
  return `約${new Intl.NumberFormat('ja-JP').format(rounded)}円`
}

const getPlaneCostLabel = (distanceKm) => {
  if (!Number.isFinite(distanceKm)) return '距離取得後に概算'
  if (distanceKm < 500) return '飛行機は基本おすすめしない'
  if (distanceKm < 900) return '20,000円〜45,000円'
  return '30,000円〜70,000円'
}

const getRouteDestinationQuery = (destination = {}) => {
  const concreteSpot = getConcreteTouristSpots(destination)[0]?.name
  return destination.nearestStation
    || destination.googleMapsQuery
    || (concreteSpot ? `${concreteSpot}, ${destination.prefecture}${destination.city}` : '')
    || destination.address
    || `${destination.prefecture ?? ''}${destination.city ?? ''}`
}

const getRouteDestinationLabel = (destination = {}) => (
  destination.nearestStationLabel
  || destination.nearestStation
  || destination.googleMapsQuery
  || destination.address
  || `${destination.prefecture ?? ''}${destination.city ?? ''}`
)

const getCarTravelComment = (durationMinutes) => {
  if (!Number.isFinite(durationMinutes)) return null
  if (durationMinutes <= 120) return '日帰りでも行きやすい距離です。'
  if (durationMinutes <= 240) return '日帰りも可能ですが、現地で過ごす時間に余裕を持ちたい距離です。'
  if (durationMinutes <= 360) return '車での往復は長くなるため、宿泊旅行に向いています。'
  if (durationMinutes <= 480) return '運転の負担が大きいため、1泊2日以上をおすすめします。'
  return '車移動はかなり大変です。現実的には負担が大きいため、飛行機や電車を検討してください。'
}

const getRecommendedTransportReason = (recommended, evaluations, tripType) => {
  if (!recommended) return '移動情報を取得すると、おすすめ理由を表示します。'
  const car = evaluations.find((item) => item.mode === '車')
  const train = evaluations.find((item) => item.mode === '電車')

  if (recommended.mode === '飛行機') {
    if (car?.basis?.durationMinutes > 480) {
      return '車では移動時間が長すぎるため、飛行機を優先しました。'
    }
    return '距離が長く、宿泊日数を現地で有効に使いやすいため飛行機を優先しました。'
  }
  if (recommended.mode === '電車') {
    if (car?.basis && train?.basis && train.basis.durationMinutes < car.basis.durationMinutes) {
      return '車より移動時間が短く、運転の負担も避けられるため電車を優先しました。'
    }
    return '距離から概算した移動時間が現実的で、乗車中も休めるため電車を優先しました。'
  }
  return tripType === '日帰り'
    ? '目安時間が比較的短く、現地で自由に移動しやすいため車を優先しました。'
    : '人数や荷物に合わせやすく、現地移動の自由度が高いため車を優先しました。'
}

const getTravelCacheKey = (origin, destinationId) => (
  `${origin.trim().toLowerCase()}::${destinationId}`
)

const getTripSuitability = (destination, tripType, tripSchedule = null) => {
  const schedule = tripSchedule ?? resolveTripSchedule(tripType)
  const expectedDays = expectedTripDays[schedule.planKey]
  const planDays = getPlansForSchedule(destination, schedule).length
  const planRatio = Math.min(planDays / expectedDays, 1)
  const accessMinutes = Number.isFinite(destination.stationAccessMinutes)
    ? destination.stationAccessMinutes
    : 30

  if (schedule.days <= 1) {
    const accessFactor = accessMinutes <= 30 ? 1 : accessMinutes <= 60 ? 0.85 : 0.6
    return planRatio * accessFactor
  }
  if (schedule.days === 2) {
    return planRatio * (accessMinutes <= 90 ? 1 : 0.82)
  }
  return planRatio
}

const scoreDestination = ({
  destination,
  selectedFilters,
  selectedTravelPurposes = [],
  tripType,
  tripSchedule = null,
  cachedDurationMinutes,
  travelSeason,
  isPrevious,
  movementRangeEstimate = null,
}) => {
  const resolvedTripSchedule = tripSchedule ?? resolveTripSchedule(tripType)
  const styleMatch = getTravelStyleMatch(destination, selectedFilters)
  const matchingCount = styleMatch.matchedStyles.length
  const tripRatio = getTripSuitability(destination, tripType, resolvedTripSchedule)
  const tripCompatibilityLabel = tripRatio >= 1 ? '良い' : tripRatio >= 0.66 ? '普通' : '低い'
  const cachedFeasibility = cachedDurationMinutes
    ? calculateFeasibility(cachedDurationMinutes, tripType, '車', resolvedTripSchedule)
    : null
  const season = resolveSeason(travelSeason)
  const seasonPoints = season && destination.bestSeasons.includes(season) ? 24 : season ? 3 : 10
  const conditionRatio = selectedFilters.length > 0 ? matchingCount / selectedFilters.length : 1
  const conditionPoints = selectedFilters.length > 0
    ? Math.min(styleMatch.score, 34) + conditionRatio * 10
    : 18
  const purposeMatch = getTravelPurposeMatch(destination, selectedTravelPurposes)
  const schedulePoints = getTripScheduleScore(destination, resolvedTripSchedule, movementRangeEstimate)

  const score = Math.max(1, Math.round(
    8
    + conditionPoints
    + tripRatio * 22
    + 8
    + Math.min(destination.tags.length, 5) * 1.5
    + seasonPoints
    + Math.min(purposeMatch.score, 32)
    + schedulePoints
    + (cachedFeasibility ? cachedFeasibility.stars * 4 : 0)
    + (movementRangeEstimate?.scoreEffect ?? 0),
  ))

  return {
    destination,
    matchingCount,
    tripCompatibilityLabel,
    tripSchedule: resolvedTripSchedule,
    styleMatch,
    schedulePoints,
    feasibilityStars: cachedFeasibility?.starsLabel ?? null,
    seasonCompatibility: !season
      ? 'おまかせ'
      : destination.bestSeasons.includes(season) ? 'とても良い' : '標準',
    movementRangeEstimate,
    purposeMatch,
    score,
    weight: Math.pow(score, 1.28) * (isPrevious ? 0.22 : 1),
  }
}

const pickWeightedDestination = (scoredDestinations) => {
  const totalWeight = scoredDestinations.reduce((total, item) => total + item.weight, 0)
  let randomPoint = Math.random() * totalWeight

  for (const item of scoredDestinations) {
    randomPoint -= item.weight
    if (randomPoint <= 0) return item
  }

  return scoredDestinations[scoredDestinations.length - 1]
}

const loadStoredCities = (storageKey) => {
  try {
    const saved = JSON.parse(window.localStorage.getItem(storageKey) ?? '[]')
    return Array.isArray(saved) ? saved.filter((city) => typeof city === 'string') : []
  } catch {
    return []
  }
}

const loadStoredApiKey = (storageKey = MAPS_API_KEY_STORAGE_KEY) => {
  try {
    return window.localStorage.getItem(storageKey) ?? ''
  } catch {
    return ''
  }
}

const loadBetaFeedbackNotes = () => {
  try {
    const saved = JSON.parse(window.localStorage.getItem(BETA_FEEDBACK_STORAGE_KEY) ?? '[]')
    return Array.isArray(saved)
      ? saved.filter((item) => item && typeof item === 'object' && item.id)
        .map((item) => ({
          id: String(item.id),
          screen: typeof item.screen === 'string' ? item.screen : '',
          issue: typeof item.issue === 'string' ? item.issue : '',
          suggestion: typeof item.suggestion === 'string' ? item.suggestion : '',
          priority: ['低', '中', '高'].includes(item.priority) ? item.priority : '中',
          createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
        }))
      : []
  } catch {
    return []
  }
}

const getLocalDateKey = (date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const loadAiPlanUsage = () => {
  const today = getLocalDateKey()
  try {
    const saved = JSON.parse(window.localStorage.getItem(AI_PLAN_USAGE_STORAGE_KEY) ?? '{}')
    if (saved?.date !== today || !Number.isInteger(saved?.count) || saved.count < 0) {
      return { date: today, count: 0 }
    }
    return { date: today, count: Math.min(saved.count, DAILY_AI_PLAN_LIMIT) }
  } catch {
    return { date: today, count: 0 }
  }
}

const loadTravelTimeCache = () => {
  try {
    const saved = JSON.parse(window.localStorage.getItem(TRAVEL_CACHE_STORAGE_KEY) ?? '{}')
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {}
    return Object.fromEntries(Object.entries(saved).filter(([, value]) => (
      Number.isFinite(value) && value > 0
    )))
  } catch {
    return {}
  }
}

const loadDrawHistory = () => {
  try {
    const saved = JSON.parse(window.localStorage.getItem(DRAW_HISTORY_STORAGE_KEY) ?? '[]')
    return Array.isArray(saved)
      ? saved.filter((entry) => entry && typeof entry === 'object' && entry.id && entry.city)
        .map((entry) => ({
          ...entry,
          bestTransport: entry.bestTransport === '鉄道'
            ? '電車'
            : transportModes.includes(entry.bestTransport)
              ? entry.bestTransport
              : entry.transportMode === '鉄道'
                ? '電車'
                : transportModes.includes(entry.transportMode) ? entry.transportMode : null,
          travelSeason: seasonOptions.includes(entry.travelSeason) ? entry.travelSeason : '今の季節',
          movementRange: movementRangeOptions.some((option) => option.value === entry.movementRange)
            ? entry.movementRange
            : 'auto',
          strictMovementRange: Boolean(entry.strictMovementRange),
          ...normalizeStoredTripType(entry.tripType, entry.customNights, entry.customDays),
          selectedFilters: normalizeTravelStyles(entry.selectedFilters ?? []),
          selectedTravelPurposes: normalizeTravelPurposes(entry.selectedTravelPurposes ?? [], entry.selectedFilters ?? []),
          customNights: normalizeStoredTripType(entry.tripType, entry.customNights, entry.customDays).customNights,
          customDays: normalizeStoredTripType(entry.tripType, entry.customNights, entry.customDays).customDays,
        }))
        .slice(0, MAX_HISTORY_ITEMS)
      : []
  } catch {
    return []
  }
}

const formatHistoryDate = (dateString) => (
  Number.isNaN(new Date(dateString).getTime())
    ? ''
    : new Intl.DateTimeFormat('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    }).format(new Date(dateString))
)

const loadInputState = () => {
  const initialState = {
    departure: '',
    tripType: '日帰り',
    travelSeason: '今の季節',
    selectedFilters: [],
    selectedTravelPurposes: [],
    movementRange: 'auto',
    strictMovementRange: false,
    customRangeHours: '',
    customRangeKm: '',
    customNights: '2',
    customDays: '3',
  }

  try {
    const saved = JSON.parse(window.localStorage.getItem(INPUT_STATE_STORAGE_KEY) ?? '{}')
    return {
      departure: typeof saved.departure === 'string' ? saved.departure : initialState.departure,
      ...normalizeStoredTripType(saved.tripType, saved.customNights, saved.customDays),
      travelSeason: seasonOptions.includes(saved.travelSeason)
        ? saved.travelSeason
        : initialState.travelSeason,
      selectedFilters: normalizeTravelStyles(saved.selectedFilters ?? initialState.selectedFilters),
      selectedTravelPurposes: normalizeTravelPurposes(saved.selectedTravelPurposes ?? initialState.selectedTravelPurposes, saved.selectedFilters ?? []),
      movementRange: movementRangeOptions.some((option) => option.value === saved.movementRange)
        ? saved.movementRange
        : initialState.movementRange,
      strictMovementRange: initialState.strictMovementRange,
      customRangeHours: typeof saved.customRangeHours === 'string'
        ? saved.customRangeHours
        : initialState.customRangeHours,
      customRangeKm: typeof saved.customRangeKm === 'string'
        ? saved.customRangeKm
        : initialState.customRangeKm,
    }
  } catch {
    return initialState
  }
}

const getLocalStorageDebugStatus = () => {
  try {
    const savedCount = DEBUG_STORAGE_KEYS.filter((key) => (
      window.localStorage.getItem(key) !== null
    )).length
    return `正常（${savedCount}/${DEBUG_STORAGE_KEYS.length}種類を保存）`
  } catch {
    return '利用できません'
  }
}

const travelStatusLabels = {
  idle: '未取得',
  loading: '取得中',
  success: '取得成功',
  unconfigured: '移動情報取得エラー',
  error: '取得失敗',
  'api-error': 'API設定エラー',
}

const conditionDrawTestCases = [
  { id: 'mito-near-day-solo-walk', name: '水戸駅 / 近場 / 日帰り / 一人旅 / 街歩き', departure: '水戸駅', movementRange: 'near', tripType: '日帰り', selectedFilters: ['一人旅'], selectedTravelPurposes: ['街歩き'], expected: '関東近郊・日帰り向きが中心。北海道、沖縄、九州、四国、関西などは出ない。' },
  { id: 'tokyo-near-one-couple-onsen', name: '東京駅 / 近場 / 1泊2日 / カップル / 温泉・ゆっくり', departure: '東京駅', movementRange: 'near', tripType: '1泊2日', selectedFilters: ['カップル'], selectedTravelPurposes: ['温泉', 'ゆっくり'], expected: '箱根、熱海、草津、日光、軽井沢などが出やすい。' },
  { id: 'tokyo-far-three-friends-food-walk', name: '東京駅 / 遠出 / 3泊4日 / 友達 / グルメ・街歩き', departure: '東京駅', movementRange: 'far', tripType: '自分で入力', customNights: '3', customDays: '4', selectedFilters: ['友達'], selectedTravelPurposes: ['グルメ', '街歩き'], expected: '福岡、札幌、京都、金沢、長崎、広島なども候補に入ってよい。' },
  { id: 'mito-auto-five-couple-food-nature', name: '水戸駅 / 制限なし / 5泊6日 / カップル / グルメ・自然', departure: '水戸駅', movementRange: 'auto', tripType: '自分で入力', customNights: '5', customDays: '6', selectedFilters: ['カップル'], selectedTravelPurposes: ['グルメ', '自然・絶景'], expected: '遠方も含めてよい。長期旅行向けにメイン旅先＋関連候補が表示される。' },
  { id: 'fukuoka-near-one-family-nature', name: '福岡駅 / 近場 / 1泊2日 / ファミリー / 自然・体験', departure: '福岡駅', movementRange: 'near', tripType: '1泊2日', selectedFilters: ['ファミリー'], selectedTravelPurposes: ['自然・絶景', '体験'], expected: '九州周辺が中心。関東・北海道・沖縄が近場として出すぎない。' },
  { id: 'sapporo-near-one-solo-food-walk', name: '札幌駅 / 近場 / 1泊2日 / 一人旅 / グルメ・街歩き', departure: '札幌駅', movementRange: 'near', tripType: '1泊2日', selectedFilters: ['一人旅'], selectedTravelPurposes: ['グルメ', '街歩き'], expected: '北海道内が中心。本州・九州・沖縄が近場として出ない。' },
  { id: 'tokyo-far-five-solo-history', name: '東京駅 / 5泊6日 / 遠出 / 一人旅 / 神社・歴史・街歩き', departure: '東京駅', movementRange: 'far', tripType: '自分で入力', customNights: '5', customDays: '6', selectedFilters: ['一人旅'], selectedTravelPurposes: ['神社・歴史', '街歩き'], expected: '京都、奈良、金沢、広島、宮島、高山などが出やすい。関連候補が自然に出る。' },
  { id: 'mito-near-day-pet-nature', name: '水戸駅 / 日帰り / 近場 / ペットあり / 自然・ゆっくり', departure: '水戸駅', movementRange: 'near', tripType: '日帰り', selectedFilters: ['ペットあり'], selectedTravelPurposes: ['自然・絶景', 'ゆっくり'], expected: '自然・公園・散歩向きの候補が出やすい。ただしペット同伴可とは断定しない。' },
]

const conditionDrawTestRuns = 20
const farRegionsForNearByOrigin = {
  北海道: ['関東', '中部', '関西', '中国', '四国', '九州', '沖縄'],
  東北: ['関西', '中国', '四国', '九州', '沖縄'],
  関東: ['北海道', '関西', '中国', '四国', '九州', '沖縄'],
  中部: ['北海道', '中国', '四国', '九州', '沖縄'],
  関西: ['北海道', '東北', '九州', '沖縄'],
  中国: ['北海道', '東北', '関東', '沖縄'],
  四国: ['北海道', '東北', '関東', '沖縄'],
  九州: ['北海道', '東北', '関東', '中部', '沖縄'],
  沖縄: ['北海道', '東北', '関東', '中部', '関西', '中国', '四国', '九州'],
}

const imagePreviewFilters = [
  { value: 'all', label: 'すべて' },
  { value: 'individual', label: '個別画像あり' },
  { value: 'category', label: 'カテゴリ画像使用' },
  { value: 'common', label: '共通画像使用' },
  { value: 'temporary', label: 'status: temporary' },
  { value: 'confirmed', label: 'status: confirmed' },
  { value: 'duplicate', label: '画像重複あり' },
  { value: 'credit-missing', label: 'クレジット未設定' },
]

const qualityPriorityCities = [
  '京都市', '奈良市', '小樽市', '札幌市', '函館市', '金沢市', '箱根町', '熱海市', '草津町', '日光市',
  '鎌倉市', '横浜市', '松島町', '仙台市', '福岡市', '長崎市', '広島市', '廿日市市', '那覇市', '石垣市',
  '高山市', '伊勢市', '白浜町', '軽井沢町', '富良野市', '会津若松市', '尾道市', '倉敷市', '松江市', '別府市',
]

const imageImprovementPriorityCities = [
  '京都市',
  '奈良市',
  '小樽市',
  '札幌市',
  '函館市',
  '金沢市',
  '箱根町',
  '熱海市',
  '草津町',
  '日光市',
  '鎌倉市',
  '横浜市',
  '松島町',
  '仙台市',
  '福岡市',
  '長崎市',
  '広島市',
  '廿日市市',
  '那覇市',
  '石垣市',
  '高山市',
  '伊勢市',
  '白浜町',
  '軽井沢町',
  '富良野市',
  '会津若松市',
  '尾道市',
  '倉敷市',
  '松江市',
  '別府市',
]

const getImageMetaValue = (image, key, fallback = '') => (
  typeof image === 'object' && image
    ? image[key] ?? image[`image${key[0].toUpperCase()}${key.slice(1)}`] ?? fallback
    : fallback
)

const getImageDisplayType = (image) => {
  const url = getImageUrl(image)
  const source = getImageMetaValue(image, 'source')
  if (source === 'curated' || url.startsWith('/images/destinations/')) return '個別画像'
  if (source === 'fallback' || url.startsWith('/images/categories/')) return 'カテゴリ画像'
  return '共通画像'
}

const getImageCategoryFromUrl = (image) => (
  getImageUrl(image).match(/\/images\/categories\/([a-z]+)-\d+\.jpg$/)?.[1] ?? ''
)

const isStrongResultImage = (image) => {
  if (!isValidImageUrl(image)) return false
  const status = getImageMetaValue(image, 'status')
  const source = getImageMetaValue(image, 'source')
  return Boolean(getImageMetaValue(image, 'isDestinationSpecific'))
    && source !== 'fallback'
    && !['fallback', 'missing', 'placeholder'].includes(status)
}

const getResultJourneyImages = (destination = {}) => [
  { key: 'hero', label: '旅先の雰囲気', alt: `${destination.city}の旅先イメージ`, image: destination.heroImage },
  { key: 'scenery', label: '見たい景色', alt: `${destination.city}の景色イメージ`, image: destination.sceneryImage },
  { key: 'food', label: '食のイメージ', alt: `${destination.city}のご当地グルメイメージ`, image: destination.foodImage },
]
  .filter((item) => isStrongResultImage(item.image))
  .filter((item, index, items) => items.findIndex((candidate) => getImageUrl(candidate.image) === getImageUrl(item.image)) === index)
  .slice(0, 2)

const getExpectedImageCategories = (destination = {}, imageType = 'hero') => {
  const tags = destination.tags ?? []
  const categories = new Set(['city', 'history', 'nature'])
  if (imageType === 'food') categories.add('gourmet')
  if (tags.includes('温泉') || Number(destination.purposeFit?.onsen ?? 0) >= 60) categories.add('onsen')
  if (tags.includes('海') || destination.region === '沖縄') categories.add('sea')
  if (tags.includes('山') || Number(destination.purposeFit?.nature ?? 0) >= 70) {
    categories.add('mountain')
    categories.add('nature')
  }
  if (tags.includes('グルメ') || Number(destination.purposeFit?.gourmet ?? 0) >= 70) categories.add('gourmet')
  if (tags.includes('カップル向け') || Number(destination.companionFit?.couple ?? 0) >= 70) {
    categories.add('couple')
    categories.add('city')
  }
  return categories
}

const splitFoodTheme = (theme = '') => String(theme)
  .split(/[、・/／,]/)
  .map((item) => item.trim())
  .filter(Boolean)

const abstractFoodLabels = new Set([
  'ご当地グルメ', '市場グルメ', 'カフェ', '料理イメージ', '食事', '名物', 'グルメ', 'スイーツ', '軽食',
  '汎用料理イメージ', 'ご当地グルメ候補', '温泉街グルメ', '港町の食事', '中華街グルメ',
])

const abstractFoodLabelPatterns = [/料理イメージ/, /^汎用/, /^ご当地グルメ$/, /^市場グルメ$/, /^カフェ$/, /^食事$/, /^名物$/, /^グルメ$/, /^スイーツ$/, /^軽食$/]

const isConcreteFoodName = (name = '') => {
  const normalized = String(name).trim()
  if (!normalized) return false
  if (abstractFoodLabels.has(normalized)) return false
  return !abstractFoodLabelPatterns.some((pattern) => pattern.test(normalized))
}

const isTemplateFoodDescription = (description = '') => {
  const text = String(description ?? '')
  if (!text.trim()) return true
  return [
    '観光スポットの前後に入れると',
    '観光の前後に入れると',
    '移動だけで終わらない旅',
    '食事候補にしやすい',
  ].some((fragment) => text.includes(fragment))
}

const getConcreteFoodCandidates = (items = []) => [...new Set((Array.isArray(items) ? items : [])
  .map((item) => String(item ?? '').trim())
  .filter(isConcreteFoodName))]

const abstractSpotNames = new Set([
  '\u89b3\u5149\u30b9\u30dd\u30c3\u30c8', '\u81ea\u7136\u30b9\u30dd\u30c3\u30c8', '\u6b74\u53f2\u30b9\u30dd\u30c3\u30c8', '\u30b0\u30eb\u30e1\u30b9\u30dd\u30c3\u30c8', '\u4f53\u9a13\u30b9\u30dd\u30c3\u30c8',
  '\u8857\u6b69\u304d\u30b9\u30dd\u30c3\u30c8', '\u5b9a\u756a\u30b9\u30dd\u30c3\u30c8', '\u4eba\u6c17\u30b9\u30dd\u30c3\u30c8', '\u8857\u6b69\u304d', '\u30b0\u30eb\u30e1', '\u6e29\u6cc9', '\u4f53\u9a13', '\u7d76\u666f', '\u540d\u6240', '\u5b9a\u756a',
  '\u3054\u5f53\u5730\u30e9\u30f3\u30c1', '\u6d77\u8fba\u30a8\u30ea\u30a2', '\u4e2d\u5fc3\u8857\u30b0\u30eb\u30e1\u6563\u7b56', '\u30b0\u30eb\u30e1\u6563\u7b56', '\u30ab\u30d5\u30a7\u4f11\u61a9', '\u30e9\u30f3\u30c1', '\u30ab\u30d5\u30a7', '\u5468\u8fba\u6563\u7b56',
])

const pseudoSpotNamePatterns = [
  /\u3054\u5f53\u5730\u30e9\u30f3\u30c1$/,
  /\u6d77\u8fba\u30a8\u30ea\u30a2$/,
  /\u4e2d\u5fc3\u8857\u30b0\u30eb\u30e1\u6563\u7b56$/,
  /\u8857\u6b69\u304d$/,
  /\u89b3\u5149\u30b9\u30dd\u30c3\u30c8$/,
  /\u81ea\u7136\u30b9\u30dd\u30c3\u30c8$/,
  /\u6b74\u53f2\u30b9\u30dd\u30c3\u30c8$/,
  /\u30b0\u30eb\u30e1\u30b9\u30dd\u30c3\u30c8$/,
  /\u30ab\u30d5\u30a7$/,
  /\u30e9\u30f3\u30c1$/,
  /\u5468\u8fba\u6563\u7b56$/,
  /\u30b0\u30eb\u30e1\u6563\u7b56$/,
  /\u30ab\u30d5\u30a7\u4f11\u61a9$/,
  /\u4e2d\u5fc3\u8857$/,
]

const isPseudoSpotName = (name = '') => {
  const normalized = String(name).trim()
  if (!normalized) return true
  if (abstractSpotNames.has(normalized)) return true
  return pseudoSpotNamePatterns.some((pattern) => pattern.test(normalized))
}

const isConcreteSpotName = (name = '') => {
  const normalized = String(name).trim()
  if (!normalized) return false
  if (isPseudoSpotName(normalized)) return false
  return !/^(\u89b3\u5149|\u81ea\u7136|\u6b74\u53f2|\u30b0\u30eb\u30e1|\u4f53\u9a13|\u8857\u6b69\u304d|\u5b9a\u756a|\u4eba\u6c17|\u540d\u6240|\u6e29\u6cc9|\u7d76\u666f)(\u30b9\u30dd\u30c3\u30c8)?$/.test(normalized)
}

const isTemplateSpotDescription = (description = '') => {
  const text = String(description ?? '').trim()
  if (!text) return true
  return [
    '\u3053\u306e\u65c5\u5148\u3067\u697d\u3057\u3081\u308b\u30b9\u30dd\u30c3\u30c8\u3067\u3059',
    '\u89b3\u5149\u306b\u304a\u3059\u3059\u3081\u3067\u3059',
    '\u65c5\u306e\u76ee\u7684\u306b\u5408\u3044\u307e\u3059',
    '\u7acb\u3061\u5bc4\u308a\u3084\u3059\u3044\u30b9\u30dd\u30c3\u30c8\u3067\u3059',
    '\u9b45\u529b\u7684\u306a\u5834\u6240\u3067\u3059',
    '\u81ea\u7136\u3092\u697d\u3057\u3081\u307e\u3059',
    '\u6b74\u53f2\u3092\u611f\u3058\u3089\u308c\u307e\u3059',
    '\u98df\u4e8b\u3092\u697d\u3057\u3081\u307e\u3059',
    '\u663c\u98df\u306b\u90f7\u571f\u6599\u7406\u3084\u30ab\u30d5\u30a7\u3092\u9078\u3073',
    '\u6d77\u6cbf\u3044\u306e\u666f\u8272\u3092\u773a\u3081\u306a\u304c\u3089\u6b69\u304d',
    '\u99c5\u5468\u8fba\u3084\u4e2d\u5fc3\u8857\u3067\u98df\u4e8b\u51e6\u3092\u63a2\u3057',
    '\u5019\u88dc\u306b\u3057\u3084\u3059\u3044\u3067\u3059',
    '\u5165\u308c\u3084\u3059\u3044\u3067\u3059',
    '\u305d\u306e\u571f\u5730\u3089\u3057\u3044',
    '\u98df\u6587\u5316\u306b\u89e6\u308c\u3084\u3059\u3044',
  ].some((fragment) => text.includes(fragment))
}

const getConcreteTouristSpots = (destination = {}) => (Array.isArray(destination.touristSpots) ? destination.touristSpots : [])
  .filter((spot) => isConcreteSpotName(spot?.name) && !isTemplateSpotDescription(spot?.description))

const getLocalFoodDisplayItems = (destination = {}) => {
  const fromCandidates = getConcreteFoodCandidates(destination.localFoodCandidates)
  const fromFoodTheme = getConcreteFoodCandidates(splitFoodTheme(getImageMetaValue(destination.foodImage, 'foodTheme')))
  return [...new Set([...fromCandidates, ...fromFoodTheme])]
    .filter(Boolean)
    .slice(0, 5)
}


const purposeSpotKeywords = {
  グルメ: ['グルメ', '市場', '商店街', '屋台', '食べ歩き'],
  '神社・歴史': ['神社', '歴史', '寺', '城', '文化'],
  温泉: ['温泉', '湯', '湯畑'],
  '自然・絶景': ['自然', '絶景', '海', '山', '湖', '滝', '公園'],
  アクティビティ: ['体験', 'アクティビティ', '遊覧', 'サイクリング', 'ロープウェイ'],
  体験: ['体験', '工芸', '文化', '市場', '美術館'],
  街歩き: ['街歩き', '商店街', '通り', '町並み', '散歩'],
  ゆっくり: ['ゆっくり', '温泉', '庭園', '公園', '散歩'],
}

const getLocalFoodDetailItems = (destination = {}, fallbackItems = []) => {
  const fallbackSet = new Set(getConcreteFoodCandidates(fallbackItems))
  const details = Array.isArray(destination.localFoodDetails) ? destination.localFoodDetails : []
  return details
    .filter((item) => item?.name && isConcreteFoodName(item.name))
    .filter((item) => !isTemplateFoodDescription(item.description))
    .filter((item) => fallbackSet.size === 0 || fallbackSet.has(item.name) || isConcreteFoodName(item.name))
    .slice(0, 2)
}

const getPurposeMatchedTouristSpots = (destination = {}, selectedPurposes = []) => {
  const spots = getConcreteTouristSpots(destination)
  if (spots.length === 0) return []
  const purposes = Array.isArray(selectedPurposes) ? selectedPurposes : []
  return spots
    .map((spot, index) => {
      const searchable = [spot.name, spot.type, spot.description, ...(spot.bestFor ?? [])].join(' ')
      const score = purposes.reduce((total, purpose) => {
        const keywords = purposeSpotKeywords[purpose] ?? [purpose]
        const bestForMatch = (spot.bestFor ?? []).some((item) => item === purpose || keywords.some((keyword) => item.includes(keyword)))
        const textMatch = keywords.some((keyword) => searchable.includes(keyword))
        return total + (bestForMatch ? 8 : 0) + (textMatch ? 4 : 0)
      }, 0)
      return { ...spot, score, order: index }
    })
    .sort((left, right) => right.score - left.score || left.order - right.order)
    .slice(0, 3)
}

const getSpotPurposeLabel = (spot = {}, selectedPurposes = []) => {
  const matched = (selectedPurposes ?? []).filter((purpose) => {
    const keywords = purposeSpotKeywords[purpose] ?? [purpose]
    return (spot.bestFor ?? []).includes(purpose) || keywords.some((keyword) => (spot.type + ' ' + spot.description).includes(keyword))
  })
  return matched.length > 0 ? matched.slice(0, 2).join('・') + '向き' : (spot.bestFor ?? []).slice(0, 2).join('・') || '立ち寄りやすい'
}

const getModelCourseTone = (selectedPurposes = [], selectedStyles = []) => {
  const purposeText = (selectedPurposes ?? []).slice(0, 2).join('・')
  if ((selectedPurposes ?? []).includes('ゆっくり') || (selectedStyles ?? []).includes('ファミリー')) return '移動を詰め込みすぎず、' + (purposeText || '散策') + 'の時間を少し長めに取ると過ごしやすいです。'
  if ((selectedPurposes ?? []).includes('グルメ') || (selectedStyles ?? []).includes('友達')) return '食事の時間を少し厚めに取り、' + (purposeText || '街歩き') + 'と組み合わせると流れを作りやすいです。'
  if ((selectedStyles ?? []).includes('一人旅')) return '気ままに歩ける余白を残し、' + (purposeText || '街歩き') + 'を軸にすると動きやすいです。'
  if ((selectedStyles ?? []).includes('カップル')) return '景色や夕食の時間を急がず入れると、' + (purposeText || '街歩き') + 'を落ち着いて味わいやすいです。'
  if ((selectedStyles ?? []).includes('ペットあり')) return '屋外で歩きやすい時間を中心にしつつ、入場条件は事前確認しておくと安心です。'
  return purposeText ? purposeText + 'を軸に、移動と食事の間に余白を残すと組み立てやすいです。' : '移動と食事の間に余白を残すと、ざっくりした流れを組み立てやすいです。'
}

const getCourseFoodNames = (destination = {}, foodDetails = []) => [...new Set([
  ...foodDetails.map((food) => food?.name),
  ...getConcreteFoodCandidates(destination.localFoodCandidates),
])].filter((name) => isConcreteFoodName(name)).slice(0, 3)

const getConcreteSchedulePlans = (destination = {}, schedule = {}, foodItems = []) => {
  const plans = getPlansForSchedule(destination, schedule)
  const foodNames = [...new Set([
    ...getConcreteFoodCandidates(foodItems),
    ...getConcreteFoodCandidates(destination.localFoodCandidates),
  ])].slice(0, 2)
  const foodLabel = foodNames.join('や')
  return plans.map((dayPlan) => ({
    ...dayPlan,
    items: (dayPlan.items ?? [])
      .map((item) => {
        if (String(item).includes('ご当地ランチ')) {
          return foodLabel ? String(item).replace('ご当地ランチ', foodLabel) : ''
        }
        return item
      })
      .filter(Boolean),
  }))
}

const getCourseNearbyName = (destination = {}, nearbySuggestions = []) => {
  const suggestionName = nearbySuggestions[0]?.destination?.city ?? nearbySuggestions[0]?.city
  const hintName = (destination.nearbyDestinationHints ?? []).find((hint) => hint && !isPseudoSpotName(hint))
  return suggestionName || hintName || ''
}

const getConcreteStayIdeas = (destination = {}, schedule = {}, spots = [], foodDetails = [], selectedPurposes = [], selectedStyles = [], nearbySuggestions = []) => {
  const spotNames = spots.map((spot) => spot?.name).filter((name) => isConcreteSpotName(name)).slice(0, 3)
  const [mainSpotName, secondSpotName, thirdSpotName] = spotNames
  const foodNames = getCourseFoodNames(destination, foodDetails)
  const foodText = foodNames.slice(0, 2).join('や')
  const nearbyName = getCourseNearbyName(destination, nearbySuggestions)
  const tone = getModelCourseTone(selectedPurposes, selectedStyles)
  const days = schedule?.days ?? 1
  const fallbackLead = destination.recommendText ? destination.recommendText : tone

  if (days <= 1) {
    const ideas = []
    ideas.push(mainSpotName ? '午前：移動・到着後、' + mainSpotName + 'から歩き始める流れにすると、最初の目的地を決めやすいです。' : '午前：移動・到着後は、無理に詰め込まず旅先の雰囲気をつかむ時間にします。')
    if (foodText) ideas.push('昼：' + foodText + 'を候補にし、食事を旅の区切りとして入れると動きやすいです。')
    if (mainSpotName || secondSpotName) ideas.push('午後：' + [mainSpotName, secondSpotName].filter(Boolean).join('や') + 'を組み合わせ、' + tone)
    else ideas.push('午後：' + fallbackLead)
    ideas.push(thirdSpotName ? '夕方：帰路に合わせて' + thirdSpotName + 'を軽めに入れます。' : '夕方：帰路に合わせて、短めの散策や買い物で締めると負担を抑えやすいです。')
    return ideas.slice(0, 4)
  }

  if (days === 2) {
    const firstDayParts = [mainSpotName ? '到着後に' + mainSpotName : '到着後は中心になるエリア', foodText ? '夕食は' + foodText : '夕方は宿周辺の時間']
    const secondDayParts = [secondSpotName ? secondSpotName : thirdSpotName, foodNames[2] ? foodNames[2] : null].filter(Boolean)
    return [
      '1日目：' + firstDayParts.join('、') + 'を入れ、宿泊前に余白を残すと1泊2日でも慌ただしくなりにくいです。',
      secondDayParts.length > 0
        ? '2日目：朝の散策後、' + secondDayParts.join('や') + 'を軽めに組み合わせて帰路へ向かいます。'
        : '2日目：朝の散策後、帰路に合わせて短めに立ち寄る流れにすると動きやすいです。',
    ]
  }

  if (days === 3) {
    const nearbyText = nearbyName ? '余裕があれば' + nearbyName + 'も候補に入れます。' : ''
    return [
      '1日目：' + (mainSpotName ? mainSpotName + 'を軸に' : '到着後は旅先の中心になる場所を軸に') + '、到着後の散策と食事をまとめます。',
      '2日目：' + [secondSpotName, thirdSpotName].filter(Boolean).join('や') + (secondSpotName || thirdSpotName ? 'を入れ、' : '') + tone,
      '3日目：' + (foodText ? foodText + 'を食事候補にし、' : '') + '帰路に合わせて短めに動きます。' + nearbyText,
    ].filter((item) => item.trim())
  }

  return [
    '前半：' + (mainSpotName ? mainSpotName + 'を中心に' : 'メイン旅先を中心に') + '、到着後すぐ遠くへ動きすぎず旅先の軸を作ります。',
    '中盤：' + (nearbyName ? nearbyName + 'へ足を伸ばし、' : secondSpotName ? secondSpotName + 'も組み合わせ、' : '') + 'メイン旅先とは違う景色や街歩きを入れます。',
    '後半：' + (foodText ? foodText + 'などの食事と' : '') + tone,
    '最終日：' + (thirdSpotName ? thirdSpotName + 'を軽めに入れてから' : '帰路に合わせて短めに整えてから') + '戻る流れにします。',
  ]
}

const canShowConcreteModelCourse = (destination = {}, schedule = {}, spots = [], foodDetails = [], nearbySuggestions = []) => {
  const hasSpot = spots.some((spot) => isConcreteSpotName(spot?.name))
  const hasFood = getCourseFoodNames(destination, foodDetails).length > 0
  const hasNearbyForLongStay = (schedule?.days ?? 1) < 4
    || nearbySuggestions.length > 0
    || (destination.nearbyDestinationHints?.length ?? 0) > 0
  return hasSpot && hasFood && hasNearbyForLongStay
}

const createAiDestinationPayload = (destination = {}, context = {}, featuredSpots = [], foodDetails = [], nearbySuggestions = []) => ({
  city: destination.city,
  prefecture: destination.prefecture,
  region: destination.region,
  tags: destination.tags ?? [],
  recommendText: destination.recommendText ?? destination.recommendation ?? '',
  bestSeasons: destination.bestSeasons ?? [],
  seasonHighlights: destination.seasonHighlights ?? {},
  localFoodCandidates: getConcreteFoodCandidates(destination.localFoodCandidates).slice(0, 5),
  localFoodDetails: foodDetails.slice(0, 3),
  touristSpots: (featuredSpots.length > 0 ? featuredSpots : getConcreteTouristSpots(destination)).slice(0, 5).map(({ name, type, description, bestFor, stayTime }) => ({ name, type, description, bestFor, stayTime })),
  nearbyDestinationHints: (destination.nearbyDestinationHints ?? []).slice(0, 3),
  companionFit: destination.companionFit ?? {},
  purposeFit: destination.purposeFit ?? {},
  stayFit: destination.stayFit ?? {},
  longStayStyle: destination.longStayStyle ?? '',
  selectedFilters: context.selectedFilters ?? [],
  selectedTravelPurposes: context.selectedTravelPurposes ?? [],
  tripSchedule: context.tripSchedule ?? resolveTripSchedule(context.tripType, context.customNights, context.customDays),
  customNights: context.customNights,
  customDays: context.customDays,
  movementRange: context.movementRange,
  movementRangeLabel: movementRangeOptions.find((option) => option.value === context.movementRange)?.label ?? 'おまかせ',
  travelSeason: context.travelSeason,
  nearbySuggestions: nearbySuggestions.slice(0, 3).map((item) => ({
    city: item.destination?.city ?? item.city,
    prefecture: item.destination?.prefecture ?? item.prefecture,
    reason: item.reason,
    sharedTags: item.sharedTags ?? [],
    regionMatch: item.regionMatch ?? 'stay-focus',
  })),
})

const normalizeSearchText = (value) => String(value ?? '').toLowerCase()

const getTravelPurposeMatch = (destination = {}, selectedTravelPurposes = []) => {
  if (!Array.isArray(selectedTravelPurposes) || selectedTravelPurposes.length === 0) {
    return {
      matchedPurposes: [],
      score: 0,
      summary: '',
    }
  }

  const tags = destination.tags ?? []
  const localFoods = Array.isArray(destination.localFoodCandidates) ? destination.localFoodCandidates : []
  const foodDetails = Array.isArray(destination.localFoodDetails) ? destination.localFoodDetails : []
  const touristSpots = getConcreteTouristSpots(destination)
  const foodTheme = getImageMetaValue(destination.foodImage, 'foodTheme')
  const searchableText = normalizeSearchText([
    destination.city,
    destination.prefecture,
    destination.recommendText,
    destination.recommendation,
    destination.highlights,
    destination.highlight,
    destination.reason,
    Object.values(destination.seasonHighlights ?? {}).join(' '),
    localFoods.join(' '),
    foodDetails.map((food) => [food.name, food.description, food.type].join(' ')).join(' '),
    touristSpots.map((spot) => [spot.name, spot.type, spot.description, ...(spot.bestFor ?? [])].join(' ')).join(' '),
    foodTheme,
    tags.join(' '),
  ].join(' '))

  const matchedPurposes = selectedTravelPurposes.filter((purpose) => {
    const profile = travelPurposeProfiles[purpose]
    if (!profile) return false
    const fitKey = travelPurposeFitKeys[purpose]
    const fitScore = Number(destination.purposeFit?.[fitKey] ?? 0)
    const tagMatched = profile.tags.some((tag) => tags.includes(tag))
    const cityMatched = profile.cities.some((city) => destination.city === city)
    const keywordMatched = profile.keywords.some((keyword) => searchableText.includes(normalizeSearchText(keyword)))
    const spotMatched = touristSpots.some((spot) => (spot.bestFor ?? []).includes(purpose) || (spot.type + ' ' + spot.description).includes(purpose))
    const foodMatched = purpose === 'グルメ' && (localFoods.length > 0 || foodDetails.length > 0 || Boolean(foodTheme))
    return fitScore >= 58 || tagMatched || cityMatched || keywordMatched || spotMatched || foodMatched
  })

  const score = matchedPurposes.reduce((total, purpose) => {
    const profile = travelPurposeProfiles[purpose]
    const fitKey = travelPurposeFitKeys[purpose]
    const fitScore = Number(destination.purposeFit?.[fitKey] ?? 0)
    const isStrongCityMatch = profile?.cities?.includes(destination.city)
    const hasLocalFood = purpose === 'グルメ' && (localFoods.length > 0 || foodDetails.length > 0)
    const spotBonus = touristSpots.some((spot) => (spot.bestFor ?? []).includes(purpose) || (spot.type + ' ' + spot.description).includes(purpose)) ? 4 : 0
    return total + Math.max(isStrongCityMatch || hasLocalFood ? 18 : 13, Math.round(fitScore / 5)) + spotBonus
  }, 0)

  const summary = matchedPurposes.length > 0
    ? `この旅先では、${matchedPurposes.slice(0, 3).join('・')}を楽しみやすいです。`
    : selectedTravelPurposes.length > 0
      ? `選んだ目的とは少し違う角度から、${tags.slice(0, 2).join('・') || '旅先の魅力'}を楽しめます。`
      : ''

  return {
    matchedPurposes,
    score,
    summary,
  }
}

const getFoodThemeText = (destination = {}, foodItems = []) => {
  const foodTheme = getConcreteFoodCandidates(splitFoodTheme(getImageMetaValue(destination.foodImage, 'foodTheme')))
  if (foodTheme.length > 0) return foodTheme.slice(0, 3).join('・')
  if (foodItems.length > 0) return foodItems.slice(0, 3).join('・')
  return ''
}

const shouldFeatureFoodImage = (destination = {}, foodItems = []) => {
  const foodImage = destination.foodImage
  const hasConcreteFood = getConcreteFoodCandidates(foodItems).length > 0
    || getConcreteFoodCandidates(destination.localFoodCandidates).length > 0
  const isGeneric = Boolean(getImageMetaValue(foodImage, 'isGeneric'))
  const isFallback = getImageMetaValue(foodImage, 'status') === 'fallback'
  const hasConcreteTheme = getConcreteFoodCandidates(splitFoodTheme(getImageMetaValue(foodImage, 'foodTheme'))).length > 0
  return Boolean(
    getImageUrl(foodImage)
    && hasConcreteFood
    && !isGeneric
    && !isFallback
    && (
      getImageMetaValue(foodImage, 'isDestinationSpecific')
      || getImageMetaValue(foodImage, 'isLocalFood')
      || hasConcreteTheme
    ),
  )
}

const getTripProposalText = (destination = {}, context = {}, seasonInfo = {}) => {
  const tags = destination.tags ?? []
  const selectedStyles = context?.selectedFilters ?? []
  const selectedPurposes = context?.selectedTravelPurposes ?? []
  const purposeMatch = getTravelPurposeMatch(destination, selectedPurposes)
  const schedule = context?.tripSchedule ?? resolveTripSchedule(context?.tripType)
  const spots = getPurposeMatchedTouristSpots(destination, selectedPurposes)
  const foodDetails = getLocalFoodDetailItems(destination, getLocalFoodDisplayItems(destination))
  const mainSpot = spots[0]?.name
  const secondSpot = spots[1]?.name
  const foodName = foodDetails[0]?.name ?? getConcreteFoodCandidates(destination.localFoodCandidates)[0]
  const nearbyName = context?.tripSuggestions?.[0]?.destination?.city
    ?? context?.tripSuggestions?.[0]?.city
    ?? destination.nearbyDestinationHints?.[0]
  const stylePhrase = selectedStyles.includes('ファミリー')
    ? '家族で'
    : selectedStyles.includes('一人旅')
      ? 'ひとりで気ままに'
      : selectedStyles.includes('カップル')
        ? 'ふたりで'
        : selectedStyles.includes('友達')
          ? '友達と'
          : ''
  const purposePhrase = purposeMatch.matchedPurposes.length > 0
    ? purposeMatch.matchedPurposes.slice(0, 2).join('や')
    : tags.includes('温泉')
      ? '温泉街の散策'
      : tags.includes('海') || tags.includes('山')
        ? '自然の景色'
        : tags.includes('グルメ')
          ? foodName ?? 'ご当地グルメ'
          : mainSpot ?? '旅先の中心エリア'
  const spotPhrase = mainSpot
    ? mainSpot + (secondSpot ? 'と' + secondSpot : '') + 'を軸に回れます。'
    : destination.recommendText
      ? destination.recommendText + 'を手がかりに過ごし方を組み立てられます。'
      : ''
  const foodPhrase = foodName
    ? '食事は' + foodName + 'を昼食や休憩に入れ、' + (mainSpot ? mainSpot + '周辺の散策' : '旅先での散策') + 'とつなげると流れを作りやすくなります。'
    : ''
  const stayPhrase = schedule?.days <= 1
    ? '日帰りなら、到着後に' + (mainSpot ?? destination.city + '中心部') + 'を歩き、昼食と午後の散策を短くまとめる流れが合います。'
    : schedule?.days === 2
      ? '1泊2日なら、1日目に' + (mainSpot ?? destination.city + '中心部') + '、2日目に' + (secondSpot ?? '周辺散策') + 'を分けると詰め込みすぎを避けられます。'
      : schedule?.days >= 5
        ? '長めの日程なら、' + (mainSpot ?? destination.city) + 'を深く見たうえで' + (nearbyName ? nearbyName + '方面' : '周辺エリア') + 'へ足を伸ばせます。'
        : schedule.label + 'なら、' + (mainSpot ?? destination.city) + 'を中心に、' + (nearbyName ? nearbyName + '方面' : '近いエリア') + 'を1つ足す余白があります。'
  const season = seasonInfo?.season && seasonInfo.season !== 'おまかせ'
    ? seasonInfo.season + 'は' + (Object.values(destination.seasonHighlights ?? {})[0] ?? '季節の景色や食事') + 'も意識できます。'
    : ''
  const lead = stylePhrase
    ? stylePhrase + purposePhrase + 'を入れたい旅なら、'
    : purposePhrase + 'を入れたい旅なら、'
  const longStayNote = schedule?.days >= 3 && destination.longStayStyle
    ? destination.longStayStyle
    : ''
  return [lead + spotPhrase, stayPhrase, foodPhrase, season, longStayNote].filter(Boolean).join('')
}
const getTripEnjoymentItems = (destination = {}, foodItems = []) => {
  const tagItems = (destination.tags ?? []).slice(0, 4)
  const foodItem = foodItems[0] ? `${foodItems[0]}を味わう` : ''
  const highlightItem = destination.highlights
    ? String(destination.highlights).replace(/を一度に楽しめる$/, '').replace(/を満喫$/, '')
    : ''
  return [...new Set([...tagItems, highlightItem, foodItem])]
    .filter(Boolean)
    .slice(0, 6)
}

const formatShortageList = (cities = []) => {
  if (!Array.isArray(cities) || cities.length === 0) return 'なし'
  return cities
    .slice(0, 40)
    .map((city) => qualityPriorityCities.includes(city) ? '優先：' + city : city)
    .join('、')
}

const getGourmetFoodShortageCities = (destinationList = []) => destinationList
  .filter((place) => Number(place.purposeFit?.gourmet ?? 0) >= 70 && getConcreteFoodCandidates(place.localFoodCandidates).length < 2)
  .map((place) => place.city)

const getPseudoTouristSpotNameCities = (destinationList = []) => destinationList
  .filter((place) => (place.touristSpots ?? []).some((spot) => isPseudoSpotName(spot?.name)))
  .map((place) => place.city)

const getFallbackPseudoSpotGeneratedCities = (destinationList = []) => destinationList
  .filter((place) => (place.touristSpots ?? []).some((spot) => String(spot?.name ?? '').startsWith(place.city) && isPseudoSpotName(spot?.name)))
  .map((place) => place.city)

const getAbstractTouristSpotNameCities = (destinationList = []) => destinationList
  .filter((place) => (place.touristSpots ?? []).some((spot) => spot?.name && !isConcreteSpotName(spot.name)))
  .map((place) => place.city)

const getTemplateTouristSpotDescriptionCities = (destinationList = []) => destinationList
  .filter((place) => (place.touristSpots ?? []).some((spot) => isConcreteSpotName(spot?.name) && isTemplateSpotDescription(spot?.description)))
  .map((place) => place.city)

const getPurposeSpotShortageCities = (destinationList = []) => destinationList
  .filter((place) => {
    const spots = getConcreteTouristSpots(place)
    if (spots.length < 2) return true
    const purposeKeys = Object.entries(place.purposeFit ?? {}).filter(([, score]) => Number(score) >= 70).map(([key]) => key)
    if (purposeKeys.length === 0) return false
    const searchable = spots.map((spot) => [spot.type, spot.description, ...(spot.bestFor ?? [])].join(' ')).join(' ')
    return !purposeKeys.some((key) => searchable.toLowerCase().includes(key.toLowerCase()))
  })
  .map((place) => place.city)

const getStayPlanSpotNameMissingCities = (destinationList = []) => destinationList
  .filter((place) => getConcreteTouristSpots(place).length === 0)
  .map((place) => place.city)

const getStayPlanFoodNameMissingCities = (destinationList = []) => destinationList
  .filter((place) => getConcreteFoodCandidates(place.localFoodCandidates).length === 0 && getLocalFoodDetailItems(place, []).length === 0)
  .map((place) => place.city)

const getModelCourseDiagnosticItems = (place = {}, days = 4) => getConcreteStayIdeas(
  place,
  { days, label: days >= 4 ? '3泊4日以上' : days === 3 ? '2泊3日' : days === 2 ? '1泊2日' : '日帰り' },
  getPurposeMatchedTouristSpots(place, []),
  getLocalFoodDetailItems(place, getLocalFoodDisplayItems(place)),
  [],
  [],
  (place.nearbyDestinationHints ?? []).slice(0, 1).map((city) => ({ city })),
)

const getModelCourseMissingSpotCities = (destinationList = []) => destinationList
  .filter((place) => {
    const spots = getConcreteTouristSpots(place)
    if (spots.length === 0) return false
    const courseText = getModelCourseDiagnosticItems(place, 2).join(' ')
    return !spots.some((spot) => courseText.includes(spot.name))
  })
  .map((place) => place.city)

const getModelCourseMissingFoodCities = (destinationList = []) => destinationList
  .filter((place) => {
    const foodNames = getCourseFoodNames(place, getLocalFoodDetailItems(place, getLocalFoodDisplayItems(place)))
    if (foodNames.length === 0) return false
    const courseText = getModelCourseDiagnosticItems(place, 2).join(' ')
    return !foodNames.some((name) => courseText.includes(name))
  })
  .map((place) => place.city)

const getLongModelCourseMissingNearbyCities = (destinationList = []) => destinationList
  .filter((place) => (place.nearbyDestinationHints?.length ?? 0) > 0)
  .filter((place) => {
    const courseText = getModelCourseDiagnosticItems(place, 5).join(' ')
    return !(place.nearbyDestinationHints ?? []).some((hint) => courseText.includes(hint))
  })
  .map((place) => place.city)

const getModelCoursePseudoNameRiskCities = (destinationList = []) => destinationList
  .filter((place) => getModelCourseDiagnosticItems(place, 3).some((line) => isPseudoSpotName(line)))
  .map((place) => place.city)

const getModelCourseGenerationShortageCities = (destinationList = []) => destinationList
  .filter((place) => getModelCourseDiagnosticItems(place, 2).length === 0)
  .map((place) => place.city)

const getPriorityModelCourseStrengtheningCities = (destinationList = []) => destinationList
  .filter((place) => qualityPriorityCities.includes(place.city))
  .filter((place) => getConcreteTouristSpots(place).length < 2 || getCourseFoodNames(place, getLocalFoodDetailItems(place, getLocalFoodDisplayItems(place))).length === 0 || (place.nearbyDestinationHints?.length ?? 0) === 0)
  .map((place) => place.city)


const localFoodDescriptionRiskPhrases = ['\u98df\u6587\u5316\u306b\u89e6\u308c\u3084\u3059\u3044', '\u5019\u88dc\u306b\u3057\u3084\u3059\u3044', '\u5165\u308c\u3084\u3059\u3044\u3067\u3059', '\u305d\u306e\u571f\u5730\u3089\u3057\u3044\u98df\u4e8b']

const getLocalFoodDescriptionDuplicateCities = (destinationList = []) => destinationList
  .filter((place) => {
    const descriptions = (place.localFoodDetails ?? []).map((food) => food?.description).filter(Boolean)
    return descriptions.length > 1 && new Set(descriptions).size < descriptions.length
  })
  .map((place) => place.city)

const getLocalFoodPhraseRiskCities = (destinationList = []) => destinationList
  .filter((place) => (place.localFoodDetails ?? []).some((food) => localFoodDescriptionRiskPhrases.some((phrase) => String(food?.description ?? '').includes(phrase))))
  .map((place) => place.city)

const getLocalFoodMissingTimingCities = (destinationList = []) => destinationList
  .filter((place) => (place.localFoodDetails ?? []).some((food) => !(food.bestTiming?.length > 0)))
  .map((place) => place.city)

const getLocalFoodMissingAreaHintCities = (destinationList = []) => destinationList
  .filter((place) => (place.localFoodDetails ?? []).some((food) => !(food.bestAreaHints?.length > 0)))
  .map((place) => place.city)

const getUnreviewedRestaurantHintCities = (destinationList = []) => destinationList
  .filter((place) => (place.restaurantHints ?? []).some((hint) => hint?.name && (hint.status === 'confirmed' ? !hint.checkedAt : true)))
  .map((place) => place.city)

const getAbstractFoodDetailCities = (destinationList = []) => destinationList
  .filter((place) => (place.localFoodDetails ?? []).some((food) => food?.name && !isConcreteFoodName(food.name)))
  .map((place) => place.city)

const getAbstractFoodCandidateOnlyCities = (destinationList = []) => destinationList
  .filter((place) => (place.localFoodCandidates?.length ?? 0) > 0 && getConcreteFoodCandidates(place.localFoodCandidates).length === 0)
  .map((place) => place.city)

const getTemplateFoodDescriptionCities = (destinationList = []) => destinationList
  .filter((place) => (place.localFoodDetails ?? []).some((food) => isTemplateFoodDescription(food?.description)))
  .map((place) => place.city)

const getConcreteFoodShortageCities = (destinationList = []) => destinationList
  .filter((place) => getConcreteFoodCandidates(place.localFoodCandidates).length < 3)
  .map((place) => place.city)

const getGenericFoodImageRiskCities = (destinationList = []) => destinationList
  .filter((place) => getConcreteFoodCandidates(place.localFoodCandidates).length > 0 && Boolean(getImageMetaValue(place.foodImage, 'isGeneric')))
  .map((place) => place.city)

const getFoodImageMismatchRiskCities = (destinationList = []) => destinationList
  .filter((place) => {
    const foods = getConcreteFoodCandidates(place.localFoodCandidates)
    const imageThemes = getConcreteFoodCandidates(splitFoodTheme(getImageMetaValue(place.foodImage, 'foodTheme')))
    if (foods.length === 0 || imageThemes.length === 0) return false
    return !imageThemes.some((theme) => foods.some((food) => food.includes(theme) || theme.includes(food)))
  })
  .map((place) => place.city)

const getResultJourneyImageShortageCities = (destinationList = []) => destinationList
  .filter((place) => getResultJourneyImages(place).length === 0)
  .map((place) => place.city)

const getBroadRouteDestinationRiskCities = (destinationList = []) => destinationList
  .filter((place) => {
    const query = getRouteDestinationQuery(place)
    return query === place.address || query === `${place.prefecture ?? ''}${place.city ?? ''}`
  })
  .map((place) => place.city)

const getAbstractDescriptionRiskCities = (destinationList = []) => destinationList
  .filter((place) => {
    const spotCount = place.touristSpots?.length ?? 0
    const foodDetailCount = place.localFoodDetails?.length ?? 0
    const hasSpecificFood = getConcreteFoodCandidates(place.localFoodCandidates).length > 0
    return spotCount < 3 || (foodDetailCount === 0 && !hasSpecificFood)
  })
  .map((place) => place.city)

const getPriorityDescriptionStrengtheningCities = (destinationList = []) => destinationList
  .filter((place) => qualityPriorityCities.includes(place.city))
  .filter((place) => (place.touristSpots?.length ?? 0) < 3 || (place.localFoodDetails?.length ?? 0) < 2 || (place.nearbyDestinationHints?.length ?? 0) === 0)
  .map((place) => place.city)

const createImagePreviewData = (destinationList) => {
  const imageFields = [
    { key: 'heroImage', type: 'hero', label: 'hero' },
    { key: 'foodImage', type: 'food', label: 'food' },
    { key: 'sceneryImage', type: 'scenery', label: 'scenery' },
  ]
  const usageCounts = {}

  destinationList.forEach((destination) => {
    imageFields.forEach(({ key }) => {
      const url = getImageUrl(destination[key])
      if (url) usageCounts[url] = (usageCounts[url] ?? 0) + 1
    })
  })

  return destinationList.map((destination) => {
    const images = imageFields.map(({ key, type, label }) => {
      const image = destination[key]
      const url = getImageUrl(image)
      const category = getImageCategoryFromUrl(image)
      const expectedCategories = getExpectedImageCategories(destination, type)

      return {
        key,
        type,
        label,
        image,
        url,
        displayType: getImageDisplayType(image),
        source: getImageMetaValue(image, 'source', '未設定'),
        credit: getImageMetaValue(image, 'credit'),
        license: getImageMetaValue(image, 'license'),
        status: getImageMetaValue(image, 'status', '未設定'),
        note: getImageMetaValue(image, 'note'),
        isLocal: Boolean(getImageMetaValue(image, 'isLocal')),
        isGeneric: Boolean(getImageMetaValue(image, 'isGeneric')),
        isDestinationSpecific: Boolean(getImageMetaValue(image, 'isDestinationSpecific')),
        isFoodSpecific: Boolean(getImageMetaValue(image, 'isFoodSpecific')),
        isLocalFood: Boolean(getImageMetaValue(image, 'isLocalFood')),
        foodTheme: getImageMetaValue(image, 'foodTheme'),
        usageCount: usageCounts[url] ?? 0,
        categoryMismatch: Boolean(category && !expectedCategories.has(category)),
      }
    })
    const urls = images.map((image) => image.url).filter(Boolean)
    const duplicateWithinDestination = new Set(urls).size < urls.length
    const localFoodCandidates = Array.isArray(destination.localFoodCandidates)
      ? destination.localFoodCandidates.filter(Boolean)
      : []

    return {
      destination,
      images,
      localFoodCandidates,
      duplicateWithinDestination,
      hasDuplicateUsage: images.some((image) => image.usageCount > 1),
      hasCreditMissing: images.some((image) => !image.credit),
      hasCategoryMismatch: images.some((image) => image.categoryMismatch),
      hasIndividual: images.some((image) => image.displayType === '個別画像'),
      hasCategory: images.some((image) => image.displayType === 'カテゴリ画像'),
      hasCommon: images.some((image) => image.displayType === '共通画像'),
      hasTemporary: images.some((image) => image.status === 'temporary'),
      hasConfirmed: images.some((image) => image.status === 'confirmed'),
      hasLocalFood: images.some((image) => image.type === 'food' && image.isLocalFood),
      hasGenericFood: images.some((image) => image.type === 'food' && (image.isGeneric || !image.isLocalFood)),
      hasLocalFoodCandidates: localFoodCandidates.length > 0,
    }
  })
}

const createImageImprovementItems = (imagePreviewItems) => imagePreviewItems
  .map((item) => {
    const hero = item.images.find((image) => image.type === 'hero')
    const food = item.images.find((image) => image.type === 'food')
    const scenery = item.images.find((image) => image.type === 'scenery')
    const issues = []
    const recommendations = []
    let priorityScore = imageImprovementPriorityCities.includes(item.destination.city) ? 2 : 0

    if (!hero?.isDestinationSpecific) {
      issues.push('個別hero画像なし')
      recommendations.push('現地の第一印象が伝わる写真を追加')
      priorityScore += 3
    }
    if (!food?.isDestinationSpecific) {
      issues.push('個別food画像なし')
      recommendations.push('ご当地グルメ写真を追加')
      priorityScore += 3
    }
    if (food && !food.isLocalFood) {
      issues.push('food画像がご当地グルメ未判定')
      recommendations.push((item.destination.localFoodCandidates ?? []).length > 0
        ? `${item.destination.localFoodCandidates.slice(0, 3).join('・')} の写真を検討`
        : '地域らしい料理写真を検討')
      priorityScore += 3
    }
    if (!item.hasLocalFoodCandidates) {
      issues.push('localFoodCandidates未設定')
      recommendations.push('ご当地グルメ候補を3〜5個追加')
      priorityScore += 3
    }
    if (food?.url && !item.hasLocalFoodCandidates) {
      issues.push('food画像あり / グルメ候補なし')
      recommendations.push('food画像に対応する localFoodCandidates を追加')
      priorityScore += 2
    }
    if (!scenery?.isDestinationSpecific) {
      issues.push('scenery画像がカテゴリ画像')
      recommendations.push('代表的な風景・街並み写真を追加')
      priorityScore += 1
    }
    if (item.images.some((image) => ['temporary', 'needs_review', 'fallback', 'missing'].includes(image.status))) {
      issues.push('status確認が必要')
      recommendations.push('公開前に権利・出典・ライセンスを確認')
      priorityScore += 1
    }
    if (item.hasCreditMissing) {
      issues.push('クレジット未設定')
      recommendations.push('写真ごとの credit を登録')
      priorityScore += 1
    }
    if (item.images.some((image) => image.usageCount >= 10)) {
      issues.push('同じ画像の使用回数が多い')
      recommendations.push('カテゴリ画像の追加または個別画像への差し替えを検討')
      priorityScore += 2
    }

    const priority = priorityScore >= 8 ? '高' : priorityScore >= 4 ? '中' : '低'
    return { ...item, issues, recommendations: [...new Set(recommendations)], priority, priorityScore }
  })
  .filter((item) => item.issues.length > 0)
  .sort((left, right) => right.priorityScore - left.priorityScore)

const filterImagePreviewItems = (items, filter) => items.filter((item) => {
  if (filter === 'individual') return item.hasIndividual
  if (filter === 'category') return item.hasCategory
  if (filter === 'common') return item.hasCommon
  if (filter === 'temporary') return item.hasTemporary
  if (filter === 'confirmed') return item.hasConfirmed
  if (filter === 'duplicate') return item.hasDuplicateUsage || item.duplicateWithinDestination
  if (filter === 'credit-missing') return item.hasCreditMissing
  return true
})

function HistoryItems({ entries, favoriteCities, onShow, onFavorite, onDelete }) {
  return (
    <div className="history-list">
      {entries.map((entry) => (
        <article className="history-item" key={entry.id}>
          <header>
            <div><p>{entry.prefecture}</p><h3>{entry.city}</h3></div>
            <time dateTime={entry.drawnAt}>{formatHistoryDate(entry.drawnAt)}</time>
          </header>
          <dl>
            <div><dt>出発地</dt><dd>{entry.departure}</dd></div>
            <div><dt>旅行日程</dt><dd>{entry.tripScheduleLabel ?? resolveTripSchedule(entry.tripType, entry.customNights, entry.customDays).label}</dd></div>
            <div><dt>旅行予定季節</dt><dd>{entry.travelSeason ?? '今の季節'}</dd></div>
            <div><dt>移動範囲</dt><dd>{entry.movementRangeLabel ?? movementRangeOptions.find((option) => option.value === entry.movementRange)?.label ?? 'おまかせ'}</dd></div>
            <div><dt>最適な移動手段</dt><dd>{entry.bestTransport ?? '未評価'}</dd></div>
            <div><dt>同行者・旅のスタイル</dt><dd>{entry.selectedFilters?.length > 0 ? entry.selectedFilters.join('、') : '指定なし'}</dd></div>
            <div><dt>旅の目的</dt><dd>{entry.selectedTravelPurposes?.length > 0 ? entry.selectedTravelPurposes.join('、') : '指定なし'}</dd></div>
            <div><dt>運命度</dt><dd>{entry.destinyScore}%</dd></div>
            <div><dt>行けそう度</dt><dd>{entry.feasibilityStars ?? '未取得'}</dd></div>
            <div><dt>予算目安</dt><dd>{entry.budget}</dd></div>
          </dl>
          <div className="history-actions">
            <button type="button" onClick={() => onShow(entry)}>もう一度表示</button>
            <button
              type="button"
              className="history-favorite-button"
              onClick={() => onFavorite(entry)}
              disabled={favoriteCities.includes(entry.city)}
            >
              {favoriteCities.includes(entry.city) ? 'お気に入り済み' : 'お気に入り登録'}
            </button>
            <button
              type="button"
              className="history-delete-button"
              onClick={() => onDelete(entry.id)}
              aria-label={`${entry.city}の抽選履歴を削除`}
            >
              削除
            </button>
          </div>
        </article>
      ))}
    </div>
  )
}

function SafeImage({
  destination,
  imageType = 'hero',
  src,
  fallbackSrc = DEFAULT_TRAVEL_IMAGE,
  genericFallbackSrc = DEFAULT_TRAVEL_IMAGE,
  alt,
  className = '',
  loading = 'lazy',
  showCredit = false,
  onLoadFailure,
}) {
  const [imageIndex, setImageIndex] = useState(0)
  const candidates = destination
    ? getDestinationImageCandidates(destination, imageType)
    : [src, fallbackSrc, genericFallbackSrc]
      .filter(isValidImageUrl)
      .filter((image, index, images) => images.findIndex((candidate) => getImageUrl(candidate) === getImageUrl(image)) === index)
  const resolvedImage = candidates[imageIndex]
  const resolvedSrc = getImageUrl(resolvedImage)
  const credit = getImageCredit(resolvedImage)

  if (!isValidImageUrl(resolvedSrc)) {
    return <div className={`${className} image-placeholder`} role="img" aria-label={`${alt}（写真準備中）`}>写真準備中</div>
  }

  return (
    <>
      <img
        className={className}
        src={resolvedSrc}
        alt={alt}
        loading={loading}
        decoding="async"
        onError={() => {
          const nextImage = candidates[imageIndex + 1]
          const nextSource = nextImage?.source ?? nextImage?.imageSource
          onLoadFailure?.(nextSource === 'fallback' ? 'tag' : 'generic')
          setImageIndex((current) => current + 1)
        }}
      />
      {showCredit && credit && credit !== 'DROPTRIP' && <small className="image-credit">写真：{credit}</small>}
    </>
  )
}

function DeveloperImagePreviewImage({ item, image }) {
  const [failed, setFailed] = useState(false)

  return (
    <div className={`image-preview-shot ${failed ? 'failed' : ''}`}>
      <div className="image-preview-shot-header">
        <strong>{image.label}</strong>
        <span>{image.displayType}</span>
      </div>
      {failed || !isValidImageUrl(image.image) ? (
        <div className="image-preview-failed" role="img" aria-label={`${item.destination.city} ${image.label} 読み込み失敗`}>
          読み込み失敗
        </div>
      ) : (
        <img
          src={image.url}
          alt={`${item.destination.city}の${image.label}画像`}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      )}
      <dl>
        <div><dt>source</dt><dd>{image.source}</dd></div>
        <div><dt>credit</dt><dd>{image.credit || '未設定'}</dd></div>
        <div><dt>license</dt><dd>{image.license || '未確認'}</dd></div>
        <div><dt>status</dt><dd>{image.status}</dd></div>
        <div><dt>現地写真</dt><dd>{image.isDestinationSpecific ? 'はい' : 'いいえ'}</dd></div>
        <div><dt>汎用カテゴリ</dt><dd>{image.isGeneric ? '共通画像' : image.displayType}</dd></div>
        {image.type === 'food' && (
          <>
            <div><dt>ご当地グルメ</dt><dd>{image.isLocalFood ? 'はい' : '未判定 / 汎用'}</dd></div>
            <div><dt>foodテーマ</dt><dd>{image.foodTheme || '未設定'}</dd></div>
          </>
        )}
        <div><dt>note</dt><dd>{image.note || 'なし'}</dd></div>
        <div><dt>使用回数</dt><dd>{image.usageCount > 1 ? `この画像は ${image.usageCount} 件で使用中` : '1件'}</dd></div>
      </dl>
      {image.categoryMismatch && <p className="image-preview-warning">タグと画像カテゴリが合っているか要確認</p>}
    </div>
  )
}

function App() {
  const travelRequestId = useRef(0)
  const aiPlanRequestId = useRef(0)
  const historyIdFallback = useRef(0)
  const travelRequestInFlight = useRef(false)
  const aiPlanRequestInFlight = useRef(false)
  const developerTitleClicks = useRef({ count: 0, lastClickAt: 0 })
  const destinationListScrollY = useRef(0)
  const [restoredInputState] = useState(loadInputState)
  const [departure, setDeparture] = useState(restoredInputState.departure)
  const [departureError, setDepartureError] = useState('')
  const [tripType, setTripType] = useState(restoredInputState.tripType)
  const [travelSeason, setTravelSeason] = useState(restoredInputState.travelSeason)
  const [selectedFilters, setSelectedFilters] = useState(restoredInputState.selectedFilters)
  const [selectedTravelPurposes, setSelectedTravelPurposes] = useState(restoredInputState.selectedTravelPurposes)
  const [movementRange, setMovementRange] = useState(restoredInputState.movementRange)
  const [strictMovementRange, setStrictMovementRange] = useState(restoredInputState.strictMovementRange)
  const [customRangeHours, setCustomRangeHours] = useState(restoredInputState.customRangeHours)
  const [customRangeKm, setCustomRangeKm] = useState(restoredInputState.customRangeKm)
  const [customNights, setCustomNights] = useState(restoredInputState.customNights)
  const [customDays, setCustomDays] = useState(restoredInputState.customDays)
  const [destination, setDestination] = useState(null)
  const [planContext, setPlanContext] = useState(null)
  const [travelInfo, setTravelInfo] = useState({ status: 'idle', car: null, publicTransit: null })
  const [noMatchMessage, setNoMatchMessage] = useState('')
  const [favoriteCities, setFavoriteCities] = useState(() => loadStoredCities(FAVORITES_STORAGE_KEY))
  const [compareCities, setCompareCities] = useState(() => loadStoredCities(COMPARE_STORAGE_KEY))
  const [comparisonSeason, setComparisonSeason] = useState(restoredInputState.travelSeason)
  const [comparisonFilters, setComparisonFilters] = useState(restoredInputState.selectedFilters)
  const [savedApiKey, setSavedApiKey] = useState(loadStoredApiKey)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [apiKeyNotice, setApiKeyNotice] = useState('')
  const [savedOpenAiApiKey, setSavedOpenAiApiKey] = useState(() => loadStoredApiKey(OPENAI_API_KEY_STORAGE_KEY))
  const [openAiApiKeyInput, setOpenAiApiKeyInput] = useState('')
  const [openAiApiKeyNotice, setOpenAiApiKeyNotice] = useState('')
  const [travelTimeCache, setTravelTimeCache] = useState(loadTravelTimeCache)
  const [lastDestinationId, setLastDestinationId] = useState(null)
  const [selectionMeta, setSelectionMeta] = useState(null)
  const [drawHistory, setDrawHistory] = useState(loadDrawHistory)
  const [showDebugPanel, setShowDebugPanel] = useState(false)
  const [imageFailures, setImageFailures] = useState([])
  const [imagePreviewFilter, setImagePreviewFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState('main')
  const [aiPlanNotice, setAiPlanNotice] = useState('')
  const [aiPlanStatus, setAiPlanStatus] = useState('idle')
  const [aiPlanResult, setAiPlanResult] = useState('')
  const [aiPlanUsage, setAiPlanUsage] = useState(loadAiPlanUsage)
  const [isPremiumUser, setIsPremiumUser] = useState(loadPremiumStatus)
  const [drawSimulation, setDrawSimulation] = useState(null)
  const [conditionTestResults, setConditionTestResults] = useState({})
  const [betaFeedbackNotes, setBetaFeedbackNotes] = useState(loadBetaFeedbackNotes)
  const [betaFeedbackForm, setBetaFeedbackForm] = useState({
    screen: '',
    issue: '',
    suggestion: '',
    priority: '中',
  })
  const [betaFeedbackNotice, setBetaFeedbackNotice] = useState('')
  const [openAiCommunicationMode, setOpenAiCommunicationMode] = useState('server')
  const [resultDetailView, setResultDetailView] = useState('overview')
  const [destinationSearch, setDestinationSearch] = useState('')
  const [destinationPrefectureFilter, setDestinationPrefectureFilter] = useState('all')
  const [destinationTagFilter, setDestinationTagFilter] = useState('all')
  const [destinationPurposeFilter, setDestinationPurposeFilter] = useState('all')
  const [destinationTripTypeFilter, setDestinationTripTypeFilter] = useState('all')
  const [destinationSeasonFilter, setDestinationSeasonFilter] = useState('all')
  const [destinationRangeFilter, setDestinationRangeFilter] = useState('auto')
  const [destinationFavoritesOnly, setDestinationFavoritesOnly] = useState(false)
  const [destinationFiltersOpen, setDestinationFiltersOpen] = useState(false)

  const favoriteDestinations = favoriteCities
    .map((city) => destinations.find((place) => place.city === city))
    .filter(Boolean)


  const prefectureOptions = [...new Set(destinations.map((place) => place.prefecture))]
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right, 'ja'))
  const tripSchedule = resolveTripSchedule(tripType, customNights, customDays)
  const movementRangeSettings = getMovementRangeConfig({ movementRange, customRangeHours, customRangeKm })
  const movementRangeDebugItems = destinations.map((place) => (
    estimateMovementRange(place, departure, movementRangeSettings)
  ))
  const movementRangeBoostedCount = movementRangeDebugItems.filter((item) => item.scoreEffect > 0).length
  const movementRangePenalizedCount = movementRangeDebugItems.filter((item) => item.scoreEffect < 0).length
  const currentMatchingDestinations = destinations
  const travelPurposeBoostedCount = destinations.filter((place) => (
    getTravelPurposeMatch(place, selectedTravelPurposes).matchedPurposes.length > 0
  )).length
  const currentDrawCandidateDiagnostics = getMovementRangeCandidatePool({
    destinationList: currentMatchingDestinations,
    departure,
    rangeSettings: movementRangeSettings,
  })

  const comparisonDestinations = compareCities
    .filter((city) => favoriteCities.includes(city))
    .map((city) => destinations.find((place) => place.city === city))
    .filter(Boolean)
  const comparisonEvaluations = comparisonDestinations.map((place) => {
    const matchingConditions = comparisonFilters.filter((filter) => place.tags.includes(filter))
    const placeSeason = getSeasonCompatibility(place, comparisonSeason, tripType)
    const placeDestiny = calculateDestiny(place, comparisonFilters, tripType)
    const recommendationScore = placeDestiny.score + placeSeason.stars * 4 + matchingConditions.length * 6
    const comment = matchingConditions.length === comparisonFilters.length && comparisonFilters.length > 0 && placeSeason.stars >= 4
      ? '選んだ条件と季節の両方に強く合う候補です。'
      : placeSeason.stars >= 5
        ? `${placeSeason.season}の魅力が特に高い候補です。`
        : matchingConditions.length > 0
          ? `同行者・旅のスタイルのうち${matchingConditions.join('・')}と一致します。`
          : '条件にない魅力との新しい出会いを楽しめる候補です。'
    return { place, matchingConditions, placeSeason, placeDestiny, recommendationScore, comment }
  })
  const bestComparison = [...comparisonEvaluations]
    .sort((a, b) => b.recommendationScore - a.recommendationScore)[0] ?? null
  const destinationListRangeSettings = getMovementRangeConfig({
    movementRange: destinationRangeFilter,
    customRangeHours,
    customRangeKm,
  })
  const filteredDestinations = destinations.filter((place) => {
    const keyword = destinationSearch.trim().toLowerCase()
    const matchesKeyword = !keyword || [
      place.city,
      place.prefecture,
      place.recommendation,
      place.recommendText,
      place.nearestStationLabel,
      place.tags.join(' '),
    ].some((value) => String(value ?? '').toLowerCase().includes(keyword))
    const matchesPrefecture = destinationPrefectureFilter === 'all' || place.prefecture === destinationPrefectureFilter
    const matchesTag = destinationTagFilter === 'all' || place.tags.includes(destinationTagFilter)
    const matchesPurpose = destinationPurposeFilter === 'all'
      || getTravelPurposeMatch(place, [destinationPurposeFilter]).matchedPurposes.length > 0
    const matchesTripType = destinationTripTypeFilter === 'all' || Boolean(place.plans[destinationTripTypeFilter])
    const resolvedListSeason = destinationSeasonFilter === 'all' ? null : resolveSeason(destinationSeasonFilter)
    const matchesSeason = !resolvedListSeason || place.bestSeasons.includes(resolvedListSeason)
    const rangeEstimate = estimateMovementRange(place, departure, destinationListRangeSettings)
    const matchesRange = destinationRangeFilter === 'auto'
      || destinationRangeFilter === 'unlimited'
      || rangeEstimate.isWithinRange
    const matchesFavorite = !destinationFavoritesOnly || favoriteCities.includes(place.city)
    return matchesKeyword
      && matchesPrefecture
      && matchesTag
      && matchesPurpose
      && matchesTripType
      && matchesSeason
      && matchesRange
      && matchesFavorite
  })
  const destinationRangeLabel = movementRangeOptions.find((option) => option.value === destinationRangeFilter)?.label ?? 'おまかせ'
  const activeDestinationFilters = [
    destinationSearch.trim() && `キーワード：${destinationSearch.trim()}`,
    destinationPrefectureFilter !== 'all' && `都道府県：${destinationPrefectureFilter}`,
    destinationTagFilter !== 'all' && `旅先タグ：${destinationTagFilter}`,
    destinationPurposeFilter !== 'all' && `旅先で楽しみたいこと：${destinationPurposeFilter}`,
    destinationTripTypeFilter !== 'all' && `旅行日程：${destinationTripTypeFilter}`,
    destinationSeasonFilter !== 'all' && `季節：${destinationSeasonFilter}`,
    destinationRangeFilter !== 'auto' && `移動範囲：${destinationRangeLabel}`,
    destinationFavoritesOnly && 'お気に入りのみ',
  ].filter(Boolean)

  const resetDestinationFilters = () => {
    setDestinationSearch('')
    setDestinationPrefectureFilter('all')
    setDestinationTagFilter('all')
    setDestinationPurposeFilter('all')
    setDestinationTripTypeFilter('all')
    setDestinationSeasonFilter('all')
    setDestinationRangeFilter('auto')
    setDestinationFavoritesOnly(false)
  }

  const destiny = destination && planContext
    ? calculateDestiny(destination, planContext.selectedFilters, planContext.tripType, planContext.selectedTravelPurposes, planContext.tripSchedule)
    : null
  const seasonCompatibility = destination && planContext
    ? getSeasonCompatibility(destination, planContext.travelSeason, planContext.tripType)
    : null
  const transitFallback = destination && planContext
    ? travelInfo.transitFallback ?? createTransitFallback(planContext.departure, destination)
    : null
  const transportEvaluations = planContext
    ? getTransportEvaluations({ ...travelInfo, transitFallback }, planContext.tripType, destination)
    : []
  const visibleTransportEvaluations = getVisibleTransportEvaluations(transportEvaluations, travelInfo)
  const routeDestinationQuery = destination ? getRouteDestinationQuery(destination) : ''
  const routeDestinationLabel = destination ? getRouteDestinationLabel(destination) : ''
  const drivingMapsUrl = destination && planContext
    ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(planContext.departure)}&destination=${encodeURIComponent(routeDestinationQuery)}&travelmode=driving`
    : 'https://www.google.com/maps'
  const transitMapsUrl = transitFallback?.googleMapsUrl ?? 'https://www.google.com/maps'
  const bestTransportEvaluation = getBestPrimaryTransport(visibleTransportEvaluations)
  const bestTransportReason = getRecommendedTransportReason(
    bestTransportEvaluation,
    visibleTransportEvaluations,
    planContext?.tripType,
  )
  const feasibility = bestTransportEvaluation?.feasibility ?? null
  const localFoodItems = destination ? getLocalFoodDisplayItems(destination) : []
  const localFoodDetails = destination ? getLocalFoodDetailItems(destination, localFoodItems) : []
  const featuredTouristSpots = destination && planContext ? getPurposeMatchedTouristSpots(destination, planContext.selectedTravelPurposes) : []
  const foodThemeText = destination ? getFoodThemeText(destination, localFoodItems) : ''
  const foodImageIsFeatured = destination ? shouldFeatureFoodImage(destination, localFoodItems) : false
  const journeyImages = destination ? getResultJourneyImages(destination) : []
  const tripProposalText = destination && planContext
    ? getTripProposalText(destination, planContext, seasonCompatibility)
    : ''
  const tripEnjoymentItems = destination
    ? getTripEnjoymentItems(destination, localFoodItems)
    : []
  const currentPurposeMatch = destination && planContext
    ? getTravelPurposeMatch(destination, planContext.selectedTravelPurposes)
    : { matchedPurposes: [], summary: '' }
  const currentStyleMatch = destination && planContext
    ? getTravelStyleMatch(destination, planContext.selectedFilters)
    : { matchedStyles: [], summary: '' }
  const currentTripSchedule = planContext?.tripSchedule ?? (planContext ? resolveTripSchedule(planContext.tripType) : tripSchedule)
  const currentTripPlans = destination ? getConcreteSchedulePlans(destination, currentTripSchedule, localFoodItems) : []
  const concreteStayIdeas = destination && canShowConcreteModelCourse(destination, currentTripSchedule, featuredTouristSpots, localFoodDetails, planContext?.tripSuggestions ?? [])
    ? getConcreteStayIdeas(destination, currentTripSchedule, featuredTouristSpots, localFoodDetails, planContext?.selectedTravelPurposes ?? [], planContext?.selectedFilters ?? [], planContext?.tripSuggestions ?? [])
    : []
  const currentBudget = destination ? getBudgetForSchedule(destination, currentTripSchedule) : '時期により変動'
  const longTripPacingItems = getLongTripPacingItems(currentTripSchedule, Boolean(planContext?.tripSuggestions?.some((item) => !item.isStayFocus)))

  const apiKeySource = getGoogleMapsApiKeySource(savedApiKey)
  const maskedApiKey = savedApiKey ? savedApiKey.slice(-4) : ''
  const apiKeyDebugStatus = apiKeySource === 'environment'
    ? '.envで設定済み'
    : apiKeySource === 'localStorage'
      ? '設定カードで設定済み'
      : '未設定'
  const openAiApiKeySource = getOpenAiApiKeySource(savedOpenAiApiKey)
  const maskedOpenAiApiKey = savedOpenAiApiKey ? savedOpenAiApiKey.slice(-4) : ''
  const openAiApiKeyDebugStatus = openAiApiKeySource === 'environment'
    ? '.envで設定済み'
    : openAiApiKeySource === 'localStorage'
      ? '設定カードで設定済み'
      : '未設定'
  const todayAiPlanUsageCount = aiPlanUsage.date === getLocalDateKey() ? aiPlanUsage.count : 0
  const imagePreviewItems = createImagePreviewData(destinations)
  const filteredImagePreviewItems = filterImagePreviewItems(imagePreviewItems, imagePreviewFilter)
  const imageImprovementItems = createImageImprovementItems(imagePreviewItems)

  const reportImageFailure = (destinationId, imageType, fallbackType) => {
    const key = `${destinationId}:${imageType}`
    setImageFailures((current) => (
      current.some((failure) => failure.key === key)
        ? current
        : [...current, { key, destinationId, imageType, fallbackType }]
    ))
  }

  useEffect(() => {
    try {
      window.localStorage.setItem(INPUT_STATE_STORAGE_KEY, JSON.stringify({
        departure,
        tripType,
        travelSeason,
        selectedFilters,
        selectedTravelPurposes,
        movementRange,
        strictMovementRange,
        customRangeHours,
        customRangeKm,
        customNights,
        customDays,
      }))
    } catch {
      // 保存できない環境でも入力操作は継続する
    }
  }, [
    departure,
    tripType,
    travelSeason,
    selectedFilters,
    selectedTravelPurposes,
    movementRange,
    strictMovementRange,
    customRangeHours,
    customRangeKm,
    customNights,
    customDays,
  ])

  const saveCities = (storageKey, cities) => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(cities))
    } catch {
      // 保存が許可されていない環境でも、現在の画面では操作を継続できるようにする
    }
  }

  const updateDrawHistory = (updater) => {
    setDrawHistory((currentHistory) => {
      const nextHistory = updater(currentHistory).slice(0, MAX_HISTORY_ITEMS)
      saveCities(DRAW_HISTORY_STORAGE_KEY, nextHistory)
      return nextHistory
    })
  }

  const addHistoryEntry = (entry) => {
    updateDrawHistory((currentHistory) => [entry, ...currentHistory])
  }

  const updateHistoryEntry = (entryId, updates) => {
    updateDrawHistory((currentHistory) => currentHistory.map((entry) => (
      entry.id === entryId ? { ...entry, ...updates } : entry
    )))
  }

  const deleteHistoryEntry = (entryId) => {
    updateDrawHistory((currentHistory) => currentHistory.filter((entry) => entry.id !== entryId))
  }

  const updateFavorites = (nextFavorites) => {
    setFavoriteCities(nextFavorites)
    saveCities(FAVORITES_STORAGE_KEY, nextFavorites)

    const nextComparison = compareCities.filter((city) => nextFavorites.includes(city))
    if (nextComparison.length !== compareCities.length) {
      setCompareCities(nextComparison)
      saveCities(COMPARE_STORAGE_KEY, nextComparison)
      if (nextComparison.length < 2 && currentPage === 'comparison') switchPage('favorites')
    }
  }


  const toggleFavorite = (city) => {
    const isRegistered = favoriteCities.includes(city)
    const nextFavorites = isRegistered
      ? favoriteCities.filter((favoriteCity) => favoriteCity !== city)
      : [...favoriteCities, city]

    updateFavorites(nextFavorites)
  }

  const toggleComparison = (city) => {
    const isAdding = !compareCities.includes(city)
    if (isAdding && !favoriteCities.includes(city)) {
      const nextFavorites = [...favoriteCities, city]
      setFavoriteCities(nextFavorites)
      saveCities(FAVORITES_STORAGE_KEY, nextFavorites)
    }
    const nextComparison = compareCities.includes(city)
      ? compareCities.filter((compareCity) => compareCity !== city)
      : [...compareCities, city]

    setCompareCities(nextComparison)
    saveCities(COMPARE_STORAGE_KEY, nextComparison)
    if (nextComparison.length < 2 && currentPage === 'comparison') switchPage('favorites')
  }

  const clearComparison = () => {
    setCompareCities([])
    saveCities(COMPARE_STORAGE_KEY, [])
    switchPage('favorites')
  }

  const openComparison = () => {
    setComparisonSeason(travelSeason)
    setComparisonFilters(selectedFilters)
    switchPage('comparison')
  }

  const toggleComparisonFilter = (filter) => {
    setComparisonFilters((current) => (
      current.includes(filter)
        ? current.filter((item) => item !== filter)
        : [...current, filter]
    ))
  }

  const saveBetaFeedbackNotes = (nextNotes) => {
    setBetaFeedbackNotes(nextNotes)
    try {
      window.localStorage.setItem(BETA_FEEDBACK_STORAGE_KEY, JSON.stringify(nextNotes))
    } catch {
      setBetaFeedbackNotice('メモを保存できませんでした。')
    }
  }

  const updateBetaFeedbackForm = (field, value) => {
    setBetaFeedbackForm((current) => ({ ...current, [field]: value }))
    setBetaFeedbackNotice('')
  }

  const addBetaFeedbackNote = (event) => {
    event.preventDefault()
    const nextNote = {
      id: globalThis.crypto?.randomUUID?.() ?? `beta-${Date.now()}`,
      screen: betaFeedbackForm.screen.trim(),
      issue: betaFeedbackForm.issue.trim(),
      suggestion: betaFeedbackForm.suggestion.trim(),
      priority: betaFeedbackForm.priority,
      createdAt: new Date().toISOString(),
    }

    if (!nextNote.screen || !nextNote.issue) {
      setBetaFeedbackNotice('気になった画面と問題内容を入力してください。')
      return
    }

    saveBetaFeedbackNotes([nextNote, ...betaFeedbackNotes].slice(0, 50))
    setBetaFeedbackForm({ screen: '', issue: '', suggestion: '', priority: '中' })
    setBetaFeedbackNotice('βテストメモを保存しました。')
  }

  const deleteBetaFeedbackNote = (noteId) => {
    saveBetaFeedbackNotes(betaFeedbackNotes.filter((note) => note.id !== noteId))
  }

  const saveApiKey = (event) => {
    event.preventDefault()
    const nextApiKey = apiKeyInput.trim()
    if (!nextApiKey) {
      setApiKeyNotice('APIキーを入力してください。')
      return
    }

    try {
      window.localStorage.setItem(MAPS_API_KEY_STORAGE_KEY, nextApiKey)
      setSavedApiKey(nextApiKey)
      setApiKeyInput('')
      setApiKeyNotice('APIキーを保存しました。次回の抽選から使用します。')
    } catch {
      setApiKeyNotice('APIキーを保存できませんでした。')
    }
  }

  const deleteApiKey = () => {
    try {
      window.localStorage.removeItem(MAPS_API_KEY_STORAGE_KEY)
      setSavedApiKey('')
      setApiKeyInput('')
      setApiKeyNotice('保存したAPIキーを削除しました。')
    } catch {
      setApiKeyNotice('APIキーを削除できませんでした。')
    }
  }

  const saveOpenAiApiKey = (event) => {
    event.preventDefault()
    const nextApiKey = openAiApiKeyInput.trim()
    if (!nextApiKey) {
      setOpenAiApiKeyNotice('OpenAI APIキーを入力してください。')
      return
    }

    try {
      window.localStorage.setItem(OPENAI_API_KEY_STORAGE_KEY, nextApiKey)
      setSavedOpenAiApiKey(nextApiKey)
      setOpenAiApiKeyInput('')
      setOpenAiApiKeyNotice('OpenAI APIキーを保存しました。')
    } catch {
      setOpenAiApiKeyNotice('OpenAI APIキーを保存できませんでした。')
    }
  }

  const deleteOpenAiApiKey = () => {
    try {
      window.localStorage.removeItem(OPENAI_API_KEY_STORAGE_KEY)
      setSavedOpenAiApiKey('')
      setOpenAiApiKeyInput('')
      setOpenAiApiKeyNotice('保存したOpenAI APIキーを削除しました。')
    } catch {
      setOpenAiApiKeyNotice('OpenAI APIキーを削除できませんでした。')
    }
  }

  const saveAiPlanUsage = (usage) => {
    setAiPlanUsage(usage)
    try {
      window.localStorage.setItem(AI_PLAN_USAGE_STORAGE_KEY, JSON.stringify(usage))
    } catch {
      // 保存できない環境でも、現在の画面では回数制限を維持する
    }
  }

  const resetAiPlanUsage = () => {
    const resetUsage = { date: getLocalDateKey(), count: 0 }
    saveAiPlanUsage(resetUsage)
    setOpenAiApiKeyNotice('本日のAI生成回数をリセットしました。')
  }

  const togglePremiumStatus = () => {
    const nextStatus = !isPremiumUser
    savePremiumStatus(nextStatus)
    setIsPremiumUser(nextStatus)
    resetAiPlanState()
  }

  const resetAiPlanState = () => {
    ++aiPlanRequestId.current
    setAiPlanNotice('')
    setAiPlanStatus('idle')
    setAiPlanResult('')
  }

  const resetInputConditions = () => {
    ++travelRequestId.current
    setDeparture('')
    setDepartureError('')
    setTripType('日帰り')
    setTravelSeason('今の季節')
    setSelectedFilters([])
    setSelectedTravelPurposes([])
    setMovementRange('auto')
    setStrictMovementRange(false)
    setCustomRangeHours('')
    setCustomRangeKm('')
    setCustomNights('2')
    setCustomDays('3')
    setDestination(null)
    setPlanContext(null)
    setTravelInfo({ status: 'idle', car: null, publicTransit: null })
    setNoMatchMessage('')
    setSelectionMeta(null)
    setLastDestinationId(null)
    setCompareCities([])
    saveCities(COMPARE_STORAGE_KEY, [])
    setComparisonSeason('今の季節')
    setComparisonFilters([])
    resetAiPlanState()
  }

  const switchPage = (page) => {
    if (page === 'result') {
      setResultDetailView('overview')
    }
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const backToDestinationList = () => {
    setCurrentPage('destinations')
    window.setTimeout(() => {
      window.scrollTo({ top: destinationListScrollY.current, behavior: 'auto' })
    }, 0)
  }

  const handleDeveloperTitleClick = (event) => {
    const now = event.timeStamp
    const previous = developerTitleClicks.current
    const nextCount = now - previous.lastClickAt <= 1200 ? previous.count + 1 : 1
    developerTitleClicks.current = { count: nextCount, lastClickAt: now }

    if (nextCount >= 5) {
      developerTitleClicks.current = { count: 0, lastClickAt: 0 }
      switchPage('developer')
    }
  }


  const toggleFilter = (filter) => {
    setSelectedFilters((current) =>
      current.includes(filter)
        ? current.filter((item) => item !== filter)
        : [...current, filter],
    )
  }

  const toggleTravelPurpose = (purpose) => {
    setSelectedTravelPurposes((current) =>
      current.includes(purpose)
        ? current.filter((item) => item !== purpose)
        : [...current, purpose],
    )
  }

  const addHistoryToFavorites = (entry) => {
    if (!favoriteCities.includes(entry.city)) {
      updateFavorites([...favoriteCities, entry.city])
    }
  }

  const showHistoryEntry = async (entry) => {
    if (travelRequestInFlight.current) return
    const place = destinations.find((item) => (
      item.id === entry.destinationId || item.city === entry.city
    ))
    if (!place) return

    const requestId = ++travelRequestId.current
    const restoredDeparture = typeof entry.departure === 'string' ? entry.departure : ''
    const restoredTripTypeData = normalizeStoredTripType(entry.tripType, entry.customNights, entry.customDays)
    const restoredTripType = restoredTripTypeData.tripType
    const restoredTripSchedule = resolveTripSchedule(restoredTripType, restoredTripTypeData.customNights, restoredTripTypeData.customDays)
    const restoredSeason = seasonOptions.includes(entry.travelSeason) ? entry.travelSeason : '今の季節'
    const restoredMovementRange = movementRangeOptions.some((option) => option.value === entry.movementRange)
      ? entry.movementRange
      : 'auto'
    const restoredFilters = normalizeTravelStyles(entry.selectedFilters ?? [])
    const restoredTravelPurposes = normalizeTravelPurposes(entry.selectedTravelPurposes ?? [], entry.selectedFilters ?? [])
    const matchingCount = getTravelStyleMatch(place, restoredFilters).matchedStyles.length
    const purposeMatch = getTravelPurposeMatch(place, restoredTravelPurposes)

    setDeparture(restoredDeparture)
    setDepartureError('')
    setTripType(restoredTripType)
    setTravelSeason(restoredSeason)
    setMovementRange(restoredMovementRange)
    setStrictMovementRange(false)
    setCustomNights(restoredTripTypeData.customNights)
    setCustomDays(restoredTripTypeData.customDays)
    setSelectedFilters(restoredFilters)
    setSelectedTravelPurposes(restoredTravelPurposes)
    setDestination(place)
    setLastDestinationId(place.id)
    setNoMatchMessage('')
    setPlanContext({
      departure: restoredDeparture,
      tripType: restoredTripType,
      travelSeason: restoredSeason,
      selectedFilters: restoredFilters,
      selectedTravelPurposes: restoredTravelPurposes,
      tripSchedule: restoredTripSchedule,
      customNights: restoredTripTypeData.customNights,
      customDays: restoredTripTypeData.customDays,
      tripSuggestions: entry.tripSuggestions ?? [],
      hasMultiDestinationSuggestion: Boolean(entry.hasMultiDestinationSuggestion),
      movementRange: restoredMovementRange,
      strictMovementRange: false,
    })
    setSelectionMeta({
      matchingCount,
      purposeMatch,
      tripCompatibilityLabel: entry.tripCompatibilityLabel ?? '良い',
      feasibilityStars: entry.feasibilityStars ?? null,
      score: entry.selectionScore ?? 0,
      seasonCompatibility: entry.seasonCompatibility ?? '標準',
      movementRangeEstimate: entry.movementRangeEstimate ?? null,
      tripSchedule: restoredTripSchedule,
      tripSuggestions: entry.tripSuggestions ?? [],
      hasMultiDestinationSuggestion: Boolean(entry.hasMultiDestinationSuggestion),
      suggestionReasons: entry.suggestionReasons ?? [],
      source: 'history',
    })
    travelRequestInFlight.current = true
    setTravelInfo({ status: 'loading', car: null, publicTransit: null })
    resetAiPlanState()
    switchPage('result')

    try {
      const routes = await getTravelInfo({
        origin: restoredDeparture,
        destination: {
          address: place.address,
          latitude: place.latitude,
          longitude: place.longitude,
          googleMapsQuery: place.googleMapsQuery,
          routeDestinationQuery: getRouteDestinationQuery(place),
          nearestStation: place.nearestStation,
          nearestStationLabel: place.nearestStationLabel,
          transitQuery: place.transitQuery,
          prefecture: place.prefecture,
          city: place.city,
        },
        apiKey: savedApiKey,
      })

      if (requestId === travelRequestId.current) {
        setTravelInfo(routes)
        const restoredEvaluations = getTransportEvaluations(routes, restoredTripType, place)
        const restoredBest = getBestPrimaryTransport(restoredEvaluations)
        if (routes.car?.durationMinutes) {
          const cacheKey = getTravelCacheKey(restoredDeparture, place.id)
          const nextCache = { ...travelTimeCache, [cacheKey]: routes.car.durationMinutes }
          setTravelTimeCache(nextCache)
          saveCities(TRAVEL_CACHE_STORAGE_KEY, nextCache)
        }
        if (restoredBest) {
          const currentFeasibility = restoredBest.feasibility
          setSelectionMeta((current) => current
            ? { ...current, feasibilityStars: currentFeasibility.starsLabel }
            : current)
          updateHistoryEntry(entry.id, {
            feasibilityStars: currentFeasibility.starsLabel,
            bestTransport: restoredBest.mode,
          })
        }
      }
    } catch (error) {
      if (requestId === travelRequestId.current) {
        setTravelInfo({
          status: ['API_KEY_INVALID', 'SERVER_API_KEY_MISSING'].includes(error?.code) ? 'api-error' : 'error',
          car: null,
          publicTransit: null,
          transitDebug: error?.transitDebug,
          transitFallback: error?.transitFallback,
          routeDiagnostics: error?.routeDiagnostics,
        })
      }
    } finally {
      travelRequestInFlight.current = false
    }

  }

  const showDestinationFromList = async (place) => {
    if (travelRequestInFlight.current) return
    destinationListScrollY.current = window.scrollY
    const normalizedDeparture = departure.trim()
    const requestId = ++travelRequestId.current
    const detailFilters = [...selectedFilters]
    const detailTravelPurposes = [...selectedTravelPurposes]
    const detailTripSchedule = resolveTripSchedule(tripType, customNights, customDays)
    const detailTripSuggestions = getNearbyTripSuggestions(place, filteredDestinations.length > 0 ? filteredDestinations : destinations, detailTripSchedule, detailTravelPurposes)
    const movementEstimate = estimateMovementRange(place, normalizedDeparture, movementRangeSettings)
    const detailScore = scoreDestination({
      destination: place,
      selectedFilters: detailFilters,
      selectedTravelPurposes: detailTravelPurposes,
      tripType,
      tripSchedule: detailTripSchedule,
      travelSeason,
      cachedDurationMinutes: normalizedDeparture
        ? travelTimeCache[getTravelCacheKey(normalizedDeparture, place.id)]
        : null,
      isPrevious: place.id === lastDestinationId,
      movementRangeEstimate: movementEstimate,
    })

    setDepartureError('')
    setDestination(place)
    setLastDestinationId(place.id)
    setNoMatchMessage('')
    setSelectionMeta({
      matchingCount: detailScore.matchingCount,
      purposeMatch: detailScore.purposeMatch,
      tripCompatibilityLabel: detailScore.tripCompatibilityLabel,
      feasibilityStars: detailScore.feasibilityStars,
      score: detailScore.score,
      schedulePoints: detailScore.schedulePoints,
      styleMatch: detailScore.styleMatch,
      seasonCompatibility: detailScore.seasonCompatibility,
      movementRangeEstimate: movementEstimate,
      tripSchedule: detailTripSchedule,
      tripSuggestions: detailTripSuggestions,
      hasMultiDestinationSuggestion: detailTripSuggestions.length > 0,
      suggestionReasons: detailTripSuggestions.map((item) => item.reason),
      source: 'destination-list',
    })
    setPlanContext({
      departure: normalizedDeparture || '出発地未設定',
      tripType,
      travelSeason,
      selectedFilters: detailFilters,
      selectedTravelPurposes: detailTravelPurposes,
      tripSchedule: detailTripSchedule,
      customNights,
      customDays,
      tripSuggestions: detailTripSuggestions,
      hasMultiDestinationSuggestion: detailTripSuggestions.length > 0,
      movementRange,
      strictMovementRange,
    })
    resetAiPlanState()
    switchPage('result')

    if (!normalizedDeparture) {
      setTravelInfo({ status: 'idle', car: null, publicTransit: null })
      return
    }

    travelRequestInFlight.current = true
    setTravelInfo({ status: 'loading', car: null, publicTransit: null })

    try {
      const routes = await getTravelInfo({
        origin: normalizedDeparture,
        destination: {
          address: place.address,
          latitude: place.latitude,
          longitude: place.longitude,
          googleMapsQuery: place.googleMapsQuery,
          routeDestinationQuery: getRouteDestinationQuery(place),
          nearestStation: place.nearestStation,
          nearestStationLabel: place.nearestStationLabel,
          transitQuery: place.transitQuery,
          prefecture: place.prefecture,
          city: place.city,
        },
        apiKey: savedApiKey,
      })

      if (requestId === travelRequestId.current) {
        setTravelInfo(routes)
        if (routes.car?.durationMinutes) {
          const cacheKey = getTravelCacheKey(normalizedDeparture, place.id)
          const nextCache = { ...travelTimeCache, [cacheKey]: routes.car.durationMinutes }
          setTravelTimeCache(nextCache)
          saveCities(TRAVEL_CACHE_STORAGE_KEY, nextCache)
        }
        const listEvaluations = getTransportEvaluations(routes, tripType, place)
        const listBest = getBestPrimaryTransport(listEvaluations)
        if (listBest) {
          setSelectionMeta((current) => current
            ? { ...current, feasibilityStars: listBest.feasibility.starsLabel }
            : current)
        }
      }
    } catch (error) {
      if (requestId === travelRequestId.current) {
        setTravelInfo({
          status: ['API_KEY_INVALID', 'SERVER_API_KEY_MISSING'].includes(error?.code) ? 'api-error' : 'error',
          car: null,
          publicTransit: null,
          transitDebug: error?.transitDebug,
          transitFallback: error?.transitFallback,
          routeDiagnostics: error?.routeDiagnostics,
        })
      }
    } finally {
      travelRequestInFlight.current = false
    }
  }

  const runConditionDrawTest = (testCase) => {
    const testSchedule = resolveTripSchedule(testCase.tripType, testCase.customNights, testCase.customDays)
    const testRangeSettings = getMovementRangeConfig({ movementRange: testCase.movementRange })
    const candidatePool = getMovementRangeCandidatePool({
      destinationList: destinations,
      departure: testCase.departure,
      rangeSettings: testRangeSettings,
      minimumCandidateCount: 3,
    })
    const candidates = candidatePool.candidates

    if (candidates.length === 0) {
      setConditionTestResults((current) => ({
        ...current,
        [testCase.id]: { ...testCase, runs: 0, error: '候補がありません。移動範囲条件を確認してください。' },
      }))
      return
    }

    const originRegion = inferOriginRegion(testCase.departure)
    const farRegions = farRegionsForNearByOrigin[originRegion] ?? []
    const byCity = {}
    const regionCounts = {}
    const warnings = new Set()
    let previousId = null
    let purposeMatchedTotal = 0
    let styleMatchedTotal = 0
    let longStaySuggestionTotal = 0
    let longStayNoSuggestionCount = 0

    for (let index = 0; index < conditionDrawTestRuns; index += 1) {
      const scored = candidates.map((place) => scoreDestination({
        destination: place,
        selectedFilters: testCase.selectedFilters,
        selectedTravelPurposes: testCase.selectedTravelPurposes,
        tripType: testCase.tripType,
        tripSchedule: testSchedule,
        travelSeason: '今の季節',
        cachedDurationMinutes: null,
        isPrevious: place.id === previousId,
        movementRangeEstimate: estimateMovementRange(place, testCase.departure, testRangeSettings),
      }))
      const selected = pickWeightedDestination(scored)
      const place = selected.destination
      const movementEstimate = selected.movementRangeEstimate ?? estimateMovementRange(place, testCase.departure, testRangeSettings)
      const purposeMatch = getTravelPurposeMatch(place, testCase.selectedTravelPurposes)
      const styleMatch = getTravelStyleMatch(place, testCase.selectedFilters)
      const suggestions = getNearbyTripSuggestions(place, candidates, testSchedule, testCase.selectedTravelPurposes)
      const localFoodCount = place.localFoodCandidates?.length ?? 0
      const row = byCity[place.city] ?? {
        city: place.city,
        prefecture: place.prefecture,
        region: getDestinationRegion(place),
        count: 0,
        movementLabel: movementEstimate.label,
        estimatedMinutes: movementEstimate.estimatedMinutes,
        purposeMatched: false,
        styleMatched: false,
        localFoodCount,
        suggestionCount: 0,
        warnings: new Set(),
      }

      row.count += 1
      row.purposeMatched = row.purposeMatched || purposeMatch.matchedPurposes.length > 0
      row.styleMatched = row.styleMatched || styleMatch.matchedStyles.length > 0
      row.suggestionCount = Math.max(row.suggestionCount, suggestions.length)
      byCity[place.city] = row
      regionCounts[row.region] = (regionCounts[row.region] ?? 0) + 1
      if (purposeMatch.matchedPurposes.length > 0) purposeMatchedTotal += 1
      if (styleMatch.matchedStyles.length > 0) styleMatchedTotal += 1
      if (suggestions.length > 0) longStaySuggestionTotal += 1
      if (testSchedule.days >= 5 && suggestions.length === 0) longStayNoSuggestionCount += 1

      if (testCase.movementRange === 'near' && farRegions.includes(row.region)) row.warnings.add('近場なのに遠方地方')
      if (testCase.movementRange === 'near' && movementEstimate.estimatedMinutes > 120) row.warnings.add('近場として長め')
      if (testSchedule.days <= 1 && movementEstimate.estimatedMinutes > 120) row.warnings.add('日帰りとして遠い')
      if (testSchedule.days >= 5 && suggestions.length === 0) row.warnings.add('長期旅行の追加候補なし')
      if (testCase.selectedTravelPurposes.includes('グルメ') && localFoodCount === 0) row.warnings.add('グルメ候補なし')
      if (testCase.selectedTravelPurposes.includes('温泉') && !(place.tags?.includes('温泉') || Number(place.purposeFit?.onsen ?? 0) >= 58)) row.warnings.add('温泉適性が弱い')
      if (testCase.selectedTravelPurposes.includes('神社・歴史') && Number(place.purposeFit?.history ?? 0) < 58) row.warnings.add('歴史適性が弱い')
      if (testCase.selectedFilters.includes('ペットあり') && Number(place.companionFit?.pet ?? 0) < 45 && !place.tags?.some((tag) => ['山', '海'].includes(tag))) row.warnings.add('自然・屋外向きが弱い')
      row.warnings.forEach((warning) => warnings.add(place.city + '：' + warning))
      previousId = place.id
    }

    const destinationRows = Object.values(byCity)
      .map((row) => ({ ...row, warnings: [...row.warnings] }))
      .sort((left, right) => right.count - left.count)
    const unsuitableCandidates = destinationRows.filter((row) => row.warnings.length > 0)
    if (testSchedule.days >= 5 && longStayNoSuggestionCount > 0) warnings.add('5泊以上なのに追加候補がない結果があります')
    if (testCase.movementRange === 'near' && unsuitableCandidates.some((row) => row.warnings.some((warning) => warning.includes('遠方') || warning.includes('長め')))) warnings.add('近場条件で移動範囲の確認が必要です')

    setConditionTestResults((current) => ({
      ...current,
      [testCase.id]: {
        ...testCase,
        runs: conditionDrawTestRuns,
        scheduleLabel: testSchedule.label,
        movementRangeLabel: movementRangeOptions.find((option) => option.value === testCase.movementRange)?.label ?? '制限なし',
        candidateCount: candidates.length,
        rangeExcludedCount: candidatePool.excludedCount,
        rangeRelaxed: candidatePool.relaxed,
        destinationRows,
        regionCounts,
        unsuitableCandidates,
        purposeFitCount: purposeMatchedTotal,
        companionFitCount: styleMatchedTotal,
        longStaySuggestionCount: longStaySuggestionTotal,
        warnings: [...warnings],
      },
    }))
  }

  const runAllConditionDrawTests = () => {
    conditionDrawTestCases.forEach((testCase) => runConditionDrawTest(testCase))
  }

  const runDrawSimulation = () => {
    const normalizedDeparture = departure.trim()
    const matchingDestinations = destinations
    const currentRangeSettings = getMovementRangeConfig({ movementRange, customRangeHours, customRangeKm })
    const candidatePool = getMovementRangeCandidatePool({
      destinationList: matchingDestinations,
      departure: normalizedDeparture,
      rangeSettings: currentRangeSettings,
    })
    const candidates = candidatePool.candidates

    if (candidates.length === 0) {
      setDrawSimulation({ error: '現在の条件ではシミュレーション対象がありません。' })
      return
    }

    const cityCounts = {}
    const prefectureCounts = {}
    const tagCounts = Object.fromEntries(filterOptions.map((tag) => [tag, 0]))
    let destinyTotal = 0
    let conditionRatioTotal = 0
    let previousId = lastDestinationId

    for (let index = 0; index < 100; index += 1) {
      const scoredDestinations = candidates.map((place) => scoreDestination({
        destination: place,
        selectedFilters,
        selectedTravelPurposes,
        tripType,
        tripSchedule,
        travelSeason,
        cachedDurationMinutes: normalizedDeparture
          ? travelTimeCache[getTravelCacheKey(normalizedDeparture, place.id)]
          : null,
        isPrevious: place.id === previousId,
        movementRangeEstimate: estimateMovementRange(place, normalizedDeparture, currentRangeSettings),
      }))
      const selected = pickWeightedDestination(scoredDestinations)
      const place = selected.destination
      const destinyScore = calculateDestiny(place, selectedFilters, tripType, selectedTravelPurposes).score

      cityCounts[place.city] = (cityCounts[place.city] ?? 0) + 1
      prefectureCounts[place.prefecture] = (prefectureCounts[place.prefecture] ?? 0) + 1
      place.tags.forEach((tag) => {
        if (tag in tagCounts) tagCounts[tag] += 1
      })
      destinyTotal += destinyScore
      conditionRatioTotal += selectedFilters.length > 0
        ? selected.matchingCount / selectedFilters.length
        : 1
      previousId = place.id
    }

    const sortCounts = (counts) => Object.entries(counts).sort(([, left], [, right]) => right - left)
    const destinationRanking = sortCounts(cityCounts)
    const mostFrequentCount = destinationRanking[0]?.[1] ?? 0
    setDrawSimulation({
      candidateCount: candidates.length,
      rangeExcludedCount: candidatePool.excludedCount,
      rangeRelaxed: candidatePool.relaxed,
      rangeFarCandidateCount: candidatePool.farCandidateCount,
      destinationRanking: destinationRanking.slice(0, 5),
      prefectureRanking: sortCounts(prefectureCounts).slice(0, 5),
      tagRanking: sortCounts(tagCounts),
      averageDestiny: Math.round(destinyTotal / 100),
      conditionMatchRate: Math.round((conditionRatioTotal / 100) * 100),
      repetitionWarning: mostFrequentCount >= 15,
      mostFrequentCount,
      conditions: {
        tripType,
        season: resolveSeason(travelSeason) ?? 'おまかせ',
        filters: selectedFilters.length > 0 ? selectedFilters.join('、') : '指定なし',
        purposes: selectedTravelPurposes.length > 0 ? selectedTravelPurposes.join('、') : '指定なし',
        movementRange: movementRangeOptions.find((option) => option.value === movementRange)?.label ?? 'おまかせ',
      },
    })
  }

  const chooseDestination = async (event) => {
    event?.preventDefault?.()
    if (travelRequestInFlight.current) return
    const normalizedDeparture = departure.trim()

    if (!normalizedDeparture) {
      ++travelRequestId.current
      setDepartureError('出発地を入力してください')
      return
    }

    setDepartureError('')
    const requestId = ++travelRequestId.current
    const matchingDestinations = destinations
    const currentRangeSettings = getMovementRangeConfig({ movementRange, customRangeHours, customRangeKm })
    const candidatePool = getMovementRangeCandidatePool({
      destinationList: matchingDestinations,
      departure: normalizedDeparture,
      rangeSettings: currentRangeSettings,
    })
    const candidates = candidatePool.candidates

    if (candidates.length === 0) {
      setDestination(null)
      setPlanContext(null)
      setTravelInfo({ status: 'idle', car: null, publicTransit: null })
      setSelectionMeta(null)
      setNoMatchMessage(
        matchingDestinations.length > 0
          ? '条件に合う旅先がありません。移動範囲や条件を少し広げてください。'
          : '条件に合う旅先が見つかりませんでした。条件を減らしてください。',
      )
      switchPage('main')
      return
    }

    const scoredDestinations = candidates.map((place) => scoreDestination({
      destination: place,
      selectedFilters,
      selectedTravelPurposes,
      tripType,
      tripSchedule,
      travelSeason,
      cachedDurationMinutes: travelTimeCache[getTravelCacheKey(normalizedDeparture, place.id)],
      isPrevious: place.id === lastDestinationId,
      movementRangeEstimate: estimateMovementRange(place, normalizedDeparture, currentRangeSettings),
    }))
    const selected = pickWeightedDestination(scoredDestinations)
    const next = selected.destination
    const selectedTripSchedule = resolveTripSchedule(tripType, customNights, customDays)
    const tripSuggestions = getNearbyTripSuggestions(next, candidates, selectedTripSchedule, selectedTravelPurposes)
    const selectedDestiny = calculateDestiny(next, selectedFilters, tripType, selectedTravelPurposes, selectedTripSchedule)
    const historyEntryId = globalThis.crypto?.randomUUID?.()
      ?? `history-${historyIdFallback.current += 1}`
    addHistoryEntry({
      id: historyEntryId,
      destinationId: next.id,
      city: next.city,
      prefecture: next.prefecture,
      departure: normalizedDeparture,
      tripType,
      tripScheduleLabel: selectedTripSchedule.label,
      customNights: String(selectedTripSchedule.nights),
      customDays: String(selectedTripSchedule.days),
      hasMultiDestinationSuggestion: tripSuggestions.length > 0,
      tripSuggestions: tripSuggestions.map((item) => ({ city: item.destination?.city ?? item.city, prefecture: item.destination?.prefecture ?? item.prefecture, reason: item.reason, isStayFocus: Boolean(item.isStayFocus), sharedTags: item.sharedTags ?? [], regionMatch: item.regionMatch ?? 'stay-focus' })),
      suggestionReasons: tripSuggestions.map((item) => item.reason),
      travelSeason,
      movementRange,
      strictMovementRange,
      movementRangeLabel: movementRangeOptions.find((option) => option.value === movementRange)?.label ?? 'おまかせ',
      selectedFilters: [...selectedFilters],
      selectedTravelPurposes: [...selectedTravelPurposes],
      destinyScore: selectedDestiny.score,
      feasibilityStars: selected.feasibilityStars,
      bestTransport: selected.feasibilityStars ? '車' : null,
      budget: getBudgetForSchedule(next, selectedTripSchedule),
      drawnAt: new Date().toISOString(),
      selectionScore: selected.score,
      seasonCompatibility: selected.seasonCompatibility,
      source: 'draw',
      movementRangeEstimate: selected.movementRangeEstimate,
      movementRangeRelaxed: candidatePool.relaxed,
      movementRangeExcludedCount: candidatePool.excludedCount,
      movementRangeFinalCount: candidatePool.finalCount,
      purposeMatch: selected.purposeMatch,
      tripCompatibilityLabel: selected.tripCompatibilityLabel,
    })
    setNoMatchMessage('')
    setDestination(next)
    setLastDestinationId(next.id)
    setSelectionMeta({
      matchingCount: selected.matchingCount,
      purposeMatch: selected.purposeMatch,
      tripCompatibilityLabel: selected.tripCompatibilityLabel,
      feasibilityStars: selected.feasibilityStars,
      score: selected.score,
      schedulePoints: selected.schedulePoints,
      styleMatch: selected.styleMatch,
      seasonCompatibility: selected.seasonCompatibility,
      movementRangeRelaxed: candidatePool.relaxed,
      movementRangeExcludedCount: candidatePool.excludedCount,
      movementRangeFinalCount: candidatePool.finalCount,
      tripSchedule: selectedTripSchedule,
      tripSuggestions,
      hasMultiDestinationSuggestion: tripSuggestions.length > 0,
      suggestionReasons: tripSuggestions.map((item) => item.reason),
    })
    setPlanContext({
      departure: normalizedDeparture,
      tripType,
      travelSeason,
      selectedFilters: [...selectedFilters],
      selectedTravelPurposes: [...selectedTravelPurposes],
      tripSchedule: selectedTripSchedule,
      customNights: String(selectedTripSchedule.nights),
      customDays: String(selectedTripSchedule.days),
      tripSuggestions,
      hasMultiDestinationSuggestion: tripSuggestions.length > 0,
      movementRange,
      strictMovementRange,
    })
    travelRequestInFlight.current = true
    setTravelInfo({ status: 'loading', car: null, publicTransit: null })
    resetAiPlanState()
    switchPage('result')

    try {
      const routes = await getTravelInfo({
        origin: normalizedDeparture,
        destination: {
          address: next.address,
          latitude: next.latitude,
          longitude: next.longitude,
          googleMapsQuery: next.googleMapsQuery,
          routeDestinationQuery: getRouteDestinationQuery(next),
          nearestStation: next.nearestStation,
          nearestStationLabel: next.nearestStationLabel,
          transitQuery: next.transitQuery,
          prefecture: next.prefecture,
          city: next.city,
        },
        apiKey: savedApiKey,
      })
      if (requestId === travelRequestId.current) {
        setTravelInfo(routes)
        if (routes.car?.durationMinutes) {
          const cacheKey = getTravelCacheKey(normalizedDeparture, next.id)
          const nextCache = { ...travelTimeCache, [cacheKey]: routes.car.durationMinutes }
          setTravelTimeCache(nextCache)
          saveCities(TRAVEL_CACHE_STORAGE_KEY, nextCache)
        }
        const selectedEvaluations = getTransportEvaluations(routes, tripType, next)
        const selectedBest = getBestPrimaryTransport(selectedEvaluations)
        if (selectedBest) {
          const currentFeasibility = selectedBest.feasibility
          setSelectionMeta((current) => current
            ? { ...current, feasibilityStars: currentFeasibility.starsLabel }
            : current)
          updateHistoryEntry(historyEntryId, {
            feasibilityStars: currentFeasibility.starsLabel,
            bestTransport: selectedBest.mode,
          })
        }
      }
    } catch (error) {
      if (requestId === travelRequestId.current) {
        setTravelInfo({
          status: ['API_KEY_INVALID', 'SERVER_API_KEY_MISSING'].includes(error?.code) ? 'api-error' : 'error',
          car: null,
          publicTransit: null,
          transitDebug: error?.transitDebug,
          transitFallback: error?.transitFallback,
          routeDiagnostics: error?.routeDiagnostics,
        })
      }
    } finally {
      travelRequestInFlight.current = false
    }
  }

  const generateAiPlan = async () => {
    if (aiPlanRequestInFlight.current) return
    if (!destination || !planContext) return
    if (!isPremiumEnabled(isPremiumUser)) {
      ++aiPlanRequestId.current
      setAiPlanResult('')
      setAiPlanStatus('premium-required')
      setAiPlanNotice('プレミアム機能は今後提供予定です')
      return
    }
    if (todayAiPlanUsageCount >= DAILY_AI_PLAN_LIMIT) {
      ++aiPlanRequestId.current
      setAiPlanResult('')
      setAiPlanStatus('limit')
      setAiPlanNotice('本日のAIプラン生成回数に達しました。明日またお試しください。')
      return
    }

    aiPlanRequestInFlight.current = true
    const requestId = ++aiPlanRequestId.current
    saveAiPlanUsage({
      date: getLocalDateKey(),
      count: todayAiPlanUsageCount + 1,
    })
    setAiPlanNotice('')
    setAiPlanResult('')
    setAiPlanStatus('loading')
    const season = planContext.travelSeason === '今の季節'
      ? `今の季節（${getCurrentSeason()}）`
      : planContext.travelSeason
    const aiDestination = createAiDestinationPayload(destination, planContext, featuredTouristSpots, localFoodDetails, planContext.tripSuggestions ?? [])
    const prompt = createAiPlanPrompt({
      departure: planContext.departure,
      destination: aiDestination,
      tripType: planContext.tripType,
      tripSchedule: currentTripSchedule,
      season,
      selectedFilters: planContext.selectedFilters,
      selectedTravelPurposes: planContext.selectedTravelPurposes,
      movementRangeLabel: aiDestination.movementRangeLabel,
      nearbySuggestions: aiDestination.nearbySuggestions,
      transportComparisons: visibleTransportEvaluations.map((item) => ({
        mode: item.mode,
        rating: item.feasibility?.starsLabel ?? '未評価',
        duration: item.isReference ? null : item.basis?.duration,
        isReference: item.isReference,
      })),
      budget: currentBudget,
    })
    try {
      const result = await generateOpenAiPlan({
        prompt,
        destination: aiDestination,
        travelType: planContext.tripType,
        storedApiKey: savedOpenAiApiKey,
      })
      if (requestId === aiPlanRequestId.current) {
        setAiPlanResult(result.text)
        setOpenAiCommunicationMode(result.mode)
        setAiPlanStatus('success')
      }
    } catch {
      if (requestId === aiPlanRequestId.current) {
        setAiPlanStatus('error')
        setAiPlanNotice('AIプランを生成できませんでした。しばらくしてから再度お試しください。')
      }
    } finally {
      aiPlanRequestInFlight.current = false
    }
  }

  return (
    <main className="app-shell">
      <section
        className={`trip-card ${currentPage === 'developer' ? 'developer-page' : currentPage === 'history' ? 'history-page' : currentPage === 'favorites' ? 'favorites-page' : currentPage === 'comparison' ? 'comparison-page' : currentPage === 'calculation' ? 'calculation-page' : currentPage === 'destinations' ? 'destinations-page' : currentPage === 'result' ? 'result-page' : 'main-page'}`}
        aria-labelledby={currentPage === 'developer' ? 'developer-page-title' : currentPage === 'history' ? 'history-page-title' : currentPage === 'favorites' ? 'favorites-page-title' : currentPage === 'comparison' ? 'comparison-page-title' : currentPage === 'calculation' ? 'calculation-page-title' : currentPage === 'destinations' ? 'destinations-page-title' : currentPage === 'result' ? 'result-page-title' : 'app-title'}
      >
        {currentPage === 'main' || currentPage === 'result' ? (
          <>
        {currentPage === 'main' && (
          <>
        <header className="hero">
          <div className="logo-mark" aria-hidden="true">
            <svg viewBox="0 0 48 48" role="img">
              <path d="M24 4C14.6 4 7 11.5 7 20.8 7 33.4 24 44 24 44s17-10.6 17-23.2C41 11.5 33.4 4 24 4Z" />
              <circle cx="24" cy="20" r="6" />
            </svg>
          </div>
          <p className="eyebrow">WHERE TO NEXT?</p>
          <h1 id="app-title" onClick={handleDeveloperTitleClick}>DROPTRIP</h1>
          <p className="subtitle">運命の旅行先を決めよう</p>
          <p className="hero-description">今の気分に合う旅先を提案します。</p>
        </header>

        <form onSubmit={chooseDestination} className="trip-form" noValidate>
          <details className="quick-guide">
            <summary><span aria-hidden="true">✦</span>かんたん3ステップ</summary>
            <ol>
              <li><b>1</b><span>出発地を入力</span></li>
              <li><b>2</b><span>同行者・目的・日程を選ぶ</span></li>
              <li><b>3</b><span>旅先を決める</span></li>
            </ol>
          </details>
          <div className="field-group">
            <label htmlFor="departure">出発地</label>
            <div className="input-wrap">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 21s7-4.7 7-12A7 7 0 1 0 5 9c0 7.3 7 12 7 12Z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
              <input
                id="departure"
                type="text"
                value={departure}
                onChange={(event) => {
                  setDeparture(event.target.value)
                  if (event.target.value.trim()) setDepartureError('')
                }}
                placeholder="例：水戸駅 / 茨城県水戸市 / 東京駅"
                autoComplete="address-level1"
                aria-required="true"
                aria-invalid={Boolean(departureError)}
                aria-describedby={departureError ? 'departure-error' : undefined}
              />
            </div>
            {departureError && (
              <p className="input-error" id="departure-error" role="alert">
                <span aria-hidden="true">!</span>{departureError}
              </p>
            )}
          </div>

          <fieldset className="field-group">
            <legend>旅行日程</legend>
            <div className="trip-type-options">
              {tripTypes.map((type) => (
                <label key={type} className={tripType === type ? 'selected' : ''}>
                  <input
                    type="radio"
                    name="tripType"
                    value={type}
                    checked={tripType === type}
                    onChange={(event) => {
                      const nextType = event.target.value
                      setTripType(nextType)
                      if (nextType === '自分で入力') {
                        setCustomNights((current) => current || '2')
                        setCustomDays((current) => current || '3')
                      }
                    }}
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
            {tripType === '自分で入力' && (
              <div className="custom-trip-duration" aria-label="自分で入力する旅行日程">
                <label>
                  <span>何泊</span>
                  <input
                    type="number"
                    min="0"
                    max="7"
                    inputMode="numeric"
                    value={customNights}
                    onChange={(event) => {
                      const nextNights = clampTripNights(event.target.value)
                      setCustomNights(String(nextNights))
                      setCustomDays(String(nextNights + 1))
                    }}
                  />
                </label>
                <label>
                  <span>何日</span>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    inputMode="numeric"
                    value={customDays}
                    onChange={(event) => setCustomDays(String(Math.min(8, Math.max(1, Number.parseInt(event.target.value, 10) || 1))))}
                    onBlur={() => setCustomDays(String(clampTripNights(customNights) + 1))}
                  />
                </label>
                <p>{tripSchedule.label}として抽選します。最大7泊8日まで入力できます。</p>
                {tripSchedule.dayInputWasAdjusted && <p className="duration-warning">日数は「何泊＋1日」に合わせて扱います。</p>}
              </div>
            )}
          </fieldset>

          <fieldset className="field-group">
            <legend>旅行予定季節</legend>
            <div className="season-options">
              {seasonOptions.map((season) => (
                <label key={season} className={travelSeason === season ? 'selected' : ''}>
                  <input
                    type="radio"
                    name="travelSeason"
                    value={season}
                    checked={travelSeason === season}
                    onChange={(event) => setTravelSeason(event.target.value)}
                  />
                  <span>{season}</span>
                </label>
              ))}
            </div>
            {travelSeason === '今の季節' && (
              <p className="season-current-note">現在は「{getCurrentSeason()}」として抽選します。</p>
            )}
          </fieldset>

          <fieldset className="field-group movement-range-field">
            <legend>移動範囲</legend>
            <div className="movement-range-options">
              {movementRangeOptions.map((option) => (
                <label key={option.value} className={movementRange === option.value ? 'selected' : ''}>
                  <input
                    type="radio"
                    name="movementRange"
                    value={option.value}
                    checked={movementRange === option.value}
                    onChange={(event) => setMovementRange(event.target.value)}
                  />
                  <span>{option.label}</span>
                  {option.description && <small>{option.description}</small>}
                </label>
              ))}
            </div>
            <p className="movement-range-note">
              移動範囲は行きやすさの目安です。正確な移動時間は旅先決定後に表示されます。
            </p>
          </fieldset>

          <fieldset className="field-group">
            <legend>
              同行者・旅のスタイル
              <span className="optional-label">複数選択可</span>
            </legend>
            <p className="field-help">誰と行く旅かを選んでください</p>
            <div className="filter-options">
              {filterOptions.map((filter) => {
                const isSelected = selectedFilters.includes(filter)

                return (
                  <label key={filter} className={isSelected ? 'selected' : ''}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleFilter(filter)}
                    />
                    <span className="filter-check" aria-hidden="true">✓</span>
                    <span>{filter}</span>
                  </label>
                )
              })}
            </div>
          </fieldset>

          <fieldset className="field-group travel-purpose-field">
            <legend>
              旅の目的
              <span className="optional-label">複数選択可</span>
            </legend>
            <p className="field-help">旅先で楽しみたいことを選んでください</p>
            <div className="filter-options purpose-options">
              {travelPurposeOptions.map((purpose) => {
                const isSelected = selectedTravelPurposes.includes(purpose)

                return (
                  <label key={purpose} className={isSelected ? 'selected' : ''}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleTravelPurpose(purpose)}
                    />
                    <span className="filter-check" aria-hidden="true">✓</span>
                    <span>{purpose}</span>
                  </label>
                )
              })}
            </div>
          </fieldset>

          <p className="decide-note">思いがけない場所へ、出かけよう。</p>
          <button type="submit" className="decide-button" disabled={travelInfo.status === 'loading'}>
            <span>{travelInfo.status === 'loading' ? '移動情報を取得中...' : '旅先を決める'}</span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m5 12 14-7-4 14-3-6-7-1Z" />
            </svg>
          </button>
        </form>
          </>
        )}

        {currentPage === 'result' && (
          <header className="developer-page-header result-page-header">
            <button type="button" onClick={() => switchPage('main')}><span aria-hidden="true">←</span>条件を変えてもう一度探す</button>
            <div className="developer-page-icon result-page-icon" aria-hidden="true">✦</div>
            <p>{selectionMeta?.source === 'destination-list' ? 'DESTINATION DETAIL' : 'DRAW RESULT'}</p>
            <h1 id="result-page-title">{selectionMeta?.source === 'destination-list' ? '旅行先一覧から表示中' : '抽選結果'}</h1>
            <span>選ばれた旅先の理由・プラン・行きやすさをまとめて確認できます。</span>
            <div className="result-page-actions">
              {selectionMeta?.source !== 'destination-list' && (
                <button type="button" className="result-redraw-button" onClick={chooseDestination} disabled={travelInfo.status === 'loading'}>
                  {travelInfo.status === 'loading' ? '移動情報を取得中...' : 'もう一度旅先を決める'}
                </button>
              )}
              <button type="button" className="result-list-button" onClick={() => switchPage('destinations')}>旅行先一覧を見る</button>
            </div>
          </header>
        )}

        {currentPage === 'result' && destination && (
          <div className="result-area" aria-live="polite">
            <section className="result-card result-proposal-hero" aria-label="旅先の提案">
              <SafeImage
                key={`${destination.id}-hero`}
                destination={destination}
                imageType="hero"
                className="result-hero-image"
                alt={`${destination.city}の観光イメージ`}
                loading="eager"
                showCredit
                onLoadFailure={(fallbackType) => reportImageFailure(destination.id, 'hero', fallbackType)}
              />
              {selectionMeta?.source === 'destination-list' && (
                <div className="result-source-row">
                  <p className="result-source-label">旅行先一覧から表示中</p>
                  <button type="button" onClick={backToDestinationList}>旅行先一覧に戻る</button>
                </div>
              )}
              <div className="result-hero-copy">
                <p className="result-label">{selectionMeta?.source === 'destination-list' ? '旅行先一覧から表示中' : '今回の旅先は'}</p>
                <h2 className="result-city">
                  <span>{destination.prefecture}</span>
                  {destination.city}
                </h2>
                <div className="result-hero-meta">
                  <span>運命度 {destiny.score}%</span>
                  <span>最寄り目安：{destination.nearestStationLabel}</span>
                </div>
                <p className="result-recommendation">{tripProposalText}</p>
                {selectionMeta?.movementRangeRelaxed && (
                  <p className="range-relaxation-note">
                    指定した移動範囲の候補が少なかったため、少し範囲を広げて提案しています。
                  </p>
                )}
              </div>
              <button
                type="button"
                className={`favorite-button ${favoriteCities.includes(destination.city) ? 'registered' : ''}`}
                aria-pressed={favoriteCities.includes(destination.city)}
                onClick={() => toggleFavorite(destination.city)}
              >
                <span aria-hidden="true">♡</span>
                {favoriteCities.includes(destination.city) ? 'お気に入り登録済み' : 'お気に入り登録'}
              </button>
              <button
                type="button"
                className={`favorite-button compare-detail-button ${compareCities.includes(destination.city) ? 'registered' : ''}`}
                aria-pressed={compareCities.includes(destination.city)}
                onClick={() => toggleComparison(destination.city)}
              >
                <span aria-hidden="true">⇄</span>
                {compareCities.includes(destination.city) ? '比較中 / 外す' : '比較に追加'}
              </button>
            </section>

            <section className="destiny-card" aria-labelledby="destiny-title">
              <div
                className="destiny-score"
                style={{ '--destiny-score': `${destiny.score * 3.6}deg` }}
                aria-label={`運命度${destiny.score}パーセント`}
              >
                <div>
                  <strong>{destiny.score}</strong>
                  <span>%</span>
                </div>
              </div>
              <div className="destiny-content">
                <p>DESTINY MATCH</p>
                <h2 id="destiny-title">運命度</h2>
                <blockquote>「{destiny.comment}」</blockquote>
                <p className="destiny-explanation">同行者・旅の目的・旅行日程・季節との相性から算出しています。</p>
                <div className="destiny-factors" aria-label="運命度の算出要素">
                  <span>スタイル一致 <b>{destiny.matchingCount}件</b></span>
                  <span>旅行日程 <b>{currentTripSchedule.label}</b></span>
                  <span>タグ <b>{destination.tags.length}個</b></span>
                </div>
              </div>
            </section>

            <section className="recommendation-card" aria-labelledby="recommendation-title">
              <div className="recommendation-heading">
                <span aria-hidden="true">✦</span>
                <div>
                  <p>WHY IT FITS</p>
                  <h2 id="recommendation-title">この旅先が合いそうな理由</h2>
                </div>
              </div>

              <div className="reason-list">
                <div className="reason-item">
                  <p className="reason-label">同行者・旅のスタイルとの相性</p>
                  <div className="reason-tags">
                    {(planContext.selectedFilters.length > 0
                      ? planContext.selectedFilters
                      : destination.tags.slice(0, 3)
                    ).map((tag) => (
                      <span key={tag}><b aria-hidden="true">✓</b>{tag}</span>
                    ))}
                  </div>
                  {planContext.selectedFilters.length === 0 && (
                    <p className="no-filter-note">同行者の指定がないため、この旅先の代表的な魅力を表示しています。</p>
                  )}
                  {currentStyleMatch.summary && <p className="no-filter-note">{currentStyleMatch.summary}</p>}
                </div>

                <div className="reason-item">
                  <p className="reason-label">旅行日程との相性</p>
                  <p><strong>{currentTripSchedule.label}</strong> — {tripCompatibility[currentTripSchedule.compatibilityKey]}</p>
                </div>

                <div className="reason-item">
                  <p className="reason-label">季節との相性</p>
                  <p><strong>{seasonCompatibility.season}</strong> — {seasonCompatibility.description}</p>
                </div>

                <div className="reason-item">
                  <p className="reason-label">旅先の特徴</p>
                  <p>{destination.recommendation}</p>
                </div>
              </div>

              <p className="reason-summary">
                {destination.reason}
                {tripCompatibility[currentTripSchedule.compatibilityKey]}
              </p>
            </section>

            {tripEnjoymentItems.length > 0 && (
              <section className="enjoyment-card" aria-labelledby="enjoyment-title">
                <div>
                  <p>WHAT TO ENJOY</p>
                  <h2 id="enjoyment-title">ここで楽しみたいこと</h2>
                </div>
                <div className="enjoyment-chips">
                  {tripEnjoymentItems.map((item) => <span key={item}>{item}</span>)}
                </div>
                {(planContext.selectedTravelPurposes ?? []).length > 0 && (
                  <div className="purpose-match-box">
                    <p>今回選んだ旅の目的：{planContext.selectedTravelPurposes.join('・')}</p>
                    {currentPurposeMatch.summary && <span>{currentPurposeMatch.summary}</span>}
                  </div>
                )}
              </section>
            )}

            {journeyImages.length > 0 && (
            <section className="journey-gallery-card" aria-labelledby="journey-gallery-title">
              <div className="journey-gallery-heading">
                <p>TRIP INSPIRATION</p>
                <h2 id="journey-gallery-title">旅のイメージ</h2>
              </div>
              <div className="journey-gallery" role="list">
                {journeyImages.map((image) => (
                  <article className="journey-image-card" role="listitem" key={`${destination.id}-${image.key}`}>
                    <SafeImage
                      imageType={image.key}
                      src={image.image}
                      alt={image.alt}
                      className="journey-image"
                      showCredit
                      onLoadFailure={(fallbackType) => reportImageFailure(destination.id, image.key, fallbackType)}
                    />
                    <span>{image.label}</span>
                  </article>
                ))}
              </div>
            </section>
            )}

            <section className="result-detail-card" aria-labelledby="result-detail-title">
              <div>
                <p>DEEP DIVE</p>
                <h2 id="result-detail-title">気になるところを深掘り</h2>
                <span>必要な情報だけ開けるように、結果画面を短く整理しています。</span>
              </div>
              <div className="result-detail-tabs" role="tablist" aria-label="結果画面の詳細表示">
                <button type="button" className={resultDetailView === 'overview' ? 'active' : ''} onClick={() => setResultDetailView('overview')} aria-pressed={resultDetailView === 'overview'}>
                  概要
                </button>
                <button type="button" className={resultDetailView === 'food' ? 'active' : ''} onClick={() => setResultDetailView('food')} disabled={localFoodItems.length === 0} aria-pressed={resultDetailView === 'food'}>
                  グルメ
                </button>
                <button type="button" className={resultDetailView === 'spots' ? 'active' : ''} onClick={() => setResultDetailView('spots')} disabled={featuredTouristSpots.length === 0} aria-pressed={resultDetailView === 'spots'}>
                  スポット
                </button>
                <button type="button" className={resultDetailView === 'course' ? 'active' : ''} onClick={() => setResultDetailView('course')} disabled={concreteStayIdeas.length === 0} aria-pressed={resultDetailView === 'course'}>
                  モデルコース
                </button>
                <button type="button" className={resultDetailView === 'access' ? 'active' : ''} onClick={() => setResultDetailView('access')} aria-pressed={resultDetailView === 'access'}>
                  移動
                </button>
              </div>
            </section>

            {resultDetailView === 'food' && localFoodItems.length > 0 && (
              <section className={`local-food-card ${foodImageIsFeatured ? 'featured-food-image' : 'compact-food-image'}`} aria-labelledby="local-food-title">
                <div className="local-food-heading">
                  <span aria-hidden="true">🍴</span>
                  <div>
                    <p>LOCAL FOOD</p>
                    <h2 id="local-food-title">ご当地グルメ</h2>
                  </div>
                </div>
                <div className="local-food-content">
                  <div className="local-food-text">
                    {foodThemeText && (
                      <p className="local-food-theme">この旅先で食べたいもの：{foodThemeText}</p>
                    )}
                    <div className="local-food-chips" aria-label={`${destination.city}で食べたいご当地グルメ`}>
                      {localFoodItems.map((food) => <span key={food}>{food}</span>)}
                    </div>
                    {localFoodDetails.length > 0 && (
                      <ul className="local-food-details">
                        {localFoodDetails.map((food) => (
                          <li key={food.name}>
                            <strong>{food.name}</strong>
                            <span>{food.type}</span>
                            <p>{food.description}</p>
                            {(food.bestTiming?.length > 0 || food.bestAreaHints?.length > 0) && (
                              <div className="local-food-meta">
                                {food.bestTiming?.length > 0 && <small>{'\u5165\u308c\u3084\u3059\u3044\u30bf\u30a4\u30df\u30f3\u30b0: '}{food.bestTiming.join('\u30fb')}</small>}
                                {food.bestAreaHints?.length > 0 && <small>{'\u5408\u308f\u305b\u3084\u3059\u3044\u30a8\u30ea\u30a2: '}{food.bestAreaHints.join('\u30fb')}</small>}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {isValidImageUrl(destination.foodImage) && (
                    <div className="local-food-image-wrap">
                      <SafeImage
                        destination={destination}
                        imageType="food"
                        alt={`${destination.city}のご当地グルメイメージ`}
                        className="local-food-image"
                        showCredit={foodImageIsFeatured}
                        onLoadFailure={(fallbackType) => reportImageFailure(destination.id, 'food', fallbackType)}
                      />
                    </div>
                  )}
                </div>
              </section>
            )}

            

            {resultDetailView === 'spots' && featuredTouristSpots.length > 0 && (
              <section className="tourist-spots-card" aria-labelledby="tourist-spots-title">
                <div className="tourist-spots-heading">
                  <span aria-hidden="true">📍</span>
                  <div>
                    <p>SPOTS</p>
                    <h2 id="tourist-spots-title">ここで行きたいスポット</h2>
                  </div>
                </div>
                <div className="tourist-spots-grid">
                  {featuredTouristSpots.map((spot) => (
                    <article key={spot.name} className="tourist-spot-item">
                      <div>
                        <strong>{spot.name}</strong>
                        <span>{spot.type}</span>
                      </div>
                      <p>{spot.description}</p>
                      <dl>
                        <div><dt>目安</dt><dd>{spot.stayTime}</dd></div>
                        <div><dt>相性</dt><dd>{getSpotPurposeLabel(spot, planContext.selectedTravelPurposes)}</dd></div>
                      </dl>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {resultDetailView === 'course' && concreteStayIdeas.length > 0 && (
              <section className="stay-ideas-card" aria-labelledby="stay-ideas-title">
                <div>
                  <p>HOW TO SPEND</p>
                  <h2 id="stay-ideas-title">ざっくりモデルコース</h2>
                </div>
                <ol>
                  {concreteStayIdeas.map((idea) => <li key={idea}>{idea}</li>)}
                </ol>
              </section>
            )}
{planContext.hasMultiDestinationSuggestion && planContext.tripSuggestions?.length > 0 && (
              <section className="multi-destination-card" aria-labelledby="multi-destination-title">
                <div>
                  <p>EXTENDED TRIP</p>
                  <h2 id="multi-destination-title">長めの旅行なら、周辺まで広げられます</h2>
                </div>
                <p className="multi-destination-lead">{currentTripSchedule.label}なら、{destination.city}を中心に{planContext.tripSuggestions.map((item) => item.destination?.city ?? item.city).slice(0, 3).join('、')}を組み合わせると、{planContext.selectedTravelPurposes.length > 0 ? planContext.selectedTravelPurposes.slice(0, 2).join('・') : '街歩きやご当地グルメ'}の時間を分けて作りやすくなります。</p>
                <dl>
                  <div><dt>メイン</dt><dd>{destination.prefecture} {destination.city}</dd></div>
                  <div><dt>一緒に楽しめそうな候補</dt><dd>{planContext.tripSuggestions.map((item) => `${item.destination?.prefecture ?? item.prefecture} ${item.destination?.city ?? item.city}`).join('、')}</dd></div>
                </dl>
                <ul>
                  {planContext.tripSuggestions.map((item) => (
                    <li key={`${item.destination?.id ?? item.city}-suggestion`}>
                      <strong>{item.destination?.city ?? item.city}</strong>
                      <span>{item.reason}</span>
                      <small>{(item.sharedTags ?? []).length > 0 ? '合う目的：' + item.sharedTags.slice(0, 2).join('・') : planContext.selectedTravelPurposes.length > 0 ? '合う目的：' + planContext.selectedTravelPurposes.slice(0, 2).join('・') : '周辺散策向き'}</small>
                    </li>
                  ))}
                </ul>
                {longTripPacingItems.length > 0 && (
                  <ol className="long-trip-pacing">
                    {longTripPacingItems.map((item) => <li key={item}>{item}</li>)}
                  </ol>
                )}
                <p>交通手段比較はメイン旅先を基準にしています。追加候補の移動時間は目安です。詳しい移動はGoogle Maps等で確認してください。</p>
              </section>
            )}
            <section className="season-compatibility-card" aria-labelledby="season-compatibility-title">
              <div>
                <p>SEASON HIGHLIGHT</p>
                <h2 id="season-compatibility-title">この季節に行くなら</h2>
              </div>
              <strong aria-label={`${seasonCompatibility.stars}つ星`}>{seasonCompatibility.starsLabel}</strong>
              <p>{seasonCompatibility.description}</p>
              <span>ベストシーズン：{destination.bestSeasons.join('・')}</span>
            </section>

            {(resultDetailView === 'course' || resultDetailView === 'access') && (
            <section className="detail-plan" aria-labelledby="detail-plan-title">
              <div className="detail-heading">
                <span className="detail-heading-icon" aria-hidden="true">✦</span>
                <div>
                  <p>TRIP REALITY</p>
                  <h2 id="detail-plan-title">行き方と旅の具体プラン</h2>
                </div>
              </div>

              <p className="plan-route-title">
                {planContext.departure}から{destination.city}への
                <strong>{currentTripSchedule.label}</strong>旅行プラン
              </p>

              {resultDetailView === 'course' && (
              <section className={`premium-guide-card ${isPremiumUser ? 'active' : ''}`} aria-labelledby="premium-guide-title">
                <div className="premium-guide-heading">
                  <span aria-hidden="true">✦</span>
                  <div>
                    <p>PREMIUM AI PLAN</p>
                    <h3 id="premium-guide-title">AIプラン生成はプレミアム機能です</h3>
                  </div>
                  {isPremiumUser && <b>有効</b>}
                </div>
                <p className="premium-guide-description">{'\u8a73\u3057\u3044\u56de\u308a\u65b9\u3092\u898b\u305f\u3044\u5834\u5408\u306f\u3001AI\u30d7\u30e9\u30f3\u3067\u65e5\u7a0b\u5225\u306b\u6574\u7406\u3067\u304d\u307e\u3059\u3002'}</p>
                <ul>
                  <li>AIが日程別プランを作成</li>
                  <li>食事・カフェ案を提案</li>
                  <li>移動の注意点を整理</li>
                  <li>旅行を楽しむコツを提案</li>
                </ul>
              </section>
              )}

              {resultDetailView === 'course' && (
              <>
              <button type="button" className={`ai-plan-button ${isPremiumUser ? 'premium-active' : 'premium-locked'}`} onClick={generateAiPlan} disabled={aiPlanStatus === 'loading'}>
                <span aria-hidden="true">✦</span>
                {aiPlanStatus === 'loading' ? 'AIプランを生成中...' : 'プレミアムでAIプランを作成'}
              </button>
              {aiPlanNotice && <p className="ai-plan-key-notice" role="status">{aiPlanNotice}</p>}
              {aiPlanStatus === 'loading' && (
                <div className="ai-plan-loading" role="status"><span aria-hidden="true" />AIプランを生成中...</div>
              )}

              {aiPlanStatus === 'success' && aiPlanResult && (
                <section className="ai-plan-card" aria-labelledby="ai-plan-title">
                  <div className="ai-plan-heading">
                    <span aria-hidden="true">AI</span>
                    <div><p>PERSONALIZED TRIP</p><h3 id="ai-plan-title">AIプラン案</h3></div>
                    <b>{OPENAI_PLAN_MODEL}</b>
                  </div>
                  <div className="ai-generated-content">{aiPlanResult}</div>
                  <dl>
                    <div><dt>出発地</dt><dd>{planContext.departure}</dd></div>
                    <div><dt>旅先</dt><dd>{destination.prefecture} {destination.city}</dd></div>
                    <div><dt>旅行日程</dt><dd>{currentTripSchedule.label}</dd></div>
                    <div><dt>季節</dt><dd>{planContext.travelSeason === '今の季節' ? `今の季節（${getCurrentSeason()}）` : planContext.travelSeason}</dd></div>
                    <div><dt>同行者・旅のスタイル</dt><dd>{planContext.selectedFilters.length > 0 ? planContext.selectedFilters.join('、') : '指定なし'}</dd></div>
                    <div><dt>旅の目的</dt><dd>{planContext.selectedTravelPurposes.length > 0 ? planContext.selectedTravelPurposes.join('、') : '指定なし'}</dd></div>
                  </dl>
                </section>
              )}

              {currentTripPlans.length > 0 && (
              <details className="plan-card schedule-card collapsible-plan-card">
                <summary>
                  <span aria-hidden="true">▦</span>
                  <b>詳細プランを見る</b>
                  <small>{currentTripSchedule.label}の流れを確認できます</small>
                </summary>
                {currentTripPlans.map((dayPlan) => (
                  <div className="schedule-day" key={dayPlan.day}>
                    <h4>{dayPlan.day}</h4>
                    <ol>
                      {dayPlan.items.map((item) => {
                        const [time, ...activity] = item.split(' ')
                        return (
                          <li key={item}>
                            <time>{time}</time>
                            <span>{activity.join(' ')}</span>
                          </li>
                        )
                      })}
                    </ol>
                  </div>
                ))}
              </details>
              )}
              </>
              )}

              {resultDetailView === 'access' && (
              <div className="plan-card travel-card">
                  <h3><span aria-hidden="true">⌁</span>交通手段比較</h3>
                  <p className="transport-introduction">車・電車・飛行機で、行きやすさをざっくり比較できます。</p>
                  <p className="travel-destination">目的地：{routeDestinationLabel}</p>
                  {travelInfo.status === 'loading' && (
                    <div className="travel-state travel-loading" role="status">
                      <span className="travel-spinner" aria-hidden="true" />
                      <div>
                        <strong>移動情報を取得中...</strong>
                        <p>車と公共交通機関の経路を確認しています。</p>
                      </div>
                    </div>
                  )}
                  {visibleTransportEvaluations.length > 0 ? (
                  <div className="transport-comparison-list">
                      {visibleTransportEvaluations.map((item) => (
                        <article
                          className={`transport-comparison-item ${item.isReference ? 'reference' : ''} ${bestTransportEvaluation?.mode === item.mode ? 'best' : ''}`}
                          key={item.mode}
                        >
                          <header>
                            <strong>{item.mode}</strong>
                            <span aria-label={item.feasibility ? `${item.feasibility.stars}つ星` : item.mode === '電車' ? 'Google Mapsで確認' : '未評価'}>
                              {item.feasibility?.starsLabel ?? (item.mode === '電車' ? 'Google Mapsで確認' : '未評価')}
                            </span>
                          </header>
                          {item.mode === '車' && (
                            travelInfo.car ? (
                              <>
                                <dl>
                                  <div><dt>距離</dt><dd>{travelInfo.car.distance ?? '取得できませんでした'}</dd></div>
                                  <div><dt>目安時間</dt><dd>{travelInfo.car.duration}</dd></div>
                                  <div><dt>料金目安</dt><dd>{formatEstimatedYen(item.estimatedCost) ?? '距離取得後に概算'}</dd></div>
                                  <div><dt>距離・時間</dt><dd>Google Maps API</dd></div>
                                  <div><dt>料金</dt><dd>概算</dd></div>
                                </dl>
                                <p className={`transport-comment ${travelInfo.car.durationMinutes > 480 ? 'strong-warning' : ''}`}>
                                  車で{travelInfo.car.duration}のため、{getCarTravelComment(travelInfo.car.durationMinutes)}
                                </p>
                              </>
                            ) : <p>車の経路が見つかりませんでした</p>
                          )}
                          {item.mode === '電車' && (
                            <div className="transit-fallback train-estimate">
                              <dl>
                                <div><dt>目安時間</dt><dd>{item.basis?.duration ?? '距離取得後に概算'}</dd></div>
                                <div><dt>想定列車種別</dt><dd>{item.basis?.trainType ?? '距離取得後に判定'}</dd></div>
                                <div><dt>現地アクセス</dt><dd>{item.basis?.stationAccessNote ?? destination.stationAccessNote ?? '駅周辺'}</dd></div>
                                <div><dt>データ種別</dt><dd>距離ベースの時間概算</dd></div>
                                <div><dt>検索条件</dt><dd>{transitFallback?.searchCondition ?? '駅候補を特定できませんでした'}</dd></div>
                              </dl>
                              <p className="transport-comment">停車・乗換・駅までの移動余裕を含む、旅行アプリ用の平均速度による概算です。</p>
                              {transitFallback?.googleMapsUrl && (
                                <a href={transitFallback.googleMapsUrl} target="_blank" rel="noopener noreferrer">Google Mapsで確認する</a>
                              )}
                            </div>
                          )}
                          {item.mode === '飛行機' && (
                            <>
                              <dl>
                                <div><dt>目安時間</dt><dd>{item.basis?.duration ?? '距離取得後に概算'}</dd></div>
                                <div><dt>料金目安</dt><dd>{getPlaneCostLabel(item.distanceKm)}</dd></div>
                                <div><dt>データ種別</dt><dd>距離帯による概算</dd></div>
                              </dl>
                              <p>航空券・空港アクセス・時期によって大きく変動します。現時点では概算表示です。</p>
                              {bestTransportEvaluation?.mode === '飛行機' && (
                                <p className="transport-comment recommended-comment">距離が長いため、飛行機が最も現実的な移動手段です。航空券代や空港アクセスで費用は変動します。</p>
                              )}
                            </>
                          )}
                          <p className="transport-reliability">
                            信頼度：{item.mode === '車'
                              ? '距離・時間：高精度 / 料金：概算'
                              : item.mode === '電車'
                                ? '時間：概算 / 正確な経路・料金はGoogle Maps'
                                : '概算'}
                          </p>
                          {bestTransportEvaluation?.mode === item.mode && <b>おすすめ</b>}
                          {bestTransportEvaluation?.mode === item.mode && (
                            <div className="transport-recommendation-reason">
                              <strong>おすすめ理由</strong>
                              <p>{bestTransportReason}</p>
                            </div>
                          )}
                        </article>
                      ))}
                  </div>
                  ) : (
                    <div className="transport-empty-state">
                      <strong>移動時間を表示できませんでした</strong>
                      <p>出発地または目的地の指定が広すぎる可能性があります。詳しい移動はGoogle Mapsで確認してください。</p>
                      <a href={drivingMapsUrl} target="_blank" rel="noopener noreferrer">Google Mapsで確認する</a>
                    </div>
                  )}
                  {travelInfo.status === 'unconfigured' && (
                    <div className="travel-state travel-unconfigured">
                      <strong>移動情報を取得できませんでした。</strong>
                      <p>しばらくしてから再度お試しください。</p>
                    </div>
                  )}
                  {travelInfo.status === 'error' && (
                    <div className="travel-state travel-error" role="alert">
                      <strong>移動情報を取得できませんでした。</strong>
                      <p>しばらくしてから再度お試しください。</p>
                    </div>
                  )}
                  {travelInfo.status === 'api-error' && (
                    <div className="travel-state travel-error" role="alert">
                      <strong>移動情報を取得できませんでした。</strong>
                      <p>しばらくしてから再度お試しください。</p>
                    </div>
                  )}
                  <button className="calculation-method-button" type="button" onClick={() => switchPage('calculation')}>
                    計算方法の内容はこちら <span aria-hidden="true">→</span>
                  </button>
              </div>
              )}

            </section>

            )}

            <nav className="result-bottom-actions" aria-label="抽選結果画面の操作">
              <button type="button" onClick={() => switchPage('main')}>条件を変えて探す</button>
              {selectionMeta?.source !== 'destination-list' && (
                <button type="button" onClick={chooseDestination} disabled={travelInfo.status === 'loading'}>
                  {travelInfo.status === 'loading' ? '移動情報を取得中...' : 'もう一度旅先を決める'}
                </button>
              )}
              <button type="button" onClick={() => switchPage('destinations')}>旅行先一覧を見る</button>
            </nav>
          </div>
        )}

        {currentPage === 'main' && (
          <>
        {noMatchMessage && (
          <div className="no-match" role="alert">
            <span aria-hidden="true">!</span>
            <p>{noMatchMessage}</p>
          </div>
        )}

        <nav className="favorites-entry-card" aria-label="お気に入りページへの移動">
          <div>
            <span aria-hidden="true">♥</span>
            <p>お気に入り <b>{favoriteDestinations.length}件</b></p>
            {compareCities.length > 0 && <small>比較中：{compareCities.length}件</small>}
          </div>
          <button type="button" onClick={() => switchPage('favorites')}>一覧を見る <span aria-hidden="true">→</span></button>
        </nav>

        <nav className="favorites-entry-card history-entry-card" aria-label="抽選履歴ページへの移動">
          <div>
            <span aria-hidden="true">↶</span>
            <p>抽選履歴 <b>{drawHistory.length}件</b></p>
            <small>最大{MAX_HISTORY_ITEMS}件まで保存</small>
          </div>
          <button type="button" onClick={() => switchPage('history')}>一覧を見る <span aria-hidden="true">→</span></button>
        </nav>

        <nav className="favorites-entry-card destination-list-entry-card" aria-label="旅行先一覧ページへの移動">
          <div>
            <span aria-hidden="true">□</span>
            <p>旅行先一覧 <b>{destinations.length}件</b></p>
            <small>写真と条件から探せます</small>
          </div>
          <button type="button" onClick={() => switchPage('destinations')}>旅行先一覧を見る <span aria-hidden="true">→</span></button>
        </nav>

        <div className="beta-version-badge" aria-label={`DROPTRIP ${APP_VERSION}`}>
          <span>DROPTRIP β</span>
          <small>{APP_VERSION}</small>
        </div>
        <aside className="beta-test-guide-card" aria-label="βテスト中の案内">
          <strong>βテスト中です</strong>
          <p>旅先提案・移動時間・画像・グルメ情報は改善中です。使っていて気になった点があればメモしてください。</p>
          <div>
            <span>提案は自然？</span>
            <span>スマホで見やすい？</span>
            <span>交通比較は分かりやすい？</span>
          </div>
        </aside>
        <p className="footer-note">思いがけない場所へ、出かけよう。</p>
          </>
        )}
          </>
        ) : currentPage === 'destinations' ? (
          <>
            <header className="developer-page-header destinations-page-header">
              <button type="button" onClick={() => switchPage('main')}><span aria-hidden="true">←</span>メイン画面に戻る</button>
              <div className="developer-page-icon destinations-page-icon" aria-hidden="true">□</div>
              <p>DESTINATIONS</p>
              <h1 id="destinations-page-title">旅行先一覧</h1>
              <span>気になる旅先を探して、お気に入りや比較に追加できます。</span>
            </header>

            <section className="destination-browser-card" aria-labelledby="destination-browser-title">
              <div className="favorites-heading">
                <div><p>SEARCH</p><h2 id="destination-browser-title">旅行先を絞り込む</h2></div>
                <span>{destinations.length}件中 {filteredDestinations.length}件を表示中</span>
              </div>
              <p className="destination-browser-description">
                気になる旅先を探して、お気に入りや比較に追加できます。
              </p>

              <button
                type="button"
                className="destination-filter-toggle"
                onClick={() => setDestinationFiltersOpen((current) => !current)}
                aria-expanded={destinationFiltersOpen}
                aria-controls="destination-browser-filters"
              >
                {destinationFiltersOpen ? '絞り込み条件を閉じる' : '絞り込み条件を開く'}
              </button>

              {destinationFiltersOpen && (
              <div className="destination-browser-filters" id="destination-browser-filters">
                <label>
                  <span>キーワード</span>
                  <input
                    type="search"
                    value={destinationSearch}
                    onChange={(event) => setDestinationSearch(event.target.value)}
                    placeholder="例：温泉、京都、海"
                  />
                </label>
                <label>
                  <span>都道府県</span>
                  <select value={destinationPrefectureFilter} onChange={(event) => setDestinationPrefectureFilter(event.target.value)}>
                    <option value="all">すべて</option>
                    {prefectureOptions.map((prefecture) => <option value={prefecture} key={prefecture}>{prefecture}</option>)}
                  </select>
                </label>
                <label>
                  <span>旅先タグ</span>
                  <select value={destinationTagFilter} onChange={(event) => setDestinationTagFilter(event.target.value)}>
                    <option value="all">すべて</option>
                    {destinationTagOptions.map((filter) => <option value={filter} key={filter}>{filter}</option>)}
                  </select>
                </label>
                <label>
                  <span>旅先で楽しみたいこと</span>
                  <select value={destinationPurposeFilter} onChange={(event) => setDestinationPurposeFilter(event.target.value)}>
                    <option value="all">すべて</option>
                    {travelPurposeOptions.map((purpose) => <option value={purpose} key={purpose}>{purpose}</option>)}
                  </select>
                </label>
                <label>
                  <span>旅行日程</span>
                  <select value={destinationTripTypeFilter} onChange={(event) => setDestinationTripTypeFilter(event.target.value)}>
                    <option value="all">すべて</option>
                    {tripTypes.map((type) => <option value={type} key={type}>{type}</option>)}
                  </select>
                </label>
                <label>
                  <span>季節</span>
                  <select value={destinationSeasonFilter} onChange={(event) => setDestinationSeasonFilter(event.target.value)}>
                    <option value="all">すべて</option>
                    {seasonOptions.map((season) => <option value={season} key={season}>{season}</option>)}
                  </select>
                </label>
                <label>
                  <span>移動範囲</span>
                  <select value={destinationRangeFilter} onChange={(event) => setDestinationRangeFilter(event.target.value)}>
                    {movementRangeOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <label className="destination-favorites-only">
                  <input
                    type="checkbox"
                    checked={destinationFavoritesOnly}
                    onChange={(event) => setDestinationFavoritesOnly(event.target.checked)}
                  />
                  <span>お気に入りのみ</span>
                </label>
              </div>
              )}

              <p className="movement-range-note">
                移動範囲は概算で判定しています。正確な移動時間は詳細表示後に取得します。
              </p>
              <div className="destination-filter-summary" aria-live="polite">
                <div className="destination-active-filters">
                  {activeDestinationFilters.length > 0
                    ? activeDestinationFilters.map((filter) => <span key={filter}>{filter}</span>)
                    : <span className="empty">条件指定なし</span>}
                </div>
                <button
                  type="button"
                  className="destination-filter-reset"
                  onClick={resetDestinationFilters}
                  disabled={activeDestinationFilters.length === 0}
                >
                  条件をリセット
                </button>
              </div>
            </section>

            <section className="destination-list-section" aria-label="旅行先一覧">
              {filteredDestinations.length === 0 ? (
                <p className="favorites-empty">条件に合う旅行先が見つかりませんでした。</p>
              ) : (
                <div className="destination-card-grid">
                  {filteredDestinations.map((place) => {
                    const isFavorite = favoriteCities.includes(place.city)
                    const isCompared = compareCities.includes(place.city)
                    return (
                      <article className="destination-browser-item" key={place.id}>
                        <div className="destination-browser-body">
                          <header>
                            <div><p>{place.prefecture}</p><h3>{place.city}</h3></div>
                            <span>{place.bestSeasons.join('・')}</span>
                          </header>
                          <div className="destination-browser-tags">
                            {place.tags.map((tag) => <span key={tag}>{tag}</span>)}
                          </div>
                          <dl>
                            <div><dt>最寄り目安</dt><dd>{place.nearestStationLabel}</dd></div>
                            <div><dt>移動範囲目安</dt><dd>{estimateMovementRange(place, departure, destinationListRangeSettings).label}</dd></div>
                          </dl>
                          <p>{place.recommendText ?? place.recommendation}</p>
                          <div className="destination-browser-actions">
                            <button type="button" onClick={() => toggleFavorite(place.city)}>
                              {isFavorite ? 'お気に入り済み' : 'お気に入り登録'}
                            </button>
                            <button
                              type="button"
                              className={isCompared ? 'selected' : ''}
                              aria-pressed={isCompared}
                              onClick={() => toggleComparison(place.city)}
                            >
                              {isCompared ? (
                                <>
                                  <span>比較中</span>
                                  <small>比較から外す</small>
                                </>
                              ) : '比較に追加'}
                            </button>
                            <button type="button" className="primary" onClick={() => showDestinationFromList(place)}>
                              詳細を見る
                            </button>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
              {comparisonDestinations.length >= 2 && (
                <button type="button" className="compare-open-button" onClick={openComparison}>
                  選択した旅先を比較する <b>{comparisonDestinations.length}件</b><span aria-hidden="true">→</span>
                </button>
              )}
            </section>

            <p className="footer-note">DROPTRIP Destination List</p>
          </>
        ) : currentPage === 'favorites' ? (
          <>
            <header className="developer-page-header favorites-page-header">
              <button type="button" onClick={() => switchPage('main')}><span aria-hidden="true">←</span>メイン画面に戻る</button>
              <div className="developer-page-icon favorites-page-icon" aria-hidden="true">♥</div>
              <p>MY FAVORITES</p>
              <h1 id="favorites-page-title">お気に入り</h1>
              <span>気になる旅先を保存して、あとから季節や条件で比較できます。</span>
            </header>

            <aside className="comparison-guide-card" aria-labelledby="comparison-guide-title">
              <div aria-hidden="true">⇄</div>
              <section>
                <p>COMPARE FAVORITES</p>
                <h2 id="comparison-guide-title">保存した旅先を、ゆっくり比べよう</h2>
                <span>気になる旅先を選んで、予定している季節や同行者・旅のスタイルとの相性を比べられます。</span>
                <b>{favoriteDestinations.length >= 2 ? '2件以上選ぶと比較できます' : '比較するにはお気に入りを2件以上登録してください'}</b>
              </section>
            </aside>

            <section className="favorites-section favorites-page-list" aria-labelledby="favorites-page-list-title">
              <div className="favorites-heading">
                <div><p>SAVED PLACES</p><h2 id="favorites-page-list-title">登録済みの旅先</h2></div>
                <span>{favoriteDestinations.length}件</span>
              </div>
              {favoriteDestinations.length === 0 ? (
                <p className="favorites-empty">まだお気に入りはありません</p>
              ) : (
                <div className="favorites-list">
                  {favoriteDestinations.map((place) => {
                    const latestHistory = drawHistory.find((entry) => entry.city === place.city)
                    return (
                      <article className="favorite-page-card" key={place.city}>
                        <header><div><p>{place.prefecture}</p><h3>{place.city}</h3></div><span aria-hidden="true">♥</span></header>
                        <p className="favorite-recommendation">{place.recommendation}</p>
                        <div className="favorite-tags">{place.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                        <dl>
                          <div><dt>予算目安</dt><dd>1人あたり {place.budgets[tripType]}</dd></div>
                          <div><dt>運命度</dt><dd>{latestHistory ? `${latestHistory.destinyScore}%` : '未評価'}</dd></div>
                          <div><dt>行けそう度</dt><dd>{latestHistory?.feasibilityStars ?? '未取得'}</dd></div>
                        </dl>
                        <div className="favorite-page-actions">
                          <button
                            type="button"
                            className={`favorite-compare-button ${compareCities.includes(place.city) ? 'selected' : ''}`}
                            aria-pressed={compareCities.includes(place.city)}
                            onClick={() => toggleComparison(place.city)}
                          >
                            <span>{compareCities.includes(place.city) ? '比較中' : '比較に追加'}</span>
                            {compareCities.includes(place.city) && <small>比較から外す</small>}
                          </button>
                          <button type="button" className="danger" onClick={() => toggleFavorite(place.city)}>お気に入り削除</button>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
              {comparisonDestinations.length >= 2 && (
                <button type="button" className="compare-open-button" onClick={openComparison}>
                  選択した旅先を比較する <b>{comparisonDestinations.length}件</b><span aria-hidden="true">→</span>
                </button>
              )}
            </section>

            <p className="footer-note">DROPTRIP Favorites</p>
          </>
        ) : currentPage === 'comparison' ? (
          <>
            <header className="developer-page-header comparison-page-header">
              <button type="button" onClick={() => switchPage('favorites')}><span aria-hidden="true">←</span>お気に入りに戻る</button>
              <div className="developer-page-icon comparison-page-icon" aria-hidden="true">⇄</div>
              <p>COMPARE TRIPS</p>
              <h1 id="comparison-page-title">旅先を比較</h1>
              <span>季節と同行者・旅のスタイルを変えて、今の旅行に合う候補を探せます</span>
            </header>

            <section className="comparison-condition-card" aria-labelledby="comparison-condition-title">
              <div className="comparison-condition-heading">
                <p>YOUR CONDITIONS</p><h2 id="comparison-condition-title">比較条件を選び直す</h2>
              </div>
              <fieldset className="comparison-fieldset">
                <legend>旅行予定季節</legend>
                <div className="comparison-season-options">
                  {seasonOptions.map((season) => (
                    <label className={comparisonSeason === season ? 'selected' : ''} key={season}>
                      <input type="radio" name="comparison-season" value={season} checked={comparisonSeason === season} onChange={() => setComparisonSeason(season)} />
                      {season}
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset className="comparison-fieldset">
                <legend>同行者・旅のスタイル</legend>
                <div className="comparison-filter-options">
                  {filterOptions.map((filter) => (
                    <label className={comparisonFilters.includes(filter) ? 'selected' : ''} key={filter}>
                      <input type="checkbox" checked={comparisonFilters.includes(filter)} onChange={() => toggleComparisonFilter(filter)} />
                      <span aria-hidden="true">✓</span>{filter}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="comparison-current-condition">
                <strong>現在の比較条件</strong>
                <span>季節：{comparisonSeason}</span>
                <span>同行者・旅のスタイル：{comparisonFilters.length > 0 ? comparisonFilters.join('、') : '指定なし'}</span>
              </div>
            </section>

            {bestComparison && (
              <aside className="comparison-best-card">
                <span>BEST MATCH</span>
                <strong>今回の条件では「{bestComparison.place.city}」が最も相性の良い候補です。</strong>
                <p>{bestComparison.comment}</p>
              </aside>
            )}

            <section className="comparison-section comparison-page-results" aria-labelledby="comparison-results-title">
              <div className="comparison-heading">
                <div><p>RESULTS</p><h2 id="comparison-results-title">比較結果</h2></div>
                <button type="button" onClick={clearComparison}>選択を解除</button>
              </div>
              <div className="comparison-list">
                {comparisonEvaluations.map(({ place, matchingConditions, placeSeason, placeDestiny, recommendationScore, comment }) => {
                  const latestEvaluation = drawHistory.find((entry) => entry.city === place.city)
                  return (
                    <article className={`comparison-card ${bestComparison?.place.city === place.city ? 'best' : ''}`} key={place.city}>
                      <header><div><p>{place.prefecture}</p><h3>{place.city}</h3></div>{bestComparison?.place.city === place.city && <b>おすすめ</b>}</header>
                      <dl>
                        <div><dt>タグ</dt><dd className="comparison-tags">{place.tags.map((tag) => <span key={tag}>{tag}</span>)}</dd></div>
                        <div><dt>予算目安</dt><dd>1人あたり {place.budgets[tripType]}</dd></div>
                        <div><dt>スタイル一致数</dt><dd>{matchingConditions.length}件{matchingConditions.length > 0 ? `（${matchingConditions.join('、')}）` : ''}</dd></div>
                        <div><dt>運命度</dt><dd>{placeDestiny.score}%</dd></div>
                        <div><dt>おすすめ度</dt><dd>{recommendationScore}pt</dd></div>
                        <div><dt>季節との相性</dt><dd>{placeSeason.starsLabel} {placeSeason.description}</dd></div>
                        <div><dt>比較コメント</dt><dd>{comment}</dd></div>
                        <div><dt>おすすめポイント</dt><dd>{place.highlights}</dd></div>
                        <div><dt>旅行日程との相性</dt><dd>{tripCompatibility[tripType]}</dd></div>
                        <div><dt>最適な移動手段</dt><dd>{latestEvaluation?.bestTransport ?? '未評価'}</dd></div>
                      </dl>
                    </article>
                  )
                })}
              </div>
            </section>
            <p className="footer-note">DROPTRIP Comparison</p>
          </>
        ) : currentPage === 'history' ? (
          <>
            <header className="developer-page-header history-page-header">
              <button type="button" onClick={() => switchPage('main')}>
                <span aria-hidden="true">←</span>
                メイン画面に戻る
              </button>
              <div className="developer-page-icon history-page-icon" aria-hidden="true">↶</div>
              <p>DRAW HISTORY</p>
              <h1 id="history-page-title">抽選履歴一覧</h1>
              <span>過去に出会った旅先を、もう一度確認できます。</span>
            </header>

            <section className="history-section history-page-list" aria-labelledby="history-page-list-title">
              <div className="history-heading">
                <span aria-hidden="true">↶</span>
                <div>
                  <p>ALL RESULTS</p>
                  <h2 id="history-page-list-title">保存済みの抽選結果</h2>
                </div>
                <b>{drawHistory.length} / {MAX_HISTORY_ITEMS}件</b>
              </div>
              {drawHistory.length === 0
                ? <p className="history-empty">まだ抽選履歴はありません</p>
                : (
                  <HistoryItems
                    entries={drawHistory.slice(0, MAX_HISTORY_ITEMS)}
                    favoriteCities={favoriteCities}
                    onShow={showHistoryEntry}
                    onFavorite={addHistoryToFavorites}
                    onDelete={deleteHistoryEntry}
                  />
                )}
            </section>
            <p className="footer-note">DROPTRIP Draw History</p>
          </>
        ) : currentPage === 'calculation' ? (
          <>
            <header className="developer-page-header calculation-page-header">
              <button type="button" onClick={() => switchPage(destination ? 'result' : 'main')}>
                <span aria-hidden="true">←</span>
                {destination ? '結果画面に戻る' : 'メイン画面に戻る'}
              </button>
              <div className="developer-page-icon calculation-page-icon" aria-hidden="true">∑</div>
              <p>HOW WE CALCULATE</p>
              <h1 id="calculation-page-title">計算方法</h1>
              <span>交通手段ごとの時間・料金・信頼度の考え方</span>
            </header>

            <section className="calculation-methods" aria-label="交通手段の計算方法">
              <article className="calculation-method-card">
                <div className="calculation-method-heading"><span aria-hidden="true">🚗</span><h2>車</h2></div>
                <ul>
                  <li>距離・時間はGoogle Maps APIから取得</li>
                  <li>料金は走行距離をもとにした概算</li>
                </ul>
                <div className="calculation-formula">
                  <strong>計算式</strong>
                  <p>ガソリン代 = 距離km × 17円</p>
                  <p>高速代 = 距離km × 25円</p>
                  <p>車料金目安 = ガソリン代 + 高速代</p>
                  <p><b>車料金目安 = 距離km × 42円</b></p>
                </div>
                <div className="calculation-assumptions">
                  <strong>ガソリン代の前提</strong>
                  <p>想定ガソリン価格：170円/L</p>
                  <p>想定燃費：10km/L</p>
                  <p>170円 ÷ 10km = 17円/km</p>
                  <span>レギュラーとハイオク、車種ごとの燃費差を考慮し、アプリ内ではガソリン価格170円/L・燃費10km/Lを目安にしています。</span>
                </div>
                <p className="calculation-note">実際のガソリン代は、地域、油種、車種、燃費、渋滞、山道、エアコン使用などによって変動します。高速料金も高速道路利用有無、ETC割引、駐車場代、寄り道によって変動します。</p>
                <div className="verification-links">
                  <h3>正確に確認する</h3>
                  <p>実際のルートや高速料金は、各サービスで確認してください。</p>
                  <div className="flight-link-list">
                    <a href={drivingMapsUrl} target="_blank" rel="noopener noreferrer">Google Mapsでルート確認</a>
                    <a href="https://www.driveplaza.com/dp/SearchTop" target="_blank" rel="noopener noreferrer">NEXCOで高速料金を確認</a>
                  </div>
                </div>
              </article>

              <article className="calculation-method-card">
                <div className="calculation-method-heading"><span aria-hidden="true">🚆</span><h2>電車</h2></div>
                <p>電車の目安時間は、距離に応じて普通列車・特急・新幹線の利用を想定し、平均速度を切り替えて概算しています。</p>
                <div className="calculation-rules train-calculation-rules">
                  <div><b>100km未満</b><span>普通列車・快速中心、平均50km/h + 30分</span></div>
                  <div><b>100〜300km</b><span>普通列車＋特急想定、平均85km/h + 45分</span></div>
                  <div><b>300〜700km</b><span>特急・新幹線想定、平均160km/h + 60分</span></div>
                  <div><b>700km以上</b><span>新幹線中心、平均200km/h + 90分</span></div>
                </div>
                <div className="calculation-formula">
                  <strong>計算式</strong>
                  <p>電車目安時間 = 距離km ÷ 想定平均速度 + 追加時間</p>
                  <p>営業最高速度ではなく、停車・乗換・駅までの移動余裕を含む旅行アプリ用の概算平均速度です。</p>
                </div>
                <div className="calculation-assumptions">
                  <strong>新幹線・現地アクセス補正</strong>
                  <p>主要新幹線駅同士：平均220km/h + 25分</p>
                  <p>目的地が駅から離れている場合：現地アクセス時間を加算</p>
                  <span>電車の目安時間は、通常の距離帯別概算に加えて、主要新幹線区間では新幹線補正を行います。また、目的地が駅から離れている場合は、現地アクセス時間を加算しています。</span>
                </div>
                <p className="calculation-note">実際の所要時間は、乗換回数、停車駅、列車種別、待ち時間、駅までの移動、運行状況によって変動します。正確な経路・時刻・料金はGoogle Mapsや乗換案内サービスで確認してください。</p>
                <div className="verification-links">
                  <h3>正確に確認する</h3>
                  <p>乗車日時や運行状況を含む最新情報を確認できます。</p>
                  <div className="flight-link-list">
                    <a href={transitMapsUrl} target="_blank" rel="noopener noreferrer">Google Mapsで確認</a>
                    <a href="https://transit.yahoo.co.jp/" target="_blank" rel="noopener noreferrer">Yahoo!乗換案内で確認</a>
                    <a href="https://www.navitime.co.jp/transfer/" target="_blank" rel="noopener noreferrer">NAVITIMEで確認</a>
                  </div>
                </div>
              </article>

              <article className="calculation-method-card plane-calculation-card">
                <div className="calculation-method-heading"><span aria-hidden="true">✈</span><h2>飛行機</h2></div>
                <p>現時点では、車で取得した距離を基準にした距離帯ごとの概算です。</p>
                <div className="calculation-rules">
                  <div><b>500km未満</b><span>基本おすすめしない</span></div>
                  <div><b>500km〜900km</b><span>目安時間 3〜5時間 / 料金目安 20,000円〜45,000円</span></div>
                  <div><b>900km以上</b><span>目安時間 4〜6時間 / 料金目安 30,000円〜70,000円</span></div>
                </div>
                <p className="calculation-note">実際の航空券代は予約時期、航空会社、LCC利用、繁忙期、空港アクセス費、荷物料金によって大きく変動します。</p>

                <div className="flight-comparison verification-links">
                  <h3>正確に確認する・航空券を比較する</h3>
                  <p>正確な航空券価格は、比較サイトで確認してください。</p>
                  <div className="flight-link-list">
                    <a href="https://www.google.com/travel/flights" target="_blank" rel="noopener noreferrer">Google Flightsで確認</a>
                    <a href="https://www.skyscanner.jp/transport/flights/" target="_blank" rel="noopener noreferrer">Skyscannerで確認</a>
                    <a href="https://www.tour.ne.jp/j_air/" target="_blank" rel="noopener noreferrer">トラベルコで確認</a>
                  </div>
                </div>
              </article>
            </section>
            <p className="footer-note">DROPTRIP Calculation Guide</p>
          </>
        ) : (
          <>
        <header className="developer-page-header">
          <button type="button" onClick={() => switchPage('main')}>
            <span aria-hidden="true">←</span>
            メイン画面に戻る
          </button>
          <div className="developer-page-icon" aria-hidden="true">⚙</div>
          <p>DEVELOPER PAGE</p>
          <h1 id="developer-page-title">開発者ページ</h1>
          <span>API設定とアプリの内部状態を管理します</span>
        </header>

        <p className="developer-warning">
          <strong>公開前にAPIキー保護を確認してください。</strong>
          ブラウザ側にOpenAI APIキーを保存した状態で一般公開しないでください。現在のキー設定はローカル開発・検証専用です。
        </p>

        <section className="release-info-card" aria-labelledby="release-info-title">
          <div className="settings-heading">
            <span aria-hidden="true">β</span>
            <div>
              <p>RELEASE</p>
              <h2 id="release-info-title">リリース情報</h2>
            </div>
          </div>
          <dl className="release-info-list">
            <div><dt>バージョン</dt><dd>{APP_VERSION}</dd></div>
            <div><dt>ステージ</dt><dd>{APP_STAGE}</dd></div>
            <div><dt>最終更新メモ</dt><dd>{APP_RELEASE_NOTE}</dd></div>
            <div><dt>デプロイ先</dt><dd>{APP_DEPLOY_TARGET}</dd></div>
            <div><dt>API通信</dt><dd>{APP_API_MODE}</dd></div>
            <div><dt>βテスト対象</dt><dd>{APP_BETA_SCOPE}</dd></div>
          </dl>
        </section>

        <section className="beta-feedback-card" aria-labelledby="beta-feedback-title">
          <div className="settings-heading">
            <span aria-hidden="true">β</span>
            <div>
              <p>BETA TEST</p>
              <h2 id="beta-feedback-title">βテストメモ</h2>
            </div>
          </div>

          <div className="beta-checkpoints" aria-label="βテスト時に確認する観点">
            {betaTestCheckpoints.map((checkpoint) => (
              <span key={checkpoint}>{checkpoint}</span>
            ))}
          </div>

          <form className="beta-feedback-form" onSubmit={addBetaFeedbackNote}>
            <label>
              <span>気になった画面</span>
              <input
                type="text"
                value={betaFeedbackForm.screen}
                onChange={(event) => updateBetaFeedbackForm('screen', event.target.value)}
                placeholder="例：旅行先一覧、比較ページ"
              />
            </label>
            <label>
              <span>重要度</span>
              <select
                value={betaFeedbackForm.priority}
                onChange={(event) => updateBetaFeedbackForm('priority', event.target.value)}
              >
                <option value="低">低</option>
                <option value="中">中</option>
                <option value="高">高</option>
              </select>
            </label>
            <label>
              <span>問題内容</span>
              <textarea
                value={betaFeedbackForm.issue}
                onChange={(event) => updateBetaFeedbackForm('issue', event.target.value)}
                placeholder="違和感、分かりにくかった点、迷った箇所など"
              />
            </label>
            <label>
              <span>改善案</span>
              <textarea
                value={betaFeedbackForm.suggestion}
                onChange={(event) => updateBetaFeedbackForm('suggestion', event.target.value)}
                placeholder="こうすると使いやすそう、というメモ"
              />
            </label>
            {betaFeedbackNotice && <p className="settings-notice">{betaFeedbackNotice}</p>}
            <button type="submit">メモを保存</button>
          </form>

          <div className="beta-feedback-list" aria-label="保存済みβテストメモ">
            <div className="beta-feedback-list-heading">
              <strong>保存済みメモ</strong>
              <span>{betaFeedbackNotes.length}件</span>
            </div>
            {betaFeedbackNotes.length === 0 ? (
              <p className="beta-feedback-empty">まだメモはありません。</p>
            ) : (
              betaFeedbackNotes.map((note) => (
                <article className={`beta-feedback-note priority-${note.priority}`} key={note.id}>
                  <header>
                    <div>
                      <strong>{note.screen}</strong>
                      <span>重要度：{note.priority}</span>
                    </div>
                    <button type="button" onClick={() => deleteBetaFeedbackNote(note.id)}>削除</button>
                  </header>
                  <p>{note.issue}</p>
                  {note.suggestion && <small>改善案：{note.suggestion}</small>}
                </article>
              ))
            )}
          </div>
        </section>

        <section className="settings-card" aria-labelledby="settings-title">
          <div className="settings-heading">
            <span aria-hidden="true">⚙</span>
            <div>
              <p>SETTINGS</p>
              <h2 id="settings-title">設定</h2>
            </div>
          </div>

          <form onSubmit={saveApiKey}>
            <label htmlFor="google-maps-api-key">Google Maps APIキー</label>
            <input
              id="google-maps-api-key"
              type="password"
              value={apiKeyInput}
              onChange={(event) => {
                setApiKeyInput(event.target.value)
                setApiKeyNotice('')
              }}
              placeholder={savedApiKey ? '新しいキーに変更する' : 'APIキーを入力'}
              autoComplete="new-password"
              aria-describedby="api-key-status api-key-help"
            />

            <div className="api-key-status" id="api-key-status" aria-live="polite">
              {apiKeySource === 'environment' && (
                <span className="configured">設定済み（.envを優先して使用）</span>
              )}
              {apiKeySource === 'localStorage' && (
                <span className="configured">設定済み（末尾4文字：{maskedApiKey}）</span>
              )}
              {!apiKeySource && <span>未設定</span>}
            </div>

            <p className="settings-help" id="api-key-help">
              公開版はサーバー側のGOOGLE_MAPS_API_KEYを使い、/api/route-time経由で通信します。
              この入力欄とVITE_GOOGLE_MAPS_API_KEYはlocalhostでの開発フォールバック専用です。キー全文は再表示しません。
            </p>

            {apiKeyNotice && <p className="settings-notice">{apiKeyNotice}</p>}

            <div className="settings-actions">
              <button type="submit" className="save-key-button">保存</button>
              <button
                type="button"
                className="delete-key-button"
                onClick={deleteApiKey}
                disabled={!savedApiKey}
              >
                削除
              </button>
            </div>
          </form>

          <div className="reset-settings">
            <div>
              <strong>入力条件を初期状態に戻す</strong>
              <p>お気に入り・履歴・APIキーは削除されません。</p>
            </div>
            <button type="button" onClick={resetInputConditions}>入力条件をリセット</button>
          </div>
        </section>

        <section className="settings-card openai-settings-card" aria-labelledby="openai-settings-title">
          <div className="settings-heading">
            <span aria-hidden="true">AI</span>
            <div>
              <p>AI SETTINGS</p>
              <h2 id="openai-settings-title">OpenAI APIキー設定</h2>
            </div>
          </div>

          <form onSubmit={saveOpenAiApiKey}>
            <label htmlFor="openai-api-key">OpenAI APIキー</label>
            <input
              id="openai-api-key"
              type="password"
              value={openAiApiKeyInput}
              onChange={(event) => {
                setOpenAiApiKeyInput(event.target.value)
                setOpenAiApiKeyNotice('')
              }}
              placeholder={savedOpenAiApiKey ? '新しいキーに変更する' : 'OpenAI APIキーを入力'}
              autoComplete="new-password"
              aria-describedby="openai-api-key-status openai-api-key-help"
            />

            <div className="api-key-status" id="openai-api-key-status" aria-live="polite">
              {openAiApiKeySource === 'environment' && <span className="configured">設定済み（.envを優先して使用）</span>}
              {openAiApiKeySource === 'localStorage' && <span className="configured">設定済み（末尾4文字：{maskedOpenAiApiKey}）</span>}
              {!openAiApiKeySource && <span>未設定</span>}
            </div>

            <p className="settings-help" id="openai-api-key-help">
              公開版はサーバー側のOPENAI_API_KEYを使い、/api/generate-plan経由で通信します。
              この入力欄とVITE_OPENAI_API_KEYはlocalhostでの開発フォールバック専用です。キー全文は再表示しません。
            </p>
            {openAiApiKeyNotice && <p className="settings-notice">{openAiApiKeyNotice}</p>}

            <div className="settings-actions">
              <button type="submit" className="save-key-button">保存</button>
              <button type="button" className="delete-key-button" onClick={deleteOpenAiApiKey} disabled={!savedOpenAiApiKey}>削除</button>
            </div>
          </form>

          <div className="ai-usage-settings">
            <div>
              <strong>本日のAI生成回数</strong>
              <p>{todayAiPlanUsageCount} / {DAILY_AI_PLAN_LIMIT}回</p>
            </div>
            <button type="button" onClick={resetAiPlanUsage} disabled={todayAiPlanUsageCount === 0}>回数をリセット</button>
          </div>
          <div className="premium-test-settings">
            <div>
              <strong>プレミアム状態を切り替える</strong>
              <p>開発テスト専用。決済機能とは連携していません。</p>
            </div>
            <label className="premium-switch">
              <input type="checkbox" checked={isPremiumUser} onChange={togglePremiumStatus} />
              <span aria-hidden="true" />
              <b>{isPremiumUser ? 'ON' : 'OFF'}</b>
            </label>
          </div>
        </section>

        <section className="quality-check-card" aria-labelledby="quality-check-title">
          <div className="quality-check-heading">
            <span aria-hidden="true">✓</span>
            <div>
              <p>PRE-PUBLISH CHECK</p>
              <h2 id="quality-check-title">品質チェック</h2>
            </div>
          </div>

          <div className="quality-check-summary" aria-label="品質チェック集計">
            <div className="quality-passed"><span>問題なし</span><strong>{destinationQualityReport.passed}件</strong></div>
            <div className={destinationQualityReport.warningCount > 0 ? 'quality-warning' : 'quality-passed'}>
              <span>要確認</span><strong>{destinationQualityReport.warningCount}件</strong>
            </div>
          </div>

          <ul className="quality-global-checks">
            {destinationQualityReport.globalChecks.map((check) => (
              <li className={check.passed ? 'passed' : 'warning'} key={check.label}>
                <span aria-hidden="true">{check.passed ? '✓' : '!'}</span>{check.label}
              </li>
            ))}
          </ul>

          <section className="security-check-section" aria-labelledby="security-check-title">
            <div className="security-check-heading">
              <div aria-hidden="true">⌾</div>
              <div>
                <p>SECURITY</p>
                <h3 id="security-check-title">公開前セキュリティ確認</h3>
              </div>
            </div>
            <ul>
              {publicSecurityChecks.map((check) => (
                <li className={check.passed ? 'passed' : 'action-required'} key={check.label}>
                  <span aria-hidden="true">{check.passed ? '✓' : '!'}</span>
                  <div>
                    <strong>{check.label}</strong>
                    <small>{check.note}</small>
                  </div>
                  <b>{check.passed ? '確認済み' : '公開前に対応'}</b>
                </li>
              ))}
            </ul>
            <dl className="api-protection-status">
              <div><dt>OpenAI通信</dt><dd>{getOpenAiCommunicationModeLabel(openAiCommunicationMode)}</dd></div>
              <div><dt>Google Routes通信</dt><dd>{getGoogleMapsCommunicationModeLabel(travelInfo.routeDiagnostics?.communicationMode ?? travelInfo.communicationMode)}</dd></div>
              <div><dt>メソッド制限</dt><dd className="enabled">有効（POSTのみ）</dd></div>
              <div><dt>入力バリデーション</dt><dd className="enabled">有効</dd></div>
              <div><dt>最大出力制限</dt><dd className="enabled">有効（1,200トークン）</dd></div>
              <div><dt>本番レート制限</dt><dd className="pending">未実装</dd></div>
            </dl>
          </section>

          <div className="quality-image-status" aria-label="旅行先画像の設定状態">
            <div><span>個別画像あり</span><strong>{destinationQualityReport.imageStatus.configured}件</strong></div>
            <div><span>カテゴリ画像使用</span><strong>{destinationQualityReport.imageStatus.tagFallback + imageFailures.filter((failure) => failure.fallbackType === 'tag').length}件</strong></div>
            <div><span>汎用画像使用</span><strong>{destinationQualityReport.imageStatus.genericFallback + imageFailures.filter((failure) => failure.fallbackType === 'generic').length}件</strong></div>
            <div><span>外部URL使用</span><strong>{destinationQualityReport.imageStatus.external}件</strong></div>
            <div><span>画像URL不正</span><strong>{destinationQualityReport.imageStatus.invalid}件</strong></div>
            <div><span>イラスト画像使用中</span><strong>{destinationQualityReport.imageStatus.illustration}件</strong></div>
            <div><span>仮画像（temporary）</span><strong>{destinationQualityReport.imageStatus.temporary}件</strong></div>
            <div><span>クレジット未設定</span><strong>{destinationQualityReport.imageStatus.creditMissing}件</strong></div>
            <div><span>ライセンス未確認</span><strong>{destinationQualityReport.imageStatus.licenseUnconfirmed}件</strong></div>
            <div><span>読み込み失敗</span><strong>{imageFailures.length}件</strong></div>
            <div><span>要確認</span><strong>{destinationQualityReport.imageStatus.needsReview}件</strong></div>
          </div>

          <div className="quality-image-status" aria-label="旅行先メタデータの整備状態">
            <div><span>旅行先件数</span><strong>{destinationQualityReport.metadataStatus.destinationTotal}件</strong></div>
            <div><span>region未設定</span><strong>{destinationQualityReport.metadataStatus.missingRegion.length}件</strong></div>
            <div><span>localFood未設定</span><strong>{destinationQualityReport.metadataStatus.missingLocalFood.length}件</strong></div>
            <div><span>localFoodDetails未設定</span><strong>{destinationQualityReport.metadataStatus.missingLocalFoodDetails.length}件</strong></div>
            <div><span>観光スポット未設定</span><strong>{destinationQualityReport.metadataStatus.missingTouristSpots.length}件</strong></div>
            <div><span>観光スポット3件未満</span><strong>{destinationQualityReport.metadataStatus.touristSpotShortage.length}件</strong></div>
            <div><span>companionFit未設定</span><strong>{destinationQualityReport.metadataStatus.missingCompanionFit.length}件</strong></div>
            <div><span>purposeFit未設定</span><strong>{destinationQualityReport.metadataStatus.missingPurposeFit.length}件</strong></div>
            <div><span>stayFit未設定</span><strong>{destinationQualityReport.metadataStatus.missingStayFit.length}件</strong></div>
            <div><span>周遊ヒント未設定</span><strong>{destinationQualityReport.metadataStatus.missingNearbyHints.length}件</strong></div>
            <div><span>優先30件整備率</span><strong>{destinationQualityReport.metadataStatus.priorityCompleted}/{destinationQualityReport.metadataStatus.priorityTotal}</strong></div>
            <div><span>長期候補不足</span><strong>{destinationQualityReport.metadataStatus.longStayHintShortage.length}件</strong></div>
          </div>

          {destinationQualityReport.metadataStatus.priorityMissing.length > 0 && (
            <p className="image-major-warning">
              優先整備リストで未登録の旅行先：{destinationQualityReport.metadataStatus.priorityMissing.join('、')}
            </p>
          )}

          <details className="image-reuse-details metadata-shortage-details">
            <summary>旅行先データ不足リストを見る</summary>
            <dl className="debug-details">
              <div><dt>touristSpots未設定</dt><dd>{formatShortageList(destinationQualityReport.metadataStatus.missingTouristSpots)}</dd></div>
              <div><dt>touristSpots 3件未満</dt><dd>{formatShortageList(destinationQualityReport.metadataStatus.touristSpotShortage)}</dd></div>
              <div><dt>localFoodDetails未設定</dt><dd>{formatShortageList(destinationQualityReport.metadataStatus.missingLocalFoodDetails)}</dd></div>
              <div><dt>companionFit未設定</dt><dd>{formatShortageList(destinationQualityReport.metadataStatus.missingCompanionFit)}</dd></div>
              <div><dt>purposeFit未設定</dt><dd>{formatShortageList(destinationQualityReport.metadataStatus.missingPurposeFit)}</dd></div>
              <div><dt>stayFit未設定</dt><dd>{formatShortageList(destinationQualityReport.metadataStatus.missingStayFit)}</dd></div>
              <div><dt>nearbyDestinationHints未設定</dt><dd>{formatShortageList(destinationQualityReport.metadataStatus.missingNearbyHints)}</dd></div>
              <div><dt>localFoodCandidates未設定</dt><dd>{formatShortageList(destinationQualityReport.metadataStatus.missingLocalFood)}</dd></div>
              <div><dt>region未設定</dt><dd>{formatShortageList(destinationQualityReport.metadataStatus.missingRegion)}</dd></div>
              <div><dt>長期旅行向きなのに周遊ヒントなし</dt><dd>{formatShortageList(destinationQualityReport.metadataStatus.longStayHintShortage)}</dd></div>
              <div><dt>グルメ向きなのに料理候補が少ない</dt><dd>{formatShortageList(getGourmetFoodShortageCities(destinations))}</dd></div>
              <div><dt>抽象表現だけになりやすい旅行先</dt><dd>{formatShortageList(getAbstractDescriptionRiskCities(destinations))}</dd></div>
              <div><dt>優先的に説明を強化すべき旅行先</dt><dd>{formatShortageList(getPriorityDescriptionStrengtheningCities(destinations))}</dd></div>
              <div><dt>localFoodDetailsのnameが抽象語</dt><dd>{formatShortageList(getAbstractFoodDetailCities(destinations))}</dd></div>
              <div><dt>localFoodCandidatesが抽象語のみ</dt><dd>{formatShortageList(getAbstractFoodCandidateOnlyCities(destinations))}</dd></div>
              <div><dt>ご当地グルメ説明文がテンプレート化</dt><dd>{formatShortageList(getTemplateFoodDescriptionCities(destinations))}</dd></div>
              <div><dt>localFoodDetails duplicate descriptions</dt><dd>{formatShortageList(getLocalFoodDescriptionDuplicateCities(destinations))}</dd></div>
              <div><dt>localFoodDetails template phrase risk</dt><dd>{formatShortageList(getLocalFoodPhraseRiskCities(destinations))}</dd></div>
              <div><dt>localFoodDetails missing bestTiming</dt><dd>{formatShortageList(getLocalFoodMissingTimingCities(destinations))}</dd></div>
              <div><dt>localFoodDetails missing bestAreaHints</dt><dd>{formatShortageList(getLocalFoodMissingAreaHintCities(destinations))}</dd></div>
              <div><dt>restaurantHints review metadata missing</dt><dd>{formatShortageList(getUnreviewedRestaurantHintCities(destinations))}</dd></div>
              <div><dt>model course missing concrete spot</dt><dd>{formatShortageList(getModelCourseMissingSpotCities(destinations))}</dd></div>
              <div><dt>model course missing concrete food</dt><dd>{formatShortageList(getModelCourseMissingFoodCities(destinations))}</dd></div>
              <div><dt>long model course missing nearby hint</dt><dd>{formatShortageList(getLongModelCourseMissingNearbyCities(destinations))}</dd></div>
              <div><dt>model course pseudo name risk</dt><dd>{formatShortageList(getModelCoursePseudoNameRiskCities(destinations))}</dd></div>
              <div><dt>model course generation shortage</dt><dd>{formatShortageList(getModelCourseGenerationShortageCities(destinations))}</dd></div>
              <div><dt>priority model course strengthening</dt><dd>{formatShortageList(getPriorityModelCourseStrengtheningCities(destinations))}</dd></div>
              <div><dt>具体的な料理名が不足</dt><dd>{formatShortageList(getConcreteFoodShortageCities(destinations))}</dd></div>
              <div><dt>generic food画像の大表示リスク</dt><dd>{formatShortageList(getGenericFoodImageRiskCities(destinations))}</dd></div>
              <div><dt>food image / dish mismatch risk</dt><dd>{formatShortageList(getFoodImageMismatchRiskCities(destinations))}</dd></div>
              <div><dt>result journey image shortage</dt><dd>{formatShortageList(getResultJourneyImageShortageCities(destinations))}</dd></div>
              <div><dt>broad route destination risk</dt><dd>{formatShortageList(getBroadRouteDestinationRiskCities(destinations))}</dd></div>
              <div><dt>touristSpotsのnameが抽象語</dt><dd>{formatShortageList(getAbstractTouristSpotNameCities(destinations))}</dd></div>
              <div><dt>touristSpots.nameが疑似スポット名</dt><dd>{formatShortageList(getPseudoTouristSpotNameCities(destinations))}</dd></div>
              <div><dt>fallback疑似カード生成リスク</dt><dd>{formatShortageList(getFallbackPseudoSpotGeneratedCities(destinations))}</dd></div>
              <div><dt>touristSpotsのdescriptionがテンプレート化</dt><dd>{formatShortageList(getTemplateTouristSpotDescriptionCities(destinations))}</dd></div>
              <div><dt>旅の目的に合うtouristSpots不足</dt><dd>{formatShortageList(getPurposeSpotShortageCities(destinations))}</dd></div>
              <div><dt>簡易プランにスポット名が入りにくい</dt><dd>{formatShortageList(getStayPlanSpotNameMissingCities(destinations))}</dd></div>
              <div><dt>簡易プランにご当地グルメ名が入りにくい</dt><dd>{formatShortageList(getStayPlanFoodNameMissingCities(destinations))}</dd></div>
            </dl>
          </details>

          <details className="image-reuse-details">
            <summary>カテゴリ画像の使用回数を見る</summary>
            <div className="image-reuse-grid">
              {destinationQualityReport.imageReuse.categoryUsage.map(([url, count]) => (
                <span className={count > 20 ? 'warning' : ''} key={url}>
                  {url.split('/').at(-1)} <b>{count}回</b>
                </span>
              ))}
            </div>
          </details>

          {destinationQualityReport.imageReuse.overusedCategoryImages.length > 0 && (
            <ul className="image-reuse-warnings">
              {destinationQualityReport.imageReuse.overusedCategoryImages.map(([url, count]) => (
                <li key={url}>{url.split('/').at(-1)} が{count}件で使用されています。画像バリエーション追加を検討してください。</li>
              ))}
            </ul>
          )}

          {destinationQualityReport.imageReuse.missingMajorImages.length > 0 && (
            <p className="image-major-warning">
              個別画像未設定の主要旅行先：{destinationQualityReport.imageReuse.missingMajorImages.join('、')}
            </p>
          )}

          <div className="quality-tag-balance" aria-label="旅行先タグの件数">
            {Object.entries(destinationQualityReport.coverage.tagCounts).map(([tag, count]) => (
              <span key={tag}>{tag} <b>{count}件</b></span>
            ))}
          </div>

          {destinationQualityReport.warningCount === 0 ? (
            <p className="quality-all-clear">全{destinationQualityReport.total}件の旅行先データに問題は見つかりませんでした。</p>
          ) : (
            <div className="quality-warning-list">
              {destinationQualityReport.warnings.map((result) => (
                <article className="quality-warning-item" key={result.id}>
                  <header><strong>{result.city}</strong><span>{result.prefecture}</span></header>
                  <dl>
                    <div><dt>問題内容</dt><dd>{result.issues.map((issue) => issue.message).join(' / ')}</dd></div>
                    <div><dt>修正が必要な項目</dt><dd>{result.fields.join('、')}</dd></div>
                    <div><dt>修正推奨内容</dt><dd>{result.recommendations.join(' / ')}</dd></div>
                  </dl>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="image-preview-card" aria-labelledby="image-preview-title">
          <div className="quality-check-heading">
            <span aria-hidden="true">□</span>
            <div>
              <p>IMAGE PREVIEW</p>
              <h2 id="image-preview-title">画像プレビュー</h2>
            </div>
          </div>

          <p className="image-preview-lead">
            旅行先ごとの hero / food / scenery 画像、使用タイプ、クレジット、重複状態を確認できます。
          </p>

          <div className="image-preview-filter" role="group" aria-label="画像プレビューフィルター">
            {imagePreviewFilters.map((filter) => (
              <button
                type="button"
                className={imagePreviewFilter === filter.value ? 'active' : ''}
                onClick={() => setImagePreviewFilter(filter.value)}
                key={filter.value}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <p className="image-preview-count">
            表示中：{filteredImagePreviewItems.length}件 / 全{imagePreviewItems.length}件
          </p>

          <div className="image-preview-grid">
            {filteredImagePreviewItems.map((item) => (
              <article className="image-preview-item" key={item.destination.id}>
                <header>
                  <div>
                    <p>{item.destination.prefecture}</p>
                    <h3>{item.destination.city}</h3>
                  </div>
                  {(item.duplicateWithinDestination || item.hasCategoryMismatch) && (
                    <span className="image-preview-review">要確認</span>
                  )}
                </header>

                <div className="image-preview-tags">
                  {item.destination.tags.map((tag) => <span key={tag}>{tag}</span>)}
                </div>
                {item.localFoodCandidates.length > 0 && (
                  <p className="image-preview-food-candidates">
                    ご当地グルメ候補：{item.localFoodCandidates.join('、')}
                  </p>
                )}

                {item.duplicateWithinDestination && (
                  <p className="image-preview-warning">同じ旅行先内で同一画像が使われています。</p>
                )}
                {item.hasCategoryMismatch && (
                  <p className="image-preview-warning">タグと画像カテゴリの組み合わせを確認してください。</p>
                )}

                <div className="image-preview-shots">
                  {item.images.map((image) => (
                    <DeveloperImagePreviewImage
                      item={item}
                      image={image}
                      key={`${item.destination.id}-${image.key}`}
                    />
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="image-improvement-card" aria-labelledby="image-improvement-title">
          <div className="quality-check-heading">
            <span aria-hidden="true">◎</span>
            <div>
              <p>IMAGE ROADMAP</p>
              <h2 id="image-improvement-title">画像改善優先リスト</h2>
            </div>
          </div>

          <p className="image-preview-lead">
            現地写真・ご当地グルメ写真を安全に増やすため、個別画像不足やfood画像の汎用利用を優先度付きで確認できます。
          </p>

          <div className="image-improvement-summary">
            <div><span>要改善</span><strong>{imageImprovementItems.length}件</strong></div>
            <div><span>優先度 高</span><strong>{imageImprovementItems.filter((item) => item.priority === '高').length}件</strong></div>
            <div><span>ご当地food未判定</span><strong>{imageImprovementItems.filter((item) => item.issues.includes('food画像がご当地グルメ未判定')).length}件</strong></div>
            <div><span>グルメ候補なし</span><strong>{imageImprovementItems.filter((item) => item.issues.includes('localFoodCandidates未設定')).length}件</strong></div>
            <div><span>タグ不一致</span><strong>{imagePreviewItems.filter((item) => item.hasCategoryMismatch).length}件</strong></div>
            <div><span>優先30件 個別画像</span><strong>{imagePreviewItems.filter((item) => imageImprovementPriorityCities.includes(item.destination.city) && item.hasIndividual).length}/{imageImprovementPriorityCities.length}</strong></div>
          </div>

          {imageImprovementItems.length === 0 ? (
            <p className="quality-all-clear">現時点で優先対応が必要な画像項目は見つかりませんでした。</p>
          ) : (
            <div className="image-improvement-list">
              {imageImprovementItems.slice(0, 30).map((item) => (
                <article className={`image-improvement-item priority-${item.priority}`} key={`image-improvement-${item.destination.id}`}>
                  <header>
                    <div>
                      <p>{item.destination.prefecture}</p>
                      <h3>{item.destination.city}</h3>
                    </div>
                    <b>優先度：{item.priority}</b>
                  </header>
                  <dl>
                    <div><dt>問題</dt><dd>{item.issues.join(' / ')}</dd></div>
                    <div><dt>推奨対応</dt><dd>{item.recommendations.join(' / ')}</dd></div>
                    <div><dt>グルメ候補</dt><dd>{item.destination.localFoodCandidates?.join('、') ?? '未設定'}</dd></div>
                  </dl>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="draw-balance-card" aria-labelledby="draw-balance-title">
          <div className="quality-check-heading">
            <span aria-hidden="true">⚖</span>
            <div>
              <p>DRAW BALANCE</p>
              <h2 id="draw-balance-title">抽選バランスチェック</h2>
            </div>
          </div>

          <div className="balance-overview">
            <div><span>旅行先</span><strong>{drawBalanceReport.total}件</strong></div>
            <div><span>都道府県</span><strong>{drawBalanceReport.prefectureCounts.length}件</strong></div>
            <div className={drawBalanceReport.warnings.length > 0 ? 'quality-warning' : 'quality-passed'}>
              <span>要確認</span><strong>{drawBalanceReport.warnings.length}件</strong>
            </div>
          </div>

          {drawBalanceReport.warnings.length > 0 ? (
            <ul className="balance-warning-list">
              {drawBalanceReport.warnings.map((warning) => <li key={warning}>{warning}</li>)}
            </ul>
          ) : (
            <p className="quality-all-clear">大きな分布の偏りは見つかりませんでした。</p>
          )}

          <div className="balance-groups">
            <article>
              <h3>タグ別</h3>
              <div className="balance-chips">
                {Object.entries(drawBalanceReport.tagCounts).map(([label, count]) => <span key={label}>{label} <b>{count}</b></span>)}
              </div>
            </article>
            <article>
              <h3>旅行日程別</h3>
              <div className="balance-chips">
                {Object.entries(drawBalanceReport.tripTypeCounts).map(([label, count]) => <span key={label}>{label} <b>{count}</b></span>)}
              </div>
            </article>
            <article>
              <h3>季節別</h3>
              <div className="balance-chips">
                {Object.entries(drawBalanceReport.seasonCounts).map(([label, count]) => <span key={label}>{label} <b>{count}</b></span>)}
              </div>
            </article>
            <article>
              <h3>地域別</h3>
              <div className="balance-chips">
                {Object.entries(drawBalanceReport.regionCounts).map(([label, count]) => <span key={label}>{label} <b>{count}</b></span>)}
              </div>
            </article>
            <article>
              <h3>駅からのアクセス</h3>
              <div className="balance-chips">
                {Object.entries(drawBalanceReport.stationAccessCounts).map(([label, count]) => <span key={label}>{label} <b>{count}</b></span>)}
              </div>
            </article>
            <article>
              <h3>移動範囲条件の影響</h3>
              <div className="balance-chips">
                <span>条件 <b>{movementRangeOptions.find((option) => option.value === movementRange)?.label ?? 'おまかせ'}</b></span>
                <span>加点 <b>{movementRangeBoostedCount}</b></span>
                <span>減点 <b>{movementRangePenalizedCount}</b></span>
                <span>除外 <b>{currentDrawCandidateDiagnostics.excludedCount}</b></span>
                <span>最終候補 <b>{currentDrawCandidateDiagnostics.finalCount}</b></span>
                <span>緩和 <b>{currentDrawCandidateDiagnostics.relaxed ? 'あり' : 'なし'}</b></span>
              </div>
            </article>
            <article>
              <h3>予算帯（1泊2日の下限）</h3>
              <div className="balance-chips">
                {Object.entries(drawBalanceReport.budgetCounts).map(([label, count]) => <span key={label}>{label} <b>{count}</b></span>)}
              </div>
            </article>
          </div>

          <details className="prefecture-balance-details">
            <summary>都道府県別の件数を見る</summary>
            <div className="balance-chips">
              {drawBalanceReport.prefectureCounts.map(([label, count]) => <span key={label}>{label} <b>{count}</b></span>)}
            </div>
          </details>

          <div className="draw-simulation">
            <div>
              <p>SIMULATION</p>
              <h3>抽選シミュレーション</h3>
              <span>現在の条件で100回だけ仮抽選します。抽選履歴には保存されません。</span>
            </div>
            <button type="button" onClick={runDrawSimulation}>100回シミュレーション</button>
          </div>

          {drawSimulation?.error && <p className="settings-notice">{drawSimulation.error}</p>}
          {drawSimulation && !drawSimulation.error && (
            <div className="simulation-results" aria-live="polite">
              <p className="simulation-conditions">
                条件：{drawSimulation.conditions.tripType} / {drawSimulation.conditions.season} / {drawSimulation.conditions.filters} / 旅の目的：{drawSimulation.conditions.purposes} / 移動範囲：{drawSimulation.conditions.movementRange}
              </p>
              <div className="simulation-summary">
                <div><span>候補数</span><strong>{drawSimulation.candidateCount}件</strong></div>
                <div><span>範囲除外</span><strong>{drawSimulation.rangeExcludedCount ?? 0}件</strong></div>
                <div><span>平均運命度</span><strong>{drawSimulation.averageDestiny}%</strong></div>
                <div><span>スタイル一致率</span><strong>{drawSimulation.conditionMatchRate}%</strong></div>
                <div className={drawSimulation.repetitionWarning ? 'quality-warning' : 'quality-passed'}>
                  <span>最多出現</span><strong>{drawSimulation.mostFrequentCount}回</strong>
                </div>
              </div>
              <div className="simulation-rankings">
                <article><h4>よく出た旅先</h4><ol>{drawSimulation.destinationRanking.map(([label, count]) => <li key={label}><span>{label}</span><b>{count}回</b></li>)}</ol></article>
                <article><h4>都道府県の傾向</h4><ol>{drawSimulation.prefectureRanking.map(([label, count]) => <li key={label}><span>{label}</span><b>{count}回</b></li>)}</ol></article>
                <article><h4>タグの傾向</h4><ol>{drawSimulation.tagRanking.map(([label, count]) => <li key={label}><span>{label}</span><b>{count}回</b></li>)}</ol></article>
              </div>
              <p className={drawSimulation.repetitionWarning ? 'simulation-alert' : 'simulation-ok'}>
                {drawSimulation.repetitionWarning
                  ? '同じ旅先の出現が多めです。候補数や条件の絞り込みを確認してください。'
                  : '同じ旅先への極端な集中は見つかりませんでした。'}
              </p>
            </div>
          )}

          <div className="draw-simulation condition-test-heading">
            <div>
              <p>CONDITION TESTS</p>
              <h3>条件別抽選テスト</h3>
              <span>固定ケースをAPIなしで20回ずつ仮抽選し、近場・長期旅行・同行者・目的の不自然さを確認します。</span>
            </div>
            <button type="button" onClick={runAllConditionDrawTests}>全ケースを実行</button>
          </div>

          <div className="condition-test-list">
            {conditionDrawTestCases.map((testCase) => {
              const result = conditionTestResults[testCase.id]
              return (
                <article className="condition-test-item" key={testCase.id}>
                  <header>
                    <div>
                      <p>{testCase.expected}</p>
                      <h4>{testCase.name}</h4>
                    </div>
                    <button type="button" onClick={() => runConditionDrawTest(testCase)}>このケースを実行</button>
                  </header>
                  <dl className="condition-test-inputs">
                    <div><dt>出発地</dt><dd>{testCase.departure}</dd></div>
                    <div><dt>移動範囲</dt><dd>{movementRangeOptions.find((option) => option.value === testCase.movementRange)?.label ?? testCase.movementRange}</dd></div>
                    <div><dt>旅行日程</dt><dd>{resolveTripSchedule(testCase.tripType, testCase.customNights, testCase.customDays).label}</dd></div>
                    <div><dt>同行者</dt><dd>{testCase.selectedFilters.join('、')}</dd></div>
                    <div><dt>旅の目的</dt><dd>{testCase.selectedTravelPurposes.join('、')}</dd></div>
                  </dl>

                  {result?.error && <p className="simulation-alert">{result.error}</p>}
                  {result && !result.error && (
                    <div className="simulation-results condition-test-results" aria-live="polite">
                      <div className="simulation-summary">
                        <div><span>抽選回数</span><strong>{result.runs}回</strong></div>
                        <div><span>候補数</span><strong>{result.candidateCount}件</strong></div>
                        <div><span>範囲除外</span><strong>{result.rangeExcludedCount}件</strong></div>
                        <div><span>目的一致</span><strong>{result.purposeFitCount}/{result.runs}</strong></div>
                        <div><span>同行者一致</span><strong>{result.companionFitCount}/{result.runs}</strong></div>
                        <div><span>追加候補あり</span><strong>{result.longStaySuggestionCount}/{result.runs}</strong></div>
                      </div>
                      <div className="simulation-rankings">
                        <article>
                          <h4>出現した旅先</h4>
                          <ol>{result.destinationRows.map((row) => <li key={row.city}><span>{row.prefecture} {row.city}</span><b>{row.count}回</b></li>)}</ol>
                        </article>
                        <article>
                          <h4>region分布</h4>
                          <ol>{Object.entries(result.regionCounts).sort(([, left], [, right]) => right - left).map(([label, count]) => <li key={label}><span>{label}</span><b>{count}回</b></li>)}</ol>
                        </article>
                        <article>
                          <h4>注意候補</h4>
                          {result.unsuitableCandidates.length > 0 ? (
                            <ol>{result.unsuitableCandidates.map((row) => <li key={row.city}><span>{row.city}：{row.warnings.join('、')}</span><b>{row.movementLabel}</b></li>)}</ol>
                          ) : <p className="simulation-ok">明らかな不一致は見つかりませんでした。</p>}
                        </article>
                      </div>
                      {result.warnings.length > 0 ? (
                        <ul className="balance-warning-list condition-warning-list">
                          {result.warnings.map((warning) => <li key={warning}>{warning}</li>)}
                        </ul>
                      ) : (
                        <p className="simulation-ok">自動警告はありません。</p>
                      )}
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        </section>

        <section className={`debug-card ${showDebugPanel ? 'expanded' : ''}`} aria-labelledby="debug-title">
          <div className="debug-toggle-row">
            <div>
              <p>DEVELOPER TOOLS</p>
              <h2 id="debug-title">開発者向け情報</h2>
            </div>
            <button
              type="button"
              aria-expanded={showDebugPanel}
              aria-controls="debug-details"
              onClick={() => setShowDebugPanel((current) => !current)}
            >
              {showDebugPanel ? '閉じる' : '開発者向け情報を表示'}
              <span aria-hidden="true">{showDebugPanel ? '−' : '+'}</span>
            </button>
          </div>

          {showDebugPanel && (
            <dl className="debug-details" id="debug-details">
              <div><dt>現在の出発地</dt><dd>{departure.trim() || '未入力'}</dd></div>
              <div><dt>選択中の旅行日程</dt><dd>{tripType}</dd></div>
              <div><dt>選択中の旅行予定季節</dt><dd>{travelSeason}（判定：{resolveSeason(travelSeason) ?? 'おまかせ'}）</dd></div>
              <div><dt>最も現実的な移動手段</dt><dd>{bestTransportEvaluation?.mode ?? '未評価'}</dd></div>
              <div><dt>同行者・旅のスタイル</dt><dd>{selectedFilters.length > 0 ? selectedFilters.join('、') : '指定なし'}</dd></div>
              <div><dt>選択中の旅の目的</dt><dd>{selectedTravelPurposes.length > 0 ? selectedTravelPurposes.join('、') : '指定なし'}</dd></div>
              <div><dt>旅の目的で加点された旅先</dt><dd>{selectedTravelPurposes.length > 0 ? `${travelPurposeBoostedCount}件` : '指定なし'}</dd></div>
              <div><dt>移動範囲条件</dt><dd>{movementRangeOptions.find((option) => option.value === movementRange)?.label ?? 'おまかせ'}</dd></div>
              <div><dt>近場の内部目安</dt><dd>{movementRange === 'near' ? '90分目安 / 候補不足時は120分程度まで緩和' : '近場選択時に90分目安を使用'}</dd></div>
              <div><dt>近場で除外された候補</dt><dd>{movementRange === 'near' ? `${currentDrawCandidateDiagnostics.excludedCount}件` : '近場未選択'}</dd></div>
              <div><dt>近場の緩和候補数</dt><dd>{movementRange === 'near' ? `${currentDrawCandidateDiagnostics.strictCount ?? 0}件 → ${currentDrawCandidateDiagnostics.relaxedCount ?? 0}件` : '近場未選択'}</dd></div>
              <div><dt>旅行日程</dt><dd>{tripSchedule.label}</dd></div>
              <div><dt>長期旅行判定</dt><dd>{tripSchedule.days >= 5 ? '長期旅行' : tripSchedule.days >= 3 ? '複数候補提案対象' : '単独旅先提案'}</dd></div>
              <div><dt>追加候補数</dt><dd>{planContext?.tripSuggestions?.length ?? 0}件</dd></div>
              <div><dt>追加候補の選定理由</dt><dd>{planContext?.tripSuggestions?.length > 0 ? planContext.tripSuggestions.map((item) => `${item.destination?.city ?? item.city}：${item.reason}`).join(' / ') : '未提案'}</dd></div>
              <div><dt>追加候補の一致状況</dt><dd>{planContext?.tripSuggestions?.length > 0 ? planContext.tripSuggestions.map((item) => `${item.destination?.city ?? item.city}：${item.regionMatch ?? '地域一致'} / ${(item.sharedTags ?? []).join('・') || 'タグ一致なし'}`).join(' / ') : '未提案'}</dd></div>
              <div><dt>抽選前候補数</dt><dd>{currentDrawCandidateDiagnostics.entries.length}件</dd></div>
              <div><dt>移動範囲で除外</dt><dd>{currentDrawCandidateDiagnostics.excludedCount}件</dd></div>
              <div><dt>最終候補数</dt><dd>{currentDrawCandidateDiagnostics.finalCount}件</dd></div>
              <div><dt>緩和が発生したか</dt><dd>{currentDrawCandidateDiagnostics.relaxed ? 'あり' : 'なし'}</dd></div>
              <div><dt>範囲外候補の混入</dt><dd>{currentDrawCandidateDiagnostics.farCandidateCount > 0 ? `${currentDrawCandidateDiagnostics.farCandidateCount}件` : 'なし'}</dd></div>
              <div><dt>移動範囲で加点</dt><dd>{movementRangeBoostedCount}件</dd></div>
              <div><dt>移動範囲で減点</dt><dd>{movementRangePenalizedCount}件</dd></div>
              <div><dt>現在の旅先</dt><dd>{destination ? `${destination.prefecture} ${destination.city}` : '未抽選'}</dd></div>
              <div><dt>運命度スコア</dt><dd>{destiny ? `${destiny.score}%` : '未算出'}</dd></div>
              <div><dt>行けそう度スコア</dt><dd>{feasibility ? `${feasibility.stars}/5（${feasibility.starsLabel}）` : '未算出'}</dd></div>
              <div><dt>抽選スコア</dt><dd>{selectionMeta ? `${selectionMeta.score}pt` : '未算出'}</dd></div>
              <div><dt>スタイル一致数</dt><dd>{selectionMeta ? `${selectionMeta.matchingCount}件` : '未算出'}</dd></div>
              <div><dt>旅の目的の影響</dt><dd>{selectionMeta?.purposeMatch?.matchedPurposes?.length > 0 ? selectionMeta.purposeMatch.matchedPurposes.join('、') : '未加点 / 指定なし'}</dd></div>
              <div><dt>旅行日程相性</dt><dd>{selectionMeta?.tripCompatibilityLabel ?? '未算出'}</dd></div>
              <div><dt>季節相性</dt><dd>{selectionMeta?.seasonCompatibility ?? '未算出'}</dd></div>
              <div><dt>抽選方式</dt><dd>重み付きランダム（ランダム要素あり）</dd></div>
              <div><dt>ローカル開発用Google Mapsキー</dt><dd>{apiKeyDebugStatus}</dd></div>
              <div><dt>Google Routes API診断</dt><dd>{travelInfo.routeDiagnostics ? '取得済み' : '未実行'}</dd></div>
              <div><dt>通信方式</dt><dd>{getGoogleMapsCommunicationModeLabel(travelInfo.routeDiagnostics?.communicationMode ?? travelInfo.communicationMode)}</dd></div>
              <div><dt>route destination query</dt><dd>{routeDestinationQuery || '未設定'}</dd></div>
              <div><dt>交通比較 表示カード数</dt><dd>{visibleTransportEvaluations.length} / {transportEvaluations.length}</dd></div>
              <div><dt>交通比較 非表示カード</dt><dd>{transportEvaluations.filter((item) => !visibleTransportEvaluations.includes(item)).map((item) => item.mode).join('・') || 'なし'}</dd></div>
              <div><dt>route-time API応答</dt><dd>{travelInfo.routeDiagnostics?.routeTimeHttpStatus ? `HTTP ${travelInfo.routeDiagnostics.routeTimeHttpStatus}` : '未確認'}</dd></div>
              <div><dt>環境変数</dt><dd>{travelInfo.routeDiagnostics?.hasGoogleMapsApiKey === true ? '設定済み' : travelInfo.routeDiagnostics?.hasGoogleMapsApiKey === false ? 'Google Maps APIキー未設定：GOOGLE_MAPS_API_KEY がサーバー環境変数にありません' : '未確認'}</dd></div>
              <div><dt>最終HTTPステータス</dt><dd>{travelInfo.routeDiagnostics?.httpStatus ?? '未確認'}</dd></div>
              <div><dt>最終エラー種別</dt><dd>{travelInfo.routeDiagnostics?.errorType ?? 'なし'}</dd></div>
              <div><dt>最終エラー概要</dt><dd>{travelInfo.routeDiagnostics?.errorSummary || 'なし'}</dd></div>
              <div><dt>最後に試したorigin</dt><dd>{travelInfo.routeDiagnostics?.origin ?? '未実行'}</dd></div>
              <div><dt>最後に試したdestination</dt><dd>{travelInfo.routeDiagnostics?.destination ?? '未実行'}</dd></div>
              <div><dt>最後に試したtravelMode</dt><dd>{travelInfo.routeDiagnostics?.travelMode ?? '未実行'}</dd></div>
              <div><dt>OpenAI APIキー設定状態</dt><dd>{openAiApiKeyDebugStatus}</dd></div>
              <div><dt>AIプランモデル</dt><dd>{OPENAI_PLAN_MODEL}</dd></div>
              <div><dt>OpenAI通信方式</dt><dd>{getOpenAiCommunicationModeLabel(openAiCommunicationMode)}</dd></div>
              <div><dt>AIプラン生成状態</dt><dd>{aiPlanStatus}</dd></div>
              <div><dt>AI送信 touristSpots</dt><dd>{Math.min((featuredTouristSpots.length > 0 ? featuredTouristSpots.length : destination?.touristSpots?.length ?? 0), 5)} / 最大5件</dd></div>
              <div><dt>AI送信 localFoodDetails</dt><dd>{Math.min(localFoodDetails.length, 3)} / 最大3件</dd></div>
              <div><dt>AI送信 周辺候補</dt><dd>{planContext?.tripSuggestions?.slice(0, 3).length ?? 0} / 最大3件</dd></div>
              <div><dt>スポット表示診断</dt><dd>{destination?.touristSpots?.length > 0 && featuredTouristSpots.length === 0 ? 'touristSpotsあり / 結果表示なし' : '表示対象あり'}</dd></div>
              <div><dt>グルメ説明診断</dt><dd>{destination?.localFoodDetails?.length > 0 && localFoodDetails.length === 0 ? 'localFoodDetailsあり / 表示なし' : '表示対象あり'}</dd></div>
              <div><dt>長期候補診断</dt><dd>{destination?.nearbyDestinationHints?.length > 0 && currentTripSchedule.days >= 3 && !(planContext?.tripSuggestions?.length > 0) ? 'nearbyDestinationHintsあり / 長期表示なし' : '表示条件に問題なし'}</dd></div>
              <div><dt>説明強化優先</dt><dd>{featuredTouristSpots.length < 3 || localFoodDetails.length < 2 ? 'スポットまたはグルメ説明を追加確認' : '具体情報あり'}</dd></div>
              <div><dt>本日のAI生成回数</dt><dd>{todayAiPlanUsageCount} / {DAILY_AI_PLAN_LIMIT}回</dd></div>
              <div><dt>プレミアム状態</dt><dd>{isPremiumUser ? '有効（テスト）' : '無効'}</dd></div>
              <div><dt>移動情報取得状態</dt><dd>{travelStatusLabels[travelInfo.status] ?? travelInfo.status}</dd></div>
              <div><dt>TRANSIT origin候補</dt><dd>{travelInfo.transitDebug?.originCandidates?.join(' / ') || '未検索'}</dd></div>
              <div><dt>TRANSIT destination候補</dt><dd>{travelInfo.transitDebug?.destinationCandidates?.join(' / ') || '未検索'}</dd></div>
              <div><dt>departureTime候補</dt><dd>{travelInfo.transitDebug?.departureTimeCandidates?.join(' / ') || '未検索'}</dd></div>
              <div><dt>実際に使った検索条件</dt><dd>{travelInfo.transitDebug?.usedCondition ?? 'なし'}</dd></div>
              <div><dt>TRANSIT APIエラー</dt><dd>{travelInfo.transitDebug?.apiError ?? 'なし'}</dd></div>
              <div><dt>使用したorigin</dt><dd>{travelInfo.transitDebug?.lastRequest?.origin ?? '未検索'}</dd></div>
              <div><dt>使用したdestination</dt><dd>{travelInfo.transitDebug?.lastRequest?.destination ?? '未検索'}</dd></div>
              <div><dt>travelMode</dt><dd>{travelInfo.transitDebug?.lastRequest?.travelMode ?? '未検索'}</dd></div>
              <div><dt>departureTime</dt><dd>{travelInfo.transitDebug?.lastRequest?.departureTime ?? '未検索'}</dd></div>
              <div><dt>APIエンドポイント</dt><dd>{travelInfo.transitDebug?.lastRequest?.endpoint ?? '未検索'}</dd></div>
              <div><dt>fields</dt><dd>{travelInfo.transitDebug?.lastRequest?.fields ?? '未検索'}</dd></div>
              <div><dt>HTTPステータス</dt><dd>{travelInfo.transitDebug?.lastRequest?.httpStatus ?? '取得前・通信失敗'}</dd></div>
              <div><dt>Google APIエラーメッセージ</dt><dd>{travelInfo.transitDebug?.lastRequest?.googleMessage || 'なし'}</dd></div>
              <div className="debug-transit-attempts">
                <dt>失敗した候補一覧</dt>
                <dd>
                  {travelInfo.transitDebug?.attempts?.some((attempt) => attempt.status === 'failed') ? (
                    <ul>
                      {travelInfo.transitDebug.attempts.filter((attempt) => attempt.status === 'failed').map((attempt, index) => (
                        <li key={`${attempt.origin}-${attempt.destination}-${index}`}>
                          {attempt.origin} → {attempt.destination} / {attempt.departureTime ?? '時刻なし'}：{attempt.reason}
                        </li>
                      ))}
                    </ul>
                  ) : travelInfo.transitDebug?.attempts?.length > 0 ? '失敗なし' : '未検索'}
                </dd>
              </div>
              <div><dt>localStorage保存状態</dt><dd>{getLocalStorageDebugStatus()}</dd></div>
            </dl>
          )}
        </section>
        <p className="footer-note">DROPTRIP Developer Tools</p>
          </>
        )}
      </section>
    </main>
  )
}

export default App
