export const getSafeContactFormUrl = (value = '') => {
  try {
    const url = new URL(String(value).trim())
    return ['http:', 'https:'].includes(url.protocol) ? url.href : ''
  } catch {
    return ''
  }
}
