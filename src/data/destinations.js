import rawDestinations from './destinations.json'
import { getDestinationImages } from './destinationImages'
import { getDestinationTransit } from './destinationTransit'
import { supplementalDestinations } from './supplementalDestinations'

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
const localFoodCandidatesByCity = {
  京都市: ['湯豆腐', '抹茶スイーツ', '京料理', '和カフェ'],
  奈良市: ['柿の葉寿司', '茶粥', '奈良漬', '和スイーツ'],
  小樽市: ['寿司', '海鮮丼', 'ルタオ系スイーツ', '市場グルメ'],
  札幌市: ['スープカレー', '味噌ラーメン', 'ジンギスカン', '海鮮'],
  函館市: ['海鮮丼', 'イカ料理', '塩ラーメン', '市場朝食'],
  金沢市: ['海鮮丼', '金沢おでん', '加賀料理', '和菓子'],
  箱根町: ['温泉まんじゅう', 'そば', '豆腐料理', 'ベーカリー'],
  熱海市: ['海鮮', '干物', '温泉まんじゅう', 'カフェスイーツ'],
  草津町: ['温泉まんじゅう', 'そば', '舞茸料理', '湯畑周辺スイーツ'],
  日光市: ['湯波料理', 'そば', '羊羹', 'カフェ'],
  鎌倉市: ['しらす丼', '鎌倉野菜', '和カフェ', 'スイーツ'],
  横浜市: ['中華街グルメ', '洋食', 'スイーツ', 'カフェ'],
  松島町: ['牡蠣', '海鮮', '笹かまぼこ', 'ずんだスイーツ'],
  仙台市: ['牛タン', 'ずんだ餅', '笹かまぼこ', '海鮮'],
  福岡市: ['博多ラーメン', 'もつ鍋', '水炊き', '屋台グルメ'],
  長崎市: ['ちゃんぽん', '皿うどん', 'トルコライス', 'カステラ'],
  広島市: ['お好み焼き', '牡蠣', '穴子飯', '瀬戸内レモン'],
  廿日市市: ['あなごめし', '牡蠣', 'もみじ饅頭', '瀬戸内海鮮'],
  那覇市: ['沖縄そば', 'ゴーヤーチャンプルー', 'タコライス', 'ブルーシール'],
  石垣市: ['石垣牛', '八重山そば', '海鮮', '南国スイーツ'],
  高山市: ['飛騨牛', '高山ラーメン', 'みたらし団子', '郷土料理'],
  伊勢市: ['伊勢うどん', '赤福', 'てこね寿司', '海鮮'],
  白浜町: ['海鮮', 'クエ料理', '梅スイーツ', '温泉街グルメ'],
  軽井沢町: ['ベーカリー', '高原野菜', 'カフェ', 'ジャム'],
  富良野市: ['オムカレー', 'メロン', 'チーズ', 'スイーツ'],
  会津若松市: ['ソースカツ丼', 'こづゆ', '会津そば', '地酒'],
  尾道市: ['尾道ラーメン', '瀬戸内海鮮', 'レモンスイーツ', 'カフェ'],
  倉敷市: ['デミカツ丼', '白桃スイーツ', '町家カフェ', '瀬戸内グルメ'],
  松江市: ['出雲そば', '和菓子', 'しじみ料理', '茶文化'],
  別府市: ['地獄蒸し', 'とり天', '温泉プリン', '海鮮'],
}

const getLocalFoodCandidates = (city, tags = []) => {
  if (localFoodCandidatesByCity[city]) return localFoodCandidatesByCity[city]
  if (tags.includes('グルメ')) return ['ご当地グルメ', '市場グルメ', 'カフェ']
  if (tags.includes('海')) return ['海鮮', '市場グルメ', '港町の食事']
  if (tags.includes('温泉')) return ['温泉まんじゅう', 'そば', '温泉街グルメ']
  return ['ご当地グルメ', 'カフェ', '郷土料理']
}

const prefectureRegionMap = {
  北海道: '北海道',
  青森県: '東北', 岩手県: '東北', 宮城県: '東北', 秋田県: '東北', 山形県: '東北', 福島県: '東北',
  茨城県: '関東', 栃木県: '関東', 群馬県: '関東', 埼玉県: '関東', 千葉県: '関東', 東京都: '関東', 神奈川県: '関東',
  新潟県: '中部', 富山県: '中部', 石川県: '中部', 福井県: '中部', 山梨県: '中部', 長野県: '中部', 岐阜県: '中部', 静岡県: '中部', 愛知県: '中部',
  三重県: '関西', 滋賀県: '関西', 京都府: '関西', 大阪府: '関西', 兵庫県: '関西', 奈良県: '関西', 和歌山県: '関西',
  鳥取県: '中国', 島根県: '中国', 岡山県: '中国', 広島県: '中国', 山口県: '中国',
  徳島県: '四国', 香川県: '四国', 愛媛県: '四国', 高知県: '四国',
  福岡県: '九州', 佐賀県: '九州', 長崎県: '九州', 熊本県: '九州', 大分県: '九州', 宮崎県: '九州', 鹿児島県: '九州',
  沖縄県: '沖縄',
}

const normalizeRegion = (prefecture, region) => {
  if (prefectureRegionMap[prefecture]) return prefectureRegionMap[prefecture]
  if (['北海道', '東北', '関東', '中部', '関西', '中国', '四国', '九州', '沖縄'].includes(region)) return region
  return region === '中国四国' ? '中国' : region
}

const destinationHintMap = {
  京都市: ['奈良市', '大阪市', '宇治方面', '滋賀方面'],
  奈良市: ['京都市', '大阪市', '宇治方面'],
  小樽市: ['札幌市', '函館市', '余市方面'],
  札幌市: ['小樽市', '富良野市', '函館市'],
  函館市: ['札幌市', '小樽市', '大沼方面'],
  金沢市: ['高山市', '富山方面', '能登方面'],
  箱根町: ['小田原方面', '熱海市', '鎌倉市'],
  熱海市: ['箱根町', '伊東市', '伊豆方面'],
  草津町: ['軽井沢町', '伊香保方面', '長野方面'],
  日光市: ['那須塩原市', '宇都宮方面', '会津若松市'],
  鎌倉市: ['横浜市', '箱根町', '湘南方面'],
  横浜市: ['鎌倉市', '箱根町', '東京方面'],
  松島町: ['仙台市', '石巻方面', '蔵王方面'],
  仙台市: ['松島町', '山形方面', '会津若松市'],
  福岡市: ['長崎市', '別府市', '熊本方面'],
  長崎市: ['福岡市', '佐世保市', '熊本方面'],
  広島市: ['廿日市市', '尾道市', '倉敷市'],
  廿日市市: ['広島市', '宮島周辺', '尾道市'],
  那覇市: ['石垣市', '宮古島市', '沖縄本島周辺'],
  石垣市: ['石垣島周辺', '離島方面', '自然・海辺滞在'],
  高山市: ['金沢市', '白川郷方面', '松本市'],
  伊勢市: ['鳥羽方面', '志摩方面', '名古屋市'],
  白浜町: ['和歌山市', '熊野方面', '大阪市'],
  軽井沢町: ['草津町', '小諸方面', '長野方面'],
  富良野市: ['札幌市', '美瑛方面', '旭川方面'],
  会津若松市: ['日光市', '仙台市', '喜多方方面'],
  尾道市: ['広島市', '倉敷市', 'しまなみ海道方面'],
  倉敷市: ['尾道市', '広島市', '岡山市'],
  松江市: ['出雲市', '鳥取市', '境港方面'],
  別府市: ['福岡市', '由布市', '熊本方面'],
}

const scoreCap = (value) => Math.max(0, Math.min(100, Math.round(value)))
const hasAnyTag = (destination, tags) => tags.some((tag) => destination.tags?.includes(tag))
const inCityList = (destination, cities) => cities.includes(destination.city)

const createCompanionFit = (destination) => {
  const scenic = hasAnyTag(destination, ['温泉', '海', '山', 'カップル向け'])
  const easyAccess = Number.isFinite(destination.stationAccessMinutes) && destination.stationAccessMinutes <= 35
  return {
    couple: scoreCap((scenic ? 48 : 22) + (hasAnyTag(destination, ['温泉', '海', 'カップル向け']) ? 24 : 0) + (easyAccess ? 8 : 0)),
    solo: scoreCap(36 + (hasAnyTag(destination, ['グルメ', '山']) ? 18 : 0) + (inCityList(destination, ['京都市', '奈良市', '鎌倉市', '金沢市', '小樽市', '尾道市', '倉敷市', '高山市']) ? 24 : 0)),
    friends: scoreCap(34 + (hasAnyTag(destination, ['グルメ', '海']) ? 22 : 0) + (inCityList(destination, ['札幌市', '福岡市', '大阪市', '横浜市', '那覇市', '長崎市', '広島市']) ? 20 : 0)),
    family: scoreCap(32 + (hasAnyTag(destination, ['山', '海']) ? 18 : 0) + (easyAccess ? 18 : 0) + (inCityList(destination, ['横浜市', '浦安市', '日光市', '仙台市', '札幌市', '福岡市', '軽井沢町']) ? 14 : 0)),
    pet: scoreCap(18 + (hasAnyTag(destination, ['山', '海']) ? 22 : 0) + (inCityList(destination, ['軽井沢町', '鎌倉市', '箱根町', '富良野市', '石垣市', '日光市']) ? 16 : 0)),
  }
}

const createPurposeFit = (destination) => {
  const foods = Array.isArray(destination.localFoodCandidates) ? destination.localFoodCandidates : []
  const historyCities = ['京都市', '奈良市', '鎌倉市', '伊勢市', '廿日市市', '日光市', '高山市', '会津若松市', '松江市', '金沢市', '尾道市', '倉敷市', '長崎市', '広島市']
  const onsenCities = ['箱根町', '熱海市', '草津町', '別府市', '白浜町', '伊東市', '由布市', '下呂市']
  const walkingCities = ['小樽市', '金沢市', '鎌倉市', '横浜市', '京都市', '尾道市', '倉敷市', '高山市', '長崎市', '函館市', '松江市']
  return {
    gourmet: scoreCap((foods.length > 0 ? 68 : 30) + (hasAnyTag(destination, ['グルメ']) ? 22 : 0)),
    history: scoreCap((inCityList(destination, historyCities) ? 78 : 24) + (hasAnyTag(destination, ['カップル向け']) ? 8 : 0)),
    onsen: scoreCap((hasAnyTag(destination, ['温泉']) ? 82 : 18) + (inCityList(destination, onsenCities) ? 12 : 0)),
    nature: scoreCap((hasAnyTag(destination, ['山', '海']) ? 72 : 28) + (['北海道', '沖縄'].includes(destination.region) ? 12 : 0)),
    activity: scoreCap((hasAnyTag(destination, ['山', '海']) ? 62 : 22) + (['沖縄', '北海道'].includes(destination.region) ? 10 : 0)),
    experience: scoreCap(34 + (hasAnyTag(destination, ['温泉', 'グルメ']) ? 20 : 0) + (inCityList(destination, historyCities) ? 18 : 0)),
    walking: scoreCap(34 + (inCityList(destination, walkingCities) ? 42 : 0) + (hasAnyTag(destination, ['グルメ', 'カップル向け']) ? 12 : 0)),
    relax: scoreCap(32 + (hasAnyTag(destination, ['温泉', '山', '海']) ? 34 : 0) + (inCityList(destination, ['箱根町', '熱海市', '草津町', '別府市', '軽井沢町', '富良野市', '石垣市']) ? 18 : 0)),
  }
}

const createStayFit = (destination, purposeFit) => {
  const accessMinutes = Number.isFinite(destination.stationAccessMinutes) ? destination.stationAccessMinutes : 45
  const hintCount = destinationHintMap[destination.city]?.length ?? 0
  const isHub = ['京都市', '大阪市', '福岡市', '金沢市', '札幌市', '長崎市', '広島市', '那覇市', '仙台市', '横浜市'].includes(destination.city)
  const themeWidth = ['gourmet', 'history', 'onsen', 'nature', 'walking'].filter((key) => purposeFit[key] >= 60).length
  return {
    dayTrip: scoreCap(78 - Math.min(accessMinutes, 90) * 0.35 + (hasAnyTag(destination, ['グルメ', '温泉']) ? 8 : 0)),
    oneNight: scoreCap(48 + (hasAnyTag(destination, ['温泉', '海', '山', 'グルメ']) ? 22 : 0) + (accessMinutes <= 60 ? 8 : 0)),
    twoNights: scoreCap(42 + themeWidth * 8 + Math.min(hintCount, 2) * 10 + (isHub ? 8 : 0)),
    longStay: scoreCap(30 + themeWidth * 9 + Math.min(hintCount, 3) * 11 + (isHub ? 14 : 0) + (['北海道', '沖縄', '九州', '関西'].includes(destination.region) ? 8 : 0)),
  }
}

const createLongStayStyle = (destination, stayFit) => {
  if (stayFit.longStay < 55) return 'メイン旅先をゆっくり楽しむ滞在向きです。'
  if (destination.region === '沖縄') return '島内や離島方面を組み合わせ、自然・海辺・グルメを深く楽しむ滞在向きです。'
  if (destination.region === '北海道') return '広い地域の自然・街歩き・食をゆったり組み合わせる滞在向きです。'
  return '同じ地域の周辺候補を組み合わせる周遊滞在に向いています。'
}

const createTravelBaseScoreNote = (destination, purposeFit, stayFit) => {
  const strongPurposes = Object.entries(purposeFit).filter(([, value]) => value >= 70).map(([key]) => key).slice(0, 3)
  const stayLabels = Object.entries(stayFit).filter(([, value]) => value >= 70).map(([key]) => key).slice(0, 2)
  return destination.city + 'は' + (strongPurposes.join('・') || '複数テーマ') + 'に強く、' + (stayLabels.join('・') || '滞在') + 'の加点対象です。'
}

const enrichDestination = (destination) => {
  const region = normalizeRegion(destination.prefecture, destination.region)
  const base = { ...destination, region }
  const companionFit = destination.companionFit ?? createCompanionFit(base)
  const purposeFit = destination.purposeFit ?? createPurposeFit(base)
  const stayFit = destination.stayFit ?? createStayFit(base, purposeFit)
  const nearbyDestinationHints = destination.nearbyDestinationHints ?? destinationHintMap[base.city] ?? []
  return {
    ...base,
    companionFit,
    purposeFit,
    stayFit,
    nearbyDestinationHints,
    goodForDayTrip: destination.goodForDayTrip ?? stayFit.dayTrip >= 62,
    goodForOneNight: destination.goodForOneNight ?? stayFit.oneNight >= 62,
    goodForLongStay: destination.goodForLongStay ?? stayFit.longStay >= 62,
    longStayStyle: destination.longStayStyle ?? createLongStayStyle(base, stayFit),
    travelBaseScoreNote: destination.travelBaseScoreNote ?? createTravelBaseScoreNote(base, purposeFit, stayFit),
  }
}

const baseDestinations = rawDestinations.map((destination) => {
  const [latitude, longitude] = destinationCoordinates[destination.city]
  const address = destinationAddresses[destination.city]
    ?? `${destination.prefecture}${destination.city}`
  const seasonProfile = getSeasonProfile(destination)
  const localFoodCandidates = getLocalFoodCandidates(destination.city, destination.tags)
  const images = getDestinationImages(destination.prefecture, destination.city, destination.tags, {
    localFoodCandidates,
    region: normalizeRegion(destination.prefecture, destination.region),
  })
  const transit = getDestinationTransit(destination.city)

  return enrichDestination({
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
    recommendText: destination.recommendation,
    reason: `${destination.city}は「${destination.recommendation}」をテーマにした旅行ができ、${destination.tags.join('・')}を重視する方におすすめです。`,
    budgets: destination.budget,
    budget: destination.budget,
    plans: normalizePlans(destination.schedule, destination.city),
    highlights: destination.highlight,
    bestSeasons: seasonProfile.bestSeasons,
    seasonHighlights: seasonProfile.seasonHighlights,
    localFoodCandidates,
    ...images,
    ...transit,
  })
})

const expandedDestinations = supplementalDestinations.map((destination) => {
  const localFoodCandidates = getLocalFoodCandidates(destination.city, destination.tags)
  const images = getDestinationImages(destination.prefecture, destination.city, destination.tags, {
    localFoodCandidates,
    region: normalizeRegion(destination.prefecture, destination.region),
  })
  return enrichDestination({
    ...destination,
    id: `${destination.prefecture}-${destination.city}`,
    googleMapsQuery: `${destination.address} 観光`,
    reason: `${destination.city}は「${destination.recommendText}」をテーマにした旅行ができ、${destination.tags.join('・')}を重視する方におすすめです。`,
    localFoodCandidates,
    ...images,
  })
})

const destinations = [...baseDestinations, ...expandedDestinations]

export default destinations
