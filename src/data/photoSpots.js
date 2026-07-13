export const PHOTO_SPOT_STATUSES = new Set(['confirmed', 'needs_review', 'draft'])

// Confirmed entries are added only after a source check. Existing trendHighlights
// remain in their current data source until they meet this dedicated schema.
export const photoSpots = []

const getDestinationKeys = (destination = {}) => new Set([
  destination.id,
  destination.prefecture && destination.city ? `${destination.prefecture}-${destination.city}` : '',
].filter(Boolean))

const getPhotoSpotDedupeKey = (spot = {}) => `${spot.destinationId ?? ''}:${String(spot.name ?? '').trim()}`

export const getConfirmedPhotoSpots = (destination = {}) => {
  const destinationKeys = getDestinationKeys(destination)
  const seen = new Set()

  return photoSpots.filter((spot) => {
    if (spot.status !== 'confirmed' || !destinationKeys.has(spot.destinationId)) return false
    const dedupeKey = getPhotoSpotDedupeKey(spot)
    if (!spot.id || !spot.name || seen.has(dedupeKey)) return false
    seen.add(dedupeKey)
    return true
  })
}
