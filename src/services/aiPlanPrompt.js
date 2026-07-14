const joinOrDefault = (items, fallback = '指定なし') => (
  Array.isArray(items) && items.length > 0 ? items.join('、') : fallback
)

const compactList = (items, mapper, limit = 3) => (
  Array.isArray(items) ? items.filter(Boolean).slice(0, limit).map(mapper).filter(Boolean) : []
)

const formatScoreObject = (value = {}) => Object.entries(value)
  .filter(([, score]) => Number.isFinite(Number(score)))
  .sort(([, left], [, right]) => Number(right) - Number(left))
  .slice(0, 4)
  .map(([key, score]) => key + ':' + score)
  .join('、')

const getScheduleTone = (schedule = {}) => {
  if ((schedule.days ?? 1) <= 1) return '午前・昼・午後・夕方の流れで、細かすぎる時刻表にはしない。'
  if (schedule.days === 2) return '1日目・2日目に分け、宿泊前後の過ごし方が分かるようにする。'
  if (schedule.days >= 5) return 'メイン旅先を深く楽しむ日、周辺候補へ足を伸ばす日、目的別に過ごす日、帰路に合わせて軽めに過ごす日を含める。'
  return '前半・中盤・後半に分け、周辺候補を入れすぎず余白を残す。'
}

/**
 * 将来OpenAI APIへ渡す旅行プラン生成用プロンプトを組み立てる。
 * API通信は行わず、画面の入力状態をプレーンな文字列へ変換するだけに留める。
 */
export const createAiPlanPrompt = ({
  departure,
  destination,
  tripType,
  tripSchedule = {},
  season,
  selectedFilters = [],
  selectedTravelPurposes = [],
  movementRangeLabel = 'おまかせ',
  nearbySuggestions = [],
  transportComparisons = [],
  budget,
  photoSpots = [],
}) => {
  const touristSpotLines = compactList(destination.touristSpots, (spot) => (
    '- ' + spot.name + '（' + (spot.type ?? 'スポット') + ' / 目安:' + (spot.stayTime ?? '短時間') + '）: ' + (spot.description ?? '')
  ), 7)
  const localFoodDetailLines = compactList(destination.localFoodDetails, (food) => (
    '- ' + food.name + '\uff08' + (food.type ?? '\u3054\u5f53\u5730\u30b0\u30eb\u30e1') + '\uff09: ' + (food.description ?? '')
  ), 5)
  const localFoodSummary = Array.isArray(destination.localFoodCandidates) && destination.localFoodCandidates.length > 0
    ? destination.localFoodCandidates.slice(0, 10).join('、')
    : ''
  const nearbyHintSummary = compactList(destination.nearbyDestinationHints, (hint) => hint, 5).join('、')
  const nearbySuggestionLines = compactList(nearbySuggestions, (item) => (
    '- ' + (item.prefecture ? item.prefecture + ' ' : '') + item.city + ': ' + (item.reason ?? '周辺候補')
  ), 5)
  const seasonHighlights = destination.seasonHighlights && typeof destination.seasonHighlights === 'object'
    ? Object.entries(destination.seasonHighlights).slice(0, 4).map(([key, value]) => key + ':' + value).join(' / ')
    : ''
  const transportSummary = transportComparisons.length > 0
    ? transportComparisons.map((item) => (
      item.mode + ': ' + (item.rating ?? '未評価') + (item.duration ? '、' + item.duration : '') + (item.isReference ? '（参考評価）' : '')
    )).join('\n')
    : '移動情報は未取得です。'
  const scheduleLabel = tripSchedule.label ?? tripType
  const nightsDays = Number.isFinite(Number(tripSchedule.nights)) && Number.isFinite(Number(tripSchedule.days))
    ? tripSchedule.nights + '泊' + tripSchedule.days + '日'
    : scheduleLabel
  const photoSpotLines = compactList(photoSpots, (spot) => (
    '- ' + spot.name + '（' + (spot.category || '映えスポット') + '）: ' + (spot.summary || '')
      + (spot.bestTime ? ' / おすすめ時間:' + spot.bestTime : '')
      + (spot.bestSeason ? ' / おすすめ季節:' + spot.bestSeason : '')
      + (spot.weatherNote ? ' / 注意:' + spot.weatherNote : '')
      + (spot.accessNote ? ' / 補足:' + spot.accessNote : '')
      + (spot.mapQuery ? ' / 地図検索:' + spot.mapQuery : '')
  ), 3)

  return [
    'あなたはDROPTRIPの日本国内旅行プランナーです。出力はJSONのみで、Markdown、前置き、後書き、入力条件の再掲は出力しません。',
    'DROPTRIPから渡された正式データを最優先し、入力にない施設名、店名、料理名、営業時間、料金、休館日、予約可否、移動時間を作らないでください。',
    'confirmed映えスポットが2件以上ある場合、旅程itemsとrecommendedPhotoSpotsに少なくとも2件を含めます。店舗名が不明な食事は「駅周辺の郷土料理店」など一般表現にしてください。',
    '予定を詰め込みすぎず、各日に休憩を含めます。移動の詳細は断定せず、地図や公式情報で確認する表現にします。',
    '同じ注意事項を複数箇所へ繰り返さず、短い文でまとめます。雨天代替案を最低1件、写真撮影の注意・最適時間をデータの範囲で追加します。予算は概算・変動する旨をdisclaimerに入れます。',
    '',
    '## 入力条件',
    '出発地: ' + departure,
    'destinationId: ' + (destination.id ?? destination.destinationId ?? ''),
    '旅先: ' + destination.prefecture + ' ' + destination.city,
    'region: ' + (destination.region ?? '未設定'),
    'tags: ' + joinOrDefault(destination.tags),
    '旅行日程: ' + scheduleLabel + '（' + nightsDays + '）',
    '旅行予定季節: ' + season,
    '移動範囲: ' + movementRangeLabel,
    '同行者・旅のスタイル: ' + joinOrDefault(selectedFilters),
    '旅の目的: ' + joinOrDefault(selectedTravelPurposes),
    '予算目安: 1人あたり ' + budget,
    '旅先の特徴: ' + (destination.recommendText ?? destination.recommendation ?? ''),
    destination.longStayStyle ? '長期滞在の相性: ' + destination.longStayStyle : '',
    destination.bestSeasons?.length ? 'ベストシーズン: ' + destination.bestSeasons.join('、') : '',
    seasonHighlights ? '季節の見どころ: ' + seasonHighlights : '',
    destination.companionFit ? '同行者相性スコア: ' + formatScoreObject(destination.companionFit) : '',
    destination.purposeFit ? '目的相性スコア: ' + formatScoreObject(destination.purposeFit) : '',
    destination.stayFit ? '日程相性スコア: ' + formatScoreObject(destination.stayFit) : '',
    '',
    touristSpotLines.length > 0 ? '## 使ってほしい観光スポット\n' + touristSpotLines.join('\n') : '',
    photoSpotLines.length > 0 ? '## confirmed映えスポット（この名称・説明を優先）\n' + photoSpotLines.join('\n') : '',
    localFoodDetailLines.length > 0 ? '## 食事提案に含めたいご当地グルメ\n' + localFoodDetailLines.join('\n') : (localFoodSummary ? 'ご当地グルメ候補: ' + localFoodSummary : ''),
    nearbyHintSummary ? '周辺候補ヒント: ' + nearbyHintSummary : '',
    nearbySuggestionLines.length > 0 ? '## 長めの日程で余裕があれば寄りたい周辺候補\n' + nearbySuggestionLines.join('\n') : '',
    '',
    '交通手段比較:',
    transportSummary,
    '',
    '## JSON出力ルール',
    'title, concept, summary, days, recommendedPhotoSpots, localFoodSuggestions, budgetEstimate, rainPlan, tips, disclaimerを必ず含める。',
    'daysは旅行日数に合わせる。日帰りは1日、itemsは各日最大5件。itemsはtime、type、title、description、duration、location、mapQuery、photoTip、cautionを文字列で含め、descriptionは120文字以内、photoTip/cautionは各80文字以内にする。',
    'recommendedPhotoSpots/localFoodSuggestionsは各最大3件、rainPlanは最大2件、tipsは最大4件。不明な値は空文字、該当がない配列は空配列にする。' + getScheduleTone(tripSchedule),
  ].filter(Boolean).join('\n')
}
