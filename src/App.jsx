import { useEffect, useRef, useState } from 'react'
import './App.css'
import { getGoogleMapsApiKeySource, getTravelInfo } from './services/travelTime'
import { createAiPlanPrompt } from './services/aiPlanPrompt'
import destinations from './data/destinations.js'

const tripTypes = ['日帰り', '1泊2日', '2泊3日']
const transportModes = ['車', '鉄道', '高速バス', '夜行バス', '飛行機']
const seasonOptions = ['今の季節', '春', '夏', '秋', '冬', 'おまかせ']
const filterOptions = ['温泉', '海', '山', 'グルメ', 'カップル向け']
const FAVORITES_STORAGE_KEY = 'droptrip-favorites'
const VISITED_STORAGE_KEY = 'droptrip-visited'
const COMPARE_STORAGE_KEY = 'droptrip-compare'
const MAPS_API_KEY_STORAGE_KEY = 'droptrip-google-maps-api-key'
const TRAVEL_CACHE_STORAGE_KEY = 'droptrip-travel-time-cache'
const DRAW_HISTORY_STORAGE_KEY = 'droptrip-draw-history'
const INPUT_STATE_STORAGE_KEY = 'droptrip-input-state'
const MAX_HISTORY_ITEMS = 20
const DEBUG_STORAGE_KEYS = [
  FAVORITES_STORAGE_KEY,
  VISITED_STORAGE_KEY,
  COMPARE_STORAGE_KEY,
  MAPS_API_KEY_STORAGE_KEY,
  TRAVEL_CACHE_STORAGE_KEY,
  DRAW_HISTORY_STORAGE_KEY,
  INPUT_STATE_STORAGE_KEY,
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

  if (tripType === '日帰り' && hours > 4) stars = Math.max(1, stars - 1)
  if (tripType === '1泊2日' && hours > 4 && hours <= 6) stars = Math.min(5, stars + 1)
  if (tripType === '2泊3日' && hours > 6 && hours <= 8) stars = Math.min(5, stars + 1)
  if (transportMode === '高速バス' && hours >= 4 && hours <= 8) stars = Math.min(5, stars + 1)
  if (transportMode === '夜行バス' && tripType !== '日帰り' && hours >= 6) {
    stars = Math.max(3, stars)
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

  if (transportMode === '高速バス') {
    detail += ' 高速バスは中距離〜長距離向きとして参考評価しています。'
  }
  if (transportMode === '夜行バス') {
    detail += tripType === '日帰り'
      ? ' 夜行バスは宿泊を伴う旅行での利用がおすすめです。'
      : ' 夜間の移動時間を活用できる前提で評価しています。'
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

const getTransportEvaluations = (travelInfo, tripType) => {
  const car = travelInfo.car?.durationMinutes
    ? { durationMinutes: travelInfo.car.durationMinutes, duration: travelInfo.car.duration, label: '車' }
    : null
  const transit = travelInfo.publicTransit?.durationMinutes
    ? { durationMinutes: travelInfo.publicTransit.durationMinutes, duration: travelInfo.publicTransit.duration, label: '公共交通機関' }
    : null

  const reference = transit ?? car
  const definitions = [
    { mode: '車', basis: car, isReference: false },
    { mode: '鉄道', basis: transit, isReference: false },
    { mode: '高速バス', basis: reference, isReference: true },
    { mode: '夜行バス', basis: reference, isReference: true },
    { mode: '飛行機', basis: reference, isReference: true },
  ]

  return definitions.map((item) => ({
    ...item,
    feasibility: item.basis
      ? calculateFeasibility(item.basis.durationMinutes, tripType, item.mode)
      : null,
  }))
}

const getTransportCompatibility = ({ transportMode, tripType, travelInfo }) => {
  const tripNote = tripType === '日帰り'
    ? '日帰りでは、現地で過ごす時間を確保できるか確認しましょう。'
    : `${tripType}なら、移動を含めた余裕のある計画を立てやすいです。`

  if (transportMode === '車') {
    const car = travelInfo.car
    if (!car) return `車の移動時間と距離を取得すると、より具体的な相性を表示できます。${tripNote}`
    return `車で${car.duration}${car.distance ? `・${car.distance}` : ''}の移動です。${tripNote} 現地での移動もしやすく、自由度の高い旅になりやすいです。`
  }

  if (transportMode === '鉄道') {
    const transit = travelInfo.publicTransit
    return transit
      ? `公共交通機関で${transit.duration}のルートを鉄道移動の参考にしています。乗り換えや駅から観光地までの移動も含めて計画すると安心です。${tripNote}`
      : `公共交通機関ルートを鉄道移動の参考にして評価します。乗り換えや駅からの移動も含めた計画がおすすめです。${tripNote}`
  }

  if (transportMode === '高速バス') {
    const reference = travelInfo.publicTransit?.duration
      ? `公共交通機関の${travelInfo.publicTransit.duration}を参考に、`
      : ''
    return `${reference}中距離〜長距離旅行向きの移動手段として評価しています。${tripNote} 詳細な時刻・料金は今後対応予定です。`
  }

  if (transportMode === '夜行バス') {
    const stayNote = tripType === '日帰り'
      ? '宿泊旅行へ変更すると、夜間の移動時間を活用しやすくなります。'
      : '移動時間が長くても、宿泊旅行なら夜間を活用できる現実的な選択肢です。'
    return `${stayNote} 到着後に休める余裕を持ったプランがおすすめです。詳細な時刻・料金は今後対応予定です。`
  }

  return `${tripType === '日帰り' ? '日帰りでは空港までの移動や搭乗手続き時間に注意が必要です。' : `${tripType}なら、長距離でも移動時間を短縮できる候補です。`} 空港から旅先までの二次交通も含めて計画しましょう。詳細な時刻・料金は今後対応予定です。`
}

const getTravelCacheKey = (origin, destinationId) => (
  `${origin.trim().toLowerCase()}::${destinationId}`
)

const scoreDestination = ({
  destination,
  selectedFilters,
  tripType,
  isVisited,
  cachedDurationMinutes,
  travelSeason,
  isPrevious,
}) => {
  const matchingCount = selectedFilters.filter((filter) => destination.tags.includes(filter)).length
  const expectedDays = expectedTripDays[tripType]
  const planDays = destination.plans[tripType]?.length ?? 0
  const tripRatio = Math.min(planDays / expectedDays, 1)
  const tripCompatibilityLabel = tripRatio >= 1 ? '良い' : tripRatio >= 0.66 ? '普通' : '低い'
  const cachedFeasibility = cachedDurationMinutes
    ? calculateFeasibility(cachedDurationMinutes, tripType, '車')
    : null
  const season = resolveSeason(travelSeason)
  const seasonPoints = season && destination.bestSeasons.includes(season) ? 18 : season ? 2 : 8

  const score = Math.max(1, Math.round(
    10
    + matchingCount * 20
    + tripRatio * 18
    + (isVisited ? -12 : 8)
    + Math.min(destination.tags.length, 5) * 2
    + seasonPoints
    + (cachedFeasibility ? cachedFeasibility.stars * 4 : 0),
  ))

  return {
    destination,
    matchingCount,
    tripCompatibilityLabel,
    feasibilityStars: cachedFeasibility?.starsLabel ?? null,
    seasonCompatibility: !season
      ? 'おまかせ'
      : destination.bestSeasons.includes(season) ? 'とても良い' : '標準',
    score,
    weight: Math.pow(score, 1.35) * (isPrevious ? 0.35 : 1),
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

const loadStoredApiKey = () => {
  try {
    return window.localStorage.getItem(MAPS_API_KEY_STORAGE_KEY) ?? ''
  } catch {
    return ''
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
          bestTransport: transportModes.includes(entry.bestTransport)
            ? entry.bestTransport
            : transportModes.includes(entry.transportMode) ? entry.transportMode : null,
          travelSeason: seasonOptions.includes(entry.travelSeason) ? entry.travelSeason : '今の季節',
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
  unconfigured: 'APIキー未設定',
  error: '取得失敗',
  'api-error': 'API設定エラー',
}

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

function App() {
  const travelRequestId = useRef(0)
  const [restoredInputState] = useState(loadInputState)
  const [departure, setDeparture] = useState(restoredInputState.departure)
  const [departureError, setDepartureError] = useState('')
  const [tripType, setTripType] = useState(restoredInputState.tripType)
  const [travelSeason, setTravelSeason] = useState(restoredInputState.travelSeason)
  const [selectedFilters, setSelectedFilters] = useState(restoredInputState.selectedFilters)
  const [destination, setDestination] = useState(null)
  const [planContext, setPlanContext] = useState(null)
  const [travelInfo, setTravelInfo] = useState({ status: 'idle', car: null, publicTransit: null })
  const [noMatchMessage, setNoMatchMessage] = useState('')
  const [includeVisited, setIncludeVisited] = useState(restoredInputState.includeVisited)
  const [favoriteCities, setFavoriteCities] = useState(() => loadStoredCities(FAVORITES_STORAGE_KEY))
  const [visitedCities, setVisitedCities] = useState(() => loadStoredCities(VISITED_STORAGE_KEY))
  const [compareCities, setCompareCities] = useState(() => loadStoredCities(COMPARE_STORAGE_KEY))
  const [showComparison, setShowComparison] = useState(false)
  const [savedApiKey, setSavedApiKey] = useState(loadStoredApiKey)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [apiKeyNotice, setApiKeyNotice] = useState('')
  const [travelTimeCache, setTravelTimeCache] = useState(loadTravelTimeCache)
  const [lastDestinationId, setLastDestinationId] = useState(null)
  const [selectionMeta, setSelectionMeta] = useState(null)
  const [drawHistory, setDrawHistory] = useState(loadDrawHistory)
  const [showDebugPanel, setShowDebugPanel] = useState(false)
  const [currentPage, setCurrentPage] = useState('main')
  const [aiPlanPrompt, setAiPlanPrompt] = useState('')

  const favoriteDestinations = favoriteCities
    .map((city) => destinations.find((place) => place.city === city))
    .filter(Boolean)

  const visitedDestinations = visitedCities
    .map((city) => destinations.find((place) => place.city === city))
    .filter(Boolean)

  const comparisonDestinations = compareCities
    .filter((city) => favoriteCities.includes(city))
    .map((city) => destinations.find((place) => place.city === city))
    .filter(Boolean)

  const destiny = destination && planContext
    ? calculateDestiny(destination, planContext.selectedFilters, planContext.tripType)
    : null
  const seasonCompatibility = destination && planContext
    ? getSeasonCompatibility(destination, planContext.travelSeason, planContext.tripType)
    : null
  const transportEvaluations = planContext
    ? getTransportEvaluations(travelInfo, planContext.tripType)
    : []
  const bestTransportEvaluation = [...transportEvaluations]
    .filter((item) => item.feasibility)
    .sort((a, b) => (
      b.feasibility.stars - a.feasibility.stars || Number(a.isReference) - Number(b.isReference)
    ))[0] ?? null
  const feasibility = bestTransportEvaluation?.feasibility ?? null
  const feasibilityBasis = bestTransportEvaluation?.basis ?? null
  const transportCompatibility = destination && planContext && bestTransportEvaluation
    ? getTransportCompatibility({
      transportMode: bestTransportEvaluation.mode,
      tripType: planContext.tripType,
      travelInfo,
    })
    : '移動情報を取得すると、最も現実的な交通手段との相性を表示します。'

  const apiKeySource = getGoogleMapsApiKeySource(savedApiKey)
  const maskedApiKey = savedApiKey ? savedApiKey.slice(-4) : ''
  const apiKeyDebugStatus = apiKeySource === 'environment'
    ? '.envで設定済み'
    : apiKeySource === 'localStorage'
      ? '設定カードで設定済み'
      : '未設定'

  useEffect(() => {
    try {
      window.localStorage.setItem(INPUT_STATE_STORAGE_KEY, JSON.stringify({
        departure,
        tripType,
        travelSeason,
        selectedFilters,
        includeVisited,
      }))
    } catch {
      // 保存できない環境でも入力操作は継続する
    }
  }, [departure, tripType, travelSeason, selectedFilters, includeVisited])

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
      if (nextComparison.length < 2) setShowComparison(false)
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
    const nextComparison = compareCities.includes(city)
      ? compareCities.filter((compareCity) => compareCity !== city)
      : [...compareCities, city]

    setCompareCities(nextComparison)
    saveCities(COMPARE_STORAGE_KEY, nextComparison)
    if (nextComparison.length < 2) setShowComparison(false)
  }

  const clearComparison = () => {
    setCompareCities([])
    saveCities(COMPARE_STORAGE_KEY, [])
    setShowComparison(false)
    setAiPlanPrompt('')
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

  const resetInputConditions = () => {
    ++travelRequestId.current
    setDeparture('')
    setDepartureError('')
    setTripType('日帰り')
    setTravelSeason('今の季節')
    setSelectedFilters([])
    setIncludeVisited(false)
    setDestination(null)
    setPlanContext(null)
    setTravelInfo({ status: 'idle', car: null, publicTransit: null })
    setNoMatchMessage('')
    setSelectionMeta(null)
    setLastDestinationId(null)
    setCompareCities([])
    saveCities(COMPARE_STORAGE_KEY, [])
    setShowComparison(false)
  }

  const switchPage = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
    const place = destinations.find((item) => (
      item.id === entry.destinationId || item.city === entry.city
    ))
    if (!place) return

    const requestId = ++travelRequestId.current
    const restoredDeparture = typeof entry.departure === 'string' ? entry.departure : ''
    const restoredTripType = tripTypes.includes(entry.tripType) ? entry.tripType : '日帰り'
    const restoredSeason = seasonOptions.includes(entry.travelSeason) ? entry.travelSeason : '今の季節'
    const restoredFilters = Array.isArray(entry.selectedFilters) ? entry.selectedFilters : []
    const matchingCount = restoredFilters.filter((filter) => place.tags.includes(filter)).length

    setDeparture(restoredDeparture)
    setDepartureError('')
    setTripType(restoredTripType)
    setTravelSeason(restoredSeason)
    setSelectedFilters(restoredFilters)
    setDestination(place)
    setLastDestinationId(place.id)
    setNoMatchMessage('')
    setPlanContext({
      departure: restoredDeparture,
      tripType: restoredTripType,
      travelSeason: restoredSeason,
      selectedFilters: restoredFilters,
    })
    setSelectionMeta({
      matchingCount,
      tripCompatibilityLabel: entry.tripCompatibilityLabel ?? '良い',
      feasibilityStars: entry.feasibilityStars ?? null,
      score: entry.selectionScore ?? 0,
      seasonCompatibility: entry.seasonCompatibility ?? '標準',
      visitedPolicy: entry.visitedPolicy ?? '履歴から再表示',
    })
    setTravelInfo({ status: 'loading', car: null, publicTransit: null })
    setAiPlanPrompt('')
    setCurrentPage('main')
    window.scrollTo({ top: 0, behavior: 'smooth' })

    try {
      const routes = await getTravelInfo({
        origin: restoredDeparture,
        destination: {
          address: place.address,
          latitude: place.latitude,
          longitude: place.longitude,
          googleMapsQuery: place.googleMapsQuery,
          prefecture: place.prefecture,
          city: place.city,
        },
        apiKey: savedApiKey,
      })

      if (requestId === travelRequestId.current) {
        setTravelInfo(routes)
        const restoredEvaluations = getTransportEvaluations(routes, restoredTripType)
        const restoredBest = [...restoredEvaluations]
          .filter((item) => item.feasibility)
          .sort((a, b) => (
            b.feasibility.stars - a.feasibility.stars
            || Number(a.isReference) - Number(b.isReference)
          ))[0] ?? null
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
          status: error?.code === 'API_KEY_INVALID' ? 'api-error' : 'error',
          car: null,
          publicTransit: null,
        })
      }
    }

  }

  const chooseDestination = async (event) => {
    event.preventDefault()
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
    const candidates = matchingDestinations.filter((place) => (
      includeVisited || !visitedCities.includes(place.city)
    ))

    if (candidates.length === 0) {
      setDestination(null)
      setPlanContext(null)
      setTravelInfo({ status: 'idle', car: null, publicTransit: null })
      setSelectionMeta(null)
      setNoMatchMessage(
        matchingDestinations.length > 0
          ? '条件に合う未訪問の旅先がありません。「行った場所も含める」を選んでください。'
          : '条件に合う旅先が見つかりませんでした。条件を減らしてください。',
      )
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
    }))
    const selected = pickWeightedDestination(scoredDestinations)
    const next = selected.destination
    const selectedDestiny = calculateDestiny(next, selectedFilters, tripType)
    const historyEntryId = globalThis.crypto?.randomUUID?.()
      ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
    addHistoryEntry({
      id: historyEntryId,
      destinationId: next.id,
      city: next.city,
      prefecture: next.prefecture,
      departure: normalizedDeparture,
      tripType,
      travelSeason,
      selectedFilters: [...selectedFilters],
      destinyScore: selectedDestiny.score,
      feasibilityStars: selected.feasibilityStars,
      bestTransport: selected.feasibilityStars ? '車' : null,
      budget: next.budgets[tripType],
      drawnAt: new Date().toISOString(),
      selectionScore: selected.score,
      seasonCompatibility: selected.seasonCompatibility,
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
      visitedPolicy: includeVisited ? '含める（訪問済みは減点）' : '除外',
    })
    setPlanContext({
      departure: normalizedDeparture,
      tripType,
      travelSeason,
      selectedFilters: [...selectedFilters],
    })
    setTravelInfo({ status: 'loading', car: null, publicTransit: null })
    setAiPlanPrompt('')

    try {
      const routes = await getTravelInfo({
        origin: normalizedDeparture,
        destination: {
          address: next.address,
          latitude: next.latitude,
          longitude: next.longitude,
          googleMapsQuery: next.googleMapsQuery,
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
        const selectedEvaluations = getTransportEvaluations(routes, tripType)
        const selectedBest = [...selectedEvaluations]
          .filter((item) => item.feasibility)
          .sort((a, b) => (
            b.feasibility.stars - a.feasibility.stars
            || Number(a.isReference) - Number(b.isReference)
          ))[0] ?? null
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
          status: error?.code === 'API_KEY_INVALID' ? 'api-error' : 'error',
          car: null,
          publicTransit: null,
        })
      }
    }
  }

  const showAiPlanSample = () => {
    if (!destination || !planContext) return

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
    setAiPlanPrompt(prompt)
  }

  return (
    <main className="app-shell">
      <section
        className={`trip-card ${currentPage === 'developer' ? 'developer-page' : currentPage === 'history' ? 'history-page' : currentPage === 'favorites' ? 'favorites-page' : 'main-page'}`}
        aria-labelledby={currentPage === 'developer' ? 'developer-page-title' : currentPage === 'history' ? 'history-page-title' : currentPage === 'favorites' ? 'favorites-page-title' : 'app-title'}
      >
        {currentPage === 'main' ? (
          <>
        <header className="hero">
          <div className="logo-mark" aria-hidden="true">
            <svg viewBox="0 0 48 48" role="img">
              <path d="M24 4C14.6 4 7 11.5 7 20.8 7 33.4 24 44 24 44s17-10.6 17-23.2C41 11.5 33.4 4 24 4Z" />
              <circle cx="24" cy="20" r="6" />
            </svg>
          </div>
          <p className="eyebrow">WHERE TO NEXT?</p>
          <h1 id="app-title">DROPTRIP</h1>
          <p className="subtitle">運命の旅行先を決めよう</p>
        </header>

        <form onSubmit={chooseDestination} className="trip-form" noValidate>
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
                placeholder="例：東京都"
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
            <div className="visited-filter-options">
              <label className={includeVisited ? 'selected' : ''}>
                <input
                  type="radio"
                  name="visitedFilter"
                  checked={includeVisited}
                  onChange={() => setIncludeVisited(true)}
                />
                <span aria-hidden="true">✓</span>
                行った場所も含める
              </label>
              <label className={!includeVisited ? 'selected' : ''}>
                <input
                  type="radio"
                  name="visitedFilter"
                  checked={!includeVisited}
                  onChange={() => setIncludeVisited(false)}
                />
                <span aria-hidden="true">✓</span>
                行った場所を除外する
              </label>
            </div>
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

          <button type="submit" className="decide-button">
            <span>旅先を決める</span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m5 12 14-7-4 14-3-6-7-1Z" />
            </svg>
          </button>
        </form>

        {destination && (
          <div className="result-area" aria-live="polite">
            <section className="result-card" aria-label="抽選結果">
              <p className="result-label">YOUR DESTINATION</p>
              <div className="result-pin" aria-hidden="true">✦</div>
              <p className="result-city"><span>旅先：</span>{destination.city}</p>
              <div className="result-divider" />
              <p className="result-recommendation">
                <span>おすすめ</span>
                {destination.recommendation}
              </p>
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
                  <p>WHY THIS PLACE?</p>
                  <h2 id="recommendation-title">今回{destination.city}が選ばれた理由</h2>
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

            <section className="season-compatibility-card" aria-labelledby="season-compatibility-title">
              <div>
                <p>SEASON MATCH</p>
                <h2 id="season-compatibility-title">季節との相性</h2>
              </div>
              <strong aria-label={`${seasonCompatibility.stars}つ星`}>{seasonCompatibility.starsLabel}</strong>
              <p>{seasonCompatibility.description}</p>
              <span>ベストシーズン：{destination.bestSeasons.join('・')}</span>
            </section>

            <section className="detail-plan" aria-labelledby="detail-plan-title">
              <div className="detail-heading">
                <span className="detail-heading-icon" aria-hidden="true">✦</span>
                <div>
                  <p>TRIP GUIDE</p>
                  <h2 id="detail-plan-title">詳細プラン</h2>
                </div>
              </div>

              <p className="plan-route-title">
                {planContext.departure}から{destination.city}への
                <strong>{planContext.tripType}</strong>旅行プラン
              </p>

              <button type="button" className="ai-plan-button" onClick={showAiPlanSample}>
                <span aria-hidden="true">✦</span>
                AIでプランを作る
              </button>

              {aiPlanPrompt && (
                <section className="ai-plan-card" aria-labelledby="ai-plan-title">
                  <div className="ai-plan-heading">
                    <span aria-hidden="true">AI</span>
                    <div><p>PERSONALIZED TRIP</p><h3 id="ai-plan-title">AIプラン案</h3></div>
                    <b>サンプル</b>
                  </div>
                  <p className="ai-plan-message">
                    出発地、旅行タイプ、季節、こだわり条件、移動情報をもとに、
                    より自然な旅行プランを生成する予定です。
                  </p>
                  <dl>
                    <div><dt>出発地</dt><dd>{planContext.departure}</dd></div>
                    <div><dt>旅先</dt><dd>{destination.prefecture} {destination.city}</dd></div>
                    <div><dt>旅行タイプ</dt><dd>{planContext.tripType}</dd></div>
                    <div><dt>季節</dt><dd>{planContext.travelSeason === '今の季節' ? `今の季節（${getCurrentSeason()}）` : planContext.travelSeason}</dd></div>
                    <div><dt>こだわり条件</dt><dd>{planContext.selectedFilters.length > 0 ? planContext.selectedFilters.join('、') : '指定なし'}</dd></div>
                    <div><dt>交通手段比較の結果</dt><dd>{bestTransportEvaluation ? `${bestTransportEvaluation.mode}が最も現実的（${bestTransportEvaluation.feasibility.starsLabel}）` : '移動情報取得後に評価'}</dd></div>
                    <div><dt>予算目安</dt><dd>1人あたり {destination.budgets[planContext.tripType]}</dd></div>
                  </dl>
                  <p className="ai-plan-notice">
                    現在はサンプル表示です。API接続後に、あなた専用の旅行プランを作成します。
                  </p>
                </section>
              )}

              <div className="plan-card schedule-card">
                <h3>
                  <span aria-hidden="true">▦</span>
                  おすすめスケジュール
                </h3>
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
              </div>

              <div className="plan-card travel-card">
                  <h3><span aria-hidden="true">⌁</span>交通手段比較</h3>
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
                            <span aria-label={item.feasibility ? `${item.feasibility.stars}つ星` : '未評価'}>
                              {item.feasibility?.starsLabel ?? '未評価'}
                            </span>
                          </header>
                          {item.mode === '車' && (
                            travelInfo.car ? (
                              <dl>
                                <div><dt>距離</dt><dd>{travelInfo.car.distance ?? '取得できませんでした'}</dd></div>
                                <div><dt>時間</dt><dd>{travelInfo.car.duration}</dd></div>
                              </dl>
                            ) : <p>車の経路が見つかりませんでした</p>
                          )}
                          {item.mode === '鉄道' && (
                            travelInfo.publicTransit ? (
                              <dl>
                                <div><dt>時間</dt><dd>{travelInfo.publicTransit.duration}</dd></div>
                                {travelInfo.publicTransit.distance && <div><dt>距離</dt><dd>{travelInfo.publicTransit.distance}</dd></div>}
                                {travelInfo.publicTransit.fare && <div><dt>料金</dt><dd>{travelInfo.publicTransit.fare}</dd></div>}
                              </dl>
                            ) : <p>鉄道を含む公共交通機関の経路が見つかりませんでした</p>
                          )}
                          {item.mode === '高速バス' && <p>中距離〜長距離向きの参考評価です。詳細な時刻・料金は今後対応予定です。</p>}
                          {item.mode === '夜行バス' && <p>長距離・宿泊旅行向きの選択肢として参考表示しています。詳細な時刻・料金は今後対応予定です。</p>}
                          {item.mode === '飛行機' && <p>長距離旅行向きの選択肢として参考表示しています。詳細な時刻・料金は今後対応予定です。</p>}
                          {bestTransportEvaluation?.mode === item.mode && <b>最も現実的</b>}
                        </article>
                      ))}
                  </div>
                  {travelInfo.status === 'unconfigured' && (
                    <div className="travel-state travel-unconfigured">
                      <strong><span aria-hidden="true">!</span>APIキー未設定</strong>
                      <p>Google Maps APIキーを設定すると、実際の移動時間と距離が表示されます。</p>
                      <div className="travel-preview">
                        <b>取得予定</b>
                        <ul>
                          <li>車の移動時間</li>
                          <li>車の移動距離</li>
                          <li>公共交通機関の移動時間</li>
                        </ul>
                      </div>
                    </div>
                  )}
                  {travelInfo.status === 'error' && (
                    <div className="travel-state travel-error" role="alert">
                      <strong>移動情報を取得できませんでした。</strong>
                      <p>出発地の入力内容やAPIキーを確認してください。</p>
                    </div>
                  )}
                  {travelInfo.status === 'api-error' && (
                    <div className="travel-state travel-error" role="alert">
                      <strong>APIキーが無効、またはRoutes APIが有効化されていない可能性があります</strong>
                      <p>Google CloudのAPIキー、Routes API、課金設定を確認してください。</p>
                    </div>
                  )}
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
                    <p>
                      {bestTransportEvaluation.isReference
                        ? `${bestTransportEvaluation.mode}を旅行タイプと取得済みルートから参考評価した結果、${feasibility.detail}`
                        : `${bestTransportEvaluation.mode}で${feasibilityBasis.duration}のため、${feasibility.detail}`}
                    </p>
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
          </div>
        )}

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

        <nav className="page-switch-card" aria-label="開発者ページへの移動">
          <div>
            <span aria-hidden="true">⚙</span>
            <p>API設定やデバッグ情報を確認できます</p>
          </div>
          <button type="button" onClick={() => switchPage('developer')}>
            開発者ページ
            <span aria-hidden="true">→</span>
          </button>
        </nav>

        <p className="footer-note">思いがけない場所へ、出かけよう。</p>
          </>
        ) : currentPage === 'favorites' ? (
          <>
            <header className="developer-page-header favorites-page-header">
              <button type="button" onClick={() => switchPage('main')}><span aria-hidden="true">←</span>メイン画面に戻る</button>
              <div className="developer-page-icon favorites-page-icon" aria-hidden="true">♥</div>
              <p>MY FAVORITES</p>
              <h1 id="favorites-page-title">お気に入り</h1>
              <span>気になる旅先を比べて、次の旅行を考えましょう</span>
            </header>

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
                          <button type="button" className={compareCities.includes(place.city) ? 'selected' : ''} onClick={() => toggleComparison(place.city)}>
                            {compareCities.includes(place.city) ? '比較対象から外す' : '比較対象に追加'}
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
                <button type="button" className="compare-open-button" onClick={() => setShowComparison(true)}>
                  選択した{comparisonDestinations.length}件を比較する <span aria-hidden="true">→</span>
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

            {showComparison && comparisonDestinations.length >= 2 && (
              <section className="comparison-section" aria-labelledby="comparison-title">
                <div className="comparison-heading">
                  <div><p>COMPARE TRIPS</p><h2 id="comparison-title">旅先を比較</h2></div>
                  <button type="button" onClick={() => setShowComparison(false)}>閉じる</button>
                </div>
                <div className="comparison-context">
                  <div>
                    <span>旅行タイプ：<strong>{tripType}</strong></span>
                    <span>旅行予定季節：<strong>{travelSeason}</strong></span>
                  </div>
                  <button type="button" onClick={clearComparison}>選択を解除</button>
                </div>
                <div className="comparison-list">
                  {comparisonDestinations.map((place) => {
                    const matchingConditions = selectedFilters.filter((filter) => place.tags.includes(filter))
                    const latestEvaluation = drawHistory.find((entry) => entry.city === place.city)
                    const placeSeason = getSeasonCompatibility(place, travelSeason, tripType)
                    return (
                      <article className="comparison-card" key={place.city}>
                        <header><p>{place.prefecture}</p><h3>{place.city}</h3></header>
                        <dl>
                          <div><dt>タグ</dt><dd className="comparison-tags">{place.tags.map((tag) => <span key={tag}>{tag}</span>)}</dd></div>
                          <div><dt>予算目安</dt><dd>1人あたり {place.budgets[tripType]}</dd></div>
                          <div><dt>一致条件</dt><dd>{matchingConditions.length}件{matchingConditions.length > 0 ? `（${matchingConditions.join('、')}）` : ''}</dd></div>
                          <div><dt>おすすめポイント</dt><dd>{place.highlights}</dd></div>
                          <div><dt>旅行タイプとの相性</dt><dd>{tripCompatibility[tripType]}</dd></div>
                          <div><dt>季節との相性</dt><dd>{placeSeason.starsLabel} {placeSeason.description}</dd></div>
                          <div><dt>最適な移動手段</dt><dd>{latestEvaluation?.bestTransport ?? '未評価'}</dd></div>
                        </dl>
                      </article>
                    )
                  })}
                </div>
              </section>
            )}
            <p className="footer-note">DROPTRIP Favorites</p>
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
              <span>保存されている履歴を最大20件まで表示します</span>
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
              キーの全文は画面に再表示しません。.envにキーがある場合はそちらが優先されます。
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
              <div><dt>現在の旅先</dt><dd>{destination ? `${destination.prefecture} ${destination.city}` : '未抽選'}</dd></div>
              <div><dt>運命度スコア</dt><dd>{destiny ? `${destiny.score}%` : '未算出'}</dd></div>
              <div><dt>行けそう度スコア</dt><dd>{feasibility ? `${feasibility.stars}/5（${feasibility.starsLabel}）` : '未算出'}</dd></div>
              <div><dt>抽選スコア</dt><dd>{selectionMeta ? `${selectionMeta.score}pt` : '未算出'}</dd></div>
              <div><dt>条件一致数</dt><dd>{selectionMeta ? `${selectionMeta.matchingCount}件` : '未算出'}</dd></div>
              <div><dt>旅行タイプ相性</dt><dd>{selectionMeta?.tripCompatibilityLabel ?? '未算出'}</dd></div>
              <div><dt>季節相性</dt><dd>{selectionMeta?.seasonCompatibility ?? '未算出'}</dd></div>
              <div><dt>抽選方式</dt><dd>重み付きランダム（ランダム要素あり）</dd></div>
              <div><dt>APIキー設定状態</dt><dd>{apiKeyDebugStatus}</dd></div>
              <div><dt>移動情報取得状態</dt><dd>{travelStatusLabels[travelInfo.status] ?? travelInfo.status}</dd></div>
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
