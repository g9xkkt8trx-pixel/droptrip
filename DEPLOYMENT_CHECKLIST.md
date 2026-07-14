# Vercel Deployment Checklist

## リリース候補の最終確認（2026-07-13）

- [x] `test:destination-search`、`test:photo-spots`、`test:production-readiness`、`test:ai-plan-v2`、`test:ai-usage-protection`の静的検証を通過
- [x] `npm run lint` とProduction URLを指定した `npm run build` を通過
- [x] Production URL `https://droptrip.vercel.app` を注入したビルドでcanonical/OGP/Twitter絶対URLを確認
- [x] 初期JS 447.53KB、`photoSpots`遅延チャンク156.40KB、Vite 500KB警告なし
- [x] Git管理ファイルとテキスト成果物にAPIキー形式の値がないことを確認
- [ ] 実際のProductionデプロイでトップ、検索、詳細、hero、映えスポット、AI、Routes API、APIエラーを確認
- [ ] 320px〜1440pxの実表示、キーボード操作、Console/Network、戻る・進む・再読込を確認
- [ ] 未コミットの意図した変更をレビューし、公開対象のcommitを確定
- [ ] OpenAI/Google Cloudの予算・利用量アラートを確認。利用拡大前に共有ストア・認証による永続レート制限を計画

## Vercelプロジェクト

- [ ] Framework Preset: `Vite`
- [ ] Root Directory: リポジトリ直下
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`
- [ ] Node.js Version: Vercel管理画面でプロジェクトの対応バージョンを確認
- [ ] Functionsに `/api/generate-plan` と `/api/route-time` が表示される
- [ ] Preview Deployment Protectionを必要に応じて有効化

## 環境変数

- [ ] Productionに `VITE_PUBLIC_SITE_URL` をHTTPS本番URLで設定
- [ ] Productionに `GOOGLE_MAPS_API_KEY` を設定（経路APIを使う場合）
- [ ] Productionに `OPENAI_API_KEY` と必要なら `OPENAI_PLAN_MODEL` を設定（AIプランを使う場合）
- [ ] 必要な場合だけ `AI_REQUEST_TIMEOUT_MS`（10,000〜30,000）と `AI_MAX_OUTPUT_TOKENS`（400〜1,200）を設定
- [ ] Previewへ公開用の `VITE_GOOGLE_MAPS_API_KEY` / `VITE_OPENAI_API_KEY` を設定していない
- [ ] PreviewでAPI検証をする場合だけ、秘密のサーバー環境変数を設定
- [ ] `.env` / `.env.local`がGit管理されていない

## URLとSEO

- [ ] 本番URLでcanonicalが正しい
- [ ] `og:url`、`og:image`、`twitter:image`が本番ドメインのHTTPS絶対URL
- [ ] Preview URLがcanonical・OGPに使われていない
- [ ] `robots`がProductionで`index,follow`
- [ ] sitemapを作成する場合は本番URLと実在する公開ルートだけを記載
- [ ] Search Console登録とOGP共有カードを確認

## APIとキー

- [ ] `/api/route-time`が相対URL経由で応答する
- [ ] `/api/generate-plan`が相対URL経由で応答する
- [ ] キー未設定時に安全なエラー表示となる
- [ ] Google Routes APIのみをキーに許可し、予算・利用上限アラートを設定
- [ ] OpenAIの利用量上限・請求アラートを設定
- [ ] AIプランのJSON以外拒否、Origin拒否、429、504が安全な日本語で返ることを確認
- [ ] 現在のインメモリ制限は補助層であることを理解し、一般公開の拡大前に共有ストアと認証による永続レート制限を導入

## 表示とネットワーク

- [ ] `/`の直アクセスが表示される
- [ ] 静的アセットが読み込め、hero画像の失敗時には代替表示となる
- [ ] 「映え」詳細を開くとphotoSpots遅延チャンクが読み込まれる
- [ ] 検索、抽選、詳細、戻る、お気に入り、比較を確認
- [ ] 375px / 390px / 430pxとPC幅で確認
- [ ] Console / Networkに意図しないエラー、404、秘密値がない
- [ ] Lighthouseを実行し、Performance / Accessibility / Best Practices / SEOを確認

## ヘッダーとキャッシュ

- [ ] `/assets/*`に長期immutableキャッシュが付与される
- [ ] HTMLに過剰な長期キャッシュが付いていない
- [ ] `X-Content-Type-Options`、`Referrer-Policy`、`Permissions-Policy`が付く
- [ ] CSP、HSTS、フレーム埋め込み制限は外部通信・運用要件を確認してから追加

## リリースとロールバック

- [ ] Productionへ昇格する前にPreviewで上記を確認
- [ ] 問題時はVercel Deploymentsから直前の正常デプロイへPromote/Rollback
- [ ] APIキー漏えい・異常利用時は、Vercelと各API提供元でキーを即時無効化・再発行


## 2026-07-14 Production release checks

- [x] AI trip plans are publicly available without a premium switch.
- [x] Public browser allowance is one successful new plan per local calendar day.
- [x] Failed, 429, and cached requests do not consume the daily allowance.
- [x] Development-only usage reset control is hidden in production builds.
- [x] public/robots.txt is deployed; sitemap is omitted until crawlable detail URLs exist.
- [ ] Monitor API usage and add a durable server-side rate limiter before scaling traffic.
