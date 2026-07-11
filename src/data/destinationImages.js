export const createImageAsset = ({
  url = '',
  type = 'hero',
  source = '',
  credit = '',
  license = '',
  status = 'needs_review',
  imageType = type,
  isLocal,
  isGeneric,
  isDestinationSpecific,
  isFoodSpecific = false,
  isLocalFood = false,
  isIllustration = false,
  alt = '',
  assetType = '',
  foodTheme = '',
  note = '',
  candidateSrc = '',
  sourceType = 'unknown',
  reviewNote = '',
  confirmedAt = '',
  rejectedReason = '',
  isPhoto = false,
}) => ({
  url,
  imageUrl: url,
  type,
  imageType,
  source,
  imageSource: source,
  credit,
  imageCredit: credit,
  license,
  imageLicense: license,
  status,
  imageStatus: status,
  isLocal: typeof isLocal === 'boolean' ? isLocal : url.startsWith('/images/'),
  isGeneric: typeof isGeneric === 'boolean'
    ? isGeneric
    : source === 'placeholder' || url.startsWith('/images/common/'),
  isDestinationSpecific: typeof isDestinationSpecific === 'boolean'
    ? isDestinationSpecific
    : source === 'curated' || url.startsWith('/images/destinations/'),
  isIllustration,
  isPhoto,
  alt,
  assetType,
  isFoodSpecific,
  isLocalFood,
  foodTheme,
  note,
  candidateSrc,
  sourceType,
  reviewNote,
  confirmedAt,
  rejectedReason,
})

const COMMON_PATHS = {
  hero: '/images/common/travel-default.jpg',
  food: '/images/common/food-default.jpg',
  scenery: '/images/common/scenery-default.jpg',
}

const CATEGORY_PATHS = {
  温泉: ['/images/categories/onsen-1.jpg', '/images/categories/onsen-2.jpg'],
  海: ['/images/categories/sea-1.jpg', '/images/categories/sea-2.jpg'],
  山: ['/images/categories/mountain-1.jpg', '/images/categories/mountain-2.jpg'],
  グルメ: ['/images/categories/gourmet-1.jpg', '/images/categories/gourmet-2.jpg'],
  カップル向け: ['/images/categories/couple-1.jpg', '/images/categories/couple-2.jpg'],
  city: ['/images/categories/city-1.jpg', '/images/categories/city-2.jpg'],
  history: ['/images/categories/history-1.jpg', '/images/categories/history-2.jpg'],
  nature: ['/images/categories/nature-1.jpg', '/images/categories/nature-2.jpg'],
}

const CATEGORY_ALIASES = {
  自然: 'nature',
  街歩き: 'city',
  歴史: 'history',
  神社仏閣: 'history',
  ファミリー向け: 'nature',
  一人旅向け: 'city',
  アクティビティ: 'nature',
  体験: 'history',
  夜景: 'couple',
  離島: 'sea',
  雪景色: 'mountain',
  花: 'nature',
}

const CATEGORY_VARIANT_TARGET = 3

Object.values(CATEGORY_PATHS).forEach((paths) => {
  const firstPath = paths[0] ?? ''
  const match = firstPath.match(/\/images\/categories\/(.+)-1\.jpg$/)
  if (!match) return

  for (let index = 1; index <= CATEGORY_VARIANT_TARGET; index += 1) {
    const nextPath = `/images/categories/${match[1]}-${index}.jpg`
    if (!paths.includes(nextPath)) paths.push(nextPath)
  }
})

Object.entries(CATEGORY_ALIASES).forEach(([aliasKey, targetKey]) => {
  CATEGORY_PATHS[aliasKey] = CATEGORY_PATHS[targetKey] ?? CATEGORY_PATHS.nature
})

const GERO_ONSEN_CONFIRMED_HERO = {
  src: '/images/destinations/gero-onsen/hero-v2.webp',
  alt: '下呂温泉街と川沿いの散策をイメージしたビジュアル',
  type: 'destination_fixed',
  status: 'confirmed',
  isIllustration: true,
  isPhoto: false,
  sourceType: 'ai_generated',
  theme: '川沿いの温泉街・湯けむり・夕景・旅館街',
  reviewNote: 'ユーザー確認済み。高品質AI生成hero画像として第1号confirmed登録。',
  confirmedAt: '2026-07-10',
  rejectedReason: '',
}

const KYOTO_CONFIRMED_HERO = {
  src: '/images/destinations/kyoto/hero-v1.webp',
  alt: '京都の寺社と町家の街並みをイメージしたビジュアル',
  type: 'destination_fixed',
  status: 'confirmed',
  isIllustration: true,
  isPhoto: false,
  sourceType: 'ai_generated',
  theme: '寺社・石畳・町家・夕景・京都らしい街並み',
  reviewNote: 'ユーザー確認済み。高品質AI生成hero画像としてconfirmed登録。',
  confirmedAt: '2026-07-11',
  rejectedReason: '',
}

// 旅先ごとの固定イメージ画像を追加したときは、この対応表へ登録する。
// まず destination.id を優先し、既存データとの互換性のため city キーも残す。
const DESTINATION_LOCAL_IMAGES = {
  '京都府-京都市': {
    hero: KYOTO_CONFIRMED_HERO,
  },
  京都市: {
    hero: KYOTO_CONFIRMED_HERO,
    scenery: '/images/destinations/kyoto-scenery.jpg',
    food: '/images/destinations/kyoto-food.jpg',
  },
  奈良市: {
    hero: '/images/destinations/nara-hero.jpg',
    scenery: '/images/destinations/nara-scenery.jpg',
    food: '/images/destinations/nara-food.jpg',
  },
  小樽市: {
    hero: '/images/destinations/otaru/hero.svg',
    scenery: '/images/destinations/otaru-scenery.jpg',
    food: '/images/destinations/otaru-food.jpg',
  },
  札幌市: { hero: '/images/destinations/sapporo/hero.svg' },
  函館市: { hero: '/images/destinations/hakodate/hero.svg' },
  金沢市: {
    hero: '/images/destinations/kanazawa/hero.svg',
    scenery: '/images/destinations/kanazawa-scenery.jpg',
    food: '/images/destinations/kanazawa-food.jpg',
  },
  箱根町: {
    hero: '/images/destinations/hakone/hero.svg',
    scenery: '/images/destinations/hakone-scenery.jpg',
    food: '/images/destinations/hakone-food.jpg',
  },
  熱海市: {
    hero: '/images/destinations/atami/hero.svg',
    scenery: '/images/destinations/atami-scenery.jpg',
    food: '/images/destinations/atami-food.jpg',
  },
  草津町: {
    hero: '/images/destinations/kusatsu/hero.svg',
    scenery: '/images/destinations/kusatsu-scenery.jpg',
    food: '/images/destinations/kusatsu-food.jpg',
  },
  日光市: { hero: '/images/destinations/nikko-hero.jpg' },
  鎌倉市: {
    hero: '/images/destinations/kamakura/hero.svg',
    scenery: '/images/destinations/kamakura-scenery.jpg',
    food: '/images/destinations/kamakura-food.jpg',
  },
  横浜市: { hero: '/images/destinations/yokohama-hero.jpg' },
  松島町: { hero: '/images/destinations/matsushima-hero.jpg' }, 仙台市: { hero: '/images/destinations/sendai/hero.svg' },
  福岡市: {
    hero: '/images/destinations/fukuoka/hero.svg',
    scenery: '/images/destinations/fukuoka-scenery.jpg',
    food: '/images/destinations/fukuoka-food.jpg',
  },
  長崎市: { hero: '/images/destinations/nagasaki/hero.svg' },
  広島市: { hero: '/images/destinations/hiroshima/hero.svg' }, 廿日市市: { hero: '/images/destinations/miyajima/hero.svg' },
  那覇市: { hero: '/images/destinations/naha-hero.jpg' },
  石垣市: {
    hero: '/images/destinations/ishigaki/hero.svg',
    scenery: '/images/destinations/ishigaki-scenery.jpg',
    food: '/images/destinations/ishigaki-food.jpg',
  },
  高山市: { hero: '/images/destinations/takayama/hero.svg' }, 伊勢市: { hero: '/images/destinations/ise-hero.jpg' },
  白浜町: { hero: '/images/destinations/shirahama-hero.jpg' }, 軽井沢町: { hero: '/images/destinations/karuizawa-hero.jpg' },
  富良野市: { hero: '/images/destinations/furano-hero.jpg' }, 会津若松市: { hero: '/images/destinations/aizuwakamatsu-hero.jpg' },
  尾道市: { hero: '/images/destinations/onomichi/hero.svg' }, 倉敷市: { hero: '/images/destinations/kurashiki/hero.svg' },
  松江市: { hero: '/images/destinations/matsue/hero.svg' }, 別府市: { hero: '/images/destinations/beppu/hero.svg' },
  '岐阜県-下呂市': { hero: GERO_ONSEN_CONFIRMED_HERO },
  下呂市: { hero: GERO_ONSEN_CONFIRMED_HERO },
  鳴門市: { hero: '/images/destinations/naruto/hero.svg' },
  甲府市: { hero: '/images/destinations/kofu/hero.svg' },
  川越市: { hero: '/images/destinations/kawagoe/hero.svg' },
  佐野市: { hero: '/images/destinations/sano/hero.svg' },
  上田市: { hero: '/images/destinations/ueda/hero.svg' },
  宮古島市: { hero: '/images/destinations/miyakojima/hero.svg' },
  由布市: { hero: '/images/destinations/yufuin/hero.svg' },
  松山市: { hero: '/images/destinations/dogo-onsen/hero.svg' },
  神戸市: { hero: '/images/destinations/arima-onsen/hero.svg' },
  豊岡市: { hero: '/images/destinations/kinosaki-onsen/hero.svg' },
  尾花沢市: { hero: '/images/destinations/ginzan-onsen/hero.svg' },
}

const DESTINATION_IMAGE_ID_ALIASES = {
  '京都府-京都市': '京都市',
  '奈良県-奈良市': '奈良市',
  '北海道-小樽市': '小樽市',
  '北海道-札幌市': '札幌市',
  '北海道-函館市': '函館市',
  '石川県-金沢市': '金沢市',
  '神奈川県-箱根町': '箱根町',
  '静岡県-熱海市': '熱海市',
  '群馬県-草津町': '草津町',
  '栃木県-日光市': '日光市',
  '神奈川県-鎌倉市': '鎌倉市',
  '神奈川県-横浜市': '横浜市',
  '宮城県-松島町': '松島町',
  '宮城県-仙台市': '仙台市',
  '福岡県-福岡市': '福岡市',
  '長崎県-長崎市': '長崎市',
  '広島県-広島市': '広島市',
  '広島県-廿日市市': '廿日市市',
  '沖縄県-那覇市': '那覇市',
  '沖縄県-石垣市': '石垣市',
  '岐阜県-高山市': '高山市',
  '三重県-伊勢市': '伊勢市',
  '和歌山県-白浜町': '白浜町',
  '長野県-軽井沢町': '軽井沢町',
  '北海道-富良野市': '富良野市',
  '福島県-会津若松市': '会津若松市',
  '広島県-尾道市': '尾道市',
  '岡山県-倉敷市': '倉敷市',
  '島根県-松江市': '松江市',
  '大分県-別府市': '別府市',
  '岐阜県-下呂市': '下呂市',
  '徳島県-鳴門市': '鳴門市',
  '山梨県-甲府市': '甲府市',
  '埼玉県-川越市': '川越市',
  '栃木県-佐野市': '佐野市',
  '長野県-上田市': '上田市',
  '沖縄県-宮古島市': '宮古島市',
  '大分県-由布市': '由布市',
  '愛媛県-松山市': '松山市',
  '兵庫県-神戸市': '神戸市',
  '兵庫県-豊岡市': '豊岡市',
  '山形県-尾花沢市': '尾花沢市',
}

Object.entries(DESTINATION_IMAGE_ID_ALIASES).forEach(([id, city]) => {
  if (DESTINATION_LOCAL_IMAGES[city] && !DESTINATION_LOCAL_IMAGES[id]) DESTINATION_LOCAL_IMAGES[id] = DESTINATION_LOCAL_IMAGES[city]
})

const getDestinationImageMapKey = (destination = {}) => (
  destination.id ?? (destination.prefecture && destination.city ? `${destination.prefecture}-${destination.city}` : destination.city)
)

const DESTINATION_IMAGE_THEMES = {
  京都市: {
    hero: '寺社・石畳・町家の和の雰囲気',
    scenery: '清水寺・嵐山・伏見稲荷などの景観候補',
    food: '湯豆腐・抹茶スイーツ・京料理',
  },
  奈良市: {
    hero: '奈良公園・鹿・古都の街並み',
    scenery: '東大寺・春日大社・ならまちの景観候補',
    food: '柿の葉寿司・茶粥・奈良漬',
  },
  小樽市: {
    hero: '小樽運河・倉庫群・港町の夜景の雰囲気',
    scenery: '運河夜景・天狗山・堺町通りの景観候補',
    food: '寿司・海鮮丼・市場グルメ',
  },
  金沢市: {
    hero: '兼六園・ひがし茶屋街・金箔感のあるしっとりした街並み',
    scenery: '兼六園・浅野川・城下町の景観候補',
    food: '海鮮丼・金沢おでん・加賀料理',
  },
  箱根町: {
    hero: '芦ノ湖・箱根神社・山並み・温泉',
    scenery: '大涌谷・箱根神社・ロープウェイの景観候補',
    food: '温泉まんじゅう・そば・豆腐料理',
  },
  熱海市: {
    hero: '海・温泉街・坂道・レトロ観光地',
    scenery: '来宮神社・海岸線・温泉街の景観候補',
    food: '海鮮・干物・温泉まんじゅう',
  },
  草津町: {
    hero: '湯畑・湯けむり・温泉街・夜の灯り',
    scenery: '西の河原公園・温泉街夜景・雪景色',
    food: '温泉まんじゅう・そば・舞茸料理',
  },
  鎌倉市: {
    hero: '鶴岡八幡宮・江ノ電・海・古都散策',
    scenery: '長谷・由比ヶ浜・小町通りの景観候補',
    food: 'しらす丼・鎌倉野菜・和カフェ',
  },
  福岡市: {
    hero: '屋台・博多ラーメン・夜の街・港町感',
    scenery: '中洲・福岡タワー・大濠公園の景観候補',
    food: '博多ラーメン・もつ鍋・屋台グルメ',
  },
  石垣市: {
    hero: '青い海・白い砂浜・川平湾・南国の空気感',
    scenery: 'ビーチ・夕景・南国の自然',
    food: '石垣牛・八重山そば・南国カフェ',
  },
  下呂市: {
    hero: '温泉街・川沿い・足湯・やわらかい湯けむり',
  },
  仙台市: {
    hero: '杜の都・青葉城跡・牛タン・街と緑',
  },
  鳴門市: {
    hero: '渦潮・鳴門海峡・橋・海の迫力',
  },
  別府市: {
    hero: '湯けむり・地獄めぐり・温泉街・坂のある街',
  },
  甲府市: {
    hero: '甲府城跡・昇仙峡・ぶどう畑・山梨の山並み',
  },
  川越市: {
    hero: '蔵造りの町並み・時の鐘・菓子屋横丁・レトロ街歩き',
  },
  佐野市: {
    hero: '佐野ラーメン・厄除け大師・日帰り街歩き',
  },
  上田市: {
    hero: '上田城跡・真田・城下町・信州の山並み',
  },
  宮古島市: {
    hero: '宮古ブルーの海・伊良部大橋・砂浜・リゾート感',
  },
  札幌市: {
    hero: '大通公園・札幌時計台・雪景色・都市と自然',
  },
  函館市: {
    hero: '函館山夜景・赤レンガ倉庫・港町・坂道',
  },
  長崎市: {
    hero: '異国情緒・坂の街・港・夜景',
  },
  広島市: {
    hero: '平和記念公園・路面電車・川沿い・都市観光',
  },
  廿日市市: {
    hero: '厳島神社・海上鳥居・瀬戸内海・鹿のいる島の雰囲気',
  },
  高山市: {
    hero: '古い町並み・飛騨の山並み・朝市・和の街歩き',
  },
  尾道市: {
    hero: '坂道・瀬戸内海・しまなみ海道・レトロな街並み',
  },
  倉敷市: {
    hero: '美観地区・白壁の町並み・柳並木・川舟の雰囲気',
  },
  松江市: {
    hero: '松江城・宍道湖・水辺の街・夕景',
  },
  由布市: {
    hero: '由布岳・温泉街・金鱗湖・ゆったり散策',
  },
  松山市: {
    hero: '道後温泉本館・温泉街・レトロ建築・夜の灯り',
  },
  神戸市: {
    hero: '有馬温泉の温泉街・坂道・金泉銀泉の雰囲気',
  },
  豊岡市: {
    hero: '城崎温泉の柳並木・外湯めぐり・浴衣散策・川沿いの温泉街',
  },
  尾花沢市: {
    hero: '銀山温泉の大正ロマン・雪景色・ガス灯・木造旅館街',
  },
}

const CONFIRMED_HERO_IMAGE_CITIES = new Set()

const getHeroImageQualityStatus = (city, imageType, src = '') => {
  if (imageType !== 'hero') return 'needs_review'
  if (src.endsWith('.svg')) return 'rejected'
  return CONFIRMED_HERO_IMAGE_CITIES.has(city) ? 'confirmed' : 'needs_review'
}

const createDestinationFixedImageEntry = (key, mappedImages = {}) => Object.fromEntries(
  Object.entries(mappedImages).map(([imageType, imageConfig]) => {
    const city = DESTINATION_IMAGE_ID_ALIASES[key] ?? key
    const src = typeof imageConfig === 'string' ? imageConfig : imageConfig?.src ?? imageConfig?.url ?? ''
    const theme = typeof imageConfig === 'object' && imageConfig?.theme
      ? imageConfig.theme
      : DESTINATION_IMAGE_THEMES[city]?.[imageType] ?? ''
    const explicitStatus = typeof imageConfig === 'object' && imageConfig?.status
      ? imageConfig.status
      : ''
    const status = explicitStatus || getHeroImageQualityStatus(city, imageType, src)
    const isSimpleSvg = imageType === 'hero' && src.endsWith('.svg')
    return [imageType, {
      src,
      url: src,
      candidateSrc: typeof imageConfig === 'object' ? imageConfig?.candidateSrc ?? '' : '',
      alt: typeof imageConfig === 'object' && imageConfig?.alt
        ? imageConfig.alt
        : imageType === 'hero'
          ? `${city}をイメージしたビジュアル`
          : `${city}の${imageType === 'scenery' ? '景色' : 'ご当地グルメ'}をイメージしたビジュアル`,
      type: typeof imageConfig === 'object' ? imageConfig?.type ?? 'destination_fixed' : 'destination_fixed',
      status,
      isIllustration: typeof imageConfig === 'object' ? imageConfig?.isIllustration ?? true : true,
      isPhoto: typeof imageConfig === 'object' ? imageConfig?.isPhoto ?? false : false,
      sourceType: typeof imageConfig === 'object' ? imageConfig?.sourceType ?? (isSimpleSvg ? 'ai_generated' : 'unknown') : (isSimpleSvg ? 'ai_generated' : 'unknown'),
      theme,
      reviewNote: typeof imageConfig === 'object'
        ? imageConfig?.reviewNote ?? ''
        : isSimpleSvg
          ? '簡易SVGのため一般画面では非表示。高品質画像で再作成する。'
          : '権利・品質・旅先らしさを確認中。',
      confirmedAt: typeof imageConfig === 'object' ? imageConfig?.confirmedAt ?? '' : '',
      rejectedReason: typeof imageConfig === 'object'
        ? imageConfig?.rejectedReason ?? ''
        : isSimpleSvg
          ? '簡易SVGで旅先らしさと旅行アプリheroとしての魅力が不足。'
          : '',
    }]
  }),
)

export const destinationImageMap = Object.freeze(Object.fromEntries(
  Object.entries(DESTINATION_LOCAL_IMAGES).map(([key, mappedImages]) => [
    key,
    createDestinationFixedImageEntry(key, mappedImages),
  ]),
))

const getFixedImageMap = (destination = {}) => destinationImageMap[getDestinationImageMapKey(destination)]
  ?? destinationImageMap[destination.city]
  ?? null

const EXTENDED_DESTINATION_IMAGE_SLUGS = new Set([
  'kyoto',
  'nara',
  'otaru',
  'kanazawa',
  'hakone',
  'atami',
  'kusatsu',
  'kamakura',
  'fukuoka',
  'ishigaki',
  'sapporo',
  'hakodate',
  'yokohama',
  'matsushima',
  'sendai',
  'hiroshima',
  'miyajima',
  'nagasaki',
  'takayama',
  'ise',
  'nikko',
  'karuizawa',
  'furano',
  'aizuwakamatsu',
  'onomichi',
  'kurashiki',
  'matsue',
  'beppu',
  'naha',
  'shirahama',
])

const getDestinationImageSlug = (mappedImages = {}) => {
  const heroPath = getImageUrl(mappedImages.hero) || mappedImages.hero?.src || ''
  return heroPath.match(/\/images\/destinations\/(.+)-hero\.jpg$/)?.[1] ?? ''
}

const getMappedDestinationImageUrl = (mappedImages, imageType) => {
  if (!mappedImages) return ''
  const mappedUrl = getImageUrl(mappedImages[imageType]) || mappedImages[imageType]?.src || ''
  if (mappedUrl) return mappedUrl

  const slug = getDestinationImageSlug(mappedImages)
  if (slug && EXTENDED_DESTINATION_IMAGE_SLUGS.has(slug) && ['food', 'scenery'].includes(imageType)) {
    return `/images/destinations/${slug}-${imageType}.jpg`
  }

  return ''
}

export const MAJOR_DESTINATION_CITIES = Object.freeze(Object.keys(DESTINATION_LOCAL_IMAGES))

const PHOTO_LICENSE = 'DROPTRIP生成素材・本プロジェクト内で利用可能'

const inferFoodThemeFromUrl = (url = '', source = '') => {
  if (source === 'curated' && url.includes('-food')) return 'ご当地グルメ候補'
  if (url.includes('/gourmet-')) return '料理イメージ'
  if (url.includes('/food-default')) return '汎用料理イメージ'
  return ''
}

const createLocalAsset = (url, type, source, credit, status = 'confirmed', overrides = {}) => createImageAsset({
  url,
  type,
  source,
  credit,
  license: PHOTO_LICENSE,
  status,
  isLocal: true,
  isGeneric: source === 'placeholder',
  isDestinationSpecific: ['curated', 'destination_fixed'].includes(source),
  isFoodSpecific: type === 'food' && source === 'destination_fixed',
  isLocalFood: type === 'food' && source === 'destination_fixed',
  isIllustration: source === 'destination_fixed',
  assetType: source === 'destination_fixed' ? 'destination_fixed' : source,
  foodTheme: type === 'food' ? inferFoodThemeFromUrl(url, source) : '',
  note: source === 'curated'
    ? '旅行先個別画像の差し替え候補です。公開前に権利確認をしてください。'
    : source === 'fallback'
      ? 'タグ別の共通画像です。個別の現地写真へ差し替える候補です。'
      : '汎用画像です。個別画像またはカテゴリ画像への差し替え候補です。',
  ...overrides,
})

export const DEFAULT_TRAVEL_IMAGE = createLocalAsset(COMMON_PATHS.hero, 'hero', 'placeholder', 'イメージ画像')
export const DEFAULT_FOOD_IMAGE = createLocalAsset(COMMON_PATHS.food, 'food', 'placeholder', 'イメージ画像')
export const DEFAULT_SCENERY_IMAGE = createLocalAsset(COMMON_PATHS.scenery, 'scenery', 'placeholder', 'イメージ画像')
export const COMMON_IMAGE_PLACEHOLDER = DEFAULT_TRAVEL_IMAGE

export const getImageUrl = (image) => {
  if (typeof image === 'string') return image
  return image?.url ?? image?.imageUrl ?? ''
}

export const getImageCredit = (image) => {
  if (!image || typeof image === 'string') return ''
  return image.credit ?? image.imageCredit ?? ''
}

export const isValidImageUrl = (value) => {
  const imageUrl = getImageUrl(value)
  if (typeof imageUrl !== 'string' || !imageUrl.trim()) return false
  if (imageUrl.startsWith('/images/')) return true
  if (imageUrl.startsWith('data:image/')) return true
  try {
    const url = new URL(imageUrl)
    return ['http:', 'https:'].includes(url.protocol)
  } catch {
    return false
  }
}

export const isExternalImage = (value) => /^https?:\/\//i.test(getImageUrl(value))

export const isIllustrationImage = (value) => {
  const url = getImageUrl(value)
  const source = typeof value === 'object' ? value.source ?? value.imageSource : ''
  return url.startsWith('data:image/svg+xml') || ['illustration', 'droptrip-generated'].includes(source)
}

const getCommonAsset = (imageType) => {
  if (imageType === 'food') return DEFAULT_FOOD_IMAGE
  if (imageType === 'scenery') return DEFAULT_SCENERY_IMAGE
  return DEFAULT_TRAVEL_IMAGE
}

const getPreferredCategory = (destinationOrTags = [], imageType = 'hero') => {
  const destination = Array.isArray(destinationOrTags) ? { tags: destinationOrTags } : destinationOrTags
  const tags = destination.tags ?? []
  const purposeFit = destination.purposeFit ?? {}
  const localFoods = destination.localFoodCandidates ?? []
  if (imageType === 'food') return 'グルメ'
  if (destination.city === '石垣市' || destination.city === '那覇市' || destination.region === '沖縄') return imageType === 'scenery' ? '離島' : '海'
  if (destination.region === '北海道' && ['札幌市', '函館市', '富良野市', '小樽市'].includes(destination.city)) return imageType === 'scenery' ? '雪景色' : '自然'
  if (Number(purposeFit.history ?? 0) >= 70) return '歴史'
  if (Number(purposeFit.walking ?? 0) >= 70) return '街歩き'
  if (Number(purposeFit.nature ?? 0) >= 70) return '自然'
  if (imageType === 'scenery' && tags.length === 1 && tags[0] === 'グルメ') return 'nature'
  if (localFoods.some((food) => /海鮮|寿司|魚|牡蠣/.test(food)) && imageType === 'hero') return '海'
  const priorities = imageType === 'scenery'
    ? ['海', '山', '温泉', 'カップル向け', 'グルメ']
    : ['温泉', '海', '山', 'カップル向け', 'グルメ']
  return priorities.find((tag) => tags.includes(tag)) ?? (imageType === 'scenery' ? 'nature' : 'city')
}

const stableHash = (value = '') => [...String(value)].reduce((hash, character) => (
  ((hash * 31) + character.codePointAt(0)) >>> 0
), 7)

export const getThemeImageFallback = (destinationOrTags = [], imageType = 'hero', seed = '') => {
  const category = getPreferredCategory(destinationOrTags, imageType)
  const variants = CATEGORY_PATHS[category] ?? []
  const typeOffset = imageType === 'hero' ? 0 : imageType === 'food' ? 1 : 2
  const url = variants[
    (stableHash(`${seed}:${category}`) + typeOffset) % Math.max(variants.length, 1)
  ]
  return url
    ? createLocalAsset(url, imageType, 'fallback', 'カテゴリ画像', 'fallback', {
      isFoodSpecific: imageType === 'food' && category === 'グルメ',
      isLocalFood: false,
      foodTheme: imageType === 'food' ? (category === 'グルメ' ? '料理イメージ' : '汎用料理イメージ') : '',
    })
    : getCommonAsset(imageType)
}

const normalizeImageAsset = (image, imageType) => {
  if (typeof image === 'string') return createImageAsset({ url: image, type: imageType })
  if (!image || typeof image !== 'object') return null
  return createImageAsset({
    url: getImageUrl(image),
    type: imageType,
    source: image.source ?? image.imageSource ?? '',
    credit: image.credit ?? image.imageCredit ?? '',
    license: image.license ?? image.imageLicense ?? '',
    status: image.status ?? image.imageStatus ?? 'needs_review',
    isLocal: image.isLocal,
    isGeneric: image.isGeneric,
    isDestinationSpecific: image.isDestinationSpecific,
    isIllustration: image.isIllustration,
    isPhoto: image.isPhoto,
    alt: image.alt,
    assetType: image.assetType,
    isFoodSpecific: image.isFoodSpecific,
    isLocalFood: image.isLocalFood,
    foodTheme: image.foodTheme,
    note: image.note,
    candidateSrc: image.candidateSrc,
    sourceType: image.sourceType,
    reviewNote: image.reviewNote,
    confirmedAt: image.confirmedAt,
    rejectedReason: image.rejectedReason,
  })
}

/**
 * 表示画像の唯一の解決窓口。
 * 結果画面heroでは旅先固定画像だけを返し、カテゴリ・共通画像への代替は行わない。
 */
export const getDestinationImage = (destination = {}, imageType = 'hero') => {
  const field = `${imageType}Image`
  const configured = normalizeImageAsset(destination[field], imageType)
  const configuredUrl = getImageUrl(configured)
  const fixedImageMap = getFixedImageMap(destination)
  const mappedAsset = fixedImageMap?.[imageType]
  const mappedUrl = getMappedDestinationImageUrl(fixedImageMap, imageType)

  if (mappedUrl) {
    const theme = mappedAsset?.theme ?? DESTINATION_IMAGE_THEMES[destination.city]?.[imageType] ?? ''
    const status = mappedAsset?.status ?? 'needs_review'
    return createLocalAsset(mappedUrl, imageType, 'destination_fixed', '旅先イメージ', status, {
      type: mappedAsset?.type ?? 'destination_fixed',
      imageType,
      isFoodSpecific: imageType === 'food',
      isLocalFood: imageType === 'food',
      alt: mappedAsset?.alt || (imageType === 'hero'
        ? `${destination.city}をイメージしたビジュアル`
        : `${destination.city}の${imageType === 'scenery' ? '景色' : 'ご当地グルメ'}をイメージしたビジュアル`),
      foodTheme: imageType === 'food' ? theme || inferFoodThemeFromUrl(mappedUrl, 'curated') : '',
      note: theme
        ? `${theme}に沿った旅先固定のイメージビジュアルです。`
        : '旅先固定のイメージビジュアルです。',
      candidateSrc: mappedAsset?.candidateSrc ?? '',
      sourceType: mappedAsset?.sourceType ?? 'unknown',
      reviewNote: mappedAsset?.reviewNote ?? '',
      confirmedAt: mappedAsset?.confirmedAt ?? '',
      rejectedReason: mappedAsset?.rejectedReason ?? '',
      isPhoto: mappedAsset?.isPhoto ?? false,
    })
  }
  if (configuredUrl.startsWith('/images/destinations/') && isValidImageUrl(configured)) {
    return createImageAsset({
      ...configured,
      source: 'destination_fixed',
      status: configured.status ?? 'needs_review',
      isDestinationSpecific: true,
      isGeneric: false,
      isIllustration: true,
      isPhoto: configured.isPhoto ?? false,
      assetType: 'destination_fixed',
      alt: configured.alt || `${destination.city}をイメージしたビジュアル`,
      candidateSrc: configured.candidateSrc ?? '',
      sourceType: configured.sourceType ?? 'unknown',
      reviewNote: configured.reviewNote ?? '',
      confirmedAt: configured.confirmedAt ?? '',
      rejectedReason: configured.rejectedReason ?? '',
    })
  }

  return createImageAsset({
    url: '',
    type: imageType,
    source: 'missing',
    status: 'missing',
    isLocal: true,
    isGeneric: false,
    isDestinationSpecific: false,
    assetType: 'missing',
    alt: '',
    note: '旅先固定画像が未設定です。',
  })
}

export const getDestinationImageCandidates = (destination = {}, imageType = 'hero') => {
  const primary = getDestinationImage(destination, imageType)
  return [primary]
    .filter((image) => isValidImageUrl(getImageUrl(image)))
    .filter((image, index, images) => images.findIndex((candidate) => getImageUrl(candidate) === getImageUrl(image)) === index)
}

export const getDestinationImages = (prefecture, city, tags = [], details = {}) => {
  const destination = { prefecture, city, tags, ...details }
  const heroImage = getDestinationImage(destination, 'hero')
  const foodImage = getDestinationImage(destination, 'food')
  const sceneryImage = getDestinationImage(destination, 'scenery')
  const hasFixedImage = [heroImage, foodImage, sceneryImage].some((image) => image.source === 'destination_fixed')

  return {
    heroImage,
    foodImage,
    sceneryImage,
    imageCredit: hasFixedImage ? '旅先イメージ' : '',
    imageSource: hasFixedImage ? 'destination_fixed' : 'missing',
    imageLicense: PHOTO_LICENSE,
    imageStatus: heroImage.status ?? (hasFixedImage ? 'needs_review' : 'missing'),
    imageSourceType: hasFixedImage ? 'destination_fixed' : 'missing',
    imageLocationLabel: city ? `${prefecture} ${city}の旅先イメージ` : '',
  }
}

