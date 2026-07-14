# Environment Variables

秘密値そのものは、`.env`、`.env.local`、VercelのEnvironment Variablesだけに保存します。Gitへ保存しません。

## 一覧

| 変数 | 公開 | 必須 | 使用場所 | 未設定時 | Vercel設定先 |
| --- | --- | --- | --- | --- | --- |
| `VITE_PUBLIC_SITE_URL` | 公開 | 任意 | `vite.config.js` | canonical・`og:url`・絶対OGP画像を出力しない | Productionのみ |
| `VITE_GOOGLE_MAPS_API_KEY` | 公開される | ローカル任意 | `src/services/travelTime.js` | localhostの直接通信を使えない。サーバーAPIを先に試す | 設定しない |
| `VITE_OPENAI_API_KEY` | 公開される | ローカル任意 | `src/services/openAiConfig.js` | localhostの直接通信を使えない。サーバーAPIを先に試す | 設定しない |
| `VITE_OPENAI_PLAN_MODEL` | 公開される | ローカル任意 | `src/services/openAiPlan.js` | `gpt-4.1-mini` を使用 | 設定しない |
| `GOOGLE_MAPS_API_KEY` | 秘密 | API利用時は必須 | `api/route-time.js` | `/api/route-time` は503を返す | Production、API確認を行うPreview |
| `OPENAI_API_KEY` | 秘密 | AIプラン利用時は必須 | `api/generate-plan.js` | `/api/generate-plan` は503を返す | Production、API確認を行うPreview |
| `OPENAI_PLAN_MODEL` | 秘密ではないがサーバー設定 | 任意 | `api/generate-plan.js` | `gpt-4.1-mini` を使用 | Production、API確認を行うPreview |
| `AI_REQUEST_TIMEOUT_MS` | サーバー設定 | 任意 | `api/generate-plan.js` | 30,000msを使用 | Production、必要ならPreview |
| `AI_MAX_OUTPUT_TOKENS` | サーバー設定 | 任意 | `api/generate-plan.js` | 2,400 tokensを既定値として使用 | Production、必要ならPreview |

## ローカル開発

1. `.env.example` を参照して `.env` または `.env.local` を作成します。
2. Vercel Functionsを使わないローカル検証だけで、`VITE_GOOGLE_MAPS_API_KEY` と `VITE_OPENAI_API_KEY` を使用できます。
3. `VITE_`付きの値はブラウザへ埋め込まれます。実運用の秘密キーを入れません。

## Vercel

- Productionは `VITE_PUBLIC_SITE_URL` に実際のHTTPS本番ドメインを設定します。例: `https://example.com`。末尾のスラッシュは不要です。
- Previewには `VITE_PUBLIC_SITE_URL` を設定しません。Preview URLをcanonicalやOGPへ混ぜません。
- APIをPreviewで検証する場合のみ、秘密のサーバー変数をPreviewにも設定します。不要なら設定せず、APIが安全に503となることを確認します。
- `VITE_GOOGLE_MAPS_API_KEY` と `VITE_OPENAI_API_KEY` はProduction/Previewへ設定しません。
- `AI_REQUEST_TIMEOUT_MS`は10,000〜30,000、`AI_MAX_OUTPUT_TOKENS`は1,500〜4,000だけが有効です。未設定時は30,000msと2,400 tokensを使い、日帰り・宿泊日数ごとの実際の上限はサーバー側で安全に調整します。
- ブラウザ内の日次5回・60秒クールダウンは環境変数ではなく簡易制限です。共有ストアを使う恒久的な利用回数制限ではありません。

## Google Cloudの制限

`GOOGLE_MAPS_API_KEY` はサーバー専用キーです。Google Cloud ConsoleでRoutes APIだけを許可し、予算・利用量アラートを設定します。サーバー経由キーにはブラウザ用HTTPリファラー制限ではなく、利用API制限とサーバー運用上のアクセス制御を組み合わせます。開発用のブラウザキーを別途使う場合だけ、`http://localhost:*`など必要最小限のリファラーに制限します。

## Gitへ保存してはいけないもの

- `.env`、`.env.local`、実際のOpenAI APIキー、Google Maps APIキー
- Vercelの秘密環境変数の値
- 課金、認証、Webhook、外部サービスのトークン
