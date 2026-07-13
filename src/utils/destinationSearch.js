export const normalizeDestinationSearchText = (value) => String(value ?? '')
  .normalize('NFKC')
  .toLowerCase()
  .trim()
  .replace(/\s+/g, '')

const destinationSearchAliasMap = {
  台東区: ['浅草', '上野', '浅草寺', '東京都台東区'],
  墨田区: ['スカイツリー', '東京スカイツリー', '隅田川', '東京都墨田区'],
  千代田区: ['東京駅', '皇居', '丸の内', '東京都千代田区'],
  新宿区: ['新宿', '新宿御苑', '都庁', '東京都新宿区'],
  渋谷区: ['渋谷', 'スクランブル交差点', '原宿', '表参道', '東京都渋谷区'],
  江東区: ['豊洲', 'お台場', '湾岸', '東京都江東区'],
  浦安市: ['舞浜', 'ベイエリア', '千葉県浦安市'],
  藤沢市: ['江の島', '湘南', '片瀬江ノ島', '神奈川県藤沢市'],
}

export const createDestinationSearchFields = (destination = {}) => [
  { field: '旅先ID', value: destination.id },
  { field: '旅先名', value: destination.name },
  { field: '市区町村', value: destination.city },
  { field: '都道府県', value: destination.prefecture },
  { field: '都道府県-市区町村', value: destination.prefecture && destination.city ? `${destination.prefecture}-${destination.city}` : '' },
  { field: '都道府県市区町村', value: destination.prefecture && destination.city ? `${destination.prefecture}${destination.city}` : '' },
  { field: '地域', value: destination.region },
  { field: 'おすすめ文', value: destination.recommendText },
  { field: 'おすすめ文', value: destination.recommendation },
  { field: 'ハイライト', value: destination.highlight },
  { field: 'ハイライト', value: destination.highlights },
  ...(destinationSearchAliasMap[destination.city] ?? []).map((alias) => ({ field: '別名', value: alias })),
  ...(destination.tags ?? []).map((tag) => ({ field: 'タグ', value: tag })),
  ...(destination.localFoodCandidates ?? []).map((food) => ({ field: 'グルメ候補', value: food })),
  ...(destination.localFoodDetails ?? []).map((food) => ({ field: 'グルメ名', value: food?.name })),
  ...(destination.touristSpots ?? []).map((spot) => ({ field: 'スポット名', value: spot?.name })),
  ...(destination.trendHighlights ?? []).map((item) => ({ field: '映え・トレンド', value: item?.name })),
  ...(destination.nearbyDestinationHints ?? []).map((hint) => ({ field: '周辺候補', value: hint })),
].filter((item) => item.value)

export const getDestinationSearchMatches = (destination = {}, keyword = '') => {
  const normalizedKeyword = normalizeDestinationSearchText(keyword)
  if (!normalizedKeyword) return []

  return createDestinationSearchFields(destination)
    .map((item) => ({ ...item, normalizedValue: normalizeDestinationSearchText(item.value) }))
    .filter((item) => {
      if (!item.normalizedValue.includes(normalizedKeyword)) return false
      return !(normalizedKeyword === '京都' && item.normalizedValue.startsWith('東京都'))
    })
    .map(({ field, value }) => ({ field, value }))
}

export const getDestinationDedupeKey = (destination = {}) => (
  destination.id
  || (destination.prefecture && destination.city ? `${destination.prefecture}-${destination.city}` : '')
  || (destination.prefecture && destination.name ? `${destination.prefecture}-${destination.name}` : '')
  || destination.city
  || destination.name
  || ''
)

export const dedupeDestinations = (destinationList = []) => Array.from(
  destinationList.reduce((uniqueMap, place) => {
    const uniqueKey = getDestinationDedupeKey(place)
    if (uniqueKey && !uniqueMap.has(uniqueKey)) uniqueMap.set(uniqueKey, place)
    return uniqueMap
  }, new Map()).values(),
)

export const filterDestinationSearchResults = (destinationList = [], keyword = '') => {
  const pool = dedupeDestinations(destinationList)
  const normalizedKeyword = normalizeDestinationSearchText(keyword)
  if (!normalizedKeyword) return pool
  return pool.filter((destination) => getDestinationSearchMatches(destination, normalizedKeyword).length > 0)
}
