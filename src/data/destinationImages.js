const createPlaceholder = ({ title, subtitle, colors }) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${colors[0]}"/><stop offset="1" stop-color="${colors[1]}"/></linearGradient></defs><rect width="900" height="600" fill="url(#g)"/><circle cx="735" cy="125" r="65" fill="rgba(255,255,255,.35)"/><path d="M0 455 190 285l125 115 145-175 225 230 95-95 120 95v145H0Z" fill="rgba(255,255,255,.32)"/><path d="M0 500 210 380l120 95 170-125 180 140 105-70 115 80v100H0Z" fill="rgba(255,255,255,.24)"/><text x="55" y="90" fill="white" font-family="sans-serif" font-size="42" font-weight="700">${title}</text><text x="58" y="132" fill="rgba(255,255,255,.82)" font-family="sans-serif" font-size="22">${subtitle}</text></svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

export const DEFAULT_TRAVEL_IMAGE = createPlaceholder({
  title: 'DROPTRIP', subtitle: '旅の景色を探しに行こう', colors: ['#66b6a4', '#e9a26f'],
})
export const DEFAULT_FOOD_IMAGE = createPlaceholder({
  title: 'LOCAL FOOD', subtitle: 'その土地のおいしい出会い', colors: ['#dc8d68', '#f2c879'],
})
export const DEFAULT_SCENERY_IMAGE = createPlaceholder({
  title: 'SCENERY', subtitle: 'まだ見ぬ風景のイメージ', colors: ['#77a9c4', '#88bea5'],
})
export const COMMON_IMAGE_PLACEHOLDER = DEFAULT_TRAVEL_IMAGE

export const isValidImageUrl = (value) => {
  if (typeof value !== 'string' || !value.trim()) return false
  if (value.startsWith('data:image/')) return true
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol)
  } catch {
    return false
  }
}

export const getDestinationImages = (prefecture, city) => {
  if (!city) {
    return {
      heroImage: DEFAULT_TRAVEL_IMAGE,
      foodImage: DEFAULT_FOOD_IMAGE,
      sceneryImage: DEFAULT_SCENERY_IMAGE,
      imageCredit: '',
      imageSource: '',
    }
  }

  const seed = encodeURIComponent(`${prefecture}-${city}`)
  return {
    heroImage: `https://picsum.photos/seed/${seed}-hero/900/600`,
    foodImage: `https://picsum.photos/seed/${seed}-food/720/540`,
    sceneryImage: `https://picsum.photos/seed/${seed}-scenery/720/540`,
    imageCredit: 'Picsum Photos',
    imageSource: 'https://picsum.photos/',
  }
}
