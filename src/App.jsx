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

const tripTypes = ['日帰り', '1泊2日', '2泊3日']
const primaryTransportModes = ['車', '電車', '飛行機']
const transportModes = [...primaryTransportModes]
const seasonOptions = ['今の季節', '春', '夏', '秋', '冬', 'おまかせ']
const filterOptions = ['温泉', '海', '山', 'グルメ', 'カップル向け']
const movementRangeOptions = [
  { value: 'auto', label: 'おまかせ', maxHours: null, maxKm: null },
  { value: 'near', label: '近場', description: '気軽に行きやすい範囲', maxHours: 2, maxKm: 120 },
  { value: 'middle', label: '中距離', description: '少し足を伸ばす旅', maxHours: 4, maxKm: 260 },
  { value: 'far', label: '遠出', description: 'しっかり旅気分を味わう距離', maxHours: 8, maxKm: 560 },
  { value: 'unlimited', label: '制限なし', description: '全国から探す', maxHours: null, maxKm: null },
]
const TRAVEL_RANGE_RULES = {
  auto: { hardFilter: false },
  near: { maxApproxMinutes: 240, maxApproxDistanceKm: 240, hardFilter: true, relaxMultiplier: 1.25 },
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
const VISITED_STORAGE_KEY = 'droptrip-visited'
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
  VISITED_STORAGE_KEY,
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
}

const expectedTripDays = { 日帰り: 1, '1泊2日': 2, '2泊3日': 3 }
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

  const estimatedKm = Math.round(directDistanceKm * 1.35)
  const estimatedHours = Math.round(((estimatedKm / 55) + 0.5) * 10) / 10
  const estimatedMinutes = Math.round(estimatedHours * 60)
  const maxMinutes = rangeSettings.maxApproxMinutes ?? (
    Number.isFinite(rangeSettings.maxHours) ? rangeSettings.maxHours * 60 : null
  )
  const maxKm = rangeSettings.maxApproxDistanceKm ?? rangeSettings.maxKm
  const hasLimit = Number.isFinite(maxMinutes) || Number.isFinite(maxKm)
  const minuteOver = Number.isFinite(maxMinutes) ? estimatedMinutes - maxMinutes : 0
  const kmOver = Number.isFinite(maxKm) ? estimatedKm - maxKm : 0
  const isWithinRange = !hasLimit || (minuteOver <= 0 && kmOver <= 0)
  const isFarOver = hasLimit && (minuteOver > 120 || kmOver > 220)
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
  includeVisited,
  visitedCities,
  minimumCandidateCount = 3,
}) => {
  const entries = destinationList
    .filter((place) => includeVisited || !visitedCities.includes(place.city))
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
      finalCount: strictEntries.length,
      relaxed: false,
      farCandidateCount: strictEntries.filter((entry) => entry.estimate.isHardExcluded).length,
      note: '',
    }
  }

  const maxMinutes = rule.maxApproxMinutes ? rule.maxApproxMinutes * (rule.relaxMultiplier ?? 1.25) : Infinity
  const maxDistance = rule.maxApproxDistanceKm ? rule.maxApproxDistanceKm * (rule.relaxMultiplier ?? 1.25) : Infinity
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
    finalCount: finalEntries.length,
    relaxed: finalEntries.length > strictEntries.length,
    farCandidateCount: finalEntries.filter((entry) => entry.estimate.isHardExcluded).length,
    note: finalEntries.length > strictEntries.length
      ? '指定した移動範囲の候補が少なかったため、少し範囲を広げて提案しています。'
      : '',
  }
}

const calculateDestiny = (destination, selectedFilters, tripType) => {
  const matchingConditions = selectedFilters.filter((filter) => destination.tags.includes(filter))
  const conditionPoints = selectedFilters.length > 0
    ? (matchingConditions.length / selectedFilters.length) * 60
    : 42
  const planDays = destination.plans[tripType]?.length ?? 0
  const tripPoints = Math.min(planDays / expectedTripDays[tripType], 1) * 25
  const tagPoints = Math.min(destination.tags.length / 5, 1) * 15
  const score = Math.round(conditionPoints + tripPoints + tagPoints)
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

const calculateFeasibility = (durationMinutes, tripType, transportMode = '車') => {
  const hours = durationMinutes / 60
  let stars = hours <= 2 ? 5 : hours <= 4 ? 4 : hours <= 6 ? 3 : hours <= 8 ? 2 : 1

  if (transportMode !== '電車') {
    if (tripType === '日帰り' && hours > 4) stars = Math.max(1, stars - 1)
    if (tripType === '1泊2日' && hours > 4 && hours <= 6) stars = Math.min(5, stars + 1)
    if (tripType === '2泊3日' && hours > 6 && hours <= 8) stars = Math.min(5, stars + 1)
  }
  if (transportMode === '飛行機' && tripType !== '日帰り' && hours >= 6) {
    stars = Math.max(tripType === '2泊3日' ? 4 : 3, stars)
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
      : '日帰りにはやや遠いため、早朝出発や宿泊への変更がおすすめです。'
  } else if (tripType === '1泊2日') {
    detail = hours <= 6
      ? '1泊2日なら無理なく楽しめる距離です。'
      : '1泊2日でも移動が長いため、交通手段と出発時間の計画が必要です。'
  } else {
    detail = hours <= 8
      ? '2泊3日なら移動を含めてもゆっくり楽しめる距離です。'
      : '2泊3日でも長距離移動になるため、余裕のある計画がおすすめです。'
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
      ? calculateFeasibility(item.basis.durationMinutes, tripType, item.mode)
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
    if (item.mode === '飛行機' && distanceKm !== null && distanceKm >= 900 && tripType === '2泊3日') recommendationScore += 15

    return { ...item, feasibility, recommendationScore }
  })
}

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

const getFeasibilityTransportReason = (recommended, tripType) => {
  if (!recommended) return '移動情報の取得後に理由を表示します。'
  if (recommended.mode === '飛行機') {
    return tripType === '日帰り'
      ? '長距離のため飛行機が有力ですが、空港アクセスを含めた時間確認が必要です。'
      : `長距離ですが、飛行機なら${tripType}でも現実的です。`
  }
  if (recommended.mode === '電車') {
    return `${recommended.basis.duration}の電車移動なら、運転の負担を抑えて${tripType}を楽しめます。`
  }
  return `${recommended.basis.duration}の車移動で、現地での移動も自由に組み立てやすいです。`
}

const getTransportCompatibility = ({ transportMode, tripType, travelInfo, transportEvaluation }) => {
  const tripNote = tripType === '日帰り'
    ? '日帰りでは、現地で過ごす時間を確保できるか確認しましょう。'
    : `${tripType}なら、移動を含めた余裕のある計画を立てやすいです。`

  if (transportMode === '車') {
    const car = travelInfo.car
    if (!car) return `車の移動時間と距離を取得すると、より具体的な相性を表示できます。${tripNote}`
    return `車で${car.duration}${car.distance ? `・${car.distance}` : ''}の移動です。${tripNote} 現地での移動もしやすく、自由度の高い旅になりやすいです。`
  }

  if (transportMode === '電車') {
    return transportEvaluation?.basis
      ? `距離をもとに${transportEvaluation.basis.trainType}で${transportEvaluation.basis.duration}と概算しています。正確な経路はGoogle Mapsで確認してください。${tripNote}`
      : `距離を取得すると電車の目安時間を概算できます。正確な経路はGoogle Mapsで確認してください。${tripNote}`
  }

  return `${tripType === '日帰り' ? '日帰りでは空港までの移動や搭乗手続き時間に注意が必要です。' : `${tripType}なら、長距離でも移動時間を短縮できる候補です。`} 空港から旅先までの二次交通も含めて計画しましょう。詳細な時刻・料金は今後対応予定です。`
}

const getTravelCacheKey = (origin, destinationId) => (
  `${origin.trim().toLowerCase()}::${destinationId}`
)

const getTripSuitability = (destination, tripType) => {
  const expectedDays = expectedTripDays[tripType]
  const planDays = destination.plans[tripType]?.length ?? 0
  const planRatio = Math.min(planDays / expectedDays, 1)
  const accessMinutes = Number.isFinite(destination.stationAccessMinutes)
    ? destination.stationAccessMinutes
    : 30

  if (tripType === '日帰り') {
    const accessFactor = accessMinutes <= 30 ? 1 : accessMinutes <= 60 ? 0.85 : 0.6
    return planRatio * accessFactor
  }
  if (tripType === '1泊2日') {
    return planRatio * (accessMinutes <= 90 ? 1 : 0.82)
  }
  return planRatio
}

const scoreDestination = ({
  destination,
  selectedFilters,
  tripType,
  isVisited,
  cachedDurationMinutes,
  travelSeason,
  isPrevious,
  movementRangeEstimate = null,
}) => {
  const matchingCount = selectedFilters.filter((filter) => destination.tags.includes(filter)).length
  const tripRatio = getTripSuitability(destination, tripType)
  const tripCompatibilityLabel = tripRatio >= 1 ? '良い' : tripRatio >= 0.66 ? '普通' : '低い'
  const cachedFeasibility = cachedDurationMinutes
    ? calculateFeasibility(cachedDurationMinutes, tripType, '車')
    : null
  const season = resolveSeason(travelSeason)
  const seasonPoints = season && destination.bestSeasons.includes(season) ? 24 : season ? 3 : 10
  const conditionRatio = selectedFilters.length > 0 ? matchingCount / selectedFilters.length : 1
  const conditionPoints = selectedFilters.length > 0
    ? matchingCount * 22 + conditionRatio * 18
    : 18

  const score = Math.max(1, Math.round(
    8
    + conditionPoints
    + tripRatio * 22
    + (isVisited ? -12 : 8)
    + Math.min(destination.tags.length, 5) * 1.5
    + seasonPoints
    + (cachedFeasibility ? cachedFeasibility.stars * 4 : 0)
    + (movementRangeEstimate?.scoreEffect ?? 0),
  ))

  return {
    destination,
    matchingCount,
    tripCompatibilityLabel,
    feasibilityStars: cachedFeasibility?.starsLabel ?? null,
    seasonCompatibility: !season
      ? 'おまかせ'
      : destination.bestSeasons.includes(season) ? 'とても良い' : '標準',
    movementRangeEstimate,
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
          selectedFilters: Array.isArray(entry.selectedFilters)
            ? entry.selectedFilters.filter((filter) => filterOptions.includes(filter))
            : [],
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
    includeVisited: false,
    movementRange: 'auto',
    strictMovementRange: false,
    customRangeHours: '',
    customRangeKm: '',
  }

  try {
    const saved = JSON.parse(window.localStorage.getItem(INPUT_STATE_STORAGE_KEY) ?? '{}')
    return {
      departure: typeof saved.departure === 'string' ? saved.departure : initialState.departure,
      tripType: tripTypes.includes(saved.tripType) ? saved.tripType : initialState.tripType,
      travelSeason: seasonOptions.includes(saved.travelSeason)
        ? saved.travelSeason
        : initialState.travelSeason,
      selectedFilters: Array.isArray(saved.selectedFilters)
        ? saved.selectedFilters.filter((filter) => filterOptions.includes(filter))
        : initialState.selectedFilters,
      includeVisited: typeof saved.includeVisited === 'boolean'
        ? saved.includeVisited
        : initialState.includeVisited,
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

const getExpectedImageCategories = (tags = [], imageType = 'hero') => {
  const categories = new Set(['city', 'history', 'nature'])
  if (imageType === 'food') categories.add('gourmet')
  if (tags.includes(filterOptions[0])) categories.add('onsen')
  if (tags.includes(filterOptions[1])) categories.add('sea')
  if (tags.includes(filterOptions[2])) {
    categories.add('mountain')
    categories.add('nature')
  }
  if (tags.includes(filterOptions[3])) categories.add('gourmet')
  if (tags.includes(filterOptions[4])) {
    categories.add('couple')
    categories.add('city')
  }
  return categories
}

const splitFoodTheme = (theme = '') => String(theme)
  .split(/[、・/／,]/)
  .map((item) => item.trim())
  .filter(Boolean)

const getLocalFoodDisplayItems = (destination = {}) => {
  const fromCandidates = Array.isArray(destination.localFoodCandidates)
    ? destination.localFoodCandidates
    : []
  const fromFoodTheme = splitFoodTheme(getImageMetaValue(destination.foodImage, 'foodTheme'))
  const fromTags = destination.tags?.includes(filterOptions[3])
    ? ['ご当地グルメ', 'カフェ']
    : []
  return [...new Set([...fromCandidates, ...fromFoodTheme, ...fromTags])]
    .filter(Boolean)
    .slice(0, 5)
}

const getFoodThemeText = (destination = {}, foodItems = []) => {
  const foodTheme = getImageMetaValue(destination.foodImage, 'foodTheme')
  if (foodTheme) return foodTheme
  if (foodItems.length > 0) return foodItems.slice(0, 3).join('・')
  return ''
}

const shouldFeatureFoodImage = (destination = {}) => {
  const foodImage = destination.foodImage
  return Boolean(
    getImageUrl(foodImage)
    && (
      getImageMetaValue(foodImage, 'isDestinationSpecific')
      || getImageMetaValue(foodImage, 'isLocalFood')
    ),
  )
}

const getTripProposalText = (destination = {}, context = {}, seasonInfo = {}) => {
  const tags = destination.tags ?? []
  const lead = tags.includes(filterOptions[0])
    ? '温泉でゆっくり整えたい気分に合う'
    : tags.includes(filterOptions[1])
      ? '海風を感じながら気分を変えたい日に合う'
      : tags.includes(filterOptions[2])
        ? '自然の中で深呼吸したい今に合う'
        : tags.includes(filterOptions[3])
          ? 'おいしいものを楽しみたい旅に合う'
          : tags.includes(filterOptions[4])
            ? 'ふたりでゆっくり過ごしたい旅に合う'
            : '少し日常を離れたい今に合う'
  const season = seasonInfo?.season && seasonInfo.season !== 'おまかせ'
    ? `${seasonInfo.season}の魅力も楽しめる`
    : '季節を問わず選びやすい'
  const tripType = context?.tripType ? `${context.tripType}でも` : ''
  return `${lead}、${season}${tripType}旅先です。${destination.recommendText ?? destination.recommendation ?? ''}`
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
      const expectedCategories = getExpectedImageCategories(destination.tags, type)

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
            <div><dt>旅行タイプ</dt><dd>{entry.tripType}</dd></div>
            <div><dt>旅行予定季節</dt><dd>{entry.travelSeason ?? '今の季節'}</dd></div>
            <div><dt>移動範囲</dt><dd>{entry.movementRangeLabel ?? movementRangeOptions.find((option) => option.value === entry.movementRange)?.label ?? 'おまかせ'}</dd></div>
            <div><dt>最適な移動手段</dt><dd>{entry.bestTransport ?? '未評価'}</dd></div>
            <div><dt>選択条件</dt><dd>{entry.selectedFilters?.length > 0 ? entry.selectedFilters.join('、') : '指定なし'}</dd></div>
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
  const [movementRange, setMovementRange] = useState(restoredInputState.movementRange)
  const [strictMovementRange, setStrictMovementRange] = useState(restoredInputState.strictMovementRange)
  const [customRangeHours, setCustomRangeHours] = useState(restoredInputState.customRangeHours)
  const [customRangeKm, setCustomRangeKm] = useState(restoredInputState.customRangeKm)
  const [destination, setDestination] = useState(null)
  const [planContext, setPlanContext] = useState(null)
  const [travelInfo, setTravelInfo] = useState({ status: 'idle', car: null, publicTransit: null })
  const [noMatchMessage, setNoMatchMessage] = useState('')
  const [includeVisited, setIncludeVisited] = useState(restoredInputState.includeVisited)
  const [favoriteCities, setFavoriteCities] = useState(() => loadStoredCities(FAVORITES_STORAGE_KEY))
  const [visitedCities, setVisitedCities] = useState(() => loadStoredCities(VISITED_STORAGE_KEY))
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
  const [betaFeedbackNotes, setBetaFeedbackNotes] = useState(loadBetaFeedbackNotes)
  const [betaFeedbackForm, setBetaFeedbackForm] = useState({
    screen: '',
    issue: '',
    suggestion: '',
    priority: '中',
  })
  const [betaFeedbackNotice, setBetaFeedbackNotice] = useState('')
  const [openAiCommunicationMode, setOpenAiCommunicationMode] = useState('server')
  const [destinationSearch, setDestinationSearch] = useState('')
  const [destinationPrefectureFilter, setDestinationPrefectureFilter] = useState('all')
  const [destinationTagFilter, setDestinationTagFilter] = useState('all')
  const [destinationTripTypeFilter, setDestinationTripTypeFilter] = useState('all')
  const [destinationSeasonFilter, setDestinationSeasonFilter] = useState('all')
  const [destinationRangeFilter, setDestinationRangeFilter] = useState('auto')
  const [destinationFavoritesOnly, setDestinationFavoritesOnly] = useState(false)
  const [destinationFiltersOpen, setDestinationFiltersOpen] = useState(false)

  const favoriteDestinations = favoriteCities
    .map((city) => destinations.find((place) => place.city === city))
    .filter(Boolean)

  const visitedDestinations = visitedCities
    .map((city) => destinations.find((place) => place.city === city))
    .filter(Boolean)

  const prefectureOptions = [...new Set(destinations.map((place) => place.prefecture))]
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right, 'ja'))
  const movementRangeSettings = getMovementRangeConfig({ movementRange, customRangeHours, customRangeKm })
  const movementRangeDebugItems = destinations.map((place) => (
    estimateMovementRange(place, departure, movementRangeSettings)
  ))
  const movementRangeBoostedCount = movementRangeDebugItems.filter((item) => item.scoreEffect > 0).length
  const movementRangePenalizedCount = movementRangeDebugItems.filter((item) => item.scoreEffect < 0).length
  const currentMatchingDestinations = destinations.filter((place) => (
    selectedFilters.length === 0
    || selectedFilters.some((filter) => place.tags.includes(filter))
  ))
  const currentDrawCandidateDiagnostics = getMovementRangeCandidatePool({
    destinationList: currentMatchingDestinations,
    departure,
    rangeSettings: movementRangeSettings,
    includeVisited,
    visitedCities,
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
          ? `こだわり条件のうち${matchingConditions.join('・')}と一致します。`
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
      && matchesTripType
      && matchesSeason
      && matchesRange
      && matchesFavorite
  })
  const destinationRangeLabel = movementRangeOptions.find((option) => option.value === destinationRangeFilter)?.label ?? 'おまかせ'
  const activeDestinationFilters = [
    destinationSearch.trim() && `キーワード：${destinationSearch.trim()}`,
    destinationPrefectureFilter !== 'all' && `都道府県：${destinationPrefectureFilter}`,
    destinationTagFilter !== 'all' && `タグ：${destinationTagFilter}`,
    destinationTripTypeFilter !== 'all' && `旅行タイプ：${destinationTripTypeFilter}`,
    destinationSeasonFilter !== 'all' && `季節：${destinationSeasonFilter}`,
    destinationRangeFilter !== 'auto' && `移動範囲：${destinationRangeLabel}`,
    destinationFavoritesOnly && 'お気に入りのみ',
  ].filter(Boolean)

  const resetDestinationFilters = () => {
    setDestinationSearch('')
    setDestinationPrefectureFilter('all')
    setDestinationTagFilter('all')
    setDestinationTripTypeFilter('all')
    setDestinationSeasonFilter('all')
    setDestinationRangeFilter('auto')
    setDestinationFavoritesOnly(false)
  }

  const destiny = destination && planContext
    ? calculateDestiny(destination, planContext.selectedFilters, planContext.tripType)
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
  const drivingMapsUrl = destination && planContext
    ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(planContext.departure)}&destination=${encodeURIComponent(destination.googleMapsQuery ?? destination.address ?? `${destination.prefecture}${destination.city}`)}&travelmode=driving`
    : 'https://www.google.com/maps'
  const transitMapsUrl = transitFallback?.googleMapsUrl ?? 'https://www.google.com/maps'
  const bestTransportEvaluation = getBestPrimaryTransport(transportEvaluations)
  const bestTransportReason = getRecommendedTransportReason(
    bestTransportEvaluation,
    transportEvaluations,
    planContext?.tripType,
  )
  const feasibility = bestTransportEvaluation?.feasibility ?? null
  const transportCompatibility = destination && planContext && bestTransportEvaluation
    ? getTransportCompatibility({
      transportMode: bestTransportEvaluation.mode,
      tripType: planContext.tripType,
      travelInfo,
      transportEvaluation: bestTransportEvaluation,
    })
    : '移動情報を取得すると、最も現実的な交通手段との相性を表示します。'
  const localFoodItems = destination ? getLocalFoodDisplayItems(destination) : []
  const foodThemeText = destination ? getFoodThemeText(destination, localFoodItems) : ''
  const foodImageIsFeatured = destination ? shouldFeatureFoodImage(destination) : false
  const tripProposalText = destination && planContext
    ? getTripProposalText(destination, planContext, seasonCompatibility)
    : ''
  const tripEnjoymentItems = destination
    ? getTripEnjoymentItems(destination, localFoodItems)
    : []

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
        includeVisited,
        movementRange,
        strictMovementRange,
        customRangeHours,
        customRangeKm,
      }))
    } catch {
      // 保存できない環境でも入力操作は継続する
    }
  }, [
    departure,
    tripType,
    travelSeason,
    selectedFilters,
    includeVisited,
    movementRange,
    strictMovementRange,
    customRangeHours,
    customRangeKm,
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

  const updateVisited = (nextVisited) => {
    setVisitedCities(nextVisited)
    saveCities(VISITED_STORAGE_KEY, nextVisited)
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
    setMovementRange('auto')
    setStrictMovementRange(false)
    setCustomRangeHours('')
    setCustomRangeKm('')
    setIncludeVisited(false)
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

  const markAsVisited = (city) => {
    updateFavorites(favoriteCities.filter((favoriteCity) => favoriteCity !== city))
    if (!visitedCities.includes(city)) {
      updateVisited([...visitedCities, city])
    }
  }

  const moveBackToFavorites = (city) => {
    updateVisited(visitedCities.filter((visitedCity) => visitedCity !== city))
    if (!favoriteCities.includes(city)) {
      updateFavorites([...favoriteCities, city])
    }
  }

  const toggleFilter = (filter) => {
    setSelectedFilters((current) =>
      current.includes(filter)
        ? current.filter((item) => item !== filter)
        : [...current, filter],
    )
  }

  const addHistoryToFavorites = (entry) => {
    if (!favoriteCities.includes(entry.city)) {
      updateFavorites([...favoriteCities, entry.city])
    }
    if (visitedCities.includes(entry.city)) {
      updateVisited(visitedCities.filter((city) => city !== entry.city))
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
    const restoredTripType = tripTypes.includes(entry.tripType) ? entry.tripType : '日帰り'
    const restoredSeason = seasonOptions.includes(entry.travelSeason) ? entry.travelSeason : '今の季節'
    const restoredMovementRange = movementRangeOptions.some((option) => option.value === entry.movementRange)
      ? entry.movementRange
      : 'auto'
    const restoredFilters = Array.isArray(entry.selectedFilters) ? entry.selectedFilters : []
    const matchingCount = restoredFilters.filter((filter) => place.tags.includes(filter)).length

    setDeparture(restoredDeparture)
    setDepartureError('')
    setTripType(restoredTripType)
    setTravelSeason(restoredSeason)
    setMovementRange(restoredMovementRange)
    setStrictMovementRange(false)
    setSelectedFilters(restoredFilters)
    setDestination(place)
    setLastDestinationId(place.id)
    setNoMatchMessage('')
    setPlanContext({
      departure: restoredDeparture,
      tripType: restoredTripType,
      travelSeason: restoredSeason,
      selectedFilters: restoredFilters,
      movementRange: restoredMovementRange,
      strictMovementRange: false,
    })
    setSelectionMeta({
      matchingCount,
      tripCompatibilityLabel: entry.tripCompatibilityLabel ?? '良い',
      feasibilityStars: entry.feasibilityStars ?? null,
      score: entry.selectionScore ?? 0,
      seasonCompatibility: entry.seasonCompatibility ?? '標準',
      movementRangeEstimate: entry.movementRangeEstimate ?? null,
      source: 'history',
      visitedPolicy: entry.visitedPolicy ?? '履歴から再表示',
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
    const movementEstimate = estimateMovementRange(place, normalizedDeparture, movementRangeSettings)
    const detailScore = scoreDestination({
      destination: place,
      selectedFilters: detailFilters,
      tripType,
      travelSeason,
      isVisited: visitedCities.includes(place.city),
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
      tripCompatibilityLabel: detailScore.tripCompatibilityLabel,
      feasibilityStars: detailScore.feasibilityStars,
      score: detailScore.score,
      seasonCompatibility: detailScore.seasonCompatibility,
      movementRangeEstimate: movementEstimate,
      source: 'destination-list',
      visitedPolicy: '一覧から表示',
    })
    setPlanContext({
      departure: normalizedDeparture || '出発地未設定',
      tripType,
      travelSeason,
      selectedFilters: detailFilters,
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

  const runDrawSimulation = () => {
    const normalizedDeparture = departure.trim()
    const matchingDestinations = destinations.filter((place) => (
      selectedFilters.length === 0
      || selectedFilters.some((filter) => place.tags.includes(filter))
    ))
    const currentRangeSettings = getMovementRangeConfig({ movementRange, customRangeHours, customRangeKm })
    const candidatePool = getMovementRangeCandidatePool({
      destinationList: matchingDestinations,
      departure: normalizedDeparture,
      rangeSettings: currentRangeSettings,
      includeVisited,
      visitedCities,
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
        tripType,
        travelSeason,
        isVisited: visitedCities.includes(place.city),
        cachedDurationMinutes: normalizedDeparture
          ? travelTimeCache[getTravelCacheKey(normalizedDeparture, place.id)]
          : null,
        isPrevious: place.id === previousId,
        movementRangeEstimate: estimateMovementRange(place, normalizedDeparture, currentRangeSettings),
      }))
      const selected = pickWeightedDestination(scoredDestinations)
      const place = selected.destination
      const destinyScore = calculateDestiny(place, selectedFilters, tripType).score

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
        visited: includeVisited ? '含める' : '除外',
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
    const matchingDestinations = destinations.filter((place) => (
      selectedFilters.length === 0
      || selectedFilters.some((filter) => place.tags.includes(filter))
    ))
    const currentRangeSettings = getMovementRangeConfig({ movementRange, customRangeHours, customRangeKm })
    const candidatePool = getMovementRangeCandidatePool({
      destinationList: matchingDestinations,
      departure: normalizedDeparture,
      rangeSettings: currentRangeSettings,
      includeVisited,
      visitedCities,
    })
    const candidates = candidatePool.candidates

    if (candidates.length === 0) {
      setDestination(null)
      setPlanContext(null)
      setTravelInfo({ status: 'idle', car: null, publicTransit: null })
      setSelectionMeta(null)
      setNoMatchMessage(
        matchingDestinations.length > 0
          ? '条件に合う未訪問の旅先がありません。「行った場所を除外する」をOFFにするか、条件を減らしてください。'
          : '条件に合う旅先が見つかりませんでした。条件を減らしてください。',
      )
      switchPage('main')
      return
    }

    const scoredDestinations = candidates.map((place) => scoreDestination({
      destination: place,
      selectedFilters,
      tripType,
      travelSeason,
      isVisited: visitedCities.includes(place.city),
      cachedDurationMinutes: travelTimeCache[getTravelCacheKey(normalizedDeparture, place.id)],
      isPrevious: place.id === lastDestinationId,
      movementRangeEstimate: estimateMovementRange(place, normalizedDeparture, currentRangeSettings),
    }))
    const selected = pickWeightedDestination(scoredDestinations)
    const next = selected.destination
    const selectedDestiny = calculateDestiny(next, selectedFilters, tripType)
    const historyEntryId = globalThis.crypto?.randomUUID?.()
      ?? `history-${historyIdFallback.current += 1}`
    addHistoryEntry({
      id: historyEntryId,
      destinationId: next.id,
      city: next.city,
      prefecture: next.prefecture,
      departure: normalizedDeparture,
      tripType,
      travelSeason,
      movementRange,
      strictMovementRange,
      movementRangeLabel: movementRangeOptions.find((option) => option.value === movementRange)?.label ?? 'おまかせ',
      selectedFilters: [...selectedFilters],
      destinyScore: selectedDestiny.score,
      feasibilityStars: selected.feasibilityStars,
      bestTransport: selected.feasibilityStars ? '車' : null,
      budget: next.budgets[tripType],
      drawnAt: new Date().toISOString(),
      selectionScore: selected.score,
      seasonCompatibility: selected.seasonCompatibility,
      source: 'draw',
      movementRangeEstimate: selected.movementRangeEstimate,
      movementRangeRelaxed: candidatePool.relaxed,
      movementRangeExcludedCount: candidatePool.excludedCount,
      movementRangeFinalCount: candidatePool.finalCount,
      tripCompatibilityLabel: selected.tripCompatibilityLabel,
      visitedPolicy: includeVisited ? '含める（訪問済みは減点）' : '除外',
    })
    setNoMatchMessage('')
    setDestination(next)
    setLastDestinationId(next.id)
    setSelectionMeta({
      matchingCount: selected.matchingCount,
      tripCompatibilityLabel: selected.tripCompatibilityLabel,
      feasibilityStars: selected.feasibilityStars,
      score: selected.score,
      seasonCompatibility: selected.seasonCompatibility,
      movementRangeRelaxed: candidatePool.relaxed,
      movementRangeExcludedCount: candidatePool.excludedCount,
      movementRangeFinalCount: candidatePool.finalCount,
      visitedPolicy: includeVisited ? '含める（訪問済みは減点）' : '除外',
    })
    setPlanContext({
      departure: normalizedDeparture,
      tripType,
      travelSeason,
      selectedFilters: [...selectedFilters],
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
    const prompt = createAiPlanPrompt({
      departure: planContext.departure,
      destination,
      tripType: planContext.tripType,
      season,
      selectedFilters: planContext.selectedFilters,
      transportComparisons: transportEvaluations.map((item) => ({
        mode: item.mode,
        rating: item.feasibility?.starsLabel ?? '未評価',
        duration: item.isReference ? null : item.basis?.duration,
        isReference: item.isReference,
      })),
      budget: destination.budgets[planContext.tripType],
    })
    try {
      const result = await generateOpenAiPlan({
        prompt,
        destination: { city: destination.city, prefecture: destination.prefecture },
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
          <p className="hero-description">出発地と気分を選ぶだけ。今のあなたに合う旅先をランダムに提案します。</p>
        </header>

        <form onSubmit={chooseDestination} className="trip-form" noValidate>
          <details className="quick-guide">
            <summary><span aria-hidden="true">✦</span>かんたん3ステップ</summary>
            <ol>
              <li><b>1</b><span>出発地を入力</span></li>
              <li><b>2</b><span>旅行タイプとこだわりを選ぶ</span></li>
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
            <legend>旅行タイプ</legend>
            <div className="trip-type-options">
              {tripTypes.map((type) => (
                <label key={type} className={tripType === type ? 'selected' : ''}>
                  <input
                    type="radio"
                    name="tripType"
                    value={type}
                    checked={tripType === type}
                    onChange={(event) => setTripType(event.target.value)}
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
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

          <fieldset className="field-group">
            <legend>行った場所の抽選設定</legend>
            <label className={`visited-filter-toggle ${!includeVisited ? 'selected' : ''}`}>
              <input
                type="checkbox"
                checked={!includeVisited}
                onChange={(event) => setIncludeVisited(!event.target.checked)}
              />
              <span aria-hidden="true">✓</span>
              行った場所を除外する
            </label>
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
              こだわり条件
              <span className="optional-label">複数選択可</span>
            </legend>
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
              {(selectionMeta?.source === 'destination-list' || selectionMeta?.visitedPolicy === '一覧から表示') && (
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
                className={`favorite-button ${favoriteCities.includes(destination.city) ? 'registered' : ''} ${visitedCities.includes(destination.city) ? 'visited' : ''}`}
                aria-pressed={favoriteCities.includes(destination.city)}
                onClick={() => toggleFavorite(destination.city)}
                disabled={visitedCities.includes(destination.city)}
              >
                <span aria-hidden="true">♡</span>
                {visitedCities.includes(destination.city)
                  ? '行った場所に登録済み'
                  : favoriteCities.includes(destination.city)
                    ? 'お気に入り登録済み'
                    : 'お気に入り登録'}
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
                <p className="destiny-explanation">条件・季節・旅行タイプとの相性から算出しています。</p>
                <div className="destiny-factors" aria-label="運命度の算出要素">
                  <span>条件一致 <b>{destiny.matchingCount}件</b></span>
                  <span>旅行タイプ <b>◎</b></span>
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
                  <p className="reason-label">選択条件との一致理由</p>
                  <div className="reason-tags">
                    {(planContext.selectedFilters.length > 0
                      ? planContext.selectedFilters
                      : destination.tags.slice(0, 3)
                    ).map((tag) => (
                      <span key={tag}><b aria-hidden="true">✓</b>{tag}</span>
                    ))}
                  </div>
                  {planContext.selectedFilters.length === 0 && (
                    <p className="no-filter-note">条件指定がないため、この旅先の代表的な魅力を表示しています。</p>
                  )}
                </div>

                <div className="reason-item">
                  <p className="reason-label">旅行タイプとの相性</p>
                  <p><strong>{planContext.tripType}</strong> — {tripCompatibility[planContext.tripType]}</p>
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
                {tripCompatibility[planContext.tripType]}
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
              </section>
            )}

            <section className="journey-gallery-card" aria-labelledby="journey-gallery-title">
              <div className="journey-gallery-heading">
                <p>TRIP INSPIRATION</p>
                <h2 id="journey-gallery-title">旅のイメージ</h2>
              </div>
              <div className="journey-gallery" role="list">
                {[
                  { key: 'hero', label: '観光地写真', alt: `${destination.city}の観光イメージ` },
                  { key: 'food', label: 'グルメ写真', alt: `${destination.city}のグルメイメージ` },
                  { key: 'scenery', label: '風景写真', alt: `${destination.city}の風景イメージ` },
                ].map((image) => (
                  <article className="journey-image-card" role="listitem" key={`${destination.id}-${image.key}`}>
                    <SafeImage
                      destination={destination}
                      imageType={image.key}
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

            {localFoodItems.length > 0 && (
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

            <section className="season-compatibility-card" aria-labelledby="season-compatibility-title">
              <div>
                <p>SEASON HIGHLIGHT</p>
                <h2 id="season-compatibility-title">この季節に行くなら</h2>
              </div>
              <strong aria-label={`${seasonCompatibility.stars}つ星`}>{seasonCompatibility.starsLabel}</strong>
              <p>{seasonCompatibility.description}</p>
              <span>ベストシーズン：{destination.bestSeasons.join('・')}</span>
            </section>

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
                <strong>{planContext.tripType}</strong>旅行プラン
              </p>

              <section className={`premium-guide-card ${isPremiumUser ? 'active' : ''}`} aria-labelledby="premium-guide-title">
                <div className="premium-guide-heading">
                  <span aria-hidden="true">✦</span>
                  <div>
                    <p>PREMIUM AI PLAN</p>
                    <h3 id="premium-guide-title">AIプラン生成はプレミアム機能です</h3>
                  </div>
                  {isPremiumUser && <b>有効</b>}
                </div>
                <p className="premium-guide-description">
                  もっと具体的に計画したいときは、出発地・旅先・季節・交通手段・予算をもとに、AIがあなた向けの日程案を作成します。
                </p>
                <ul>
                  <li>AIが日程別プランを作成</li>
                  <li>食事・カフェ案を提案</li>
                  <li>移動の注意点を整理</li>
                  <li>旅行を楽しむコツを提案</li>
                </ul>
              </section>

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
                    <div><dt>旅行タイプ</dt><dd>{planContext.tripType}</dd></div>
                    <div><dt>季節</dt><dd>{planContext.travelSeason === '今の季節' ? `今の季節（${getCurrentSeason()}）` : planContext.travelSeason}</dd></div>
                    <div><dt>こだわり条件</dt><dd>{planContext.selectedFilters.length > 0 ? planContext.selectedFilters.join('、') : '指定なし'}</dd></div>
                    <div><dt>交通手段比較の結果</dt><dd>{bestTransportEvaluation ? `${bestTransportEvaluation.mode}が最も現実的（${bestTransportEvaluation.feasibility.starsLabel}）` : '移動情報取得後に評価'}</dd></div>
                    <div><dt>予算目安</dt><dd>1人あたり {destination.budgets[planContext.tripType]}</dd></div>
                  </dl>
                </section>
              )}

              <details className="plan-card schedule-card collapsible-plan-card">
                <summary>
                  <span aria-hidden="true">▦</span>
                  <b>詳細プランを見る</b>
                  <small>{planContext.tripType}の流れを確認できます</small>
                </summary>
                {destination.plans[planContext.tripType].map((dayPlan) => (
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

              <div className="plan-card travel-card">
                  <h3><span aria-hidden="true">⌁</span>交通手段比較</h3>
                  <p className="transport-introduction">車・電車・飛行機で、行きやすさをざっくり比較できます。</p>
                  <p className="travel-destination">目的地：{destination.address}</p>
                  {travelInfo.status === 'loading' && (
                    <div className="travel-state travel-loading" role="status">
                      <span className="travel-spinner" aria-hidden="true" />
                      <div>
                        <strong>移動情報を取得中...</strong>
                        <p>車と公共交通機関の経路を確認しています。</p>
                      </div>
                    </div>
                  )}
                  <div className="transport-comparison-list">
                      {transportEvaluations.map((item) => (
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

              <section className="feasibility-card" aria-labelledby="feasibility-title">
                <div className="feasibility-heading">
                  <div>
                    <p>TRIP FEASIBILITY</p>
                    <h3 id="feasibility-title">行けそう度</h3>
                  </div>
                  {feasibility && <span className="feasibility-stars" aria-label={`${feasibility.stars}つ星`}>{feasibility.starsLabel}</span>}
                </div>

                {feasibility ? (
                  <div className="feasibility-result">
                    <strong>{feasibility.label}</strong>
                    <div className="feasibility-transport-choice">
                      <span>採用交通手段</span>
                      <b>{bestTransportEvaluation.mode}</b>
                    </div>
                    <p><b>理由：</b>{getFeasibilityTransportReason(bestTransportEvaluation, planContext.tripType)}</p>
                    <span>予算目安：1人あたり {destination.budgets[planContext.tripType]}</span>
                    {travelInfo.publicTransit?.duration && (
                      <span className="feasibility-transit">公共交通機関：{travelInfo.publicTransit.duration}</span>
                    )}
                  </div>
                ) : (
                  <p className="feasibility-placeholder">
                    {travelInfo.status === 'loading'
                      ? '移動情報を取得中です...'
                      : travelInfo.status === 'unconfigured'
                        ? '移動情報を取得すると表示されます'
                        : travelInfo.status === 'error' || travelInfo.status === 'api-error'
                          ? '移動情報を取得できると表示されます'
                          : '車の移動時間を取得すると表示されます'}
                  </p>
                )}

                <div className="transport-compatibility">
                  <strong>最も現実的な移動手段：{bestTransportEvaluation?.mode ?? '判定中'}</strong>
                  <p>{transportCompatibility}</p>
                </div>
              </section>

              <div className="plan-card budget-card">
                <h3><span aria-hidden="true">¥</span>予算目安</h3>
                <p>1人あたり {destination.budgets[planContext.tripType]}</p>
              </div>

              <div className="plan-card highlight-card">
                <h3><span aria-hidden="true">♡</span>おすすめポイント</h3>
                <p>{destination.highlights}</p>
              </div>
            </section>

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
                  <span>タグ</span>
                  <select value={destinationTagFilter} onChange={(event) => setDestinationTagFilter(event.target.value)}>
                    <option value="all">すべて</option>
                    {filterOptions.map((filter) => <option value={filter} key={filter}>{filter}</option>)}
                  </select>
                </label>
                <label>
                  <span>旅行タイプ</span>
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
                <span>気になる旅先を選んで、予定している季節やこだわり条件との相性を比べられます。</span>
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
                          <button type="button" onClick={() => markAsVisited(place.city)}>行った場所にする</button>
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

            {visitedDestinations.length > 0 && (
              <section className="favorites-section visited-section" aria-labelledby="visited-title">
                <div className="favorites-heading">
                  <div><p>PLACES VISITED</p><h2 id="visited-title">行った場所一覧</h2></div>
                  <span>{visitedDestinations.length}件</span>
                </div>
                <div className="favorites-list">
                  {visitedDestinations.map((place) => (
                    <article className="favorite-item visited-item" key={place.city}>
                      <div className="favorite-item-icon" aria-hidden="true">✓</div>
                      <div className="favorite-item-content">
                        <p>{place.prefecture}</p><h3>{place.city}</h3><span>{place.recommendation}</span>
                      </div>
                      <button type="button" className="restore-button" onClick={() => moveBackToFavorites(place.city)}>未訪問に戻す</button>
                    </article>
                  ))}
                </div>
              </section>
            )}

            <p className="footer-note">DROPTRIP Favorites</p>
          </>
        ) : currentPage === 'comparison' ? (
          <>
            <header className="developer-page-header comparison-page-header">
              <button type="button" onClick={() => switchPage('favorites')}><span aria-hidden="true">←</span>お気に入りに戻る</button>
              <div className="developer-page-icon comparison-page-icon" aria-hidden="true">⇄</div>
              <p>COMPARE TRIPS</p>
              <h1 id="comparison-page-title">旅先を比較</h1>
              <span>季節とこだわり条件を変えて、今の旅行に合う候補を探せます</span>
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
                <legend>こだわり条件</legend>
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
                <span>こだわり条件：{comparisonFilters.length > 0 ? comparisonFilters.join('、') : '指定なし'}</span>
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
                        <div><dt>条件一致数</dt><dd>{matchingConditions.length}件{matchingConditions.length > 0 ? `（${matchingConditions.join('、')}）` : ''}</dd></div>
                        <div><dt>運命度</dt><dd>{placeDestiny.score}%</dd></div>
                        <div><dt>おすすめ度</dt><dd>{recommendationScore}pt</dd></div>
                        <div><dt>季節との相性</dt><dd>{placeSeason.starsLabel} {placeSeason.description}</dd></div>
                        <div><dt>比較コメント</dt><dd>{comment}</dd></div>
                        <div><dt>おすすめポイント</dt><dd>{place.highlights}</dd></div>
                        <div><dt>旅行タイプとの相性</dt><dd>{tripCompatibility[tripType]}</dd></div>
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
              <p>お気に入り・行った場所・履歴・APIキーは削除されません。</p>
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
              <h3>旅行タイプ別</h3>
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
                条件：{drawSimulation.conditions.tripType} / {drawSimulation.conditions.season} / {drawSimulation.conditions.filters} / 移動範囲：{drawSimulation.conditions.movementRange} / 訪問済みを{drawSimulation.conditions.visited}
              </p>
              <div className="simulation-summary">
                <div><span>候補数</span><strong>{drawSimulation.candidateCount}件</strong></div>
                <div><span>範囲除外</span><strong>{drawSimulation.rangeExcludedCount ?? 0}件</strong></div>
                <div><span>平均運命度</span><strong>{drawSimulation.averageDestiny}%</strong></div>
                <div><span>条件一致率</span><strong>{drawSimulation.conditionMatchRate}%</strong></div>
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
              <div><dt>選択中の旅行タイプ</dt><dd>{tripType}</dd></div>
              <div><dt>選択中の旅行予定季節</dt><dd>{travelSeason}（判定：{resolveSeason(travelSeason) ?? 'おまかせ'}）</dd></div>
              <div><dt>最も現実的な移動手段</dt><dd>{bestTransportEvaluation?.mode ?? '未評価'}</dd></div>
              <div><dt>選択中の条件</dt><dd>{selectedFilters.length > 0 ? selectedFilters.join('、') : '指定なし'}</dd></div>
              <div><dt>移動範囲条件</dt><dd>{movementRangeOptions.find((option) => option.value === movementRange)?.label ?? 'おまかせ'}</dd></div>
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
              <div><dt>条件一致数</dt><dd>{selectionMeta ? `${selectionMeta.matchingCount}件` : '未算出'}</dd></div>
              <div><dt>旅行タイプ相性</dt><dd>{selectionMeta?.tripCompatibilityLabel ?? '未算出'}</dd></div>
              <div><dt>季節相性</dt><dd>{selectionMeta?.seasonCompatibility ?? '未算出'}</dd></div>
              <div><dt>抽選方式</dt><dd>重み付きランダム（ランダム要素あり）</dd></div>
              <div><dt>ローカル開発用Google Mapsキー</dt><dd>{apiKeyDebugStatus}</dd></div>
              <div><dt>Google Routes API診断</dt><dd>{travelInfo.routeDiagnostics ? '取得済み' : '未実行'}</dd></div>
              <div><dt>通信方式</dt><dd>{getGoogleMapsCommunicationModeLabel(travelInfo.routeDiagnostics?.communicationMode ?? travelInfo.communicationMode)}</dd></div>
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
