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

const describeWaypoint = (waypoint) => {
  if (waypoint?.address) return waypoint.address
  const coordinates = waypoint?.location?.latLng
  return coordinates ? `${coordinates.latitude},${coordinates.longitude}` : 'unknown'
}

const getGoogleErrorSummary = (body, status) => {
  try {
    return JSON.parse(body)?.error?.message?.slice(0, 240) || `Google Routes API returned ${status}`
  } catch {
    return `Google Routes API returned ${status}`
  }
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return response.status(405).json({ error: 'Method not allowed' })
  }

  const rawApiKey = process.env.GOOGLE_MAPS_API_KEY
  const hasGoogleMapsApiKey = typeof rawApiKey === 'string' && rawApiKey.trim().length > 0
  const apiKey = hasGoogleMapsApiKey ? rawApiKey.trim() : ''
  const origin = toWaypoint(request.body?.origin)
  const destination = toWaypoint(request.body?.destination)
  const travelMode = request.body?.travelMode
  const departureTime = request.body?.departureTime

  if (!origin || !destination || !['DRIVE', 'TRANSIT'].includes(travelMode)) {
    return response.status(400).json({
      error: 'Invalid request',
      code: 'INVALID_REQUEST',
      hasGoogleMapsApiKey,
    })
  }

  if (!hasGoogleMapsApiKey) {
    console.error('[route-time] Server environment variable is missing', {
      httpStatus: 503,
      errorType: 'SERVER_API_KEY_MISSING',
      origin: describeWaypoint(origin),
      destination: describeWaypoint(destination),
      travelMode,
      hasGoogleMapsApiKey,
    })
    return response.status(503).json({
      error: 'Information could not be retrieved',
      code: 'SERVER_API_KEY_MISSING',
      hasGoogleMapsApiKey,
      errorSummary: 'GOOGLE_MAPS_API_KEY is not configured on the server',
    })
  }

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
      const errorBody = await googleResponse.text()
      const errorSummary = getGoogleErrorSummary(errorBody, googleResponse.status)
      const code = [401, 403].includes(googleResponse.status) ? 'API_KEY_INVALID' : 'ROUTE_ERROR'
      console.error('[route-time] Google Routes request failed', {
        httpStatus: googleResponse.status,
        googleError: errorSummary,
        origin: describeWaypoint(origin),
        destination: describeWaypoint(destination),
        travelMode,
        hasGoogleMapsApiKey,
      })
      return response.status(googleResponse.status >= 500 ? 502 : 400).json({
        error: 'Information could not be retrieved',
        code,
        hasGoogleMapsApiKey,
        googleHttpStatus: googleResponse.status,
        errorSummary,
      })
    }

    const route = (await googleResponse.json()).routes?.[0]
    if (!route?.duration) {
      console.error('[route-time] Route not found', {
        httpStatus: 404,
        errorType: 'ROUTE_NOT_FOUND',
        origin: describeWaypoint(origin),
        destination: describeWaypoint(destination),
        travelMode,
        hasGoogleMapsApiKey,
      })
      return response.status(404).json({
        error: 'Information could not be retrieved',
        code: 'ROUTE_NOT_FOUND',
        hasGoogleMapsApiKey,
        googleHttpStatus: googleResponse.status,
        errorSummary: 'Route not found',
      })
    }

    return response.status(200).json({
      duration: route.duration,
      distanceMeters: Number.isFinite(route.distanceMeters) ? route.distanceMeters : null,
      hasGoogleMapsApiKey,
      googleHttpStatus: googleResponse.status,
    })
  } catch (error) {
    console.error('[route-time] Request error', {
      httpStatus: 502,
      errorType: error?.name ?? 'ROUTE_ERROR',
      origin: describeWaypoint(origin),
      destination: describeWaypoint(destination),
      travelMode,
      hasGoogleMapsApiKey,
    })
    return response.status(502).json({
      error: 'Information could not be retrieved',
      code: 'ROUTE_ERROR',
      hasGoogleMapsApiKey,
      errorSummary: error?.name === 'AbortError' ? 'Route request timed out' : 'Route request failed',
    })
  } finally {
    clearTimeout(timeoutId)
  }
}
