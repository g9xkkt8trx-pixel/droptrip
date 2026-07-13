import { Component } from 'react'

export default class AppErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('DROPTRIP rendering error', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="app-error-boundary" role="alert" aria-live="assertive">
          <section>
            <p>DROPTRIP</p>
            <h1>画面の読み込みに失敗しました</h1>
            <span>時間をおいて再読み込みしてください。</span>
            <div>
              <button type="button" onClick={() => window.location.reload()}>再読み込み</button>
              <button type="button" onClick={() => window.location.assign('/')}>ホームへ戻る</button>
            </div>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}
