import {
  DEFAULT_FOOD_IMAGE,
  DEFAULT_SCENERY_IMAGE,
  DEFAULT_TRAVEL_IMAGE,
  getImageUrl,
  isExternalImage,
  isIllustrationImage,
  isValidImageUrl,
  MAJOR_DESTINATION_CITIES,
} from '../data/destinationImages'

const requiredTripTypes = ['日帰り', '1泊2日', '2泊3日']
const allowedTags = ['温泉', '海', '山', 'グルメ', 'カップル向け']
const prefectureTarget = 47
const tagKeywords = {
  温泉: ['温泉', '湯'],
  海: ['海', '港', '島', 'ビーチ', '砂浜', '海鮮'],
  山: ['山', '高原', '自然', '渓谷', '湖', '紅葉'],
  グルメ: ['グルメ', '料理', '寿司', '海鮮', '食', 'カフェ', 'ラーメン'],
  カップル向け: ['夜景', '街並み', '散策', 'ロマン', 'デート', '景色', '絶景', '温泉'],
}

const allowedRegions = ['北海道', '東北', '関東', '中部', '関西', '中国', '四国', '九州', '沖縄']
const companionFitKeys = ['couple', 'solo', 'friends', 'family', 'pet']
const purposeFitKeys = ['gourmet', 'history', 'onsen', 'nature', 'activity', 'experience', 'walking', 'relax']
const stayFitKeys = ['dayTrip', 'oneNight', 'twoNights', 'longStay']
const priorityQualityCities = [
  '京都市', '奈良市', '小樽市', '札幌市', '函館市', '金沢市', '箱根町', '熱海市', '草津町', '日光市',
  '鎌倉市', '横浜市', '松島町', '仙台市', '福岡市', '長崎市', '広島市', '廿日市市', '那覇市', '石垣市',
  '高山市', '伊勢市', '白浜町', '軽井沢町', '富良野市', '会津若松市', '尾道市', '倉敷市', '松江市', '別府市',
]

const hasFitKeys = (value, keys) => value && typeof value === 'object' && keys.every((key) => Number.isFinite(Number(value[key])))
const hasLocalFoods = (destination) => Array.isArray(destination.localFoodCandidates) && destination.localFoodCandidates.length > 0
const hasNearbyHints = (destination) => Array.isArray(destination.nearbyDestinationHints) && destination.nearbyDestinationHints.length > 0
const hasTouristSpots = (destination) => Array.isArray(destination.touristSpots) && destination.touristSpots.length > 0
const hasEnoughTouristSpots = (destination) => Array.isArray(destination.touristSpots) && destination.touristSpots.length >= 3
const hasLocalFoodDetails = (destination) => Array.isArray(destination.localFoodDetails) && destination.localFoodDetails.length > 0

const addIssue = (issues, field, message, recommendation = `${field}の設定内容を確認してください`) => (
  issues.push({ field, message, recommendation })
)

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
    if (!destination.recommendText?.trim()) {
      addIssue(issues, 'recommendText', 'おすすめ文がありません', '旅先の特徴が伝わるおすすめ文を追加してください')
    } else if (destination.recommendText.trim().length < 10) {
      addIssue(issues, 'recommendText', 'おすすめ文が短く、魅力が伝わりにくい可能性があります', '特徴を含む10文字以上の自然な文章にしてください')
    }

    ;['heroImage', 'foodImage', 'sceneryImage'].forEach((field) => {
      if (!destination[field]) addIssue(issues, field, `${field}がありません`)
      else if (!isValidImageUrl(destination[field])) addIssue(issues, field, `${field}のURLが不正です`)
      else if (isExternalImage(destination[field])) {
        addIssue(issues, field, `${field}が外部URLを使用しています`, '公開表示はローカルの個別画像・カテゴリ画像・汎用画像へ移行してください')
      }
      else if (isIllustrationImage(destination[field])) {
        addIssue(issues, field, `${field}にイラスト画像が使われています`, '権利確認済みの実写真または実写真風フォールバックへ変更してください')
      }
    })

    if (!destination.nearestStation?.trim()) addIssue(issues, 'nearestStation', '最寄り駅がありません')
    if (!destination.nearestStationLabel?.trim()) addIssue(issues, 'nearestStationLabel', '最寄り駅表示がありません', '路線・事業者を含む自然な駅名表示を追加してください')
    else if (/JRJR|駅\s*駅/.test(destination.nearestStationLabel)) {
      addIssue(issues, 'nearestStationLabel', '最寄り駅表示が不自然です', '重複した事業者名や「駅」を整理してください')
    }
    if (!Number.isFinite(destination.stationAccessMinutes) || destination.stationAccessMinutes < 0 || destination.stationAccessMinutes > 180) {
      addIssue(issues, 'stationAccessMinutes', '現地アクセス時間が欠損または極端です', '0〜180分の現実的な所要時間に修正してください')
    }
    if (!Array.isArray(destination.bestSeasons) || destination.bestSeasons.length === 0) {
      addIssue(issues, 'bestSeasons', 'ベストシーズンがありません')
    }
    if (!allowedRegions.includes(destination.region)) addIssue(issues, 'region', 'regionが9分類のいずれにも設定されていません', 'prefectureに対応するregionを設定してください')
    if (!hasLocalFoods(destination)) addIssue(issues, 'localFoodCandidates', 'ご当地グルメ候補が未設定です', 'localFoodCandidatesを1件以上設定してください')
    if (!hasFitKeys(destination.companionFit, companionFitKeys)) addIssue(issues, 'companionFit', '同行者・旅のスタイル相性が未設定です', 'couple / solo / friends / family / pet のスコアを設定してください')
    if (!hasFitKeys(destination.purposeFit, purposeFitKeys)) addIssue(issues, 'purposeFit', '旅の目的相性が未設定です', '目的別スコアを設定してください')
    if (!hasFitKeys(destination.stayFit, stayFitKeys)) addIssue(issues, 'stayFit', '旅行日程との相性が未設定です', 'dayTrip / oneNight / twoNights / longStay のスコアを設定してください')
    if (!hasNearbyHints(destination)) addIssue(issues, 'nearbyDestinationHints', '長期旅行向けの周遊候補ヒントが未設定です', '同じ地域・近隣県・方面表現のヒントを設定してください')

    if (!destination.seasonHighlights || typeof destination.seasonHighlights !== 'object') {
      addIssue(issues, 'seasonHighlights', '季節の見どころがありません', '春・夏・秋・冬の見どころを設定してください')
    } else {
      const missingSeasonHighlights = ['春', '夏', '秋', '冬'].filter((season) => !destination.seasonHighlights[season]?.trim())
      if (missingSeasonHighlights.length > 0) {
        addIssue(issues, 'seasonHighlights', `${missingSeasonHighlights.join('・')}の見どころがありません`, '全季節の説明を追加してください')
      }
    }
    if (!validateBudget(destination.budgets)) addIssue(issues, 'budgets', '予算の欠損または極端な値があります', '各旅行タイプを1,000〜500,000円の昇順範囲で設定してください')
    if (duplicateKeys.has(`${destination.prefecture}::${destination.city}`)) {
      addIssue(issues, 'city / prefecture', '同じ旅行先が重複しています')
    }
    if (!validateTagRecommendationMatch(destination)) {
      addIssue(issues, 'tags / recommendText', 'タグとおすすめ文の関連性が弱い可能性があります', 'タグに対応する魅力をおすすめ文へ含めてください')
    }
    if (destination.tags?.includes('海') && !destination.bestSeasons?.includes('夏')) {
      addIssue(issues, 'bestSeasons', '海タグがありますが夏がベストシーズンに含まれていません', '地域特性に問題がなければ夏を追加してください')
    }
    if (destination.tags?.includes('温泉') && !destination.bestSeasons?.some((season) => ['秋', '冬'].includes(season))) {
      addIssue(issues, 'bestSeasons', '温泉タグと秋・冬の季節設定が一致していません', '秋または冬をベストシーズンに追加してください')
    }

    return {
      id: destination.id ?? `${destination.prefecture}-${name}-${index}`,
      city: name,
      prefecture: destination.prefecture || '都道府県未設定',
      issues,
      fields: [...new Set(issues.map((issue) => issue.field))],
      recommendations: [...new Set(issues.map((issue) => issue.recommendation))],
    }
  })

  const fallbackReady = [DEFAULT_TRAVEL_IMAGE, DEFAULT_FOOD_IMAGE, DEFAULT_SCENERY_IMAGE]
    .every(isValidImageUrl)
  const warnings = results.filter((result) => result.issues.length > 0)
  const coveredPrefectures = new Set(destinations.map((destination) => destination.prefecture).filter(Boolean)).size
  const tagCounts = Object.fromEntries(allowedTags.map((tag) => [
    tag,
    destinations.filter((destination) => destination.tags?.includes(tag)).length,
  ]))
  const categoryUsage = {}
  destinations.forEach((destination) => {
    ;['heroImage', 'foodImage', 'sceneryImage'].forEach((field) => {
      const url = getImageUrl(destination[field])
      if (url.startsWith('/images/categories/')) categoryUsage[url] = (categoryUsage[url] ?? 0) + 1
    })
  })
  const categoryUsageEntries = Object.entries(categoryUsage).sort(([, left], [, right]) => right - left)
  const overusedCategoryImages = categoryUsageEntries.filter(([, count]) => count > 20)
  const missingMajorImages = MAJOR_DESTINATION_CITIES.filter((city) => {
    const destination = destinations.find((item) => item.city === city)
    return !destination || !getImageUrl(destination.heroImage).startsWith('/images/destinations/')
  })
  const imageStatus = destinations.reduce((summary, destination) => {
    const images = ['heroImage', 'foodImage', 'sceneryImage'].map((field) => destination[field])
    const allImagesValid = images.every(isValidImageUrl)
    const hasIllustration = images.some(isIllustrationImage)
    const sources = images.map((image) => image?.source ?? image?.imageSource ?? '')
    if (sources.includes('curated')) summary.configured += 1
    else if (sources.includes('fallback')) summary.tagFallback += 1
    else if (sources.includes('placeholder')) summary.genericFallback += 1
    if (images.some(isExternalImage)) summary.external += 1
    if (!allImagesValid) summary.invalid += 1
    if (!allImagesValid || hasIllustration) summary.needsReview += 1
    if (hasIllustration) summary.illustration += 1
    if (images.some((image) => (image?.status ?? image?.imageStatus) === 'temporary')) summary.temporary += 1
    if (images.some((image) => !(image?.credit ?? image?.imageCredit))) summary.creditMissing += 1
    if (images.some((image) => (
      !(image?.license ?? image?.imageLicense)
      || ['unconfirmed', 'official_pending'].includes(image?.status ?? image?.imageStatus)
    ))) summary.licenseUnconfirmed += 1
    return summary
  }, {
    configured: 0,
    tagFallback: 0,
    genericFallback: 0,
    illustration: 0,
    external: 0,
    invalid: 0,
    temporary: 0,
    creditMissing: 0,
    licenseUnconfirmed: 0,
    needsReview: 0,
  })

  const regionCounts = Object.fromEntries(allowedRegions.map((region) => [
    region,
    destinations.filter((destination) => destination.region === region).length,
  ]))
  const purposeFitStrongCounts = Object.fromEntries(purposeFitKeys.map((key) => [
    key,
    destinations.filter((destination) => Number(destination.purposeFit?.[key] ?? 0) >= 70).length,
  ]))
  const stayFitStrongCounts = Object.fromEntries(stayFitKeys.map((key) => [
    key,
    destinations.filter((destination) => Number(destination.stayFit?.[key] ?? 0) >= 70).length,
  ]))

  const metadataStatus = {
    destinationTotal: destinations.length,
    regionCounts,
    purposeFitStrongCounts,
    stayFitStrongCounts,
    missingRegion: destinations.filter((destination) => !allowedRegions.includes(destination.region)).map((destination) => destination.city),
    missingLocalFood: destinations.filter((destination) => !hasLocalFoods(destination)).map((destination) => destination.city),
    missingLocalFoodDetails: destinations.filter((destination) => !hasLocalFoodDetails(destination)).map((destination) => destination.city),
    missingTouristSpots: destinations.filter((destination) => !hasTouristSpots(destination)).map((destination) => destination.city),
    touristSpotShortage: destinations.filter((destination) => hasTouristSpots(destination) && !hasEnoughTouristSpots(destination)).map((destination) => destination.city),
    missingCompanionFit: destinations.filter((destination) => !hasFitKeys(destination.companionFit, companionFitKeys)).map((destination) => destination.city),
    missingPurposeFit: destinations.filter((destination) => !hasFitKeys(destination.purposeFit, purposeFitKeys)).map((destination) => destination.city),
    missingStayFit: destinations.filter((destination) => !hasFitKeys(destination.stayFit, stayFitKeys)).map((destination) => destination.city),
    missingNearbyHints: destinations.filter((destination) => !hasNearbyHints(destination)).map((destination) => destination.city),
    priorityTotal: priorityQualityCities.length,
    priorityCompleted: priorityQualityCities.filter((city) => {
      const destination = destinations.find((item) => item.city === city)
      return destination
        && allowedRegions.includes(destination.region)
        && hasLocalFoods(destination)
        && hasLocalFoodDetails(destination)
        && hasEnoughTouristSpots(destination)
        && hasFitKeys(destination.companionFit, companionFitKeys)
        && hasFitKeys(destination.purposeFit, purposeFitKeys)
        && hasFitKeys(destination.stayFit, stayFitKeys)
        && hasNearbyHints(destination)
    }).length,
    priorityMissing: priorityQualityCities.filter((city) => !destinations.find((destination) => destination.city === city)),
    longStayHintShortage: destinations.filter((destination) => destination.goodForLongStay && !hasNearbyHints(destination)).map((destination) => destination.city),
  }

  return {
    total: results.length,
    passed: results.length - warnings.length,
    warningCount: warnings.length,
    warnings,
    metadataStatus,
    imageStatus,
    imageReuse: {
      categoryUsage: categoryUsageEntries,
      overusedCategoryImages,
      missingMajorImages,
    },
    coverage: { prefectures: coveredPrefectures, tagCounts },
    globalChecks: [
      {
        label: '画像URLが空・不正・読み込み失敗の場合のプレースホルダー切り替え',
        passed: fallbackReady,
      },
      {
        label: '旅行先の重複チェック',
        passed: duplicateKeys.size === 0,
      },
      {
        label: `旅行先件数（${destinations.length}件 / 目標120件以上）`,
        passed: destinations.length >= 120,
      },
      {
        label: `都道府県カバー（${coveredPrefectures} / ${prefectureTarget}）`,
        passed: coveredPrefectures === prefectureTarget,
      },
      {
        label: 'カテゴリ画像の使い回し（1画像20回以下）',
        passed: overusedCategoryImages.length === 0,
      },
      {
        label: `主要旅行先の個別画像（${MAJOR_DESTINATION_CITIES.length - missingMajorImages.length} / ${MAJOR_DESTINATION_CITIES.length}）`,
        passed: missingMajorImages.length === 0,
      },
    ],
  }
}
