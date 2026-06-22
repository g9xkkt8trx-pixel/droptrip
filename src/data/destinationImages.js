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
  温泉: '/images/categories/onsen.jpg',
  海: '/images/categories/sea.jpg',
  山: '/images/categories/mountain.jpg',
  グルメ: '/images/categories/gourmet.jpg',
  カップル向け: '/images/categories/couple.jpg',
  city: '/images/categories/city.jpg',
  history: '/images/categories/history.jpg',
  nature: '/images/categories/nature.jpg',
}

// 権利確認済みの個別画像を追加したときは、この対応表へ登録する。
const DESTINATION_LOCAL_IMAGES = {
  京都市: { hero: '/images/destinations/kyoto.jpg' },
  箱根町: { hero: '/images/destinations/hakone.jpg' },
  小樽市: { hero: '/images/destinations/otaru.jpg' },
  金沢市: { hero: '/images/destinations/kanazawa.jpg' },
  那覇市: { hero: '/images/destinations/naha.jpg' },
}

const PHOTO_LICENSE = 'DROPTRIP生成素材・本プロジェクト内で利用可能'

const createLocalAsset = (url, type, source, credit) => createImageAsset({
  url,
  type,
  source,
  credit,
  license: PHOTO_LICENSE,
  status: 'confirmed',
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
  if (imageType === 'food') return tags.includes('グルメ') ? 'グルメ' : tags.includes('海') ? '海' : 'グルメ'
  const priorities = imageType === 'scenery'
    ? ['海', '山', '温泉', 'カップル向け', 'グルメ']
    : ['温泉', '海', '山', 'カップル向け', 'グルメ']
  return priorities.find((tag) => tags.includes(tag)) ?? (imageType === 'scenery' ? 'nature' : 'city')
}

export const getThemeImageFallback = (tags = [], imageType = 'hero') => {
  const category = getPreferredCategory(tags, imageType)
  const url = CATEGORY_PATHS[category]
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
  const mappedUrl = DESTINATION_LOCAL_IMAGES[destination.city]?.[imageType]

  if (mappedUrl) return createLocalAsset(mappedUrl, imageType, 'curated', 'イメージ画像')
  if (configuredUrl.startsWith('/images/destinations/') && isValidImageUrl(configured)) return configured

  const categoryAsset = getThemeImageFallback(destination.tags ?? [], imageType)
  if (isValidImageUrl(categoryAsset)) return categoryAsset
  return getCommonAsset(imageType)
}

export const getDestinationImageCandidates = (destination = {}, imageType = 'hero') => {
  const primary = getDestinationImage(destination, imageType)
  const category = getThemeImageFallback(destination.tags ?? [], imageType)
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
