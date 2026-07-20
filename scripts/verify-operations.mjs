import { readFile } from 'node:fs/promises'

import generatePlan from '../api/generate-plan.js'
import routeTime from '../api/route-time.js'

const failures = []

const invoke = async (handler, request) => {
  const result = { status: 200, body: null }
  const response = {
    setHeader: () => {},
    status: (status) => {
      result.status = status
      return { json: (body) => { result.body = body; return result } }
    },
  }
  await handler(request, response)
  return result
}

const originalAiFlag = process.env.ENABLE_AI_PLAN
const originalRouteFlag = process.env.ENABLE_ROUTE_TIME
process.env.ENABLE_AI_PLAN = 'false'
process.env.ENABLE_ROUTE_TIME = 'false'

const [aiMaintenance, routeMaintenance] = await Promise.all([
  invoke(generatePlan, { method: 'POST', headers: { 'content-type': 'application/json' }, body: {} }),
  invoke(routeTime, { method: 'POST', body: {} }),
])

if (originalAiFlag === undefined) delete process.env.ENABLE_AI_PLAN
else process.env.ENABLE_AI_PLAN = originalAiFlag
if (originalRouteFlag === undefined) delete process.env.ENABLE_ROUTE_TIME
else process.env.ENABLE_ROUTE_TIME = originalRouteFlag

if (aiMaintenance.status !== 503 || aiMaintenance.body?.code !== 'AI_PLAN_MAINTENANCE') failures.push('AI maintenance flag is invalid')
if (routeMaintenance.status !== 503 || routeMaintenance.body?.code !== 'ROUTE_TIME_MAINTENANCE') failures.push('Routes maintenance flag is invalid')

const requiredPublicFiles = ['terms.html', 'privacy.html', 'contact.html', 'legal.css', 'robots.txt']
for (const file of requiredPublicFiles) {
  try {
    await readFile(new URL(`../public/${file}`, import.meta.url), 'utf8')
  } catch {
    failures.push(`public/${file} is missing`)
  }
}

const [footerSource, noticeSource, versionSource, envExample] = await Promise.all([
  readFile(new URL('../src/components/AppFooter.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/ServiceNotice.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/config/appVersion.js', import.meta.url), 'utf8'),
  readFile(new URL('../.env.example', import.meta.url), 'utf8'),
])

if (!footerSource.includes('/terms.html') || !footerSource.includes('/privacy.html') || !footerSource.includes('/contact.html')) failures.push('service footer links are incomplete')
if (!noticeSource.includes('/terms.html')) failures.push('service notices do not link to terms')
if (!versionSource.includes("APP_VERSION = 'v1.0.0'")) failures.push('release version is not v1.0.0')
if (!envExample.includes('ENABLE_AI_PLAN=true') || !envExample.includes('ENABLE_ROUTE_TIME=true')) failures.push('maintenance flags are missing from .env.example')

if (failures.length > 0) {
  console.error(`運用基盤検証に失敗しました。\n${failures.join('\n')}`)
  process.exitCode = 1
} else {
  console.log('運用基盤検証OK: 法務ページ、問い合わせ導線、バージョン、AI/Routes停止フラグを確認しました。')
}
