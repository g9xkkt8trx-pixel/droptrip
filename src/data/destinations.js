import rawDestinations from './destinations.json'

// 各自治体の代表地点。Routes APIの目的地座標として利用する。
const destinationCoordinates = {
  横浜市: [35.4437, 139.6380],
  鎌倉市: [35.3192, 139.5467],
  箱根町: [35.2324, 139.1069],
  日光市: [36.7199, 139.6982],
  草津町: [36.6209, 138.5961],
  那須塩原市: [36.9617, 140.0460],
  仙台市: [38.2682, 140.8694],
  松島町: [38.3809, 141.0670],
  青森市: [40.8222, 140.7474],
  弘前市: [40.6031, 140.4642],
  盛岡市: [39.7021, 141.1545],
  会津若松市: [37.4948, 139.9297],
  熱海市: [35.0959, 139.0716],
  金沢市: [36.5613, 136.6562],
  高山市: [36.1461, 137.2522],
  松本市: [36.2380, 137.9720],
  富士河口湖町: [35.4973, 138.7550],
  伊豆市: [34.9765, 138.9469],
  京都市: [35.0116, 135.7681],
  大阪市: [34.6937, 135.5023],
  神戸市: [34.6901, 135.1955],
  奈良市: [34.6851, 135.8048],
  白浜町: [33.6782, 135.3481],
  豊岡市: [35.5445, 134.8203],
  福岡市: [33.5904, 130.4017],
  長崎市: [32.7503, 129.8779],
  別府市: [33.2847, 131.4912],
  由布市: [33.1800, 131.4260],
  熊本市: [32.8031, 130.7079],
  鹿児島市: [31.5966, 130.5571],
  札幌市: [43.0618, 141.3545],
  函館市: [41.7687, 140.7288],
  小樽市: [43.1907, 140.9947],
  台東区: [35.7126, 139.7800],
  浦安市: [35.6530, 139.9020],
  秩父市: [35.9917, 139.0854],
  名古屋市: [35.1815, 136.9066],
  下呂市: [35.8059, 137.2441],
  白川村: [36.2707, 136.8986],
  広島市: [34.3853, 132.4553],
  廿日市市: [34.3489, 132.3317],
  倉敷市: [34.5850, 133.7720],
  鳥取市: [35.5011, 134.2351],
  高松市: [34.3428, 134.0466],
  松山市: [33.8392, 132.7657],
  高知市: [33.5597, 133.5311],
  那覇市: [26.2124, 127.6809],
  石垣市: [24.3448, 124.1572],
  宮崎市: [31.9077, 131.4202],
  佐世保市: [33.1799, 129.7151],
}

// 町村は郡名を含む正式な自治体住所を使用する。
const destinationAddresses = {
  箱根町: '神奈川県足柄下郡箱根町',
  草津町: '群馬県吾妻郡草津町',
  松島町: '宮城県宮城郡松島町',
  富士河口湖町: '山梨県南都留郡富士河口湖町',
  白浜町: '和歌山県西牟婁郡白浜町',
  白川村: '岐阜県大野郡白川村',
}

const getSeasonProfile = (destination) => {
  const { city, prefecture, tags } = destination
  const bestSeasons = new Set(['春', '秋'])

  if (tags.includes('海')) bestSeasons.add('夏')
  if (tags.includes('温泉')) bestSeasons.add('冬')
  if (tags.includes('山')) bestSeasons.add('秋')
  if (['北海道', '青森県', '岩手県'].includes(prefecture)) bestSeasons.add('冬')
  if (['沖縄県', '宮崎県'].includes(prefecture)) bestSeasons.add('夏')

  return {
    bestSeasons: [...bestSeasons],
    seasonHighlights: {
      春: tags.includes('山')
        ? `${city}の新緑と春の散策を楽しめる`
        : `${city}の穏やかな街歩きと春景色を楽しめる`,
      夏: tags.includes('海')
        ? `${city}の海景色と爽やかな夏の観光を満喫できる`
        : tags.includes('山')
          ? `${city}の自然に囲まれて涼やかに過ごせる`
          : `${city}の夏らしい街歩きとグルメを楽しめる`,
      秋: tags.includes('山') || tags.includes('温泉')
        ? `${city}の紅葉と${tags.includes('温泉') ? '温泉' : '自然散策'}の相性が良い`
        : `${city}の落ち着いた街並みと秋の味覚を楽しめる`,
      冬: tags.includes('温泉')
        ? `${city}で冬景色と温泉のぬくもりを楽しめる`
        : ['北海道', '青森県', '岩手県'].includes(prefecture)
          ? `${city}ならではの雪景色と冬の味覚に出会える`
          : `${city}の冬グルメと静かな観光を楽しめる`,
    },
  }
}

// 出発地によって移動時間が変わるため、固定の出発・到着時刻を柔軟な表記へ整える。
const normalizePlans = (plans, city) => Object.fromEntries(
  Object.entries(plans).map(([tripType, days]) => [
    tripType,
    days.map((day) => ({
      ...day,
      items: day.items.map((item) => {
        if (/^\d{2}:\d{2} 出発$/.test(item)) return '出発 移動時間に合わせて出発'
        if (item.includes(`${city}に到着`)) {
          return `${tripType === '2泊3日' ? '午後' : '午前'} ${city}に到着`
        }
        return item
      }),
    })),
  ]),
)

/**
 * UIで利用する旅行先データの公開モデル。
 * 元データを追加しても、このファイルで項目名と必須値を統一できる。
 */
const destinations = rawDestinations.map((destination) => {
  const [latitude, longitude] = destinationCoordinates[destination.city]
  const address = destinationAddresses[destination.city]
    ?? `${destination.prefecture}${destination.city}`
  const seasonProfile = getSeasonProfile(destination)
  const imageSeed = encodeURIComponent(`${destination.prefecture}-${destination.city}`)

  return {
    id: `${destination.prefecture}-${destination.city}`,
    city: destination.city,
    prefecture: destination.prefecture,
    region: destination.region,
    address,
    latitude,
    longitude,
    googleMapsQuery: `${address} 観光`,
    tags: destination.tags,
    recommendation: destination.recommendation,
    reason: `${destination.city}は「${destination.recommendation}」をテーマにした旅行ができ、${destination.tags.join('・')}を重視する方におすすめです。`,
    budgets: destination.budget,
    plans: normalizePlans(destination.schedule, destination.city),
    highlights: destination.highlight,
    bestSeasons: seasonProfile.bestSeasons,
    seasonHighlights: seasonProfile.seasonHighlights,
    heroImage: `https://picsum.photos/seed/${imageSeed}-hero/900/600`,
    foodImage: `https://picsum.photos/seed/${imageSeed}-food/720/540`,
    sceneryImage: `https://picsum.photos/seed/${imageSeed}-scenery/720/540`,
  }
})

export default destinations
