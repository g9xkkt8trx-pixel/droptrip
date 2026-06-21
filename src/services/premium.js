export const PREMIUM_STATUS_STORAGE_KEY = 'droptrip-premium-status'

export const isPremiumEnabled = (isPremiumUser) => isPremiumUser === true

export const loadPremiumStatus = () => {
  try {
    return window.localStorage.getItem(PREMIUM_STATUS_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export const savePremiumStatus = (isPremiumUser) => {
  try {
    window.localStorage.setItem(PREMIUM_STATUS_STORAGE_KEY, String(isPremiumUser === true))
    return true
  } catch {
    return false
  }
}
