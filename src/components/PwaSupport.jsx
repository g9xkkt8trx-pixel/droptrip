import { useEffect, useState } from 'react'

const INSTALL_DISMISS_KEY = 'droptrip-pwa-install-dismissed-until'
const DISMISS_DURATION_MS = 14 * 24 * 60 * 60 * 1000

const isStandalone = () => (
  window.matchMedia?.('(display-mode: standalone)').matches
  || window.navigator.standalone === true
)

const isIosBrowser = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent)

const isInstallDismissed = () => {
  try {
    return Number(window.localStorage.getItem(INSTALL_DISMISS_KEY)) > Date.now()
  } catch {
    return false
  }
}

const dismissInstallGuide = () => {
  try {
    window.localStorage.setItem(INSTALL_DISMISS_KEY, String(Date.now() + DISMISS_DURATION_MS))
  } catch {
    // Storage is optional. The guide remains dismissible for the current view.
  }
}

export default function PwaSupport() {
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine)
  const [installEvent, setInstallEvent] = useState(null)
  const [showIosGuide, setShowIosGuide] = useState(() => (
    typeof window !== 'undefined' && !isStandalone() && !isInstallDismissed() && isIosBrowser()
  ))
  const [updateRegistration, setUpdateRegistration] = useState(null)

  useEffect(() => {
    const updateNetworkState = () => setIsOffline(!navigator.onLine)
    window.addEventListener('online', updateNetworkState)
    window.addEventListener('offline', updateNetworkState)
    return () => {
      window.removeEventListener('online', updateNetworkState)
      window.removeEventListener('offline', updateNetworkState)
    }
  }, [])

  useEffect(() => {
    if (isStandalone() || isInstallDismissed()) return undefined
    const handleInstallPrompt = (event) => {
      event.preventDefault()
      setInstallEvent(event)
    }
    window.addEventListener('beforeinstallprompt', handleInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleInstallPrompt)
  }, [])

  useEffect(() => {
    if (import.meta.env.DEV || !('serviceWorker' in navigator)) return undefined
    let isActive = true
    let refreshing = false

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js', { scope: '/' })
        if (!isActive) return
        if (registration.waiting) setUpdateRegistration(registration)
        registration.addEventListener('updatefound', () => {
          const worker = registration.installing
          worker?.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) setUpdateRegistration(registration)
          })
        })
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (!refreshing) {
            refreshing = true
            window.location.reload()
          }
        })
      } catch {
        // PWA support is progressive. The web app remains available without a worker.
      }
    }

    register()
    return () => { isActive = false }
  }, [])

  const dismissGuide = () => {
    dismissInstallGuide()
    setInstallEvent(null)
    setShowIosGuide(false)
  }

  const installApp = async () => {
    if (!installEvent) return
    await installEvent.prompt()
    await installEvent.userChoice
    setInstallEvent(null)
  }

  const applyUpdate = () => updateRegistration?.waiting?.postMessage({ type: 'SKIP_WAITING' })

  return (
    <div className="pwa-support" aria-live="polite">
      {isOffline && (
        <aside className="pwa-notice pwa-offline" role="status">
          <strong>現在オフラインです</strong>
          <span>通信環境を確認して再度お試しください。AI旅行プランと移動時間の取得には通信が必要です。</span>
        </aside>
      )}
      {updateRegistration && (
        <aside className="pwa-notice pwa-update" role="status">
          <span>新しいバージョンがあります。</span>
          <button type="button" onClick={applyUpdate}>更新する</button>
        </aside>
      )}
      {!isOffline && (installEvent || showIosGuide) && (
        <aside className="pwa-install-card" aria-label="DROPTRIPアプリのインストール案内">
          <div>
            <strong>DROPTRIPをアプリとして使う</strong>
            <span>{installEvent ? 'ホーム画面に追加すると、アプリのようにすぐ開けます。' : 'Safariの共有メニューから「ホーム画面に追加」を選んでください。'}</span>
          </div>
          <div className="pwa-install-actions">
            {installEvent && <button type="button" onClick={installApp}>アプリをインストール</button>}
            <button type="button" className="pwa-dismiss-button" onClick={dismissGuide} aria-label="インストール案内を閉じる">今回は閉じる</button>
          </div>
        </aside>
      )}
    </div>
  )
}
