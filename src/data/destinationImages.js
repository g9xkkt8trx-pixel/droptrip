export const createImageAsset = ({
  url = '',
  type = 'hero',
  source = '',
  credit = '',
  license = '',
  status = 'needs_review',
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
}) => ({
  url,
  imageUrl: url,
  type,
  imageType: type,
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
  alt,
  assetType,
  isFoodSpecific,
  isLocalFood,
  foodTheme,
  note,
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

// 旅先ごとの固定イメージ画像を追加したときは、この対応表へ登録する。
// まず destination.id を優先し、既存データとの互換性のため city キーも残す。
const DESTINATION_LOCAL_IMAGES = {
  京都市: {
    hero: '/images/destinations/kyoto-hero.jpg',
    scenery: '/images/destinations/kyoto-scenery.jpg',
    food: '/images/destinations/kyoto-food.jpg',
  },
  奈良市: {
    hero: '/images/destinations/nara-hero.jpg',
    scenery: '/images/destinations/nara-scenery.jpg',
    food: '/images/destinations/nara-food.jpg',
  },
  小樽市: {
    hero: '/images/destinations/otaru-hero.jpg',
    scenery: '/images/destinations/otaru-scenery.jpg',
    food: '/images/destinations/otaru-food.jpg',
  },
  札幌市: { hero: '/images/destinations/sapporo-hero.jpg' },
  函館市: { hero: '/images/destinations/hakodate-hero.jpg' },
  金沢市: {
    hero: '/images/destinations/kanazawa-hero.jpg',
    scenery: '/images/destinations/kanazawa-scenery.jpg',
    food: '/images/destinations/kanazawa-food.jpg',
  },
  箱根町: {
    hero: '/images/destinations/hakone-hero.jpg',
    scenery: '/images/destinations/hakone-scenery.jpg',
    food: '/images/destinations/hakone-food.jpg',
  },
  熱海市: {
    hero: '/images/destinations/atami-hero.jpg',
    scenery: '/images/destinations/atami-scenery.jpg',
    food: '/images/destinations/atami-food.jpg',
  },
  草津町: {
    hero: '/images/destinations/kusatsu-hero.jpg',
    scenery: '/images/destinations/kusatsu-scenery.jpg',
    food: '/images/destinations/kusatsu-food.jpg',
  },
  日光市: { hero: '/images/destinations/nikko-hero.jpg' },
  鎌倉市: {
    hero: '/images/destinations/kamakura-hero.jpg',
    scenery: '/images/destinations/kamakura-scenery.jpg',
    food: '/images/destinations/kamakura-food.jpg',
  },
  横浜市: { hero: '/images/destinations/yokohama-hero.jpg' },
  松島町: { hero: '/images/destinations/matsushima-hero.jpg' }, 仙台市: { hero: '/images/destinations/sendai-hero.jpg' },
  福岡市: {
    hero: '/images/destinations/fukuoka-hero.jpg',
    scenery: '/images/destinations/fukuoka-scenery.jpg',
    food: '/images/destinations/fukuoka-food.jpg',
  },
  長崎市: { hero: '/images/destinations/nagasaki-hero.jpg' },
  広島市: { hero: '/images/destinations/hiroshima-hero.jpg' }, 廿日市市: { hero: '/images/destinations/miyajima-hero.jpg' },
  那覇市: { hero: '/images/destinations/naha-hero.jpg' },
  石垣市: {
    hero: '/images/destinations/ishigaki-hero.jpg',
    scenery: '/images/destinations/ishigaki-scenery.jpg',
    food: '/images/destinations/ishigaki-food.jpg',
  },
  高山市: { hero: '/images/destinations/takayama-hero.jpg' }, 伊勢市: { hero: '/images/destinations/ise-hero.jpg' },
  白浜町: { hero: '/images/destinations/shirahama-hero.jpg' }, 軽井沢町: { hero: '/images/destinations/karuizawa-hero.jpg' },
  富良野市: { hero: '/images/destinations/furano-hero.jpg' }, 会津若松市: { hero: '/images/destinations/aizuwakamatsu-hero.jpg' },
  尾道市: { hero: '/images/destinations/onomichi-hero.jpg' }, 倉敷市: { hero: '/images/destinations/kurashiki-hero.jpg' },
  松江市: { hero: '/images/destinations/matsue-hero.jpg' }, 別府市: { hero: '/images/destinations/beppu-hero.jpg' },
}

const getDestinationImageMapKey = (destination = {}) => (
  destination.id ?? (destination.prefecture && destination.city ? `${destination.prefecture}-${destination.city}` : destination.city)
)

const getFixedImageMap = (destination = {}) => DESTINATION_LOCAL_IMAGES[getDestinationImageMapKey(destination)]
  ?? DESTINATION_LOCAL_IMAGES[destination.city]
  ?? null

const DESTINATION_IMAGE_THEMES = {
  京都市: {
    hero: '京都らしい街並み・寺社・鴨川のイメージ',
    scenery: '清水寺・嵐山・伏見稲荷などの景観候補',
    food: '湯豆腐・抹茶スイーツ・京料理',
  },
  奈良市: {
    hero: '奈良公園・鹿・古都の街並み',
    scenery: '東大寺・春日大社・ならまちの景観候補',
    food: '柿の葉寿司・茶粥・奈良漬',
  },
  小樽市: {
    hero: '小樽運河・港町・レンガ倉庫',
    scenery: '運河夜景・天狗山・堺町通りの景観候補',
    food: '寿司・海鮮丼・市場グルメ',
  },
  金沢市: {
    hero: 'ひがし茶屋街・兼六園・金沢駅',
    scenery: '兼六園・浅野川・城下町の景観候補',
    food: '海鮮丼・金沢おでん・加賀料理',
  },
  箱根町: {
    hero: '芦ノ湖・温泉旅館・富士山が見える風景',
    scenery: '大涌谷・箱根神社・ロープウェイの景観候補',
    food: '温泉まんじゅう・そば・豆腐料理',
  },
  熱海市: {
    hero: '海と温泉街・熱海サンビーチ',
    scenery: '来宮神社・海岸線・温泉街の景観候補',
    food: '海鮮・干物・温泉まんじゅう',
  },
  草津町: {
    hero: '湯畑・温泉街・湯けむり',
    scenery: '西の河原公園・温泉街夜景・雪景色',
    food: '温泉まんじゅう・そば・舞茸料理',
  },
  鎌倉市: {
    hero: '海と寺社・江ノ電・鎌倉大仏',
    scenery: '長谷・由比ヶ浜・小町通りの景観候補',
    food: 'しらす丼・鎌倉野菜・和カフェ',
  },
  福岡市: {
    hero: '博多・天神の街並み・屋台',
    scenery: '中洲・福岡タワー・大濠公園の景観候補',
    food: '博多ラーメン・もつ鍋・屋台グルメ',
  },
  石垣市: {
    hero: '青い海・離島ターミナル・川平湾',
    scenery: 'ビーチ・夕景・南国の自然',
    food: '石垣牛・八重山そば・南国カフェ',
  },
}

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
  const heroPath = mappedImages.hero ?? ''
  return heroPath.match(/\/images\/destinations\/(.+)-hero\.jpg$/)?.[1] ?? ''
}

const getMappedDestinationImageUrl = (mappedImages, imageType) => {
  if (!mappedImages) return ''
  if (mappedImages[imageType]) return mappedImages[imageType]

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
    isFoodSpecific: image.isFoodSpecific,
    isLocalFood: image.isLocalFood,
    foodTheme: image.foodTheme,
    note: image.note,
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
  const mappedUrl = getMappedDestinationImageUrl(fixedImageMap, imageType)

  if (mappedUrl) {
    const theme = DESTINATION_IMAGE_THEMES[destination.city]?.[imageType] ?? ''
    return createLocalAsset(mappedUrl, imageType, 'destination_fixed', '旅先イメージ', 'needs_review', {
      isFoodSpecific: imageType === 'food',
      isLocalFood: imageType === 'food',
      alt: imageType === 'hero'
        ? `${destination.city}をイメージしたビジュアル`
        : `${destination.city}の${imageType === 'scenery' ? '景色' : 'ご当地グルメ'}をイメージしたビジュアル`,
      foodTheme: imageType === 'food' ? theme || inferFoodThemeFromUrl(mappedUrl, 'curated') : '',
      note: theme
        ? `${theme}に沿った旅先固定画像です。現地写真ではなくイメージとして扱います。`
        : '旅先固定画像です。現地写真ではなくイメージとして扱います。',
    })
  }
  if (configuredUrl.startsWith('/images/destinations/') && isValidImageUrl(configured)) {
    return createImageAsset({
      ...configured,
      source: 'destination_fixed',
      status: configured.status ?? 'needs_review',
      isDestinationSpecific: true,
      isGeneric: false,
      isIllustration: configured.isIllustration ?? true,
      assetType: 'destination_fixed',
      alt: configured.alt || `${destination.city}をイメージしたビジュアル`,
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
    .filter(isValidImageUrl)
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
    imageStatus: hasFixedImage ? 'needs_review' : 'missing',
    imageSourceType: hasFixedImage ? 'destination_fixed' : 'missing',
    imageLocationLabel: city ? `${prefecture} ${city}の旅先イメージ` : '',
  }
}
