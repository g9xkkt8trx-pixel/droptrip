import rawDestinations from '../src/data/destinations.json' with { type: 'json' }
import { supplementalDestinations } from '../src/data/supplementalDestinations.js'
import {
  getConfirmedPhotoSpots,
  photoSpots,
  PHOTO_SPOT_STATUSES,
} from '../src/data/photoSpots.js'

const destinations = [...rawDestinations, ...supplementalDestinations].map((destination) => ({
  ...destination,
  id: `${destination.prefecture}-${destination.city}`,
}))
const destinationIds = new Set(destinations.map((destination) => destination.id))
const failures = []
const seenIds = new Set()
const namesByDestination = new Map()

for (const spot of photoSpots) {
  if (!spot.id || seenIds.has(spot.id)) failures.push(`spot.id duplicate or missing: ${spot.id || '(empty)'}`)
  seenIds.add(spot.id)

  if (!destinationIds.has(spot.destinationId)) failures.push(`unknown destinationId: ${spot.destinationId}`)
  if (!PHOTO_SPOT_STATUSES.has(spot.status)) failures.push(`invalid status: ${spot.id}`)

  const normalizedName = String(spot.name ?? '').trim()
  const nameKey = `${spot.destinationId}:${normalizedName}`
  if (!normalizedName || namesByDestination.has(nameKey)) failures.push(`duplicate or missing spot name: ${nameKey}`)
  namesByDestination.set(nameKey, true)

  if (spot.status === 'confirmed' && (!normalizedName || !String(spot.summary ?? '').trim())) {
    failures.push(`confirmed spot needs name and summary: ${spot.id}`)
  }
}

for (const destination of destinations) {
  const visibleSpots = getConfirmedPhotoSpots(destination)
  if (visibleSpots.some((spot) => spot.status !== 'confirmed')) {
    failures.push(`non-confirmed spot is visible: ${destination.id}`)
  }
  if (new Set(visibleSpots.map((spot) => spot.name)).size !== visibleSpots.length) {
    failures.push(`visible spot names are duplicated: ${destination.id}`)
  }
}

if (failures.length > 0) {
  console.error(`映えスポット検証に失敗しました。\n${failures.join('\n')}`)
  process.exitCode = 1
} else {
  const confirmedCount = photoSpots.filter((spot) => spot.status === 'confirmed').length
  const reviewCount = photoSpots.filter((spot) => spot.status === 'needs_review').length
  console.log(`映えスポット検証OK: 登録 ${photoSpots.length}件 / confirmed ${confirmedCount}件 / needs_review ${reviewCount}件`)
}
