# Vercel Deployment Checklist

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
- [ ] 公開範囲に応じた認証、レート制限、利用回数制限をサーバー側で導入済み

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

