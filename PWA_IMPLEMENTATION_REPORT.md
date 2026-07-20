# DROPTRIP PWA Implementation Report

更新日: 2026-07-20  
対象URL: `https://droptrip.vercel.app`

## 構成

- `public/manifest.webmanifest`: `standalone`表示、`/`を開始URL・scopeにしたWeb App Manifest。
- アイコン: 192px、512px、maskable 512px、Apple Touch Icon 180px。既存faviconの稲妻モチーフと色を踏襲しています。
- Service Worker: 外部プラグインを追加せず、Viteビルド時に`dist/service-worker.js`を生成します。

## キャッシュ方針

- ナビゲーションHTMLはネットワーク優先です。ネットワーク失敗時だけ最後に保存された画面、または`offline.html`を使います。
- hashed assets、`/images/`、`/icons/`、manifest、法務ページ用CSSは必要時に再利用します。
- `/api/`、AI旅行プラン、移動時間、リクエスト本文、APIキーはService Workerでキャッシュしません。
- Service Worker本体はビルドごとに更新され、待機中の更新は利用者が「更新する」を選んだ時だけ有効化します。

## インストール方法

- iPhone / iPad: Safariで開き、共有メニューから「ホーム画面に追加」を選びます。
- Android: 対応ブラウザの案内、またはアプリ内の「アプリをインストール」から追加します。
- PC: Chrome / Edgeなどのインストール機能、またはアプリ内の案内から追加します。

## オフラインと制限

- オフライン時は通信状態を知らせ、AI旅行プランと移動時間には通信が必要であることを表示します。
- 完全なオフライン旅行アプリではありません。API応答やAI結果は保存しません。
- iOSのインストール案内はSafariの仕様上、共有メニューを使う手順です。

## 本番確認

1. HTTPSのProduction URLでmanifestとService Workerが200になることを確認します。
2. Android、iOS、PCでインストール後に`standalone`で開くことを確認します。
3. 更新通知、オフライン画面、AI・Routes APIがキャッシュされないことを確認します。
4. Vercelデプロイ後、古いService Workerが待機中になり、更新操作で安全に再読み込みできることを確認します。
