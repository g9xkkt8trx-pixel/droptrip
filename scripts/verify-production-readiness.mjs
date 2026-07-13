import { access, readFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import rawDestinations from '../src/data/destinations.json' with { type: 'json' }
import { getDestinationImages } from '../src/data/destinationImages.js'
import { supplementalDestinations } from '../src/data/supplementalDestinations.js'

const indexHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8')
const appSource = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8')
const mainSource = await readFile(new URL('../src/main.jsx', import.meta.url), 'utf8')
const openAiPlanSource = await readFile(new URL('../src/services/openAiPlan.js', import.meta.url), 'utf8')
const travelTimeSource = await readFile(new URL('../src/services/travelTime.js', import.meta.url), 'utf8')
const envExample = await readFile(new URL('../.env.example', import.meta.url), 'utf8')
const gitignore = await readFile(new URL('../.gitignore', import.meta.url), 'utf8')
const viteConfig = await readFile(new URL('../vite.config.js', import.meta.url), 'utf8')
const vercelConfig = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'))
const destinations = [...rawDestinations, ...supplementalDestinations]
const failures = []
const execFileAsync = promisify(execFile)

const requiredMeta = [
  /<html\s+lang=["']ja["']/i,
  /<title>[^<]+<\/title>/i,
  /<meta\s+name=["']description["']\s+content=["'][^"']+/i,
  /<meta\s+name=["']robots["']\s+content=["']index,follow["']/i,
  /<meta\s+property=["']og:title["']\s+content=["'][^"']+/i,
  /<meta\s+name=["']twitter:card["']\s+content=["']summary_large_image["']/i,
]

requiredMeta.forEach((pattern, index) => {
  if (!pattern.test(indexHtml)) failures.push(`index.html の必須メタ情報 ${index + 1} がありません。`)
})

if (!mainSource.includes('AppErrorBoundary')) failures.push('AppErrorBoundary が main.jsx から利用されていません。')
if (!appSource.includes("import('./data/photoSpots.js')")) failures.push('映えスポットの遅延読み込みが見つかりません。')
if (appSource.includes("from './data/photoSpots.js'")) failures.push('映えスポットの静的 import が残っています。')
if (!appSource.includes('photoSpotCache')) failures.push('映えスポットの結果キャッシュが見つかりません。')
if (!appSource.includes('hasHeroImageFailure')) failures.push('hero画像の読み込み失敗フォールバックが見つかりません。')
if (!gitignore.includes('.env') || !gitignore.includes('.env.*')) failures.push('.env と .env.* が .gitignore の対象ではありません。')

const requiredEnvironmentVariables = [
  'VITE_PUBLIC_SITE_URL',
  'VITE_GOOGLE_MAPS_API_KEY',
  'VITE_OPENAI_API_KEY',
  'VITE_OPENAI_PLAN_MODEL',
  'GOOGLE_MAPS_API_KEY',
  'OPENAI_API_KEY',
  'OPENAI_PLAN_MODEL',
]
requiredEnvironmentVariables.forEach((name) => {
  if (!new RegExp(`^${name}=`, 'm').test(envExample)) failures.push(`.env.example に ${name} がありません。`)
})

if (!viteConfig.includes('VITE_PUBLIC_SITE_URL') || !viteConfig.includes('canonical')) {
  failures.push('本番URLによるcanonical/OGP絶対URLの生成設定が見つかりません。')
}
if (/https?:\/\/(?:localhost|127\.0\.0\.1)/i.test(indexHtml)) {
  failures.push('index.html にlocalhost固定URLが含まれています。')
}
if (/fetch\(\s*['"]https?:\/\/(?:localhost|127\.0\.0\.1)/i.test(`${appSource}\n${openAiPlanSource}\n${travelTimeSource}`)) {
  failures.push('本番コードにlocalhost固定API URLが含まれています。')
}
if (!openAiPlanSource.includes("const SERVER_PLAN_API_URL = '/api/generate-plan'")) {
  failures.push('AIプランAPIが相対URLを使用していません。')
}
if (!travelTimeSource.includes("const SERVER_ROUTE_API_URL = '/api/route-time'")) {
  failures.push('経路APIが相対URLを使用していません。')
}

if (vercelConfig.framework !== 'vite' || vercelConfig.buildCommand !== 'npm run build' || vercelConfig.outputDirectory !== 'dist') {
  failures.push('vercel.json のViteビルド設定が不正です。')
}
if (Array.isArray(vercelConfig.rewrites) && vercelConfig.rewrites.some((rewrite) => rewrite.source === '/(.*)')) {
  failures.push('vercel.json の全体rewriteは /api を巻き込むため使用しません。')
}
const headerNames = new Set((vercelConfig.headers ?? []).flatMap((rule) => rule.headers?.map((header) => header.key) ?? []))
;['Cache-Control', 'X-Content-Type-Options', 'Referrer-Policy', 'Permissions-Policy'].forEach((name) => {
  if (!headerNames.has(name)) failures.push(`vercel.json に ${name} ヘッダーがありません。`)
})

try {
  await access(new URL('../public/favicon.svg', import.meta.url))
} catch {
  failures.push('public/favicon.svg がありません。')
}

const { stdout: trackedFiles } = await execFileAsync('git', ['ls-files', '-z'])
const trackedFileList = trackedFiles.split('\0').filter(Boolean)
if (trackedFileList.includes('.env')) failures.push('.env がGit管理されています。')
const secretPattern = /(?:sk-(?:proj-)?[A-Za-z0-9_-]{20,}|AIza[\w-]{20,})/
for (const file of trackedFileList.filter((file) => /\.(?:js|jsx|json|md|html|env)$/i.test(file) && file !== '.env.example')) {
  const content = await readFile(new URL(`../${file}`, import.meta.url), 'utf8').catch(() => '')
  if (secretPattern.test(content)) failures.push(`Git管理ファイルにAPIキー形式の値が見つかりました: ${file}`)
}

const invalidHeroes = destinations.filter((destination) => {
  const heroImage = getDestinationImages(destination.prefecture, destination.city, destination.tags, destination).heroImage
  const source = heroImage?.src ?? heroImage?.url ?? heroImage?.imageUrl
  return !(
    heroImage?.status === 'confirmed'
    && heroImage?.type === 'destination_fixed'
    && source
    && heroImage?.alt
    && (heroImage?.isIllustration === true || heroImage?.isPhoto === true)
    && heroImage?.hasEmbeddedText !== true
  )
})

if (invalidHeroes.length > 0) {
  failures.push(`表示条件を満たさないhero画像: ${invalidHeroes.map((destination) => destination.city).join('、')}`)
}

if (failures.length > 0) {
  console.error(`本番準備静的検証に失敗しました。\n${failures.join('\n')}`)
  process.exitCode = 1
} else {
  console.log(`本番準備静的検証OK: 旅先 ${destinations.length}件 / confirmed hero ${destinations.length}件 / デプロイ設定・環境変数・メタ情報を確認`)
}
