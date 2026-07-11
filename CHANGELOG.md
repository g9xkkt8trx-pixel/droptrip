# CHANGELOG

DROPTRIP のβ版リリース履歴を管理するためのメモです。

## v0.1.0-beta

- 優先16旅先の第1弾として、下呂市、京都市、小樽市、箱根町、草津町、熱海市、金沢市、鎌倉市、仙台市、福岡市、鳴門市、別府市、甲府市、川越市、佐野市、上田市向けの軽量SVG固定heroビジュアルを追加しました。
- 第2弾として、石垣市、宮古島市、札幌市、函館市、長崎市、広島市、宮島、高山市、尾道市、倉敷市、松江市、湯布院、道後温泉、有馬温泉、城崎温泉、銀山温泉向けの軽量SVG固定heroビジュアルを追加しました。
- 追加済みの簡易SVG heroは、旅行アプリのheroとしては品質不足のため `rejected` とし、一般画面では表示しない運用へ変更しました。
- 低品質な抽象hero画像を一般画面に出さない品質ゲートを追加し、結果画面heroは `status: confirmed` の固定画像だけを表示するようにしました。
- 広島市heroも簡易SVGのため `rejected` とし、一般画面では非表示にしました。次回は原爆ドーム、平和記念公園、川沿い、路面電車、橋、都市観光感を高品質画像で作り直します。
- hero画像に `candidateSrc`、`sourceType`、`reviewNote`、`confirmedAt`、`rejectedReason` を持てるようにし、候補画像を開発者ページで確認してから手動で `confirmed` にする運用基盤を追加しました。
- 開発者ページにhero画像レビュー台帳を追加し、旅先ごとの `src` / `candidateSrc` / `alt` / `theme` / `sourceType` / `reviewNote` / `rejectedReason` と小さな画像プレビューを確認できるようにしました。
- 下呂市の `hero-v2.webp` を高品質AI生成hero画像の第1号として `confirmed` 登録し、一般結果画面で表示対象にしました。旧 `hero.svg` は簡易SVGのため一般画面では使いません。
- 京都市の `hero-v1.webp` を高品質AI生成hero画像として `confirmed` 登録し、一般結果画面で表示対象にしました。旧 `hero.svg` は簡易SVGのため一般画面では使いません。
- 箱根町・小樽市・草津町・金沢市の `hero-v1.webp` を高品質AI生成hero画像として `confirmed` 登録し、旧 `hero.svg` を一般画面で使わないようにしました。
- 鎌倉市・熱海市・仙台市・福岡市の `hero-v1.webp` は画像内に説明文が入っていたため `rejected` とし、一般画面では表示しないようにしました。hero画像は文字なしの高品質画像だけを `confirmed` にします。
- 旅先一覧検索をフィールド別の一致判定に整理し、映え・トレンド名も検索対象に追加しました。検索中は検索結果だけを表示し、表示直前に同一旅先を重複除去することで豊岡市の不正な複数表示を防ぎます。
- 下呂市hero画像のPC・スマホ表示確認後、原因切り分け用の直書きimg・赤文字デバッグ・下呂専用強制返却を削除し、正式な `destinationImages` 経由のconfirmed hero表示に戻しました。画像ファイルはGit管理に入れてVercelへ反映する必要があります。
- スマホでconfirmed heroが潰れないよう、結果画面hero画像のCSSを固定比率の高さ確保に調整しました。
- スマホ実機キャッシュ対策として下呂市heroを `hero-v2.webp` に変更し、confirmed heroは `loading="eager"` / `fetchPriority="high"` で読み込むようにしました。JPG fallbackはローカル環境でWebP変換ツールが使えなかったため未作成です。
- 開発者ページの画像診断に、第1弾・第2弾それぞれのhero登録状況、メタ情報、読み込み失敗を確認できる項目を追加しました。
- 第1弾SVG heroの品質確認を行い、画像内の表示テキストを外してモチーフ中心にし、結果画面では角丸・16:9・遅延読み込みで表示するよう微調整しました。
- 旅先画像方針を `destination.id` に紐づく専用hero画像へ統一し、一般結果画面ではカテゴリ代替・汎用画像・ランダム画像をheroとして表示しない仕様に整理しました。
- `IMAGE_TODO.md` を全120旅先の固定hero画像管理表へ更新し、confirmed 0件、needs_review 10件、rejected 32件、missing 78件、簡易SVGを一般画面に出さない方針、推奨ファイルパス、画像サイズ/形式ルールを追跡できるようにしました。
- グルメページ・スポットページの上部から抽選結果ヘッダーを外し、旅先名と専用見出しを持つ独立した詳細ページ風の表示に整理しました。
- 詳細ページでは条件変更、適合度、アクセス確認、保存/比較、再抽選など結果画面用の情報を出さず、「結果に戻る」導線だけを上部に残す方針にしました。
- スマホ実機確認向けに、グルメ/スポット詳細ページの戻るボタン、カード余白、Google Maps検索ボタンの押しやすさを微調整しました。
- 結果画面に第3の詳細ページ「映え・トレンド」を追加し、写真に残したい場所、雰囲気のある立ち寄り候補、映えグルメを手動データで表示できるようにしました。
- 優先29旅先に `trendHighlights` を追加し、各カードからGoogle Maps検索へ移動できるようにしました。外部SNSや検索からの自動取得は行わず、「最新」「バズ」などの断定表現は避けます。
- 開発者ページに、映え・トレンド情報の整備率、3件未満、mapQuery/note不足、断定表現リスクの診断を追加しました。
- 結果画面、グルメページ、スポットページ、映えページの総合品質チェックを行い、3詳細ページの役割分担、Google Maps導線、スマホ表示、断定表現を再確認しました。
- 詳細ページ内の重複見出し、カードごとの長い注意文、多すぎるタグ表示を整理し、注意文はページ下部にまとめる方針にしました。
- βテスト前の総合チェックとして、結果画面、3詳細ページ、旅先一覧検索、上部へ戻るボタン、Google Maps導線、固定hero画像方針を再確認しました。
- 結果画面下部にβテスター向けフィードバック導線を追加し、感想をコピーまたは端末内保存できるようにしました。外部送信や個人情報入力は行いません。
- βテストガイドを追加
- テスター向け確認フローを整理
- フィードバック項目と不具合報告テンプレートを追加
- アプリ内のβ版案内を調整
- READMEにβ版情報とBETA_TEST_GUIDEへの案内を追記
- 旅行先抽選
- 旅行先一覧
- お気に入り
- 比較機能
- 抽選履歴
- 移動範囲条件
- Google Mapsアクセス確認
- AIプラン生成準備
- Vercel公開対応
- APIサーバー経由化
- 画像管理改善
- βテストメモ機能

## Unreleased

- 結果画面、グルメ/スポットページ、旅先一覧検索、Google Mapsリンク、固定hero画像方針、上部へ戻るボタンの全体回帰チェックを行いました。
- 開発者ページ診断に、一般結果画面の適合度表示、不要カード非表示、旅先一覧検索対象、上部へ戻るボタン、グルメ/スポットのGoogle Maps検索リンク状態を確認する行を追加しました。
- 結果画面の適合度表示を上部チップ1か所へ統一し、一般画面から大きな運命度カードとスコア内訳チップを削除しました。
- 旅行先一覧に、旅先名・都道府県・region・タグ・ご当地グルメ・観光スポット・周辺候補を対象にした検索欄を追加しました。
- アプリ内の長いページで使える、右下固定の「ページ上部へ戻る」ボタンを追加しました。
- スポットページの各代表スポットカードに、旅先名とスポット名で検索する「Google Mapsで探す」ボタンを追加しました。Google Maps APIは使わず、通常の検索URLだけを開きます。
- 結果画面のhero画像は `destination_fixed` の旅先固定画像がある場合だけ表示する方針に変更し、カテゴリ画像・汎用画像・ランダム画像をhero代替として出さないようにしました。
- 旅先イメージ画像は現地写真と誤認させないため、`isIllustration` とalt文言で「旅先をイメージしたビジュアル」として管理します。画像不足は `IMAGE_TODO.md` で旅先ごとに追跡します。
- 開発者ページの画像診断に、固定hero画像の有無、missing、needs_review、alt不足、カテゴリ/汎用hero残存の確認項目を追加しました。
- グルメ/スポット詳細ページ向けに旅行先データの粒度を大幅に強化しました。
- localFoodCandidates を7〜10件、localFoodDetails を5件程度まで扱えるようにし、全120件で新しい最低ラインを満たすよう補完しました。
- restaurantHints の自動生成表示をやめ、グルメページは料理名ごとの Google Maps 検索リンクに移行しました。
- 優先30件は、7件以上のグルメ候補、5件以上のグルメ詳細、7件以上の具体スポット、3件以上の店名・エリア候補を満たすように補強しました。
- AIプラン生成へ、localFoodCandidates最大10件、localFoodDetails最大5件、touristSpots最大7件、周辺候補最大5件を渡すようにしました。restaurantHintsは送らず、`/api` は変更していません。
- DATA_TODO.md / IMAGE_TODO.md / 開発者ページ診断を、料理名検索リンクと具体名確認の運用に合わせて更新しました。
- グルメデータから郷土料理、地元ラーメン、刺身、海鮮、カフェ、ベーカリー、食べ歩きなどの抽象名を除外し、具体料理名・食材名・地域名物名を優先するようにしました。
- localFoodDetails の説明文を短くし、料理そのものと食べる場面が分かる文へ調整しました。
- グルメ写真は、料理名と一致する `isLocalFood` 画像だけを表示し、汎用・fallback・temporary・抽象foodTheme画像は非表示にしました。
- スポット名も抽象カテゴリではなく、実在スポット名・地名・通り名・温泉街名を優先するようにしました。
- スポットページに代表スポットとエリア/通り/温泉街候補を分けて表示し、抽象名や疑似カードは一般画面に出さないようにしました。
- touristSpots の施設候補に `sourceStatus: "needs_review"`、`checkedAt: null`、訪問前確認メモを付ける運用へ統一しました。
- AIプラン生成のプロンプトでも、抽象スポット名ではなく具体スポット名を使い、施設の営業時間・料金・写真有無を断定しない方針を追加しました。
- グルメ/スポット詳細ページの最終監査を行い、抽象グルメ名・抽象スポット名・疑似スポット名が一般表示用データに残っていないことを確認しました。
- 施設候補は `needs_review` と訪問前確認メモを維持し、料理や旅先と一致しない画像は大きく表示しない方針を再確認しました。
- グルメページを、タイミング/相性/店名候補ではなく、料理名、種類、豆知識・味の説明、Google Maps検索ボタン中心の構成に変更しました。
- 自動生成の restaurantHints を一般画面とAI送信から外し、料理名と旅先名で Google Maps 検索へ誘導する方針にしました。
- グルメ画像は原則非表示とし、料理名と完全に一致する権利確認済み画像がない限り画像枠を出さない方針にしました。
- 条件入力UIを「同行者・旅のスタイル」「旅の目的」「旅行日程」に整理。
- 旅行日程に「自分で入力」を追加し、最大7泊8日までの泊数入力に対応。
- 長めの日程では、メイン旅先と近隣候補を組み合わせる簡易提案を追加。
- 抽選スコア、結果表示、履歴保存、開発者診断に新しい条件を反映。

## 旅行先データ品質改善（同行者・目的・日程・周遊）
- 旅行先データに region / companionFit / purposeFit / stayFit / nearbyDestinationHints / longStayStyle / travelBaseScoreNote を自動補完する層を追加しました。
- 優先30件を中心に、長期旅行時の関連候補提案へ使う周遊ヒントを整備しました。
- 抽選ロジックが同行者・旅の目的・旅行日程の相性スコアを加点として参照するようにしました。
- 開発者ページでメタデータ整備状況と優先30件の整備率を確認できるようにしました。

## 開発者ページに条件別抽選テストを追加
- 開発者ページに、近場・長期旅行・同行者・旅の目的の組み合わせを検査する条件別抽選テストを追加しました。
- 各ケースはAPIを呼ばずに20回の仮抽選を行い、出現回数、region分布、目的/同行者一致、追加候補有無、自動警告を表示します。
- 一般画面から旧来の旅行経験ベースの抽選除外設定を削除しました。古い保存データは抽選条件として使いません。
- 既存ローカル画像のカテゴリ割り当てを広げ、旅行先のregion・purposeFit・localFoodCandidatesを画像選定に反映しました。
- 開発者ページの画像診断にタグ不一致と優先30件の個別画像整備状況を追加しました。

## 共有前の見え方とスマホ体験を調整
- `index.html` の title / description / OGP / Twitter Card / theme-color をDROPTRIP向けに整理しました。
- 画像表示に非同期デコードを追加し、重要な結果hero以外は遅延読み込みの方針を維持しました。
- READMEの画像方針を、現在のローカル画像運用に合わせて整理しました。
- 共有前チェックリストをTESTING.mdとBETA_TEST_GUIDE.mdに追記しました。
## 2026-07-01

- 旅行先データに観光スポット `touristSpots` と説明付きご当地グルメ `localFoodDetails` を追加しました。
- 結果画面に「ここで行きたいスポット」と具体的な過ごし方イメージを追加し、旅の目的に合わせてスポット表示順を調整しました。
- 旅行先候補を120件規模へ拡充し、開発者ページでスポット・グルメ詳細・地域別件数を診断できるようにしました。
- 外部画像取得やAPI関連の変更は行わず、画像不足は `IMAGE_TODO.md` に整理しました。
## 2026-07-01

- AIプラン生成へ touristSpots / localFoodDetails / nearbyDestinationHints / companionFit / purposeFit / stayFit を圧縮して渡すようにしました。
- AIプロンプトを、観光スポット名・ご当地グルメ名・日程別の過ごし方が入る構成へ更新しました。
- 結果画面の過ごし方と長期旅行の周辺候補表示を、スポット名・グルメ名・目的とのつながりが分かる文言に改善しました。
- 開発者ページにAI送信件数と、スポット/グルメ/長期候補の表示診断を追加しました。
## 2026-07-01

- 通常結果画面の説明文を、観光スポット名・ご当地グルメ名・日程別の過ごし方が入る表現へ微修正しました。
- 長期旅行の周辺候補表示で、候補名と旅の目的とのつながりが見えるようにしました。
- 開発者ページに、抽象表現だけになりやすい旅行先と説明強化優先リストを追加しました。
- 福岡市のご当地グルメ候補を、豚骨ラーメン・明太子・屋台グルメが伝わる内容へ調整しました。

## Unreleased

- Replaced the small deep-dive tab UI with three larger result-screen buttons for gourmet, spots, and model course.
- Moved access confirmation out of the deep-dive buttons into its own result-screen section with Google Maps confirmation.
- Stopped automatic route-time fetching on general result flows and removed transport comparison from the general result screen.
- Unified public access guidance around a direct Google Maps route link built from origin and destination query text.
- Expanded concrete local food candidates to at least five items across destination data and raised generated localFoodDetails to up to five items.
- Added tourist spot enhancements so the priority 30 destinations have at least five concrete spots, while remaining spot gaps are tracked in DATA_TODO.md.
- Added developer diagnostics for 5-food / 3-detail / 5-spot readiness, priority-30 readiness, and region-level readiness.
- Removed the general result-screen enjoyment-chip and trip-inspiration image sections to keep the first result view lighter.
- Improved route destination query construction so route-time receives routeSearchName / routeDestinationName / nearestStation based search text instead of display-only station labels.
- Reorganized the result screen into a short overview, three content deep-dive views, and a separate access confirmation section.
- Removed the general result-screen feasibility, budget estimate, and thin recommendation-point cards from the main display.
- Kept transport comparison in the access view and model-course / AI planning in the course view so weak route data does not dominate the first result impression.
- Suppressed abstract local-food labels and now show detail cards only for concrete dish or specialty names.
- Removed template-generated local-food detail copy and replaced generated descriptions with food-oriented text.
- Added developer diagnostics for abstract food names, template food descriptions, generic food-image risk, and destinations lacking concrete food names.

## Unreleased

## Unreleased

- Concrete tourist spot display: filtered generic spot names and template-like spot descriptions from the result screen.
- Updated the simple stay plan copy so day trips, one-night trips, two-night trips, and longer stays include concrete spot and local food names.
- Added developer diagnostics for abstract tourist spot names, template descriptions, purpose-fit spot shortages, and missing concrete names in simple plans.

## Unreleased

- Pseudo spot names are filtered from tourist spot cards and simple plans, including city + local lunch, seaside area, cafe, and generic sightseeing labels.
- Removed generic fallback tourist spot generation so destinations without concrete touristSpots no longer create fake cards.
- Added concrete Naruto City tourist spot and local food metadata for future data coverage.

## Unreleased

- Natural local food copy: regenerated localFoodDetails descriptions with timing, area hints, and trip-fit context instead of generic template wording.
- Added bestTiming, bestAreaHints, and goodFor metadata to generated local food details and passed those hints into AI plan prompts.
- Added developer diagnostics for duplicated food descriptions, template phrase risk, missing timing/area hints, and unreviewed restaurant hints.

## Unreleased

- Improved the simple result-screen plan into a short model-course style flow for day trips, one-night trips, two-night trips, and longer stays.
- The model course now uses concrete tourist spot names, local food names, and nearbyDestinationHints when available, without inventing pseudo names such as city + lunch or city + sightseeing.
- Added developer diagnostics for model courses missing concrete spots, local food names, long-stay nearby hints, or containing pseudo-name risks.

## Unreleased

- Ran a result-screen quality pass across local food, tourist spots, model courses, and image-fit diagnostics.
- Replaced remaining generic lunch wording in detailed schedule display with concrete local food names when available.
- Tightened developer diagnostics with a food image / dish mismatch risk check and reduced template-like result copy.

## Unreleased

- Reworked result-screen quality gates for transport comparison, model courses, and trip image display.
- Transport comparison now hides weak or unavailable cards instead of showing large unevaluated placeholders, and links users to Google Maps when route data is insufficient.
- Route lookup destination queries now prefer a concrete frontend query such as nearest station or specific destination query before falling back to broad municipality text.
- Model courses now require concrete tourist spot and local food data before appearing on the general result screen.
- Trip image sections now show only stronger destination-specific images; fallback/category images stay modest or are omitted from the inspiration section.
- Added concrete Osaka City spots and local food metadata for result-screen display.


