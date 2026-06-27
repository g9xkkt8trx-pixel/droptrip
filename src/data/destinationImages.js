export const createImageAsset = ({
  url = '',
  type = 'hero',
  source = '',
  credit = '',
  license = '',
  status = 'unconfirmed',
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

// 権利確認済みの個別画像を追加したときは、この対応表へ登録する。
const DESTINATION_LOCAL_IMAGES = {
  京都市: { hero: '/images/destinations/kyoto-hero.jpg' }, 奈良市: { hero: '/images/destinations/nara-hero.jpg' },
  小樽市: { hero: '/images/destinations/otaru-hero.jpg' }, 札幌市: { hero: '/images/destinations/sapporo-hero.jpg' },
  函館市: { hero: '/images/destinations/hakodate-hero.jpg' }, 金沢市: { hero: '/images/destinations/kanazawa-hero.jpg' },
  箱根町: { hero: '/images/destinations/hakone-hero.jpg' }, 熱海市: { hero: '/images/destinations/atami-hero.jpg' },
  草津町: { hero: '/images/destinations/kusatsu-hero.jpg' }, 日光市: { hero: '/images/destinations/nikko-hero.jpg' },
  鎌倉市: { hero: '/images/destinations/kamakura-hero.jpg' }, 横浜市: { hero: '/images/destinations/yokohama-hero.jpg' },
  松島町: { hero: '/images/destinations/matsushima-hero.jpg' }, 仙台市: { hero: '/images/destinations/sendai-hero.jpg' },
  福岡市: { hero: '/images/destinations/fukuoka-hero.jpg' }, 長崎市: { hero: '/images/destinations/nagasaki-hero.jpg' },
  広島市: { hero: '/images/destinations/hiroshima-hero.jpg' }, 廿日市市: { hero: '/images/destinations/miyajima-hero.jpg' },
  那覇市: { hero: '/images/destinations/naha-hero.jpg' }, 石垣市: { hero: '/images/destinations/ishigaki-hero.jpg' },
  高山市: { hero: '/images/destinations/takayama-hero.jpg' }, 伊勢市: { hero: '/images/destinations/ise-hero.jpg' },
  白浜町: { hero: '/images/destinations/shirahama-hero.jpg' }, 軽井沢町: { hero: '/images/destinations/karuizawa-hero.jpg' },
  富良野市: { hero: '/images/destinations/furano-hero.jpg' }, 会津若松市: { hero: '/images/destinations/aizuwakamatsu-hero.jpg' },
  尾道市: { hero: '/images/destinations/onomichi-hero.jpg' }, 倉敷市: { hero: '/images/destinations/kurashiki-hero.jpg' },
  松江市: { hero: '/images/destinations/matsue-hero.jpg' }, 別府市: { hero: '/images/destinations/beppu-hero.jpg' },
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

const createLocalAsset = (url, type, source, credit, status = 'confirmed') => createImageAsset({
  url,
  type,
  source,
  credit,
  license: PHOTO_LICENSE,
  status,
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

const getPreferredCategory = (tags = [], imageType = 'hero') => {
  if (imageType === 'food') return 'グルメ'
  if (imageType === 'scenery' && tags.length === 1 && tags[0] === 'グルメ') return 'nature'
  const priorities = imageType === 'scenery'
    ? ['海', '山', '温泉', 'カップル向け', 'グルメ']
    : ['温泉', '海', '山', 'カップル向け', 'グルメ']
  return priorities.find((tag) => tags.includes(tag)) ?? (imageType === 'scenery' ? 'nature' : 'city')
}

const stableHash = (value = '') => [...String(value)].reduce((hash, character) => (
  ((hash * 31) + character.codePointAt(0)) >>> 0
), 7)

export const getThemeImageFallback = (tags = [], imageType = 'hero', seed = '') => {
  const category = getPreferredCategory(tags, imageType)
  const variants = CATEGORY_PATHS[category] ?? []
  const typeOffset = imageType === 'hero' ? 0 : imageType === 'food' ? 1 : 2
  const url = variants[
    (stableHash(`${seed}:${category}`) + typeOffset) % Math.max(variants.length, 1)
  ]
  return url
    ? createLocalAsset(url, imageType, 'fallback', 'カテゴリ画像')
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
    status: image.status ?? image.imageStatus ?? 'unconfirmed',
  })
}

/**
 * 表示画像の唯一の解決窓口。
 * 個別ローカル画像 → カテゴリ画像 → 共通画像の順で返し、外部URLは主要表示に使わない。
 */
export const getDestinationImage = (destination = {}, imageType = 'hero') => {
  const field = `${imageType}Image`
  const configured = normalizeImageAsset(destination[field], imageType)
  const configuredUrl = getImageUrl(configured)
  const mappedUrl = getMappedDestinationImageUrl(DESTINATION_LOCAL_IMAGES[destination.city], imageType)
  const seed = destination.id ?? destination.city ?? destination.prefecture ?? ''

  if (mappedUrl) return createLocalAsset(mappedUrl, imageType, 'curated', 'イメージ画像', 'temporary')
  if (configuredUrl.startsWith('/images/destinations/') && isValidImageUrl(configured)) return configured

  const categoryAsset = getThemeImageFallback(destination.tags ?? [], imageType, seed)
  if (isValidImageUrl(categoryAsset)) return categoryAsset
  return getCommonAsset(imageType)
}

export const getDestinationImageCandidates = (destination = {}, imageType = 'hero') => {
  const primary = getDestinationImage(destination, imageType)
  const category = getThemeImageFallback(destination.tags ?? [], imageType, destination.id ?? destination.city ?? '')
  const common = getCommonAsset(imageType)
  return [primary, category, common]
    .filter(isValidImageUrl)
    .filter((image, index, images) => images.findIndex((candidate) => getImageUrl(candidate) === getImageUrl(image)) === index)
}

export const getDestinationImages = (prefecture, city, tags = []) => {
  const destination = { prefecture, city, tags }
  const heroImage = getDestinationImage(destination, 'hero')
  const foodImage = getDestinationImage(destination, 'food')
  const sceneryImage = getDestinationImage(destination, 'scenery')
  const hasIndividualImage = [heroImage, foodImage, sceneryImage].some((image) => image.source === 'curated')

  return {
    heroImage,
    foodImage,
    sceneryImage,
    imageCredit: hasIndividualImage ? 'イメージ画像' : 'カテゴリ画像',
    imageSource: hasIndividualImage ? 'curated' : 'fallback',
    imageLicense: PHOTO_LICENSE,
    imageStatus: 'confirmed',
    imageSourceType: hasIndividualImage ? 'individual' : 'tag',
    imageLocationLabel: city ? `${prefecture} ${city}の旅行イメージ` : '汎用旅行イメージ',
  }
}
