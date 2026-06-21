const getEnvironmentApiKey = () => import.meta.env.VITE_OPENAI_API_KEY?.trim() ?? ''

export const getOpenAiApiKeySource = (storedApiKey = '') => {
  if (getEnvironmentApiKey()) return 'environment'
  if (storedApiKey.trim()) return 'localStorage'
  return null
}

export const getOpenAiApiKey = (storedApiKey = '') => (
  getEnvironmentApiKey() || storedApiKey.trim()
)
