# Release Candidate Report

監査日: 2026-07-13  
対象バージョン: `0.1.0-beta`  
Production URL: `https://droptrip.vercel.app`

## リリース判定

**条件付きでリリース可能**です。

静的検証、全自動テスト、Production URLを指定したビルド、秘密値形式の成果物スキャンは通過しました。実際のリリース前には、現在の意図した未コミット変更をレビューしてProduction branchへ反映し、実ブラウザで下記のスモークテストを完了してください。

## Git と成果物

- `git status` はcleanではありません。AIプランV2・利用保護・監査文書・検証スクリプトに関する意図した未コミット変更があります。意図しない生成物は確認されませんでした。
- `.env`、`.env.local`、`dist` はGit管理外です。`package-lock.json` はGit管理され、root packageの名前・バージョン・依存定義は`package.json`と整合しています。
- ソースとGit管理ファイルにAPIキー形式の値は検出されませんでした。`dist`のテキスト成果物にもOpenAI/Googleキー形式の値はありません。
- バンドル中に`OPENAI_API_KEY`などの**変数名**と`localhost`という説明文は残りますが、いずれも開発用フォールバックを説明するUI文言です。キー値やlocalhost固定のAPI URLは含まれません。

## 機能状態

| 項目 | 結果 |
| --- | --- |
| 正式旅先 | 137件 |
| 検索表示母集団 | 136自治体（兵庫県豊岡市は表示時に1件へ重複除外） |
| confirmed hero | 137件 |
| confirmed映えスポット | 408件（全137旅先に3件） |
| ErrorBoundary / hero失敗時表示 | 静的検証OK |
| photoSpots遅延読み込み | 静的検証OK。初期HTMLはmain JS/CSSのみを参照 |

## 環境変数

| 変数 | 区分 | 必須性・未設定時 | Vercel設定 |
| --- | --- | --- | --- |
| `VITE_PUBLIC_SITE_URL` | 公開値 | Production SEOには必要。未設定ではcanonical/絶対OGP URLを出力しない | Productionのみ。Sensitive不要 |
| `GOOGLE_MAPS_API_KEY` | サーバー秘密 | 経路時間取得に必要。未設定は安全な503 | Production必須、PreviewはAPI検証時のみ。Sensitive推奨 |
| `OPENAI_API_KEY` | サーバー秘密 | AIプラン生成に必要。未設定は安全な503 | Production必須、PreviewはAI検証時のみ。Sensitive推奨 |
| `OPENAI_PLAN_MODEL` | サーバー設定 | 任意。未設定時は`gpt-4.1-mini` | Production任意。Sensitive不要 |
| `AI_REQUEST_TIMEOUT_MS` | サーバー設定 | 任意。未設定時は28,000ms（10,000〜30,000のみ有効） | Production任意。Sensitive不要 |
| `AI_MAX_OUTPUT_TOKENS` | サーバー設定 | 任意。未設定時は1,000（400〜1,200のみ有効） | Production任意。Sensitive不要 |
| `VITE_GOOGLE_MAPS_API_KEY` / `VITE_OPENAI_API_KEY` / `VITE_OPENAI_PLAN_MODEL` | 開発専用公開値 | localhostの直接通信フォールバックだけで参照 | Production/Previewへ設定しない |

`VERCEL_URL`、`VERCEL_BRANCH_URL`、`VERCEL_PROJECT_PRODUCTION_URL`は、AI APIのOrigin許可判定に使うVercel提供の自動環境変数です。手動登録は不要です。

## API と費用保護

- AI APIはPOST/JSON/本文サイズ/入力文字数/正式旅先/配列件数を検証し、28秒の上流タイムアウト、1,000 tokens既定上限、同一インスタンス内の短時間レート制限、Origin確認、429・504を含む安全なエラー応答を備えます。
- クライアントは生成中の二重送信、60秒クールダウン、日次5回の簡易上限、同一入力の10分キャッシュを持ち、失敗時に既存プランを消しません。
- Routes APIは相対`/api/route-time`のみを使用し、サーバー側キー、入力検証、25秒タイムアウト、安全な503/4xx/502応答を確認しました。移動時間に失敗しても画面全体は停止しない設計です。
- **残るリスク:** ブラウザ内制限とVercel Functionのインメモリ制限は、別端末・別インスタンス・再起動をまたいで共有されません。認証と共有ストアによる永続レート制限は未導入です。

## ルーティング、SEO、配信

- 現在のアプリは`/`を起点とする状態遷移型UIで、旅先詳細の固有URLルートは実装していません。`/api/generate-plan`と`/api/route-time`はVercel Functionsとして独立し、`/assets/*`、`/robots.txt`、`/favicon.svg`、画像は静的配信です。
- `vercel.json`はVite build/`dist`、`/assets/*`のimmutable cache、`nosniff`、Referrer Policy、Permissions Policyを設定しています。全体SPA rewriteは設定しておらず、APIや静的アセットを巻き込みません。
- Production URLを指定したビルドで、`lang=ja`、title、description、robots、theme-color、favicon、canonical、OGP URL/image、Twitter imageがすべて`https://droptrip.vercel.app`を使用することを確認しました。Preview URLやlocalhostはcanonical/OGPに入りません。
- `robots.txt`は未作成です。faviconは存在します。sitemapは固有公開ルートが未定義のため未作成です。

## パフォーマンス

| 成果物 | サイズ | gzip |
| --- | ---: | ---: |
| 初期`index` JS | 447.53KB | 124.31KB |
| CSS | 114.06KB | 21.05KB |
| `destinations` | 258.69KB | 55.81KB |
| `destinationImages` | 104.04KB | 17.17KB |
| `photoSpots`（遅延） | 156.40KB | 35.21KB |
| `destinationQuality`（遅延） | 9.92KB | 4.31KB |
| `drawBalance`（遅延） | 2.92KB | 1.44KB |

Viteの500KB警告はありません。`photoSpots`は初期HTMLからpreloadされず、映え詳細を開く時だけ動的に読み込みます。heroには`loading="lazy"`を使い、表示枠は自然な画像比率を保つ既存仕様です。

## モバイル・アクセシビリティ

- CSSには350px/430px/440pxを含む小幅画面向け規則があり、カードの単列化・長文の折返し・44px以上の主要操作領域を静的に確認しました。
- `aria-label`、`aria-live`、`focus-visible`、画像alt、button/link要素、`prefers-reduced-motion`の対応を確認しました。
- 320/360/375/390/430/768/1024/1440pxでの実描画、キーボードTab順、スクリーンリーダー、Console/Network、戻る・進む・再読込はこの環境では未実施です。

## 自動検証

- `npm run test:destination-search`: OK（正式旅先137件、検索母集団136件、豊岡市1件）
- `npm run test:photo-spots`: OK（408件すべてconfirmed、needs_review 0件）
- `npm run test:production-readiness`: OK
- `npm run test:ai-plan-v2`: OK
- `npm run test:ai-usage-protection`: OK
- `npm run lint`: OK
- `npm run build`: OK（Production URLを指定、Vite 500KB警告なし）

## 所見と優先度

| 優先度 | 件数 | 内容 |
| --- | ---: | --- |
| Critical | 0 | 静的監査では該当なし |
| High | 1 | 現在の監査対象変更は未コミット。実際の公開前にレビュー済みの変更をProduction branchへ反映し、デプロイ対象を確定する必要があります。 |
| Medium | 2 | 永続的な認証・共有レート制限が未導入。実ブラウザ/実端末での最終スモークテストは未実施。 |
| Low | 1 | `robots.txt`/sitemapと、β表記の公開方針を運用で判断する必要があります。 |

## リリース前の必須作業

1. 未コミットの意図した変更をレビューし、コミット・push後のPreviewで同じテストを再実行する。
2. 本番URLでトップ、検索、詳細、hero、映えスポット3件、AIプラン、Routes API、エラー表示、390px表示、直接`/`アクセス、戻る・進む・再読込を確認する。
3. VercelのConsole/Networkで、`photoSpots`が詳細表示時にだけ読み込まれ、APIキーや未処理エラーが出ないことを確認する。
4. OpenAI/Google Cloudの予算・利用量アラートを有効にする。利用拡大前に共有ストアと認証に基づく永続レート制限を導入する。

## リリース後24時間の監視

- Vercel Functionの4xx/5xx、504、429、Function実行時間、OpenAI/Routes APIエラー率
- OpenAI/Google Cloudの利用量・費用アラート
- Consoleエラー、画像404、photoSpots chunk失敗、AIプラン生成失敗
- 検索、hero、映えスポット、モバイル390pxの問い合わせ
- canonical/OGP共有カードの実表示

## ロールバック

VercelのDeploymentsから直前の正常なデプロイを選び、ProductionへPromote/Rollbackします。秘密情報の漏えい・異常利用時はロールバックだけでは不十分なため、Vercelと各提供元でキーを失効・再発行し、利用量を確認します。
