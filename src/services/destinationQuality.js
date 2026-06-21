import {
  DEFAULT_FOOD_IMAGE,
  DEFAULT_SCENERY_IMAGE,
  DEFAULT_TRAVEL_IMAGE,
  isValidImageUrl,
} from '../data/destinationImages'

const requiredTripTypes = ['日帰り', '1泊2日', '2泊3日']
const allowedTags = ['温泉', '海', '山', 'グルメ', 'カップル向け']
const tagKeywords = {
  温泉: ['温泉', '湯'],
  海: ['海', '港', '島', 'ビーチ', '砂浜', '海鮮'],
  山: ['山', '高原', '自然', '渓谷', '湖', '紅葉'],
  グルメ: ['グルメ', '料理', '寿司', '海鮮', '食', 'カフェ', 'ラーメン'],
  カップル向け: ['夜景', '街並み', '散策', 'ロマン', 'デート', '景色', '絶景', '温泉'],
}

const addIssue = (issues, field, message) => issues.push({ field, message })

const validateBudget = (budgets) => {
  if (!budgets || typeof budgets !== 'object') return false
  return requiredTripTypes.every((tripType) => {
    const values = String(budgets[tripType] ?? '').match(/[\d,]+/g)
      ?.map((value) => Number(value.replaceAll(',', '')))
      .filter(Number.isFinite) ?? []
    if (values.length === 0) return false
    const minimum = Math.min(...values)
    const maximum = Math.max(...values)
    return minimum >= 1_000 && maximum <= 500_000 && minimum <= maximum
  })
}

const validateTagRecommendationMatch = (destination) => {
  const text = `${destination.recommendText ?? ''} ${destination.recommendation ?? ''}`
  if (!text.trim() || !Array.isArray(destination.tags)) return false
  return destination.tags.some((tag) => (
    tagKeywords[tag]?.some((keyword) => text.includes(keyword))
  ))
}

export const runDestinationQualityChecks = (destinations) => {
  const duplicateKeys = new Set()
  const seenKeys = new Set()

  destinations.forEach((destination) => {
    const key = `${destination.prefecture}::${destination.city}`
    if (seenKeys.has(key)) duplicateKeys.add(key)
    seenKeys.add(key)
  })

  const results = destinations.map((destination, index) => {
    const issues = []
    const name = destination.city || `データ${index + 1}`

    if (!destination.city?.trim()) addIssue(issues, 'city', '市町村名がありません')
    if (!destination.prefecture?.trim()) addIssue(issues, 'prefecture', '都道府県がありません')
    if (!Array.isArray(destination.tags) || destination.tags.length === 0) {
      addIssue(issues, 'tags', 'タグが設定されていません')
    } else if (destination.tags.some((tag) => !allowedTags.includes(tag))) {
      addIssue(issues, 'tags', '未定義のタグが含まれています')
    }
    if (!destination.recommendText?.trim()) addIssue(issues, 'recommendText', 'おすすめ文がありません')

    ;['heroImage', 'foodImage', 'sceneryImage'].forEach((field) => {
      if (!destination[field]) addIssue(issues, field, `${field}がありません`)
      else if (!isValidImageUrl(destination[field])) addIssue(issues, field, `${field}のURLが不正です`)
    })

    if (!destination.nearestStation?.trim()) addIssue(issues, 'nearestStation', '最寄り駅がありません')
    if (!destination.nearestStationLabel?.trim()) addIssue(issues, 'nearestStationLabel', '最寄り駅表示がありません')
    if (!Number.isFinite(destination.stationAccessMinutes) || destination.stationAccessMinutes < 0) {
      addIssue(issues, 'stationAccessMinutes', '現地アクセス時間が不正です')
    }
    if (!Array.isArray(destination.bestSeasons) || destination.bestSeasons.length === 0) {
      addIssue(issues, 'bestSeasons', 'ベストシーズンがありません')
    }
    if (!destination.seasonHighlights || typeof destination.seasonHighlights !== 'object') {
      addIssue(issues, 'seasonHighlights', '季節の見どころがありません')
    }
    if (!validateBudget(destination.budgets)) addIssue(issues, 'budgets', '予算の欠損または極端な値があります')
    if (duplicateKeys.has(`${destination.prefecture}::${destination.city}`)) {
      addIssue(issues, 'city / prefecture', '同じ旅行先が重複しています')
    }
    if (!validateTagRecommendationMatch(destination)) {
      addIssue(issues, 'tags / recommendText', 'タグとおすすめ文の関連性を確認してください')
    }

    return {
      id: destination.id ?? `${destination.prefecture}-${name}-${index}`,
      city: name,
      prefecture: destination.prefecture || '都道府県未設定',
      issues,
      fields: [...new Set(issues.map((issue) => issue.field))],
    }
  })

  const fallbackReady = [DEFAULT_TRAVEL_IMAGE, DEFAULT_FOOD_IMAGE, DEFAULT_SCENERY_IMAGE]
    .every(isValidImageUrl)
  const warnings = results.filter((result) => result.issues.length > 0)

  return {
    total: results.length,
    passed: results.length - warnings.length,
    warningCount: warnings.length,
    warnings,
    globalChecks: [
      {
        label: '画像URLが空・不正・読み込み失敗の場合のプレースホルダー切り替え',
        passed: fallbackReady,
      },
      {
        label: '旅行先の重複チェック',
        passed: duplicateKeys.size === 0,
      },
    ],
  }
}
