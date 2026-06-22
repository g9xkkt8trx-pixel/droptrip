const createPlaceholderUrl = ({ title, subtitle, colors }) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${colors[0]}"/><stop offset="1" stop-color="${colors[1]}"/></linearGradient></defs><rect width="900" height="600" fill="url(#g)"/><circle cx="735" cy="125" r="65" fill="rgba(255,255,255,.35)"/><path d="M0 455 190 285l125 115 145-175 225 230 95-95 120 95v145H0Z" fill="rgba(255,255,255,.32)"/><path d="M0 500 210 380l120 95 170-125 180 140 105-70 115 80v100H0Z" fill="rgba(255,255,255,.24)"/><text x="55" y="90" fill="white" font-family="sans-serif" font-size="42" font-weight="700">${title}</text><text x="58" y="132" fill="rgba(255,255,255,.82)" font-family="sans-serif" font-size="22">${subtitle}</text></svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

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

const createManagedPlaceholder = ({ title, subtitle, colors, type = 'hero', source = 'droptrip-generated' }) => (
  createImageAsset({
    url: createPlaceholderUrl({ title, subtitle, colors }),
    type,
    source,
    credit: 'DROPTRIP',
    license: 'アプリ内生成画像',
    status: 'confirmed',
  })
)

export const DEFAULT_TRAVEL_IMAGE = createManagedPlaceholder({
  title: 'DROPTRIP', subtitle: '旅の景色を探しに行こう', colors: ['#66b6a4', '#e9a26f'],
})
export const DEFAULT_FOOD_IMAGE = createManagedPlaceholder({
  title: 'LOCAL FOOD', subtitle: 'その土地のおいしい出会い', colors: ['#dc8d68', '#f2c879'], type: 'food',
})
export const DEFAULT_SCENERY_IMAGE = createManagedPlaceholder({
  title: 'SCENERY', subtitle: 'まだ見ぬ風景のイメージ', colors: ['#77a9c4', '#88bea5'], type: 'scenery',
})
export const COMMON_IMAGE_PLACEHOLDER = DEFAULT_TRAVEL_IMAGE

const TAG_IMAGE_PLACEHOLDERS = {
  温泉: createManagedPlaceholder({ title: 'ONSEN', subtitle: '湯けむりと癒やしの旅', colors: ['#83b7ae', '#e5a67e'], source: 'tag-fallback' }),
  海: createManagedPlaceholder({ title: 'SEASIDE', subtitle: '潮風と青い海を楽しむ旅', colors: ['#55a9cf', '#84d3c1'], source: 'tag-fallback' }),
  山: createManagedPlaceholder({ title: 'MOUNTAIN', subtitle: '山と高原の空気に出会う旅', colors: ['#679b78', '#b9c87f'], source: 'tag-fallback' }),
  グルメ: createManagedPlaceholder({ title: 'LOCAL FOOD', subtitle: 'その土地のおいしい出会い', colors: ['#dc8d68', '#f2c879'], type: 'food', source: 'tag-fallback' }),
  カップル向け: createManagedPlaceholder({ title: 'CITY WALK', subtitle: '街歩きと特別な時間', colors: ['#ba83a4', '#e4a078'], source: 'tag-fallback' }),
}

export const getImageUrl = (image) => {
  if (typeof image === 'string') return image
  return image?.url ?? image?.imageUrl ?? ''
}

export const getImageCredit = (image) => {
  if (!image || typeof image === 'string') return ''
  return image.credit ?? image.imageCredit ?? ''
}

export const getThemeImageFallback = (tags = [], imageType = 'hero') => {
  const priorities = imageType === 'food'
    ? ['グルメ', '海', '温泉', 'カップル向け', '山']
    : imageType === 'scenery'
      ? ['海', '山', '温泉', 'カップル向け', 'グルメ']
      : ['温泉', '海', '山', 'カップル向け', 'グルメ']
  const matchedTag = priorities.find((tag) => tags.includes(tag))
  if (matchedTag) return { ...TAG_IMAGE_PLACEHOLDERS[matchedTag], type: imageType, imageType }
  if (imageType === 'food') return DEFAULT_FOOD_IMAGE
  if (imageType === 'scenery') return DEFAULT_SCENERY_IMAGE
  return DEFAULT_TRAVEL_IMAGE
}

export const isValidImageUrl = (value) => {
  const imageUrl = getImageUrl(value)
  if (!imageUrl.trim()) return false
  if (imageUrl.startsWith('data:image/')) return true
  try {
    const url = new URL(imageUrl)
    return ['http:', 'https:'].includes(url.protocol)
  } catch {
    return false
  }
}

const createPicsumAsset = (prefecture, city, type, size) => {
  const seed = encodeURIComponent(`${prefecture}-${city}`)
  return createImageAsset({
    url: `https://picsum.photos/seed/${seed}-${type}/${size}`,
    type,
    source: 'picsum-sample',
    credit: 'Picsum Photos',
    license: 'Picsum Photosの利用条件に準拠',
    status: 'confirmed',
  })
}

export const getDestinationImages = (prefecture, city, tags = []) => {
  if (!city) {
    const imageSourceType = tags.length > 0 ? 'tag' : 'generic'
    return {
      heroImage: getThemeImageFallback(tags, 'hero'),
      foodImage: getThemeImageFallback(tags, 'food'),
      sceneryImage: getThemeImageFallback(tags, 'scenery'),
      imageCredit: 'DROPTRIP',
      imageSource: imageSourceType === 'tag' ? 'tag-fallback' : 'droptrip-generated',
      imageLicense: 'アプリ内生成画像',
      imageStatus: 'confirmed',
      imageSourceType,
    }
  }

  return {
    heroImage: createPicsumAsset(prefecture, city, 'hero', '900/600'),
    foodImage: createPicsumAsset(prefecture, city, 'food', '720/540'),
    sceneryImage: createPicsumAsset(prefecture, city, 'scenery', '720/540'),
    imageCredit: 'Picsum Photos',
    imageSource: 'picsum-sample',
    imageLicense: 'Picsum Photosの利用条件に準拠',
    imageStatus: 'confirmed',
    imageSourceType: 'individual',
  }
}
