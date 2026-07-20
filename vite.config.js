import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { cwd } from 'node:process'
import { getSafeContactFormUrl } from './src/utils/contactFormUrl.js'

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

const createServiceWorkerPlugin = (contactFormUrl) => ({
  name: 'droptrip-service-worker',
  apply: 'build',
  async closeBundle() {
    const buildId = new Date().toISOString()
    const cacheName = `droptrip-runtime-${buildId}`
    const serviceWorker = `/* DROPTRIP service worker: ${buildId} */
const CACHE_NAME = ${JSON.stringify(cacheName)}
const OFFLINE_URL = '/offline.html'
const STATIC_PATHS = ['/assets/', '/images/', '/icons/', '/manifest.webmanifest', '/legal.css']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL)))
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys()
    await Promise.all(names.filter((name) => name.startsWith('droptrip-runtime-') && name !== CACHE_NAME).map((name) => caches.delete(name)))
    await self.clients.claim()
  })())
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

const isCacheableStaticRequest = (url) => STATIC_PATHS.some((path) => url.pathname.startsWith(path))

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request)
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME)
          await cache.put(request, response.clone())
        }
        return response
      } catch {
        return (await caches.match(request)) || (await caches.match(OFFLINE_URL))
      }
    })())
    return
  }

  if (!isCacheableStaticRequest(url)) return
  event.respondWith((async () => {
    const cached = await caches.match(request)
    const network = fetch(request).then(async (response) => {
      if (response.ok && response.type === 'basic') {
        const cache = await caches.open(CACHE_NAME)
        await cache.put(request, response.clone())
      }
      return response
    })
    return cached || network
  })())
})
`
    const outputDirectory = resolve(cwd(), 'dist')
    await mkdir(outputDirectory, { recursive: true })
    await writeFile(resolve(outputDirectory, 'service-worker.js'), serviceWorker, 'utf8')
    await writeFile(
      resolve(outputDirectory, 'contact-config.js'),
      `window.DROPTRIP_CONTACT_FORM_URL = ${JSON.stringify(contactFormUrl)};\n`,
      'utf8',
    )
  },
})

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const publicSiteOrigin = getPublicSiteOrigin(env.VITE_PUBLIC_SITE_URL)
  const contactFormUrl = getSafeContactFormUrl(env.VITE_CONTACT_FORM_URL)

  return {
    plugins: [react(), createPublicSiteMetadataPlugin(publicSiteOrigin), createServiceWorkerPlugin(contactFormUrl)],
  }
})
