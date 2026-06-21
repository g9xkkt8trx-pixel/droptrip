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
  transportComparisons = [],
  budget,
}) => {
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
    `こだわり条件: ${joinOrDefault(selectedFilters)}`,
    `予算目安: 1人あたり ${budget}`,
    `旅先の特徴: ${destination.recommendation}`,
    '',
    '交通手段比較:',
    transportSummary,
    '',
    '日ごとのスケジュール、移動上の注意、食事、季節に合うおすすめポイントを含めてください。',
  ].join('\n')
}
