const TAGS = ['温泉', '海', '山', 'グルメ', 'カップル向け']
const TRIP_TYPES = ['日帰り', '1泊2日', '2泊3日']
const SEASONS = ['春', '夏', '秋', '冬']

const regionPrefectures = {
  北海道: ['北海道'],
  東北: ['青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県'],
  関東: ['茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県'],
  北陸: ['新潟県', '富山県', '石川県', '福井県'],
  中部: ['山梨県', '長野県', '岐阜県', '静岡県', '愛知県', '三重県'],
  関西: ['滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県'],
  中国: ['鳥取県', '島根県', '岡山県', '広島県', '山口県'],
  四国: ['徳島県', '香川県', '愛媛県', '高知県'],
  九州沖縄: ['福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'],
}

const countBy = (items, keys, matcher) => Object.fromEntries(
  keys.map((key) => [key, items.filter((item) => matcher(item, key)).length]),
)

const extractBudgetMinimum = (value) => {
  const values = String(value ?? '').match(/[\d,]+/g)
    ?.map((number) => Number(number.replaceAll(',', '')))
    .filter(Number.isFinite) ?? []
  return values.length > 0 ? Math.min(...values) : null
}

const sortCounts = (counts) => Object.entries(counts)
  .sort(([, left], [, right]) => right - left)

export const analyzeDrawBalance = (destinations) => {
  const total = destinations.length
  const prefectureCounts = destinations.reduce((counts, destination) => {
    counts[destination.prefecture] = (counts[destination.prefecture] ?? 0) + 1
    return counts
  }, {})
  const tagCounts = countBy(destinations, TAGS, (destination, tag) => destination.tags?.includes(tag))
  const tripTypeCounts = countBy(destinations, TRIP_TYPES, (destination, tripType) => {
    const planDays = destination.plans?.[tripType]?.length ?? 0
    const requiredDays = { 日帰り: 1, '1泊2日': 2, '2泊3日': 3 }[tripType]
    if (planDays < requiredDays) return false
    if (tripType === '日帰り') return destination.stationAccessMinutes <= 60
    if (tripType === '1泊2日') return destination.stationAccessMinutes <= 120
    return true
  })
  const seasonCounts = countBy(destinations, SEASONS, (destination, season) => (
    destination.bestSeasons?.includes(season)
  ))
  const regionCounts = Object.fromEntries(Object.entries(regionPrefectures).map(([region, prefectures]) => [
    region,
    destinations.filter((destination) => prefectures.includes(destination.prefecture)).length,
  ]))
  const stationAccessCounts = {
    '駅周辺（0分）': destinations.filter((item) => item.stationAccessMinutes === 0).length,
    '1〜15分': destinations.filter((item) => item.stationAccessMinutes > 0 && item.stationAccessMinutes <= 15).length,
    '16〜30分': destinations.filter((item) => item.stationAccessMinutes > 15 && item.stationAccessMinutes <= 30).length,
    '31〜60分': destinations.filter((item) => item.stationAccessMinutes > 30 && item.stationAccessMinutes <= 60).length,
    '61分以上': destinations.filter((item) => item.stationAccessMinutes > 60).length,
  }
  const budgetCounts = { '2.5万円未満': 0, '2.5〜4万円': 0, '4万円以上': 0, '未設定': 0 }
  destinations.forEach((destination) => {
    const minimum = extractBudgetMinimum(destination.budgets?.['1泊2日'] ?? destination.budget?.['1泊2日'])
    if (minimum === null) budgetCounts['未設定'] += 1
    else if (minimum < 25_000) budgetCounts['2.5万円未満'] += 1
    else if (minimum < 40_000) budgetCounts['2.5〜4万円'] += 1
    else budgetCounts['4万円以上'] += 1
  })

  const warnings = []
  Object.entries(tagCounts).forEach(([tag, count]) => {
    const ratio = count / total
    if (ratio < 0.2) warnings.push(`${tag}タグが少なめです（${count}件 / ${total}件）`)
    if (ratio > 0.65) warnings.push(`${tag}タグが多めです（${count}件 / ${total}件）`)
  })
  Object.entries(seasonCounts).forEach(([season, count]) => {
    if (count / total < 0.2) warnings.push(`${season}向けの候補が少なめです（${count}件）`)
  })
  Object.entries(regionCounts).forEach(([region, count]) => {
    if (count < 4) warnings.push(`${region}地方の候補が少なめです（${count}件）`)
  })
  Object.entries(tripTypeCounts).forEach(([tripType, count]) => {
    if (count / total < 0.8) warnings.push(`${tripType}向け候補が少なめです（${count}件）`)
  })
  if ((stationAccessCounts['61分以上'] / total) > 0.25) {
    warnings.push('駅から61分以上かかる候補の割合が高めです')
  }

  return {
    total,
    prefectureCounts: sortCounts(prefectureCounts),
    tagCounts,
    tripTypeCounts,
    seasonCounts,
    regionCounts,
    stationAccessCounts,
    budgetCounts,
    warnings,
  }
}
