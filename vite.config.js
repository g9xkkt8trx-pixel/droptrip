import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const getPublicSiteOrigin = (value = '') => {
  try {
    const url = new URL(value.trim())
    if (url.protocol !== 'https:' || !url.hostname || ['localhost', '127.0.0.1'].includes(url.hostname)) return ''
    return url.origin
  } catch {
    return ''
  }
}

const createPublicSiteMetadataPlugin = (siteOrigin) => ({
  name: 'droptrip-public-site-metadata',
  transformIndexHtml: (html) => {
    if (!siteOrigin) return html

    const siteUrl = `${siteOrigin}/`
    const imageUrl = `${siteOrigin}/images/common/travel-default.jpg`
    const metadata = [
      `    <link rel="canonical" href="${siteUrl}" />`,
      `    <meta property="og:url" content="${siteUrl}" />`,
      `    <meta property="og:image" content="${imageUrl}" />`,
      '    <meta property="og:image:alt" content="DROPTRIPの旅行イメージ" />',
      `    <meta name="twitter:image" content="${imageUrl}" />`,
    ].join('\n')

    return html.replace('  </head>', `${metadata}\n  </head>`)
  },
})

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const publicSiteOrigin = getPublicSiteOrigin(env.VITE_PUBLIC_SITE_URL)

  return {
    plugins: [react(), createPublicSiteMetadataPlugin(publicSiteOrigin)],
  }
})
