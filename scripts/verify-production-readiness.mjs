import { readFile } from 'node:fs/promises'

import rawDestinations from '../src/data/destinations.json' with { type: 'json' }
import { getDestinationImages } from '../src/data/destinationImages.js'
import { supplementalDestinations } from '../src/data/supplementalDestinations.js'

const indexHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8')
const appSource = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8')
const mainSource = await readFile(new URL('../src/main.jsx', import.meta.url), 'utf8')
const destinations = [...rawDestinations, ...supplementalDestinations]
const failures = []

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
  console.log(`本番準備静的検証OK: 旅先 ${destinations.length}件 / confirmed hero ${destinations.length}件 / メタ情報・ErrorBoundary・遅延読み込みを確認`)
}
