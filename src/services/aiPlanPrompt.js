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
}) => {
  const touristSpotLines = compactList(destination.touristSpots, (spot) => (
    '- ' + spot.name + '（' + (spot.type ?? 'スポット') + ' / 目安:' + (spot.stayTime ?? '短時間') + '）: ' + (spot.description ?? '')
  ), 7)
  const localFoodDetailLines = compactList(destination.localFoodDetails, (food) => {
    const timing = Array.isArray(food.bestTiming) && food.bestTiming.length > 0 ? ' / \u5165\u308c\u3084\u3059\u3044\u30bf\u30a4\u30df\u30f3\u30b0: ' + food.bestTiming.join('\u30fb') : ''
    const areas = Array.isArray(food.bestAreaHints) && food.bestAreaHints.length > 0 ? ' / \u5408\u308f\u305b\u3084\u3059\u3044\u30a8\u30ea\u30a2: ' + food.bestAreaHints.join('\u30fb') : ''
    const goodFor = Array.isArray(food.goodFor) && food.goodFor.length > 0 ? ' / \u76f8\u6027: ' + food.goodFor.join('\u30fb') : ''
    return '- ' + food.name + '\uff08' + (food.type ?? '\u3054\u5f53\u5730\u30b0\u30eb\u30e1') + '\uff09: ' + (food.description ?? '') + timing + areas + goodFor
  }, 5)
  const restaurantHintLines = compactList(destination.restaurantHints, (hint) => (
    '- ' + hint.name + '（' + (hint.area ?? 'エリア未設定') + ' / ' + (hint.type ?? '候補') + '）: ' + (hint.food ?? '食事候補') + '。' + (hint.note ?? '営業時間・定休日・提供内容は訪問前に公式情報やGoogle Mapsで確認してください。')
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

  return [
    'あなたは日本国内旅行に詳しい旅行プランナーです。',
    '抽象的な褒め言葉だけで終わらせず、下記のスポット名・ご当地グルメ名・周辺候補名を使って、実際の過ごし方が浮かぶ日本語の旅行プランを作成してください。',
    '移動時間、営業状況、料金、予約可否は断定せず、必要に応じて「事前に公式情報やGoogle Mapsで確認してください」と自然に補足してください。',
    '店舗名や施設名は候補として扱い、営業中・予約可・料金確定のような断定はしないでください。',
    '観光スポットは「自然スポット」「街歩き」「温泉街」のような抽象語ではなく、入力データ内の具体的な施設名・地名・通り名・温泉街名を優先してください。',
    '施設名を使う場合も、営業時間・料金・営業状況は訪問前確認が必要なものとして扱い、写真がある前提では書かないでください。',
    '「郷土料理」「地元ラーメン」「カフェ」「市場グルメ」のような抽象語ではなく、入力データ内の具体的な料理名・食材名・地域名物名を優先してください。',
    '料理写真がある前提の表現は避け、写真・店の営業状況・提供内容は確認が必要なものとして扱ってください。',
    '',
    '## 入力条件',
    '出発地: ' + departure,
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
    localFoodDetailLines.length > 0 ? '## 食事提案に含めたいご当地グルメ\n' + localFoodDetailLines.join('\n') : (localFoodSummary ? 'ご当地グルメ候補: ' + localFoodSummary : ''),
    restaurantHintLines.length > 0 ? '## Google Mapsで探す時の店名・エリア候補（未確認候補として扱う）\n' + restaurantHintLines.join('\n') : '',
    nearbyHintSummary ? '周辺候補ヒント: ' + nearbyHintSummary : '',
    nearbySuggestionLines.length > 0 ? '## 長めの日程で余裕があれば寄りたい周辺候補\n' + nearbySuggestionLines.join('\n') : '',
    '',
    '交通手段比較:',
    transportSummary,
    '',
    '## 出力形式',
    '1. この旅のテーマ',
    '2. ざっくり旅程（' + getScheduleTone(tripSchedule) + '）',
    '3. 行きたいスポット（具体的なスポット名を使う）',
    '4. 食べたいご当地グルメ（localFoodDetailsまたはlocalFoodCandidatesの名称を使う）',
    '5. 余裕があれば寄りたい周辺候補（長期旅行または候補がある場合のみ）',
    '6. 注意点（移動、営業状況、天候など確認が必要なもの）',
    '',
    '避ける表現: 「魅力的です」「楽しめます」「おすすめです」だけで文を終えない。必ずスポット名、食べ物名、過ごし方、同行者・目的・日程とのつながりを入れてください。',
  ].filter(Boolean).join('\n')
}
