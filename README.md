# DROPTRIP

「運命の旅行先を決めよう」をテーマにした、スマートフォン向けの旅行先決定アプリです。

出発地・同行者/旅のスタイル・旅の目的・旅行日程を入力すると、条件に合う旅先ほど選ばれやすい重み付き抽選を行います。選ばれた理由、グルメ、スポット、Google Mapsでのアクセス確認をまとめて確認できます。

## 主な機能

- 出発地入力
- 日帰り・1泊2日・自分で入力できる旅行日程選択
- 温泉・海・山・グルメ・カップル向けの条件フィルター
- 条件との相性を考慮した重み付きランダム抽選
- 条件やタグから算出する「適合度」
- 選択条件との一致理由とおすすめ理由
- AI旅行プラン生成
- Google Maps直リンクによるアクセス確認
- 結果画面の概要 + グルメ / スポットの大きな2ボタンとアクセス確認
- 旅行先一覧のキーワード検索（旅先名・都道府県・グルメ・スポット）
- 各ページで使える上部へ戻るボタン
- お気に入り登録
- お気に入り旅先の比較
- 最大20件の抽選履歴
- 前回入力した条件の保存・復元
- Google Maps APIキーの設定カード
- OpenAI APIによるAI旅行プラン生成（プレミアム機能の試験実装）
- 抽選結果や保存状態を確認できる開発者向けデバッグパネル

お気に入り、抽選履歴、入力条件などはブラウザの `localStorage` に保存されます。ログイン機能は不要です。

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

現在の一般結果画面では、移動時間・料金・交通手段比較をアプリ内で自動取得せず、Google Mapsへの直接リンクで確認する方針にしています。`/api/route-time` は既存APIとして残していますが、一般ユーザー画面からは自動呼び出ししません。

```env
GOOGLE_MAPS_API_KEY=サーバー側だけに保存するAPIキー
```

Google Mapsの確認リンクはAPIキーを使わない外部リンクとして維持しています。開発者ページで既存APIの診断を行う場合のみ、プロジェクト直下の `.env` に次のように設定します。

```env
VITE_GOOGLE_MAPS_API_KEY=ここにAPIキー
```

設定後は開発サーバーを再起動してください。

ローカル開発用APIキーは開発者ページから保存することもできます。`.env` と設定カードの両方にキーがある場合は、`.env` のキーが優先されます。

APIキーを設定しなくても、抽選・プラン・お気に入りなどの機能は利用できます。移動情報カードには設定案内が表示されます。

> `VITE_GOOGLE_MAPS_API_KEY` と開発者ページのキー保存はlocalhostでの動作確認専用です。一般結果画面では移動時間取得を行わず、出発地と目的地を渡したGoogle Maps確認リンクだけを表示します。

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
- 公開版では、画像ごとの `source`・`credit`・`license`・`status` を確認し、権利・出典が不明な画像を公開しません。
- 現在の共通画像は、DROPTRIP用に生成した実写真風素材をアプリ内に保存して使用しています。外部サイトからの無断直リンクは行いません。
- 個別画像が未設定または読み込めない場合は、タグ別の実写真風素材へ切り替え、タグ別画像もない場合のみ汎用旅行写真を表示します。
- 画像ソースは `curated`・`official_pending`・`fallback`・`placeholder` に分け、公式写真へ差し替える場合も利用条件の確認が完了するまで `official_pending` として扱います。

表示画像は外部URLよりローカル画像を優先し、次の順番で解決します。

1. `public/images/destinations/` の旅行先個別画像
2. `public/images/categories/` の温泉・海・山・グルメなどのカテゴリ画像
3. `public/images/common/` の汎用旅行画像

画面側は `getDestinationImage(destination, imageType)` に画像解決を統一しています。文字列形式と画像メタデータ形式の両方を受け付け、不正値や読み込み失敗時もカテゴリ画像、共通画像の順に切り替えます。

カテゴリ画像は各カテゴリ3パターンを持ち、旅行先IDまたは市町村名から作る固定ハッシュで分散します。同じ旅行先では毎回同じ画像になり、抽選のたびに写真が変わることはありません。主要30件の個別ヒーロー画像は差し替え用のローカルパスを用意していますが、現在の仮素材は `status: temporary` として管理し、公開用の正式画像と区別します。

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

公開前の手動確認には、[TESTING.md](./TESTING.md) のチェックリストを利用してください。基本操作、抽選結果、Google Mapsアクセス確認、保存機能、AI・プレミアム、開発者ページ、スマホ表示を順番に確認できます。

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

## βテストについて

現在のDROPTRIPは `v0.1.0-beta` です。旅行先抽選、旅行先一覧、お気に入り、比較、抽選履歴、Google Mapsアクセス確認、ご当地グルメ表示、AIプラン生成準備などを少人数で確認する段階です。

v0.1.0-beta の主な機能は次のとおりです。

- 条件入力と旅行先抽選
- 抽選結果画面
- 旅行先一覧
- ご当地グルメ表示
- Google Mapsアクセス確認
- お気に入り
- 比較
- 抽選履歴
- AIプラン生成
- 開発者ページ
- βテストガイド

βテストでは、特に次の点を確認しています。

- 旅先提案が自然に感じられるか
- スマホで見やすく操作しやすいか
- 画像・ご当地グルメ情報に違和感がないか
- アクセス確認からGoogle Mapsへ迷わず進めるか
- お気に入り・比較・履歴の導線が迷わないか

画像、ご当地グルメ、交通情報は改善中です。テスター向けの使い方とフィードバック観点は [BETA_TEST_GUIDE.md](./BETA_TEST_GUIDE.md) を確認してください。

### 条件入力の整理

- 同行者・旅のスタイルでは、カップル・一人旅・友達・ファミリー・ペットありを複数選択できます。
- 「旅の目的」は、グルメ・神社/歴史・温泉・自然/絶景・アクティビティ・体験・街歩き・ゆっくりなど、旅先で楽しみたい内容に限定しました。
- 「旅行タイプ」は「旅行日程」に変更し、日帰り・1泊2日・自分で入力に対応しています。自分で入力では最大7泊8日までを想定し、日数は何泊+1日に補正します。
- 2泊3日以上では、メイン旅先に加えて近隣・同地域の候補を簡易提案する場合があります。追加候補の詳しい移動はGoogle Maps等で確認します。

### 旅行先データ品質メタ情報
旅行先データは読み込み時に prefecture から9分類の region を補正し、同行者・旅の目的・旅行日程との相性を companionFit / purposeFit / stayFit として補完します。長めの日程では nearbyDestinationHints と longStayStyle を使い、メイン旅先に関連する周辺候補を簡易提案します。

### 旅行先提案の具体性

- 旅行先データに `touristSpots` と `localFoodDetails` を追加し、結果画面で「ここで行きたいスポット」と説明付きのご当地グルメを表示します。
- 観光スポットは旅の目的に合わせて表示順を変え、グルメ・神社・歴史・温泉・自然・街歩きなどに近い候補を優先します。
- 旅行先候補を120件規模へ増やし、近場・長期旅行・周遊候補の診断に使える地域バランスを広げました。

### AIプラン生成で使う具体情報

- AIプラン生成には、旅行先名・都道府県・region・tags・季節情報に加えて、観光スポット、説明付きご当地グルメ、周辺候補ヒント、同行者/目的/日程との相性を圧縮して渡します。
- localFoodCandidates は最大10件、localFoodDetails は最大5件、touristSpots は最大7件、nearbyDestinationHints と周辺候補は最大5件を目安にし、送信データが大きくなりすぎないようにしています。店名候補はAIへ送らず、料理名と説明文を優先します。
- データが不足している旅行先では、tags / recommendText / localFoodCandidates から表示を補い、一般画面に「情報がありません」とは出さない方針です。

結果画面では、旅行先名、適合度、合いそうな短い理由、グルメ/スポットの大きな2ボタン、Google Mapsのアクセス確認を中心に短く見せます。詳しい旅程はAIプラン生成に任せ、一般結果画面には運命度カード、モデルコース、交通手段比較を出しません。

### グルメ/スポット詳細ページ

- 通常結果画面からは、大きな「グルメ」「スポット」ボタンで別ページ風の詳細表示へ切り替えます。
- グルメページでは、料理名チップ、豆知識・味・背景が分かる説明付きご当地グルメ、料理名ごとの Google Maps 検索ボタンを表示します。
- グルメページではタイミング/相性表示、店名候補の自動生成、料理名と一致しない画像を表示しません。
- スポットページでは、実在スポット名、通り名、温泉街、市場、雨の日施設などを具体名中心で表示します。
- 代表スポットカードは、Google Mapsで検索できる粒度の施設名・地名・通り名・温泉街名だけを表示します。
- 代表スポットカードには、都道府県 + 市区町村 + スポット名でGoogle Mapsを開く検索ボタンを表示します。営業時間・料金・営業状況はアプリ内で断定しません。
- 施設名や観光船、ロープウェイ、美術館、温泉施設などは `needs_review` として扱い、営業時間・料金・営業状況は訪問前確認が必要な情報として表示します。
- スポットページでは、代表スポットとは別に「エリア・通り・温泉街候補」を短くまとめて確認できます。
- データが不足している場合は、都市名 + ランチ、都市名 + 観光スポットのような疑似名称を作らず、短い補足に留めます。
- 通常結果画面は軽く保ち、詳しい日程別提案はAIプラン生成の役割にしています。
- 結果画面の品質チェックでは、抽象表現だけの説明、疑似スポット名、抽象グルメ名、foodImage と料理名の不一致を開発者ページで確認します。
- 画像が不足している旅行先は、外部取得せず `IMAGE_TODO.md` で正式素材の追加候補として管理します。
- 一般結果画面では交通手段比較を表示せず、出発地と目的地を渡した Google Maps 確認へ一本化しています。
- ルート検索へ渡す目的地は、フロント側で最寄り駅・具体クエリ・スポット名を優先し、都道府県 + 市区町村だけの広すぎる指定を避けます。
- 結果画面は短い概要を先に見せ、グルメ / スポットの大きな2ボタンで詳細へ進む構成にしています。
- 適合度は結果画面上部のチップに統一し、詳細なスコア内訳は開発者ページで確認します。
- 回帰チェックでは、DESTINY MATCH、運命度カード、モデルコース、交通手段比較、行けそう度、予算目安、移動時間取得失敗カードが一般結果画面に戻っていないことを確認します。
- 移動は深掘りボタンから分け、別枠のアクセス確認として Google Maps 確認だけを表示します。
- 旅のイメージ画像や「ここで楽しみたいこと」の薄いタグ表示、行けそう度、予算目安のような根拠が弱いカードは一般結果画面から外しています。

### 旅先イメージ画像の固定管理

- 結果画面のhero画像は、旅先ごとの `destination_fixed` 画像がある場合だけ表示します。
- カテゴリ画像、汎用画像、ランダム画像は一般結果画面のheroには使いません。画像がない旅先では画像セクションを出さず、グルメ/スポットの2ボタンを主役にします。
- 旅先イメージ画像は `destination.id` を優先して紐づけ、既存データとの互換性のため city キーも参照します。
- AI生成や手作りビジュアルを使う場合は `isIllustration: true` とし、altには「〇〇をイメージしたビジュアル」と書きます。「現地写真」とは表現しません。
- 画像ファイルは `public/images/destinations/` 配下に、英数字・ハイフンのファイル名で追加します。WebP優先、横幅1200px前後、1枚100KB〜400KB程度を目安にします。

## Local Food Display Policy

- Local food sections prioritize concrete dish and specialty names. Generic labels such as category-only gourmet or cafe text are not shown as detail cards.
- When localFoodDetails is missing, the UI falls back to concrete localFoodCandidates chips only. If no concrete food name exists, the section is hidden without an empty-state message.
- Generic food images are not promoted as concrete local specialty photos; image gaps continue to be tracked in IMAGE_TODO.md.
- Local food names avoid abstract labels such as local cuisine, local ramen, cafe, bakery, market gourmet, and walking snacks. Use concrete dish, ingredient, fish, meat, noodle, or sweet names instead.
- Food images are shown only when the image is local-food-specific, has an allowed review status, and its foodTheme matches the displayed dish name.

## Concrete Tourist Spot Display Policy

- Tourist spot cards prioritize real spot names or specific area names. Generic names such as sightseeing spot or nature spot are filtered from general screens.
- The general result screen no longer shows model-course content; detailed itinerary ideas are handled by AI plan generation.
- When touristSpots are not concrete enough, DROPTRIP avoids showing forced abstract cards or empty-state text.
- Local food candidates are kept concrete, with roughly five dish or specialty names per destination where possible.
- Priority 30 destinations maintain at least five concrete tourist spots; remaining spot-data gaps are tracked in `DATA_TODO.md`.
- Local food candidates now target seven to ten concrete items, and localFoodDetails target five travel-useful items with timing, area hints, and trip-fit context.
- General food pages no longer show generated restaurant hints. Each concrete dish card links to a Google Maps search for the destination and dish name.
- Priority 30 destinations now target at least seven concrete tourist spots; remaining 7-item spot gaps are tracked in `DATA_TODO.md`.

## Pseudo Spot Name Policy

- DROPTRIP does not show generated pseudo spot names such as city + local lunch, seaside area, cafe, or generic sightseeing spot on general result screens.
- Tourist spot cards use concrete spot names or natural real area names only. If concrete touristSpots are missing, the spot section is hidden instead of creating a generic card.
- Naruto City data has been prepared with concrete spots such as Uzu no Michi, Otsuka Museum of Art, Naruto Park, and whirlpool sightseeing boats, plus concrete local foods.

## Natural Local Food Copy Policy

- Local food descriptions avoid repeating generic template phrases and instead mention food character, timing, nearby areas, and trip fit.
- localFoodDetails can include bestTiming, bestAreaHints, and goodFor so result cards and AI plans can suggest when and where the food fits naturally.
- When exact restaurant names are ever added, they should include source, checkedAt, and status metadata and remain unconfirmed unless manually reviewed.
