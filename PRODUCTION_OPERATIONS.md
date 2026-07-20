# DROPTRIP Production Operations

- Production URL: `https://droptrip.vercel.app`
- 正式バージョン: `v1.0.0`
- 更新日: 2026-07-20

## デプロイとロールバック

1. ローカルでテスト、lint、buildを完了し、意図した差分だけを確認します。
2. mainへ反映後、VercelのProductionデプロイがReadyになることを確認します。
3. 問題時はVercel Deploymentsで直前の正常デプロイをProductionへPromoteします。
4. 秘密値の流出はロールバックだけで解決しません。該当キーを失効・再発行し、Vercel環境変数を更新します。

## ログと利用量

- Vercel: Functionsログで`/api/generate-plan`、`/api/route-time`の5xx、429、504を確認します。キー、入力全文、OpenAI生レスポンスは記録・共有しません。
- OpenAI: Usage / Costsで日次のリクエスト数、入力・出力トークン、費用アラートを確認します。
- Google Cloud: Routes APIのリクエスト数、エラー率、予算・アラートを確認します。
- APIキーのローテーション時は、新しいキーをVercelへ設定してデプロイ後に動作確認し、旧キーを失効します。

## 個別機能の停止

Vercelのサーバー環境変数へ次を設定して再デプロイします。`VITE_`接頭辞は付けません。

| 対象 | 停止方法 | 利用者への応答 |
| --- | --- | --- |
| AI旅行プラン | `ENABLE_AI_PLAN=false` | `AI_PLAN_MAINTENANCE` / 503 |
| 移動時間取得 | `ENABLE_ROUTE_TIME=false` | `ROUTE_TIME_MAINTENANCE` / 503 |

復旧時は値を`true`へ戻すか削除し、再デプロイ後に対象APIだけを確認します。APIキー未設定の503とは別コードのため、原因を区別できます。

## 障害時の確認順序

1. Production URL、Vercel Deployment、Vercel Functionログを確認します。
2. 直近の環境変数変更、OpenAI / Google Cloudの利用量・障害情報を確認します。
3. 429増加時はAIの短時間レート制限、OpenAIの制限、想定外の利用増加を確認し、必要ならAIを停止します。
4. 504増加時は上流APIの応答時間、タイムアウト、Vercelログを確認します。
5. 画像404増加時は対象URL、`public/images`の配置、Vercelデプロイ成果物、キャッシュを確認します。

## 正常性確認

`PRODUCTION_SMOKE_TEST.md`に従い、検索、詳細、hero、映えスポット、Google Maps、移動時間、AIプラン、法務ページ、`/robots.txt`を確認します。

## PWAの運用

- `manifest.webmanifest`、`service-worker.js`、`/icons/`、`offline.html`がProductionで200になることを確認します。
- PWAはService Worker更新を検出した時だけ、利用者へ更新操作を案内します。緊急更新時も、古い版を即時破棄せず利用者の更新操作を待ちます。
- Service Workerは`/api/`をキャッシュしません。AI旅行プランと移動時間の障害は、通常どおりVercel Functionsと上流サービスを確認します。
- オフライン時の表示は最低限の案内です。データの完全なオフライン利用は提供しません。

## 継続運用

- リリース後24時間: 5xx、429、504、画像404、OpenAI/Googleの利用量、問い合わせを確認します。
- 月1回: 依存関係、Vercelログ、予算アラート、APIキー権限、法務文書、問い合わせ導線、ロールバック手順を見直します。
- 現在のAI日次制限はブラウザ保存とインメモリ制限です。継続運用では共有ストアを使う永続的なサーバー側レート制限を導入します。
