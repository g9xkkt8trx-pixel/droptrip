const ROUTES_API_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes'
const ROUTE_FIELD_MASK = 'routes.duration,routes.distanceMeters'
const REQUEST_TIMEOUT_MS = 25_000

const appendJapan = (value) => {
  const address = value.trim()
  return address.includes('日本') ? address : `${address}, 日本`
}

const toWaypoint = (value) => {
  if (typeof value === 'string' && value.trim() && value.trim().length <= 200) return { address: appendJapan(value) }
  if (!value || typeof value !== 'object') return null
  if (
    Number.isFinite(value.latitude)
    && Number.isFinite(value.longitude)
    && Math.abs(value.latitude) <= 90
    && Math.abs(value.longitude) <= 180
  ) {
    return { location: { latLng: { latitude: value.latitude, longitude: value.longitude } } }
  }
  const address = value.googleMapsQuery || value.address || `${value.prefecture ?? ''}${value.city ?? ''}`
  return typeof address === 'string' && address.trim() && address.trim().length <= 200
    ? { address: appendJapan(address) }
    : null
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return response.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY?.trim()
  if (!apiKey) return response.status(503).json({ error: 'Route service is not configured' })

  const origin = toWaypoint(request.body?.origin)
  const destination = toWaypoint(request.body?.destination)
  const travelMode = request.body?.travelMode
  const departureTime = request.body?.departureTime

  if (!origin || !destination || !['DRIVE', 'TRANSIT'].includes(travelMode)) {
    return response.status(400).json({ error: 'Invalid route request' })
  }

  const requestBody = {
    origin,
    destination,
    travelMode,
    languageCode: 'ja',
    units: 'METRIC',
  }
  if (travelMode === 'DRIVE') requestBody.routingPreference = 'TRAFFIC_AWARE'
  if (travelMode === 'TRANSIT' && typeof departureTime === 'string') requestBody.departureTime = departureTime

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const googleResponse = await fetch(ROUTES_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': ROUTE_FIELD_MASK,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    })

    if (!googleResponse.ok) {
      const code = [401, 403].includes(googleResponse.status) ? 'API_KEY_INVALID' : 'ROUTE_ERROR'
      return response.status(googleResponse.status >= 500 ? 502 : 400).json({ error: 'Route request failed', code })
    }

    const route = (await googleResponse.json()).routes?.[0]
    if (!route?.duration) return response.status(404).json({ error: 'Route not found', code: 'ROUTE_NOT_FOUND' })

    return response.status(200).json({
      duration: route.duration,
      distanceMeters: Number.isFinite(route.distanceMeters) ? route.distanceMeters : null,
    })
  } catch {
    return response.status(502).json({ error: 'Route request failed', code: 'ROUTE_ERROR' })
  } finally {
    clearTimeout(timeoutId)
  }
}
