const ROUTES_API_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes'
const ROUTE_FIELD_MASK = 'routes.duration,routes.distanceMeters'
const REQUEST_TIMEOUT_MS = 25_000
const MAX_LOCATION_LENGTH = 200

const appendJapan = (value) => {
  const address = value.trim()
  return address.includes('日本') ? address : `${address}, 日本`
}

const toWaypoint = (value) => {
  if (typeof value === 'string' && value.trim() && value.trim().length <= MAX_LOCATION_LENGTH) return { address: appendJapan(value) }
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
  return typeof address === 'string' && address.trim() && address.trim().length <= MAX_LOCATION_LENGTH
    ? { address: appendJapan(address) }
    : null
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return response.status(405).json({ error: 'Method not allowed' })
  }

  const origin = toWaypoint(request.body?.origin)
  const destination = toWaypoint(request.body?.destination)
  const travelMode = request.body?.travelMode
  const departureTime = request.body?.departureTime

  if (!origin || !destination || !['DRIVE', 'TRANSIT'].includes(travelMode)) {
    return response.status(400).json({ error: 'Invalid request' })
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY?.trim()
  if (!apiKey) return response.status(503).json({ error: 'Information could not be retrieved' })

  // 一般公開時は、ここへ認証・レート制限・利用回数管理を必ず追加する。

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
      console.error('[route-time] Google Routes request failed', { status: googleResponse.status, travelMode })
      return response.status(googleResponse.status >= 500 ? 502 : 400).json({ error: 'Information could not be retrieved', code })
    }

    const route = (await googleResponse.json()).routes?.[0]
    if (!route?.duration) return response.status(404).json({ error: 'Route not found', code: 'ROUTE_NOT_FOUND' })

    return response.status(200).json({
      duration: route.duration,
      distanceMeters: Number.isFinite(route.distanceMeters) ? route.distanceMeters : null,
    })
  } catch (error) {
    console.error('[route-time] Request error', { name: error?.name ?? 'Error', travelMode })
    return response.status(502).json({ error: 'Information could not be retrieved', code: 'ROUTE_ERROR' })
  } finally {
    clearTimeout(timeoutId)
  }
}
