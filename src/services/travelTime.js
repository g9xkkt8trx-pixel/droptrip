import { findMajorStation } from '../data/majorStations'

const ROUTES_API_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes'
const SERVER_ROUTE_API_URL = '/api/route-time'
const ROUTE_FIELD_MASK = 'routes.duration,routes.distanceMeters'
const REQUEST_TIMEOUT_MS = 30000

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

export const getGoogleMapsCommunicationModeLabel = (mode = 'server') => (
  mode === 'local-direct' ? 'ローカル開発用キー' : 'サーバー経由'
)

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

const uniqueStrings = (values) => [...new Set(values.map((value) => value?.trim()).filter(Boolean))]

const getTransitOriginCandidates = (origin) => {
  const normalized = origin.trim()
  if (normalized.endsWith('駅')) return [normalized]

  const majorStation = findMajorStation(normalized)
  if (majorStation) return [majorStation]
  const municipality = normalized.match(/([^都道府県]+?[市区町村])$/)?.[1]
  const stationName = municipality ? `${municipality.replace(/[市区町村]$/, '')}駅` : null
  return uniqueStrings([majorStation, stationName, normalized])
}

const getTransitDestinationCandidates = (destination) => {
  if (destination?.nearestStation?.trim()) return [destination.nearestStation.trim()]
  return uniqueStrings([
    destination?.transitQuery,
    findMajorStation('', destination?.prefecture, destination?.city),
    `${destination?.prefecture ?? ''}${destination?.city ?? ''}`,
  ])
}

export const createTransitFallback = (origin, destination) => {
  const fallbackOrigin = getTransitOriginCandidates(origin)[0] ?? origin.trim()
  const fallbackDestination = getTransitDestinationCandidates(destination)[0]
  const fallbackDestinationLabel = fallbackDestination === destination?.nearestStation
    ? destination.nearestStationLabel ?? fallbackDestination
    : fallbackDestination

  return {
    origin: fallbackOrigin,
    destination: fallbackDestination,
    searchCondition: fallbackOrigin && fallbackDestinationLabel
      ? `${fallbackOrigin} → ${fallbackDestinationLabel}`
      : null,
    googleMapsUrl: fallbackOrigin && fallbackDestination
      ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(fallbackOrigin)}&destination=${encodeURIComponent(fallbackDestination)}&travelmode=transit`
      : null,
  }
}

const getTransitDepartureTimes = () => {
  const now = new Date()
  const tomorrowAtNine = new Date(now)
  tomorrowAtNine.setDate(tomorrowAtNine.getDate() + 1)
  tomorrowAtNine.setHours(9, 0, 0, 0)

  const tomorrowAtTen = new Date(tomorrowAtNine)
  tomorrowAtTen.setHours(10, 0, 0, 0)

  const nextSaturdayAtNine = new Date(now)
  const daysUntilSaturday = (6 - now.getDay() + 7) % 7 || 7
  nextSaturdayAtNine.setDate(nextSaturdayAtNine.getDate() + daysUntilSaturday)
  nextSaturdayAtNine.setHours(9, 0, 0, 0)

  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)
  return [tomorrowAtNine, tomorrowAtTen, nextSaturdayAtNine, oneHourLater]
    .map((date) => date.toISOString())
}

const toDestinationWaypoint = (destination) => {
  if (destination && typeof destination === 'object') {
    const routeDestinationQuery = destination.routeDestinationQuery?.trim()
    if (routeDestinationQuery) return { address: appendJapan(routeDestinationQuery) }
  }

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

const buildRouteResult = ({ duration, distanceMeters, requestDebug, communicationMode, routeDiagnostics }) => {
  const durationMinutes = durationToMinutes(duration)
  return {
    duration: formatDuration(durationMinutes),
    durationMinutes,
    distance: Number.isFinite(distanceMeters) ? formatDistance(distanceMeters) : null,
    distanceMeters: Number.isFinite(distanceMeters) ? distanceMeters : null,
    requestDebug,
    communicationMode,
    routeDiagnostics,
  }
}

const createRouteDiagnostics = ({ payload = {}, responseStatus, requestDebug, result }) => ({
  communicationMode: 'server',
  apiResponse: result,
  hasGoogleMapsApiKey: typeof payload.hasGoogleMapsApiKey === 'boolean'
    ? payload.hasGoogleMapsApiKey
    : null,
  routeTimeHttpStatus: responseStatus ?? null,
  httpStatus: payload.googleHttpStatus ?? responseStatus ?? null,
  errorType: payload.code ?? null,
  errorSummary: payload.errorSummary ?? (result === 'error' ? payload.error ?? '' : ''),
  origin: requestDebug.origin,
  destination: requestDebug.destination,
  travelMode: requestDebug.travelMode,
})

const fetchServerRoute = async ({ origin, destination, travelMode, departureTime, signal }) => {
  const requestDebug = {
    origin: typeof origin === 'string' ? origin : JSON.stringify(origin),
    destination: typeof destination === 'string' ? destination : JSON.stringify(destination),
    travelMode,
    departureTime: departureTime ?? null,
    endpoint: SERVER_ROUTE_API_URL,
    fields: ROUTE_FIELD_MASK,
  }
  let response
  try {
    response = await fetch(SERVER_ROUTE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, destination, travelMode, departureTime }),
      signal,
    })
  } catch (error) {
    error.serverUnavailable = true
    error.requestDebug = requestDebug
    error.routeDiagnostics = {
      communicationMode: 'server',
      apiResponse: 'network-error',
      hasGoogleMapsApiKey: null,
      routeTimeHttpStatus: null,
      httpStatus: null,
      errorType: error?.name ?? 'NETWORK_ERROR',
      errorSummary: 'route-time API request failed',
      origin: requestDebug.origin,
      destination: requestDebug.destination,
      travelMode: requestDebug.travelMode,
    }
    throw error
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    const error = new TravelTimeError(payload.error || 'Route server request failed', payload.code || 'ROUTE_ERROR')
    error.serverUnavailable = response.status === 405 || (response.status === 404 && payload.code !== 'ROUTE_NOT_FOUND')
    error.httpStatus = response.status
    error.googleMessage = payload.error || 'サーバー経由の経路取得に失敗しました'
    error.requestDebug = requestDebug
    error.routeDiagnostics = createRouteDiagnostics({
      payload,
      responseStatus: response.status,
      requestDebug,
      result: 'error',
    })
    throw error
  }

  const data = await response.json()
  return buildRouteResult({
    duration: data.duration,
    distanceMeters: data.distanceMeters,
    communicationMode: 'server',
    requestDebug: { ...requestDebug, httpStatus: response.status, googleMessage: '' },
    routeDiagnostics: createRouteDiagnostics({
      payload: data,
      responseStatus: response.status,
      requestDebug,
      result: 'success',
    }),
  })
}

// localhostでServerless Functionが動かない場合だけ使う開発専用の直接通信。
const fetchLocalDirectRoute = async ({ origin, destination, travelMode, departureTime, apiKey, signal }) => {
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
    requestBody.departureTime = departureTime
  }

  const requestDebug = {
    origin: requestBody.origin.address ?? JSON.stringify(requestBody.origin),
    destination: requestBody.destination.address ?? JSON.stringify(requestBody.destination),
    travelMode,
    departureTime: requestBody.departureTime ?? null,
    endpoint: ROUTES_API_URL,
    fields: ROUTE_FIELD_MASK,
  }

  let response
  try {
    response = await fetch(ROUTES_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': ROUTE_FIELD_MASK,
      },
      body: JSON.stringify(requestBody),
      signal,
    })
  } catch (error) {
    error.requestDebug = requestDebug
    throw error
  }

  if (!response.ok) {
    const errorBody = await response.text()
    const apiMessage = (() => {
      try {
        return JSON.parse(errorBody)?.error?.message?.slice(0, 180) ?? ''
      } catch {
        return ''
      }
    })()
    const looksLikeApiKeyError = [401, 403].includes(response.status)
      || /api.?key|permission.denied|not enabled|disabled|billing/i.test(errorBody)

    const routeError = new TravelTimeError(
      `Routes API request failed: ${response.status}${apiMessage ? ` - ${apiMessage}` : ''}`,
      looksLikeApiKeyError ? 'API_KEY_INVALID' : 'ROUTE_ERROR',
    )
    routeError.httpStatus = response.status
    routeError.googleMessage = apiMessage || 'Google APIから詳細メッセージは返されませんでした'
    routeError.requestDebug = requestDebug
    throw routeError
  }

  const data = await response.json()
  const route = data.routes?.[0]

  if (!route?.duration) {
    const routeNotFoundError = new TravelTimeError('Route not found')
    routeNotFoundError.httpStatus = response.status
    routeNotFoundError.googleMessage = 'レスポンスに利用可能なルートが含まれていません'
    routeNotFoundError.requestDebug = requestDebug
    throw routeNotFoundError
  }

  return buildRouteResult({
    duration: route.duration,
    distanceMeters: route.distanceMeters,
    communicationMode: 'local-direct',
    requestDebug: { ...requestDebug, httpStatus: response.status, googleMessage: '' },
    routeDiagnostics: {
      communicationMode: 'local-direct',
      apiResponse: 'success',
      hasGoogleMapsApiKey: true,
      routeTimeHttpStatus: null,
      httpStatus: response.status,
      errorType: null,
      errorSummary: '',
      origin: requestDebug.origin,
      destination: requestDebug.destination,
      travelMode: requestDebug.travelMode,
    },
  })
}

const canUseLocalDirectFallback = () => (
  import.meta.env.DEV
  && typeof window !== 'undefined'
  && ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)
)

const fetchRoute = async (options) => {
  try {
    return await fetchServerRoute(options)
  } catch (error) {
    if (!error.serverUnavailable || !canUseLocalDirectFallback() || !options.apiKey) throw error
    return fetchLocalDirectRoute(options)
  }
}

const fetchTransitRoute = async ({ origin, destination, apiKey, signal }) => {
  const origins = getTransitOriginCandidates(origin)
  const destinations = getTransitDestinationCandidates(destination)
  const departureTimes = getTransitDepartureTimes()
  const attempts = []
  const pairs = destinations.flatMap((destinationCandidate) => (
    origins.map((originCandidate) => [originCandidate, destinationCandidate])
  ))
  const fallback = createTransitFallback(origin, destination)
  const createDebug = (usedCondition = null, apiError = null, lastRequest = null) => ({
    originCandidates: origins,
    destinationCandidates: destinations,
    departureTimeCandidates: departureTimes,
    attempts,
    usedCondition,
    apiError,
    lastRequest: lastRequest ?? attempts.at(-1) ?? null,
  })

  for (const [originCandidate, destinationCandidate] of pairs) {
    for (const departureTime of departureTimes) {
      try {
        const route = await fetchRoute({
          origin: originCandidate,
          destination: destinationCandidate,
          travelMode: 'TRANSIT',
          departureTime,
          apiKey,
          signal,
        })
        const searchCondition = `${originCandidate} → ${destinationCandidate}`
        const destinationLabel = destinationCandidate === destination?.nearestStation
          ? destination.nearestStationLabel ?? destinationCandidate
          : destinationCandidate
        const displayCondition = `${originCandidate} → ${destinationLabel}`
        const successfulAttempt = {
          origin: originCandidate,
          destination: destinationCandidate,
          status: 'success',
          reason: '',
          ...route.requestDebug,
        }
        attempts.push(successfulAttempt)
        return {
          route: { ...route, searchCondition: displayCondition },
          debug: createDebug(searchCondition, null, successfulAttempt),
          fallback,
        }
      } catch (error) {
        const reason = error?.name === 'AbortError'
          ? '検索がタイムアウトしました'
          : ['API_KEY_INVALID', 'SERVER_API_KEY_MISSING'].includes(error?.code)
            ? 'APIキーまたはRoutes API設定エラー'
            : error?.message ?? '経路が見つかりませんでした'
        const failedAttempt = {
          origin: originCandidate,
          destination: destinationCandidate,
          status: 'failed',
          reason,
          ...(error?.requestDebug ?? {
            travelMode: 'TRANSIT',
            departureTime: null,
            endpoint: ROUTES_API_URL,
            fields: ROUTE_FIELD_MASK,
          }),
          httpStatus: error?.httpStatus ?? null,
          googleMessage: error?.googleMessage ?? reason,
        }
        attempts.push(failedAttempt)
        if (['API_KEY_INVALID', 'SERVER_API_KEY_MISSING'].includes(error?.code) || error?.name === 'AbortError') {
          error.transitDebug = createDebug(null, reason, failedAttempt)
          error.transitFallback = fallback
          throw error
        }
      }
    }
  }

  const apiError = attempts.at(-1)?.reason ?? '経路が見つかりませんでした'
  return { route: null, debug: createDebug(null, apiError), fallback }
}

export const getTravelInfo = async ({ origin, destination, apiKey: storedApiKey = '' }) => {
  const apiKey = getEnvironmentApiKey() || storedApiKey.trim()

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
      fetchTransitRoute({
        origin,
        destination,
        apiKey,
        signal: controller.signal,
      }),
    ])
  } finally {
    window.clearTimeout(timeoutId)
  }

  const car = carResult.status === 'fulfilled' ? carResult.value : null
  const transitPayload = transitResult.status === 'fulfilled' ? transitResult.value : null
  const transitRoute = transitPayload?.route ?? null
  const publicTransit = transitRoute
    ? {
        duration: transitRoute.duration,
        durationMinutes: transitRoute.durationMinutes,
        distance: transitRoute.distance,
        distanceMeters: transitRoute.distanceMeters,
        searchCondition: transitRoute.searchCondition,
      }
    : null
  const transitDebug = transitPayload?.debug ?? transitResult.reason?.transitDebug ?? {
    originCandidates: [],
    destinationCandidates: [],
    departureTimeCandidates: [],
    attempts: [],
    usedCondition: null,
    apiError: null,
    lastRequest: null,
  }
  const transitFallback = transitPayload?.fallback ?? transitResult.reason?.transitFallback ?? null

  if (!car && !publicTransit) {
    const localConfigurationError = [carResult, transitResult].find((result) => (
      result.status === 'rejected' && result.reason?.serverUnavailable && !apiKey
    ))
    if (localConfigurationError && canUseLocalDirectFallback()) {
      return { status: 'unconfigured', car: null, publicTransit: null }
    }
    const apiKeyError = [carResult, transitResult].find((result) => (
      result.status === 'rejected' && ['API_KEY_INVALID', 'SERVER_API_KEY_MISSING'].includes(result.reason?.code)
    ))

    if (apiKeyError) throw apiKeyError.reason
    const noRoutesError = new TravelTimeError('No routes available')
    noRoutesError.transitDebug = transitDebug
    noRoutesError.transitFallback = transitFallback
    noRoutesError.routeDiagnostics = [carResult, transitResult]
      .find((result) => result.status === 'rejected' && result.reason?.routeDiagnostics)
      ?.reason?.routeDiagnostics ?? null
    throw noRoutesError
  }

  return {
    status: 'success',
    car,
    publicTransit,
    transitDebug,
    transitFallback,
    communicationMode: car?.communicationMode ?? transitRoute?.communicationMode ?? 'server',
    routeDiagnostics: car?.routeDiagnostics ?? transitRoute?.routeDiagnostics ?? null,
  }
}
