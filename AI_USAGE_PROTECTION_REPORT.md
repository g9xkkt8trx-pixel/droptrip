# AI Usage Protection Report

監査日: 2026-07-13

## 現状の費用リスク

AIプランAPIは公開URLから呼べるため、認証と共有レート制限がない状態では、繰り返しリクエストによるOpenAI API費用の増加が主なリスクです。ブラウザだけの回数制限は削除・別ブラウザ・別端末で回避できます。

## 実装した防御

### クライアント側

- 生成中の二重送信を防止します。
- 成功後60秒のクールダウンを設け、残り秒数を表示します。
- 同じ条件の成功済みプランは10分間、セッションストレージの1件だけのキャッシュから再表示します。キャッシュはV3で、検証済みの構造化プランだけを保存し、旧形式・不正形式は読み捨てます。
- Browser-local daily allowance is one successful new generation. It is a convenience limit, not an authentication or billing control.
- localStorage/sessionStorageはJSON破損時に空として扱い、画面を壊しません。キャッシュは最大1件・16KBまでで、セッション終了または10分後に利用しません。

### サーバー側

- POST以外は405、JSON以外は415、壊れたJSONは400、本文が18KB超は413で拒否します。
- プロンプトは8,000文字、旅先ペイロードは12,000文字、映えスポットは3件までです。旅先IDは正式旅先の都道府県・市区町村キーと照合し、許可外の日程・過大な配列・必須項目不足も拒否します。
- 制御文字を除去し、未知の追加フィールドをAPIの権限判断や生成制御に使用しません。
- OpenAI呼び出しは既定30秒で中断し、出力上限は日程に応じて日帰り2,200・1泊2日3,000・2泊以上3,800 tokensです。`AI_REQUEST_TIMEOUT_MS`は10〜30秒、`AI_MAX_OUTPUT_TOKENS`は1,500〜4,000の範囲だけ受け付け、低い設定値では日程別の安全な必要量を下回りません。
- Responses APIの途中終了と互換APIの`finish_reason: length`を検出した場合は、切れた本文を返さず`OUTPUT_TRUNCATED`で再試行を案内します。
- `x-vercel-forwarded-for`/`x-forwarded-for`を内部の補助識別子に使い、同一インスタンスでは1分2回・10分5回を超える要求を429で抑えます。IPは画面やレスポンスへ返しません。

## Origin確認

OriginがあるブラウザPOSTは、Production URL、当該VercelデプロイURL、localhost開発URLだけを許可します。Originなしのサーバー間通信・ヘルスチェックは許可します。CORSを`*`にはせず、Refererだけにも依存しません。

これは認証ではありません。Originを偽装できる非ブラウザ通信や、Originなしの要求を完全に防ぐものではありません。

## 統一エラー

`METHOD_NOT_ALLOWED`、`INVALID_CONTENT_TYPE`、`INVALID_JSON`、`PAYLOAD_TOO_LARGE`、`INVALID_INPUT`、`ORIGIN_NOT_ALLOWED`、`RATE_LIMITED`、`OPENAI_NOT_CONFIGURED`、`UPSTREAM_TIMEOUT`、`UPSTREAM_ERROR`、`OUTPUT_TRUNCATED`を返します。OpenAIの生エラー、キー、プロンプト全文、スタックトレースは返しません。

AIプラン本文がJSONらしいのに解析できない場合は`AI_INVALID_RESPONSE`を返します。生のJSON・OpenAIレスポンス本文を一般画面やログへ出さず、既存の正常プランを保持したまま再試行を案内します。

## 完全ではない点

インメモリ制限はVercel Functionのインスタンス間で共有されず、再起動で失われます。ブラウザ内日次制限も回避可能です。一般公開で費用を確実に保護するには、認証と共有ストア（Vercel KV、Upstash Redis、DBなど）を使ったIP/ユーザー単位の永続レート制限、サーバー側の利用回数管理が必要です。

## OpenAIとVercelの運用

1. OpenAI管理画面でプロジェクト予算、月次利用上限、利用量アラートを設定します。
2. Vercel Productionに`OPENAI_API_KEY`、必要なら`OPENAI_PLAN_MODEL`、任意で`AI_REQUEST_TIMEOUT_MS`と`AI_MAX_OUTPUT_TOKENS`を設定します。
3. `VITE_OPENAI_API_KEY`はProduction/Previewへ設定しません。
4. 本番で正常生成、429、504、Origin拒否、キー未設定時の安全な表示を確認します。


## 2026-07-14 Public access policy

- AI plans are available to all visitors; no authentication, billing, or premium entitlement is used in production.
- The current public allowance is one successful new generation per local calendar day.
- A cache hit is a read-only restore and does not use an allowance. Failed, 429, invalid-response, and timeout outcomes do not use an allowance.
- Cooldown and duplicate-request protection remain enabled.
- Browser storage and in-memory safeguards are not a complete abuse defense. Persistent, server-side rate limiting is still required for stronger cost protection.
