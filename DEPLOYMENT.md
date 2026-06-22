# DROPTRIP デプロイ準備ガイド

DROPTRIPをVercel、Netlify、Cloudflare Pagesなどで公開する前に確認する内容をまとめています。

## 現在の状態

- ローカル開発向けのβ版です。
- Vite / React / JavaScriptで構成されています。
- Google Maps Routes APIを利用して移動情報を取得できます。
- OpenAI APIを使ったAI旅行プラン生成機能の準備があります。
- AIプラン生成はプレミアム機能として扱っています。
- APIキーをブラウザへ保存できる現在の設定画面は、ローカル開発・動作検証用です。
- 一般公開版では、APIキーを利用者から参照できない構成へ変更する必要があります。

## 公開前に必要な対応

### 1. OpenAI API通信をサーバー経由で運用する

OpenAI APIキーを `VITE_OPENAI_API_KEY` やlocalStorageへ保存した状態で一般公開しないでください。`VITE_` から始まる環境変数は、ビルド後のブラウザから参照できます。

DROPTRIPにはVercel Serverless Functionの `api/generate-plan.js` があり、フロントエンドは `/api/generate-plan` を呼び出します。Vercelのプロジェクト設定には次のサーバー環境変数を登録してください。

```env
OPENAI_API_KEY=サーバー側だけに保存するAPIキー
OPENAI_PLAN_MODEL=gpt-4.1-mini
```

公開版では `VITE_OPENAI_API_KEY` を設定しません。フロントエンドからOpenAI APIを直接呼ばず、必ずServerless Functionを経由します。サーバー側では、次の対策も必要です。

- ユーザー認証
- 利用回数制限
- リクエスト内容の検証
- API利用料の監視と上限設定
- エラーログの管理

### 2. Google Maps APIキーを制限する

DROPTRIPにはVercel Serverless Functionの `api/route-time.js` があり、車の距離・時間取得は `/api/route-time` 経由で行います。Vercelのプロジェクト設定には次のサーバー環境変数を登録してください。

```env
GOOGLE_MAPS_API_KEY=サーバー側だけに保存するAPIキー
```

公開版では `VITE_GOOGLE_MAPS_API_KEY` を設定せず、フロントエンドからGoogle Routes APIを直接呼びません。Google Maps確認リンクはAPIキー不要の外部リンクとして、そのまま利用できます。Google Cloud Consoleでは次の制限を設定してください。

- 使用するAPIだけを許可するAPI制限
- 1日あたりの利用上限と請求アラート
- 開発用キーと公開用キーの分離

加えて、`/api/route-time` 自体にも本番認証、入力検証、レート制限を追加してください。ブラウザ直呼び用キーを残す場合だけ、HTTPリファラーでlocalhostや許可ドメインを制限します。

### 3. 環境ファイルを公開しない

- `.env` と `.env.*` はGitへ追加しません。
- `.env.example` のみGitで共有します。
- `.env.example` には実際のAPIキーを書きません。
- デプロイサービスの環境変数設定にも、公開版で安全に使える値だけを登録します。

### 4. 画像の利用条件を確認する

- 画像の出典、クレジット、ライセンスを確認します。
- 自治体・観光協会の画像は、利用規約と利用目的を確認します。
- Google Places Photo APIを利用する場合は、必要なattributionを表示します。
- 確認できていない画像は、公開前にアプリ内の安全なフォールバック画像へ切り替えます。

### 5. プレミアム機能を本番仕様へ移行する

現在のプレミアム状態は開発者ページから切り替えるテスト実装です。公開版では、ログイン中のユーザー情報とサーバー側の契約状態を使って判定してください。

決済を実装する場合はStripeなどを候補にし、決済完了をブラウザの状態だけで判断せず、Webhookを使ってサーバー側で契約状態を更新します。

### 6. APIルートの不正利用対策を追加する

現在の `/api/generate-plan` と `/api/route-time` には、POSTメソッド制限、入力バリデーション、タイムアウト、出力上限などの基本保護があります。ただし、本格的な認証・DB・Redisを使ったレート制限は未実装です。

一般公開時は、次の対策を必ず追加してください。

- ログインまたは署名済みセッションによる認証
- IP・ユーザー・契約単位のレート制限
- 日次・月次の利用回数制限
- プレミアム判定のサーバー側実装
- リクエストサイズと異常パターンの監視
- APIルートの不正利用を検知・停止する仕組み
- Google CloudとOpenAI側の利用上限・請求アラート

フロントエンドのlocalStorageにある利用回数やプレミアム状態は改変できるため、本番の課金・利用可否判定には使用しないでください。

## デプロイ候補

### Vercel

Viteとの相性がよく、プレビューURLやサーバーレス関数を利用できます。最初の限定公開テスト先として推奨します。

### Netlify

静的サイトの公開、プレビュー、Netlify Functionsを利用できます。

### Cloudflare Pages

静的サイトを高速に配信でき、Cloudflare Workersと組み合わせてサーバー側処理を追加できます。

## 推奨方針

まずはVercelで、関係者だけが確認する限定公開テストを行います。

ただし、OpenAI APIキーをブラウザ側へ置いたまま一般公開してはいけません。Vercelには `OPENAI_API_KEY` を設定し、`VITE_OPENAI_API_KEY` は設定しないでください。`/api/generate-plan` に本番認証とサーバー側利用制限を追加する前のテスト公開では、アクセスできる利用者を制限してください。

## Vercel限定公開テスト手順

### 1. GitHubリポジトリを接続する

1. DROPTRIPをGitHubの非公開リポジトリへ保存します。
2. Vercelへログインし、`Add New...` → `Project` を選びます。
3. GitHub連携からDROPTRIPのリポジトリをImportします。
4. Root Directoryは、通常はリポジトリ直下のままにします。

リポジトリが非公開でも、発行されたデプロイURL自体が自動的に自分専用になるとは限りません。次のアクセス保護も設定してください。

### 2. ビルド設定を確認する

Vercelのプロジェクト設定を次の内容にします。リポジトリ内の `vercel.json` にも同じ設定を記載しています。

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`（通常は自動設定のままで構いません）

`api/generate-plan.js` と `api/route-time.js` は、リポジトリ直下の `api` ディレクトリにあるためVercel Functionsとして配置されます。

### 3. サーバー環境変数を設定する

VercelのProject Settings → Environment Variablesで次の3項目を設定します。

```env
GOOGLE_MAPS_API_KEY=
OPENAI_API_KEY=
OPENAI_PLAN_MODEL=gpt-4.1-mini
```

限定公開テスト先に合わせて、まずPreview環境へ設定します。Productionへ昇格するときは、Production環境にも別途設定内容を確認してください。値を変更した場合は再デプロイが必要です。

Vercelへ設定する値とローカル用の値は役割が異なります。

| 環境 | 変数 | 用途 |
| --- | --- | --- |
| Vercel公開・Preview | `GOOGLE_MAPS_API_KEY` | `/api/route-time` がサーバー側で利用 |
| Vercel公開・Preview | `OPENAI_API_KEY` | `/api/generate-plan` がサーバー側で利用 |
| Vercel公開・Preview | `OPENAI_PLAN_MODEL` | サーバー側のAIモデル指定 |
| localhostのみ | `VITE_GOOGLE_MAPS_API_KEY` | Vercel Functionがない場合の開発用直接通信 |
| localhostのみ | `VITE_OPENAI_API_KEY` | Vercel Functionがない場合の開発用直接通信 |
| localhostのみ | `VITE_OPENAI_PLAN_MODEL` | ローカル直接通信のモデル指定 |

公開・Preview環境には `VITE_GOOGLE_MAPS_API_KEY` と `VITE_OPENAI_API_KEY` を設定しないでください。`VITE_` の値はブラウザへ組み込まれます。

### 4. 自分だけが開けるようにする

VercelのProject SettingsにあるDeployment Protectionを確認し、利用中のプランで使用できる場合はPreview DeploymentにVercel Authenticationを有効化します。Vercelチームのメンバーを自分だけにしておくと、ログインした自分だけが確認しやすくなります。

Password Protectionなど別の保護方法を使う場合は、利用中のVercelプランで提供されているかを管理画面で確認してください。保護機能が利用できない状態で、URLを共有しないだけの運用は完全なアクセス制限ではありません。その場合はAPI機能を無効化するか、サーバーAPI側へ認証を追加してからテストしてください。

### 5. Preview Deploymentを作成する

1. テスト用ブランチをGitHubへpushします。
2. Vercelが作成したPreview Deploymentのビルドログを確認します。
3. Functions一覧に `generate-plan` と `route-time` が表示されることを確認します。
4. 保護されたPreview URLを、自分のスマートフォンとPCで開きます。

## 限定公開テストで確認すること

- [ ] トップ画面が表示される
- [ ] 出発地・旅行タイプ・季節・こだわり条件を設定して旅先を抽選できる
- [ ] 車の距離・時間が `/api/route-time` 経由で取得できる
- [ ] 車の料金目安が表示される
- [ ] 電車のGoogle Maps確認リンクが新しいタブで動作する
- [ ] 飛行機の概算時間・料金が表示される
- [ ] 無料状態ではAI API通信が実行されない
- [ ] 開発者ページでプレミアムONにした場合だけAIプラン生成を試せる
- [ ] AIプランが `/api/generate-plan` 経由で生成される
- [ ] APIキー全文が画面・ブラウザのビルド・ログに表示されていない
- [ ] 375px〜430px幅でスマホ表示が崩れない
- [ ] お気に入り・抽選履歴・比較機能が動作する
- [ ] Preview URLに未ログイン状態でアクセスしたとき、保護画面が表示される

限定公開テストでもAPIルートの利用量と請求アラートを確認してください。現在のプレミアム判定は開発用であり、本番の課金判定には使用できません。

## 基本的なビルド確認

依存パッケージをインストールし、検査と公開用ビルドを実行します。

```bash
npm install
npm run lint
npm run build
```

Viteの公開用出力先は `dist` です。通常、各デプロイサービスでは次のように設定します。

- Build command: `npm run build`
- Output directory: `dist`

## 公開チェックリスト

- [ ] `npm run lint` が成功する
- [ ] `npm run build` が成功する
- [ ] [TESTING.md](./TESTING.md) の主要項目を確認した
- [ ] APIキー全文が画面、コード、README、ログに表示されていない
- [ ] `.env` がGit管理対象外になっている
- [ ] `.env.example` に実際のAPIキーが含まれていない
- [ ] Google Maps APIキーをRoutes APIに制限し、利用上限を設定した
- [ ] Vercelに `GOOGLE_MAPS_API_KEY` をサーバー環境変数として設定した
- [ ] 公開環境に `VITE_GOOGLE_MAPS_API_KEY` を設定していない
- [ ] 車の距離・時間取得が `/api/route-time` 経由で動作する
- [ ] OpenAI API通信をサーバー経由にした、または公開版でAI機能を無効化した
- [ ] Vercelに `OPENAI_API_KEY` と `OPENAI_PLAN_MODEL` をサーバー環境変数として設定した
- [ ] 公開環境に `VITE_OPENAI_API_KEY` を設定していない
- [ ] AIプラン生成が `/api/generate-plan` 経由で動作する
- [ ] 375px〜430px幅でスマホ表示を確認した
- [ ] 旅行先画像とフォールバック画像が表示される
- [ ] 画像ライセンスとクレジットを確認した
- [ ] お気に入り・抽選履歴・比較機能が動作する
- [ ] AIプラン生成はプレミアム状態でのみ動作する
- [ ] プレミアム状態をブラウザだけで変更できない本番仕様へ移行した
- [ ] APIルートに認証を追加した
- [ ] IP・ユーザー単位のレート制限を追加した
- [ ] 利用回数制限をサーバー側で管理している
- [ ] プレミアム判定をサーバー側へ移行した
- [ ] APIルートの不正利用を監視・停止できる

## 公開後の確認

- Google Maps APIとOpenAI APIの利用量・料金を監視する
- ブラウザとサーバーのエラーログを確認する
- スマートフォン実機で主要操作を再確認する
- APIキーや依存パッケージを定期的に見直す
- 問題が起きた場合にAI機能を停止できるようにする
