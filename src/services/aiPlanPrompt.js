const joinOrDefault = (items, fallback = '指定なし') => (
  Array.isArray(items) && items.length > 0 ? items.join('、') : fallback
)

/**
 * 将来OpenAI APIへ渡す旅行プラン生成用プロンプトを組み立てる。
 * API通信は行わず、画面の入力状態をプレーンな文字列へ変換するだけに留める。
 */
export const createAiPlanPrompt = ({
  departure,
  destination,
  tripType,
  season,
  selectedFilters = [],
  selectedTravelPurposes = [],
  transportComparisons = [],
  budget,
}) => {
  const localFoodSummary = Array.isArray(destination.localFoodCandidates) && destination.localFoodCandidates.length > 0
    ? destination.localFoodCandidates.join('、')
    : ''
  const transportSummary = transportComparisons.length > 0
    ? transportComparisons.map((item) => (
      `${item.mode}: ${item.rating ?? '未評価'}${item.duration ? `、${item.duration}` : ''}${item.isReference ? '（参考評価）' : ''}`
    )).join('\n')
    : '移動情報は未取得です。'

  return [
    'あなたは日本国内旅行に詳しい旅行プランナーです。',
    '以下の条件をもとに、無理のない具体的な旅行プランを日本語で作成してください。',
    '',
    `出発地: ${departure}`,
    `旅先: ${destination.prefecture} ${destination.city}`,
    `旅行タイプ: ${tripType}`,
    `旅行予定季節: ${season}`,
    `同行者・旅のスタイル: ${joinOrDefault(selectedFilters)}`,
    `旅の目的: ${joinOrDefault(selectedTravelPurposes)}`,
    `予算目安: 1人あたり ${budget}`,
    `旅先の特徴: ${destination.recommendation}`,
    localFoodSummary ? `ご当地グルメ候補: ${localFoodSummary}` : '',
    '',
    '交通手段比較:',
    transportSummary,
    '',
    '次の見出しを必ず含めてください。',
    '1. 旅行全体のテーマ',
    '2. 日程別スケジュール',
    '3. 食事・カフェ案',
    '4. 移動の注意点',
    '5. 予算感',
    '6. この旅先を楽しむコツ',
    'ご当地グルメ候補がある場合は、食事・カフェ案に自然に含めてください。',
    '季節と移動時間を考慮し、実在を断定できない店舗名や時刻は候補として表現してください。',
  ].filter(Boolean).join('\n')
}
