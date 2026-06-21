const ROUTES_API_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes'
const REQUEST_TIMEOUT_MS = 15000

class TravelTimeError extends Error {
  constructor(message, code = 'ROUTE_ERROR') {
    super(message)
    this.name = 'TravelTimeError'
    this.code = code
  }
}

const getEnvironmentApiKey = () => import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim() ?? ''

export const getGoogleMapsApiKeySource = (storedApiKey = '') => {
  if (getEnvironmentApiKey()) return 'environment'
  if (storedApiKey.trim()) return 'localStorage'
  return null
}

const durationToMinutes = (duration) => (
  Math.max(1, Math.round(Number.parseFloat(duration) / 60))
)

const formatDuration = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours === 0) return `約${minutes}分`
  if (minutes === 0) return `約${hours}時間`
  return `約${hours}時間${minutes}分`
}

const formatDistance = (distanceMeters) => {
  const kilometers = Math.max(1, Math.round(distanceMeters / 1000))
  return `${new Intl.NumberFormat('ja-JP').format(kilometers)}km`
}

const appendJapan = (address) => {
  const normalizedAddress = address.trim()
  return normalizedAddress.includes('日本') ? normalizedAddress : `${normalizedAddress}, 日本`
}

const toDestinationWaypoint = (destination) => {
  if (
    destination
    && typeof destination === 'object'
    && Number.isFinite(destination.latitude)
    && Number.isFinite(destination.longitude)
  ) {
    return {
      location: {
        latLng: {
          latitude: destination.latitude,
          longitude: destination.longitude,
        },
      },
    }
  }

  if (destination && typeof destination === 'object') {
    const query = destination.googleMapsQuery?.trim()
    if (query) return { address: appendJapan(query) }

    const address = destination.address?.trim()
    if (address) return { address: appendJapan(address) }

    const municipality = `${destination.prefecture ?? ''}${destination.city ?? ''}`.trim()
    if (municipality) return { address: appendJapan(municipality) }
  }

  if (typeof destination === 'string' && destination.trim()) {
    return { address: appendJapan(destination) }
  }

  throw new Error('Destination is missing')
}

const fetchRoute = async ({ origin, destination, travelMode, apiKey, signal }) => {
  const requestBody = {
    origin: { address: appendJapan(origin) },
    destination: toDestinationWaypoint(destination),
    travelMode,
    languageCode: 'ja',
    units: 'METRIC',
  }

  if (travelMode === 'DRIVE') {
    requestBody.routingPreference = 'TRAFFIC_AWARE'
  }

  if (travelMode === 'TRANSIT') {
    requestBody.departureTime = new Date(Date.now() + 5 * 60 * 1000).toISOString()
  }

  const response = await fetch(ROUTES_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters',
    },
    body: JSON.stringify(requestBody),
    signal,
  })

  if (!response.ok) {
    const errorBody = await response.text()
    const looksLikeApiKeyError = [401, 403].includes(response.status)
      || /api.?key|permission.denied|not enabled|disabled|billing/i.test(errorBody)

    throw new TravelTimeError(
      `Routes API request failed: ${response.status}`,
      looksLikeApiKeyError ? 'API_KEY_INVALID' : 'ROUTE_ERROR',
    )
  }

  const data = await response.json()
  const route = data.routes?.[0]

  if (!route?.duration) {
    throw new TravelTimeError('Route not found')
  }

  const durationMinutes = durationToMinutes(route.duration)

  return {
    duration: formatDuration(durationMinutes),
    durationMinutes,
    distance: Number.isFinite(route.distanceMeters) ? formatDistance(route.distanceMeters) : null,
  }
}

export const getTravelInfo = async ({ origin, destination, apiKey: storedApiKey = '' }) => {
  const apiKey = getEnvironmentApiKey() || storedApiKey.trim()

  if (!apiKey) {
    return { status: 'unconfigured', car: null, publicTransit: null }
  }

  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  let carResult
  let transitResult

  try {
    [carResult, transitResult] = await Promise.allSettled([
      fetchRoute({
        origin,
        destination,
        travelMode: 'DRIVE',
        apiKey,
        signal: controller.signal,
      }),
      fetchRoute({
        origin,
        destination,
        travelMode: 'TRANSIT',
        apiKey,
        signal: controller.signal,
      }),
    ])
  } finally {
    window.clearTimeout(timeoutId)
  }

  const car = carResult.status === 'fulfilled' ? carResult.value : null
  const publicTransit = transitResult.status === 'fulfilled'
    ? {
        duration: transitResult.value.duration,
        durationMinutes: transitResult.value.durationMinutes,
      }
    : null

  if (!car && !publicTransit) {
    const apiKeyError = [carResult, transitResult].find((result) => (
      result.status === 'rejected' && result.reason?.code === 'API_KEY_INVALID'
    ))

    if (apiKeyError) throw apiKeyError.reason
    throw new TravelTimeError('No routes available')
  }

  return { status: 'success', car, publicTransit }
}
