import { access, readFile, stat } from 'node:fs/promises'

const root = new URL('../', import.meta.url)
const source = (path) => new URL(`../${path}`, import.meta.url)
const dist = (path) => new URL(`../dist/${path}`, import.meta.url)
const requiredIcons = [
  'public/icons/droptrip-192.png',
  'public/icons/droptrip-512.png',
  'public/icons/droptrip-maskable-512.png',
  'public/icons/droptrip-apple-touch-icon.png',
]
const requiredScreenshots = [
  { path: 'public/screenshots/droptrip-wide.png', size: '1280x720', formFactor: 'wide' },
  { path: 'public/screenshots/droptrip-mobile.png', size: '390x844', formFactor: 'narrow' },
]
const failures = []

const readPngSize = async (path) => {
  const bytes = await readFile(source(path))
  if (bytes.toString('ascii', 1, 4) !== 'PNG') return null
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }
}

const manifest = JSON.parse(await readFile(source('public/manifest.webmanifest'), 'utf8'))
if (manifest.display !== 'standalone') failures.push('manifest display must be standalone')
if (manifest.start_url !== '/' || manifest.scope !== '/') failures.push('manifest URL scope is invalid')
if (manifest.id !== '/') failures.push('manifest id must be /')
if (manifest.prefer_related_applications !== false) failures.push('manifest related app setting is invalid')
for (const size of ['192x192', '512x512']) {
  if (!manifest.icons.some((icon) => icon.sizes === size && icon.type === 'image/png')) failures.push(`manifest icon ${size} is missing`)
}

for (const screenshot of requiredScreenshots) {
  const entry = manifest.screenshots?.find((item) => item.src === `/${screenshot.path.split('/').slice(1).join('/')}`)
  if (!entry || entry.sizes !== screenshot.size || entry.type !== 'image/png' || entry.form_factor !== screenshot.formFactor) {
    failures.push(`manifest screenshot ${screenshot.path} is invalid`)
    continue
  }
  try {
    const dimensions = await readPngSize(screenshot.path)
    if (!dimensions || `${dimensions.width}x${dimensions.height}` !== screenshot.size) failures.push(`${screenshot.path} dimensions do not match manifest`)
  } catch {
    failures.push(`${screenshot.path} is missing`)
  }
}
if (!manifest.icons.some((icon) => icon.purpose === 'maskable' && icon.sizes === '512x512')) failures.push('maskable icon is missing')

for (const path of requiredIcons) {
  try {
    if ((await stat(source(path))).size < 512) failures.push(`${path} is unexpectedly small`)
  } catch {
    failures.push(`${path} is missing`)
  }
}

const indexHtml = await readFile(source('index.html'), 'utf8')
for (const value of ['rel="manifest"', 'apple-touch-icon', 'apple-mobile-web-app-capable', 'theme-color']) {
  if (!indexHtml.includes(value)) failures.push(`index.html is missing ${value}`)
}

const pwaComponent = await readFile(source('src/components/PwaSupport.jsx'), 'utf8')
for (const value of ['beforeinstallprompt', 'serviceWorker.register', 'display-mode: standalone', 'offline', 'SKIP_WAITING']) {
  if (!pwaComponent.includes(value)) failures.push(`PWA support is missing ${value}`)
}

const config = await readFile(source('vite.config.js'), 'utf8')
if (!config.includes("url.pathname.startsWith('/api/')")) failures.push('service worker does not exclude APIs')

try {
  for (const path of ['manifest.webmanifest', 'service-worker.js', 'offline.html', 'icons/droptrip-192.png', 'icons/droptrip-512.png', 'icons/droptrip-apple-touch-icon.png', 'screenshots/droptrip-wide.png', 'screenshots/droptrip-mobile.png', 'robots.txt']) await access(dist(path))
  const builtWorker = await readFile(dist('service-worker.js'), 'utf8')
  if (!builtWorker.includes("url.pathname.startsWith('/api/')")) failures.push('built service worker does not exclude APIs')
} catch {
  failures.push('build output is missing PWA files; run npm run build before release verification')
}

if (failures.length) throw new Error(`PWA verification failed:\n- ${failures.join('\n- ')}`)
console.log('PWA検証OK: manifest、アイコン、Service Worker、API除外、ビルド成果物を確認しました。')
