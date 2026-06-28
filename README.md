# DROPTRIP

「運命の旅行先を決めよう」をテーマにした、スマートフォン向けの旅行先決定アプリです。

出発地・旅行タイプ・こだわり条件を入力すると、条件に合う旅先ほど選ばれやすい重み付き抽選を行います。選ばれた理由や旅行プラン、予算、移動情報もまとめて確認できます。

## 主な機能

- 出発地入力
- 日帰り・1泊2日・2泊3日の旅行タイプ選択
- 温泉・海・山・グルメ・カップル向けの条件フィルター
- 条件との相性を考慮した重み付きランダム抽選
- 条件やタグから算出する「運命度」
- 選択条件との一致理由とおすすめ理由
- 旅行タイプ別の詳細プラン
- Google Maps Routes APIによる車・公共交通機関の移動情報
- 移動時間と旅行タイプから算出する「行けそう度」
- 旅行タイプ別の予算表示
- お気に入り登録
- 行った場所の管理と抽選除外
- お気に入り旅先の比較
- 最大20件の抽選履歴
- 前回入力した条件の保存・復元
- Google Maps APIキーの設定カード
- OpenAI APIによるAI旅行プラン生成（プレミアム機能の試験実装）
- 抽選結果や保存状態を確認できる開発者向けデバッグパネル

お気に入り、訪問済みの場所、抽選履歴、入力条件などはブラウザの `localStorage` に保存されます。ログイン機能は不要です。

## 使用技術

- React
- Vite
- JavaScript
- localStorage
- Google Maps Routes API

## 起動方法

### 1. 必要なもの

- Node.js
- npm

### 2. パッケージをインストール

プロジェクトのフォルダで次のコマンドを実行します。

```bash
npm install
```

### 3. 開発サーバーを起動

```bash
npm run dev
```

ターミナルに表示されたURLをブラウザで開いてください。通常は `http://localhost:5173` です。

## Google Maps APIの設定

移動時間と距離を取得するには、Google CloudでRoutes APIと課金を有効にし、APIキーを用意してください。

公開版では、フロントエンドから `/api/route-time` を呼び、Vercel Serverless FunctionからGoogle Routes APIへ接続します。Vercelなどの公開環境には、次のサーバー環境変数を設定してください。

```env
GOOGLE_MAPS_API_KEY=サーバー側だけに保存するAPIキー
```

Vite開発サーバーだけを起動し、`/api/route-time` が利用できない場合のローカルフォールバックは、プロジェクト直下の `.env` に次のように設定します。

```env
VITE_GOOGLE_MAPS_API_KEY=ここにAPIキー
```

設定後は開発サーバーを再起動してください。

ローカル開発用APIキーは開発者ページから保存することもできます。`.env` と設定カードの両方にキーがある場合は、`.env` のキーが優先されます。

APIキーを設定しなくても、抽選・プラン・お気に入りなどの機能は利用できます。移動情報カードには設定案内が表示されます。

> `VITE_GOOGLE_MAPS_API_KEY` と開発者ページのキー保存はlocalhostでの動作確認専用です。公開ビルドではローカル直呼びへフォールバックしません。公開版は `GOOGLE_MAPS_API_KEY` をサーバー環境変数として管理し、車の距離・時間取得を `/api/route-time` 経由で行います。Google Maps確認リンクはAPIキーを使わない外部リンクとして維持しています。

### Vercelで車の移動情報を取得できない場合

- Project Settings → Environment Variables に `GOOGLE_MAPS_API_KEY` があるか確認します。
- Production と Preview の両方へ適用されているか確認します。
- 環境変数を追加・変更した後は、既存デプロイには反映されないため必ずRedeployします。
- `api/route-time.js` が `process.env.GOOGLE_MAPS_API_KEY` を参照していることを確認します。
- Google CloudでRoutes APIが有効か、APIキーのAPI制限にRoutes APIが含まれるか確認します。

一般画面では環境設定の詳細を表示しません。タイトルを5回押して開く開発者ページの「Google Routes API診断」で、キーの有無、HTTPステータス、エラー概要を確認できます。APIキー本体は表示されません。

## OpenAI APIと公開時のキー管理

AIプラン生成は、フロントエンドから `/api/generate-plan` を呼び、Vercel Serverless FunctionからOpenAI Responses APIへ接続します。公開版ではフロントエンドからOpenAI APIを直接呼びません。

Vercelなどの公開環境には、次のサーバー環境変数を設定してください。

```env
OPENAI_API_KEY=サーバー側だけに保存するAPIキー
OPENAI_PLAN_MODEL=gpt-4.1-mini
```

開発中は開発者ページからローカル検証用OpenAI APIキーを設定できます。メイン画面のタイトル「DROPTRIP」を5回連続でクリックすると、開発者ページが開きます。

Vite開発サーバーだけを起動し、`/api/generate-plan` が利用できない場合のローカルフォールバックは次の設定を使います。

```env
VITE_OPENAI_API_KEY=ここにAPIキー
VITE_OPENAI_PLAN_MODEL=gpt-4.1-mini
```

> `VITE_OPENAI_API_KEY` と開発者ページのキー保存はlocalhostでの動作確認専用です。公開ビルドではローカル直呼びへフォールバックしません。公開版では `OPENAI_API_KEY` をサーバー環境変数として管理し、必ず `/api/generate-plan` 経由で生成します。

## 環境変数

`.env.example` をコピーして `.env` を作り、ローカル開発に必要な値だけを設定します。

```env
VITE_GOOGLE_MAPS_API_KEY=
VITE_OPENAI_API_KEY=
VITE_OPENAI_PLAN_MODEL=gpt-4.1-mini
GOOGLE_MAPS_API_KEY=
OPENAI_API_KEY=
OPENAI_PLAN_MODEL=gpt-4.1-mini
```

| 変数名 | 用途 | 公開時の扱い |
| --- | --- | --- |
| `VITE_GOOGLE_MAPS_API_KEY` | localhostでGoogle Routes APIを直接検証 | 公開版では使用しない |
| `VITE_OPENAI_API_KEY` | ローカル検証版でAI旅行プランを生成 | 公開版では使用せず、サーバー側の秘密環境変数へ移行 |
| `VITE_OPENAI_PLAN_MODEL` | ローカル直呼びで使うモデル名 | 公開版では使用しない |
| `GOOGLE_MAPS_API_KEY` | Serverless FunctionからGoogle Routes APIへ接続 | サーバー環境変数として設定し、Routes API制限・利用上限を設定 |
| `OPENAI_API_KEY` | Serverless FunctionからOpenAI APIへ接続 | Vercelなどのサーバー環境変数として設定し、ブラウザへ公開しない |
| `OPENAI_PLAN_MODEL` | サーバー経由のAIプラン生成モデル | Serverless Functionだけが参照する |

`.env` はGit管理対象外です。`.env.example` には変数名と安全な初期値だけを記載し、実際のAPIキーは絶対に追加しないでください。

## 公開時の注意事項

- 現在の実装は、ローカル開発・機能検証を目的としています。
- OpenAI APIキーをブラウザのlocalStorage、JavaScript、`VITE_`環境変数へ保存した状態で一般公開しないでください。
- OpenAI API通信は `/api/generate-plan` 経由です。一般公開前に、このサーバーAPIへ認証・利用回数制限・料金保護を追加してください。
- Google Routes API通信は `/api/route-time` 経由です。`GOOGLE_MAPS_API_KEY` はサーバーだけで管理し、Routes API制限・利用量制限を設定してください。
- プレミアム機能、ユーザー認証、決済、サーバー側の利用回数管理は今後実装予定です。現在のプレミアム切り替えは開発テスト専用です。
- 公開前に `.env` がGit管理対象外で、`.env.example` のみに安全な設定例が含まれていることを確認してください。
- `/api/generate-plan` と `/api/route-time` はPOST制限・入力検証を実装していますが、本番用の認証や永続的なレート制限は未実装です。一般公開時は、認証・レート制限・利用回数管理を必ず追加してください。

## 旅行先画像の利用方針

- 旅行先の魅力を伝えるため、主要旅行先から現地写真を増やします。
- 画像は `hero` / `scenery` / `food` の3種類を基本にし、`food` はできるだけご当地グルメ写真を優先します。
- 画像は権利確認済みのものだけを使い、無断転載しません。出典・クレジット・ライセンス・確認状態を画像データと一緒に管理します。
- 権利不明画像や外部サイトからの直リンクは原則使いません。
- 自治体や観光協会が提供する写真は、各サイトの利用規約と利用可能な目的を確認してから登録します。
- Google Places Photo APIや外部画像APIを利用する場合は、サービスが指定するattribution（帰属情報）や撮影者クレジットを画像の近くに表示します。
- 公開版では、画像ごとの `source`・`credit`・`license`・`status` を確認し、権利・出典が不明な画像を公開しません。
- 公開版では画像APIキーをブラウザへ埋め込まず、利用者から参照できないサーバー側で管理します。
- 現在の共通画像は、DROPTRIP用に生成した実写真風素材をアプリ内に保存して使用しています。外部サイトからの無断直リンクは行いません。
- 個別画像が未設定または読み込めない場合は、タグ別の実写真風素材へ切り替え、タグ別画像もない場合のみ汎用旅行写真を表示します。
- 画像ソースは `curated`・`official_pending`・`fallback`・`placeholder` に分け、公式写真へ差し替える場合も利用条件の確認が完了するまで `official_pending` として扱います。

表示画像は外部URLよりローカル画像を優先し、次の順番で解決します。

1. `public/images/destinations/` の旅行先個別画像
2. `public/images/categories/` の温泉・海・山・グルメなどのカテゴリ画像
3. `public/images/common/` の汎用旅行画像

画面側は `getDestinationImage(destination, imageType)` に画像解決を統一しています。文字列形式と画像メタデータ形式の両方を受け付け、不正値や読み込み失敗時もカテゴリ画像、共通画像の順に切り替えます。

カテゴリ画像は各カテゴリ2パターンを持ち、旅行先IDまたは市町村名から作る固定ハッシュで分散します。同じ旅行先では毎回同じ画像になり、抽選のたびに写真が変わることはありません。主要30件の個別ヒーロー画像は差し替え用のローカルパスを用意していますが、現在の仮素材は `status: temporary` として管理し、公開用の正式画像と区別します。

現地写真・ご当地グルメ画像の追加候補は [IMAGE_TODO.md](./IMAGE_TODO.md) で管理します。画像を追加するときは、旅行先ごとに `hero` / `scenery` / `food` の不足状況、推奨テーマ、グルメ候補、権利確認状況を更新してください。

## その他のコマンド

```bash
# コードを検査
npm run lint

# 公開用ファイルを作成
npm run build

# 公開用ビルドをローカルで確認
npm run preview
```

## 公開前テスト

公開前の手動確認には、[TESTING.md](./TESTING.md) のチェックリストを利用してください。基本操作、抽選結果、交通手段比較、保存機能、AI・プレミアム、開発者ページ、スマホ表示を順番に確認できます。

## デプロイ準備

Vercel、Netlify、Cloudflare Pagesなどで公開する前の手順とAPIキー保護については、[DEPLOYMENT.md](./DEPLOYMENT.md) を確認してください。Vercelで自分だけが確認する限定公開テストも、同ファイルの「Vercel限定公開テスト手順」に沿って設定してください。現在のβ版をアクセス保護なしで一般公開しないでください。

## 主なファイル

```text
src/
├─ data/
│  ├─ destinations.js      # アプリで使用する旅行先データ
│  └─ destinations.json    # 旅行先の元データ
├─ services/
│  ├─ travelTime.js        # Google Maps Routes APIとの連携
│  ├─ openAiPlan.js        # OpenAI APIとの連携
│  ├─ aiPlanPrompt.js      # AI旅行プラン用プロンプト生成
│  └─ premium.js           # プレミアム状態の判定
├─ App.jsx                 # 画面とアプリの主要ロジック
└─ App.css                 # 画面デザイン
```

## 今後の予定

- 旅行先データを100件以上へ拡張
- AIによる旅行プラン生成
- 地図を使った演出
- さらなるスマートフォン最適化
- 公開に向けた設定とテスト

## 変更履歴

β版の変更履歴は [CHANGELOG.md](./CHANGELOG.md) を確認してください。リリース前に機能追加や大きな修正を行った場合は、必要に応じて CHANGELOG.md も更新します。
