# DROPTRIP 画像改善TODO

DROPTRIPの旅先画像は、カテゴリ代替やランダム表示ではなく、旅先ごとの専用hero画像を管理する方針です。外部画像取得、直リンク、権利不明画像は使いません。低品質な画像を表示するくらいなら、一般画面では画像なしを優先します。

## 旅先固定hero画像の運用ルール

- 結果画面のhero画像は `destination_fixed` の旅先専用画像のうち、品質確認済みの `confirmed` だけを表示します。
- `category fallback`、`generic`、`common`、ランダム画像は一般結果画面のheroに使いません。
- 画像がない旅先では画像セクションを出さず、「写真準備中」も一般画面に出しません。
- 旅先イメージ画像は `destination.id` で `destinationImages` の対応表へ登録します。
- イメージ画像やAI生成画像を使う場合は `isIllustration: true`、`type: "destination_fixed"` を付け、作成直後は `status: "needs_review"` として品質確認します。altは「〇〇をイメージしたビジュアル」とします。
- 現地写真とは書かず、現地写真と誤認させる説明を避けます。
- 画像ファイルは `public/images/destinations/{slug}/hero.webp` または権利確認済みのjpgを推奨します。簡易SVGの自動量産は行わず、既存の簡易SVGは作成済み候補として残しても一般画面には表示しません。
- 一般結果画面に表示するhero画像は `status: "confirmed"` のみです。`needs_review`、`rejected`、`missing` は一般画面では表示しません。
- `confirmed` は、旅先固有の要素が2つ以上あり、スマホでもその旅先らしさが伝わり、旅行アプリのheroとして魅力があるものだけに付けます。
- 抽象的な背景、丸・四角・山・水面だけの汎用的なSVG、どの旅先にも使い回せそうな画像、ワクワク感が弱い画像は `rejected` にします。
- 今後の画像作成は、高品質AI生成画像を1枚ずつ確認して `confirmed` にするか、権利確認済み写真素材を手動選定して `confirmed` にします。

## confirmed / rejected 判定基準

confirmed 条件:

- 旅先固有の要素が最低2つ以上ある
- 画像内に旅先名・説明文・キャッチコピーなどの文字が入っていない
- 旅行アプリのheroとして見て魅力がある
- スマホで見ても特徴が伝わる
- アプリ側の旅先名・説明文と情報が重複しない
- 色味や構図が安っぽくない
- 汎用背景に見えない
- 旅先名なしでもある程度イメージできる
- 画像内の文字でごまかしていない
- 権利面に問題がない
- 現地写真と誤認させる表現がない

rejected 条件:

- 抽象的すぎる
- 画像内に文字が入っている
- トリミングで文字が切れている
- 旅先名や説明文を画像内テキストで補っている
- 簡易図形に見える
- どこでも使えそう
- 旅先らしさが弱い
- 旅行したくなる感じがない
- 画面全体を安っぽく見せる

## 画像サイズ・形式ルール

- WebPまたは権利確認済みjpgを優先し、SVGは旅先固有要素を十分に描ける高品質なものに限ります。
- 横幅は1200px前後、比率は16:9または4:3を目安にします。
- 1枚あたり100KB〜400KB程度、最大でも1MB未満を目標にします。
- ファイル名・フォルダ名は英数字とハイフンで統一し、日本語ファイル名は避けます。

## 現在の整備状況

- 現在の登録旅先: 120件
- 固定hero登録あり: 117件
- 一般画面に表示するconfirmed hero: 113件
- needs_review hero: 3件
- rejected hero: 1件
- missing hero: 11件
- 先行confirmed登録: 宇都宮市・諏訪市・日立市・土浦市・出雲市・阿蘇市・日南市・米沢市・福島市・渋川市・姫路市・岐阜市・千葉市・銚子市・成田市・沼津市・山中湖村・佐野市・佐渡市・小布施町・三浦市・逗子市・葉山町・川口市・さいたま市・越谷市・墨田区・千代田区・新宿区・江東区・藤沢市 31件（現行の抽選用旅先データでは未登録。追加時に都道府県-市区町村キーで表示可能）
- 第1弾SVG作成済み: 16件（一般画面では非表示 / 佐野市先行作成1件を含む）
- 第2弾SVG作成済み: 16件（一般画面では非表示）

## confirmed hero表示対象

下呂市（`/images/destinations/gero-onsen/hero-v2.webp`）、京都市（`/images/destinations/kyoto/hero-v1.webp`）、箱根町（`/images/destinations/hakone/hero-v1.webp`）、小樽市（`/images/destinations/otaru/hero-v1.webp`）、草津町（`/images/destinations/kusatsu/hero-v1.webp`）、金沢市（`/images/destinations/kanazawa/hero-v1.webp`）、鎌倉市（`/images/destinations/kamakura/hero-v2.webp`）、熱海市（`/images/destinations/atami/hero-v2.webp`）、仙台市（`/images/destinations/sendai/hero-v2.webp`）、福岡市（`/images/destinations/fukuoka/hero-v2.webp`）、鳴門市（`/images/destinations/naruto/hero-v1.webp`）、別府市（`/images/destinations/beppu/hero-v1.webp`）、甲府市（`/images/destinations/kofu/hero-v1.webp`）、川越市（`/images/destinations/kawagoe/hero-v1.webp`）、石垣市（`/images/destinations/ishigaki/hero-v1.webp`）、宮古島市（`/images/destinations/miyakojima/hero-v1.webp`）、札幌市（`/images/destinations/sapporo/hero-v1.webp`）、函館市（`/images/destinations/hakodate/hero-v1.webp`）、長崎市（`/images/destinations/nagasaki/hero-v1.webp`）、広島市（`/images/destinations/hiroshima/hero-v1.webp`）、廿日市市（宮島: `/images/destinations/miyajima/hero-v1.webp`）、高山市（`/images/destinations/takayama/hero-v1.webp`）、尾道市（`/images/destinations/onomichi/hero-v1.webp`）、倉敷市（`/images/destinations/kurashiki/hero-v1.webp`）、松江市（`/images/destinations/matsue/hero-v1.webp`）、由布市（湯布院: `/images/destinations/yufuin/hero-v1.webp`）、松山市（道後温泉: `/images/destinations/dogo-onsen/hero-v1.webp`）、神戸市（`/images/destinations/kobe/hero-v1.webp`）、豊岡市（城崎温泉: `/images/destinations/kinosaki-onsen/hero-v1.webp`）、尾花沢市（銀山温泉: `/images/destinations/ginzan-onsen/hero-v1.webp`）、奈良市（`/images/destinations/nara/hero-v1.webp`）、日光市（`/images/destinations/nikko/hero-v1.webp`）、伊勢市（`/images/destinations/ise/hero-v1.webp`）、横浜市（`/images/destinations/yokohama/hero-v1.webp`）、宇都宮市（`/images/destinations/utsunomiya/hero-v1.webp`）、会津若松市（`/images/destinations/aizuwakamatsu/hero-v1.webp`）、白川村（`/images/destinations/shirakawa/hero-v1.webp`）、富良野市（`/images/destinations/furano/hero-v1.webp`）、那須町（`/images/destinations/nasu/hero-v1.webp`）、奥多摩町（`/images/destinations/okutama/hero-v1.webp`）、指宿市（`/images/destinations/ibusuki/hero-v1.webp`）、鹿児島市（`/images/destinations/kagoshima/hero-v1.webp`）、軽井沢町（`/images/destinations/karuizawa/hero-v1.webp`）、上田市（`/images/destinations/ueda/hero-v1.webp`）、松本市（`/images/destinations/matsumoto/hero-v1.webp`）、諏訪市（`/images/destinations/suwa/hero-v1.webp`）、水戸市（`/images/destinations/mito/hero-v1.webp`）、大洗町（`/images/destinations/oarai/hero-v1.webp`）、日立市（`/images/destinations/hitachi/hero-v1.webp`）、土浦市（`/images/destinations/tsuchiura/hero-v1.webp`）、鳥取市（`/images/destinations/tottori/hero-v1.webp`）、出雲市（`/images/destinations/izumo/hero-v1.webp`）、高松市（`/images/destinations/takamatsu/hero-v1.webp`）、高知市（`/images/destinations/kochi/hero-v1.webp`）、熊本市（`/images/destinations/kumamoto/hero-v1.webp`）、阿蘇市（`/images/destinations/aso/hero-v1.webp`）、宮崎市（`/images/destinations/miyazaki/hero-v1.webp`）、日南市（`/images/destinations/nichinan/hero-v1.webp`）、青森市（`/images/destinations/aomori/hero-v1.webp`）、弘前市（`/images/destinations/hirosaki/hero-v1.webp`）、盛岡市（`/images/destinations/morioka/hero-v1.webp`）、秋田市（`/images/destinations/akita/hero-v1.webp`）、山形市（`/images/destinations/yamagata/hero-v1.webp`）、米沢市（`/images/destinations/yonezawa/hero-v1.webp`）、福島市（`/images/destinations/fukushima/hero-v1.webp`）、渋川市（伊香保温泉: `/images/destinations/ikaho-onsen/hero-v1.webp`）、大阪市（`/images/destinations/osaka/hero-v1.webp`）、姫路市（`/images/destinations/himeji/hero-v1.webp`）、和歌山市（`/images/destinations/wakayama/hero-v1.webp`）、岐阜市（`/images/destinations/gifu/hero-v1.webp`）、名古屋市（`/images/destinations/nagoya/hero-v1.webp`）、福井市（`/images/destinations/fukui/hero-v1.webp`）、敦賀市（`/images/destinations/tsuruga/hero-v1.webp`）、千葉市（`/images/destinations/chiba/hero-v1.webp`）、館山市（`/images/destinations/tateyama/hero-v1.webp`）、銚子市（`/images/destinations/choshi/hero-v1.webp`）、成田市（`/images/destinations/narita/hero-v1.webp`）、静岡市（`/images/destinations/shizuoka/hero-v1.webp`）、浜松市（`/images/destinations/hamamatsu/hero-v1.webp`）、伊豆市（`/images/destinations/izu/hero-v1.webp`）、沼津市（`/images/destinations/numazu/hero-v1.webp`）。簡易SVGや画像内文字入りheroは一般画面に表示しません。confirmed画像はGit管理に入れてVercelへ反映し、原因切り分け用の直書き表示ではなく `destinationImages` の正式登録から表示します。

富士河口湖町（`/images/destinations/fujikawaguchiko/hero-v1.webp`）、山中湖村（`/images/destinations/yamanakako/hero-v1.webp`）、小田原市（`/images/destinations/odawara/hero-v1.webp`）、佐野市（`/images/destinations/sano/hero-v1.webp`）、新潟市（`/images/destinations/niigata/hero-v1.webp`）、佐渡市（`/images/destinations/sado/hero-v1.webp`）、長野市（`/images/destinations/nagano/hero-v1.webp`）、小布施町（`/images/destinations/obuse/hero-v1.webp`）も文字なし高品質AI生成hero画像としてconfirmed登録します。佐野市の旧 `hero.svg` は一般画面では使いません。

三島市（`/images/destinations/mishima/hero-v1.webp`）、三浦市（`/images/destinations/miura/hero-v1.webp`）、逗子市（`/images/destinations/zushi/hero-v1.webp`）、葉山町（`/images/destinations/hayama/hero-v1.webp`）、秩父市（`/images/destinations/chichibu/hero-v1.webp`）、川口市（`/images/destinations/kawaguchi/hero-v1.webp`）、さいたま市（`/images/destinations/saitama/hero-v1.webp`）、越谷市（`/images/destinations/koshigaya/hero-v1.webp`）も文字なし高品質AI生成hero画像としてconfirmed登録します。confirmed以外の古い候補画像や汎用fallbackは一般画面では使いません。

台東区（`/images/destinations/taito/hero-v1.webp`）、墨田区（`/images/destinations/sumida/hero-v1.webp`）、千代田区（`/images/destinations/chiyoda/hero-v1.webp`）、新宿区（`/images/destinations/shinjuku/hero-v1.webp`）、渋谷区（`/images/destinations/shibuya/hero-v1.webp`）、江東区（`/images/destinations/koto/hero-v1.webp`）、浦安市（`/images/destinations/urayasu/hero-v1.webp`）、藤沢市（`/images/destinations/fujisawa/hero-v1.webp`）も文字なし高品質AI生成hero画像としてconfirmed登録します。一般画面では現地写真と誤認させる表現は使いません。

横須賀市（`/images/destinations/yokosuka/hero-v1.webp`）、木更津市（`/images/destinations/kisarazu/hero-v1.webp`）、柏市（`/images/destinations/kashiwa/hero-v1.webp`）、町田市（`/images/destinations/machida/hero-v1.webp`）、八王子市（`/images/destinations/hachioji/hero-v1.webp`）、立川市（`/images/destinations/tachikawa/hero-v1.webp`）、調布市（`/images/destinations/chofu/hero-v1.webp`）、川崎市（`/images/destinations/kawasaki/hero-v1.webp`）も文字なし高品質AI生成hero画像としてconfirmed登録します。一般画面では古い `hero.svg`、fallback画像、現地写真と誤認させる表現は使いません。

鎌倉市・熱海市・仙台市・福岡市の `hero-v1.webp` は画像内に説明文が入っているため `rejected` とし、一般画面では非表示にします。文字なしの `hero-v2.webp` をユーザー確認済みのconfirmed heroとして登録します。

広島市の現行SVGも `rejected` とし、一般画面では非表示にします。次回作成テーマは、原爆ドーム、平和記念公園、川沿い、路面電車、橋、都市観光感です。

## 第1弾 SVG固定hero作成済み

下呂市、京都市、小樽市、箱根町、草津町、熱海市、金沢市、鎌倉市、仙台市、福岡市、鳴門市、別府市、甲府市、川越市、佐野市、上田市に軽量SVGの旅先イメージビジュアルを追加しました。佐野市は現行の旅行先データには未登録ですが、画像ファイルと `destinationImages` 側の対応は先行作成済みです。現在の簡易SVGは旅行アプリのheroとしては品質不足のため `rejected` とし、一般画面では表示しません。

## 第2弾 SVG固定hero作成済み

石垣市、宮古島市、札幌市、函館市、長崎市、広島市、廿日市市、高山市、尾道市、倉敷市、松江市、由布市、松山市、神戸市、豊岡市、尾花沢市に軽量SVGの旅先イメージビジュアルを追加しました。第1弾と同じく画像内に旅先名の大きな文字は入れず、SVGの `<title>` / `<desc>` と画像メタ情報で「イメージビジュアル」として扱います。現在の簡易SVGは旅行アプリのheroとしては品質不足のため `rejected` とし、一般画面では表示しません。

## 第3弾候補

画像未作成の旅先から、温泉・海・島・古い町並み・有名観光都市を優先して次の16件を候補にします。

富士河口湖町、松本市、伊豆市、大阪市、秩父市、名古屋市、白川村、高松市、高知市、富士吉田市、宇治市、登別市、阿蘇市、那須町、奥多摩町、本部町。

## 第1優先 高品質hero作成メモ

| 旅先 | プロンプト / 素材選定メモ |
|---|---|
| 下呂温泉 | 川沿いの温泉街、湯けむり、足湯、やわらかい夕方の光、浴衣で散策したくなる雰囲気。現地写真ではなく上質な旅行イメージビジュアル。 |
| 京都市 | 寺社の屋根、石畳、町家、やわらかい朝の光、和の街歩き。観光地名の文字に頼らず京都らしい空気感が伝わる上質なビジュアル。 |
| 小樽市 | 小樽運河、石造倉庫、ガス灯、港町の夜景、少しレトロな街歩き。現地写真と誤認させない旅行イメージビジュアル。 |
| 箱根町 | 芦ノ湖、箱根神社を思わせる鳥居、山並み、湯けむり、温泉旅の静かな雰囲気。 |
| 草津町 | 湯畑を思わせる温泉街、湯けむり、夜の灯り、浴衣で歩きたくなる温泉旅の雰囲気。 |
| 広島市 | 原爆ドームをイメージしたドーム型建築、平和記念公園の川沿い、路面電車、橋、穏やかな都市観光の雰囲気。 |
| 宮島 | 海上鳥居、瀬戸内海、島の参道、夕方の光、厳島神社周辺を思わせる静かな旅行感。 |
| 金沢市 | 兼六園を思わせる庭園、ひがし茶屋街、雨上がりの石畳、金箔の上品なきらめき。 |
| 鎌倉市 | 鶴岡八幡宮を思わせる参道、江ノ電、海、古都散策の雰囲気。 |
| 甲府市 | 甲府城跡、昇仙峡、ぶどう畑、山梨の山並み、ほうとうやワインを連想する落ち着いた旅の空気感。 |

## 全旅先 hero画像管理表

| id | 旅先名 | 都道府県 | 画像テーマ | status | src | candidateSrc | sourceType | reviewNote | rejectedReason | 次に作るべき画像プロンプトメモ |
|---|---|---|---|---|---|---|---|---|---|---|
| 神奈川県-横浜市 | 横浜市 | 神奈川県 | みなとみらい・港町・夜景・赤レンガ・都市景観 | confirmed | /images/destinations/yokohama/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧yokohama-hero.jpgや旧hero.svgは未使用候補。一般画面では使わない。 | みなとみらい、港町、夜景、赤レンガ、都市景観を含む横浜らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 神奈川県-鎌倉市 | 鎌倉市 | 神奈川県 | 江ノ電・海・古都・寺社・紫陽花 | confirmed | /images/destinations/kamakura/hero-v2.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero-v1.webpは画像内テキスト入り、旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 江ノ電、海、古都、寺社、紫陽花を含む鎌倉らしい古都散策のビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 神奈川県-箱根町 | 箱根町 | 神奈川県 | 芦ノ湖・鳥居・山並み・温泉旅 | confirmed | /images/destinations/hakone/hero-v1.webp | - | ai_generated | ユーザー確認済み。高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 芦ノ湖、鳥居、山並み、温泉旅の静かな雰囲気。現地写真ではなく上質な旅行イメージビジュアル。 |
| 栃木県-日光市 | 日光市 | 栃木県 | 日光東照宮・社寺・森・歴史建築・自然 | confirmed | /images/destinations/nikko/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧nikko-hero.jpgや旧hero.svgは未使用候補。一般画面では使わない。 | 日光東照宮、社寺、森、歴史建築、自然を含む日光らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 栃木県-宇都宮市 | 宇都宮市 | 栃木県 | 街並み・川沿い・夕景・都市散策・グルメの街 | confirmed | /images/destinations/utsunomiya/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。現行の抽選用旅先データでは未登録の先行画像。 | 旧hero.svgがある場合も一般画面では使わない。 | 街並み、川沿い、夕景、都市散策、グルメの街を含む宇都宮らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 群馬県-草津町 | 草津町 | 群馬県 | 湯畑・湯けむり・温泉街・夜景 | confirmed | /images/destinations/kusatsu/hero-v1.webp | - | ai_generated | ユーザー確認済み。高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 湯畑、湯けむり、温泉街、夜景を含む草津らしい温泉旅の雰囲気。現地写真ではなく上質な旅行イメージビジュアル。 |
| 栃木県-那須塩原市 | 那須塩原市 | 栃木県 | 温泉と自然、高原カフェを満喫・温泉・山 | missing | /images/destinations/destination-006/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 温泉と自然、高原カフェを満喫・温泉・山をもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 宮城県-仙台市 | 仙台市 | 宮城県 | 杜の都・青葉城跡・街と緑・都市景観 | confirmed | /images/destinations/sendai/hero-v2.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero-v1.webpは画像内テキスト入り、旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 街並み、緑、歴史、都市景観を含む仙台らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 宮城県-松島町 | 松島町 | 宮城県 | 日本三景の島々と新鮮な海鮮に出会う・海・グルメ | needs_review | /images/destinations/matsushima-hero.jpg | - | unknown | 通常。既存ローカル画像を固定hero候補として管理中。品質確認が完了するまで一般画面では非表示。WebP化と権利確認を継続。 | - | 日本三景の島々と新鮮な海鮮に出会う・海・グルメをもとに、汎用背景に見えない高品質hero画像へ作り直す。 |
| 青森県-青森市 | 青森市 | 青森県 | 港町・ベイエリア・青森湾・山並み・都市景観 | confirmed | /images/destinations/aomori/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 2026-07-12 | 一般画面表示OK。現地写真と誤認させない。 |
| 青森県-弘前市 | 弘前市 | 青森県 | 弘前城・桜・城下町・春の風景 | confirmed | /images/destinations/hirosaki/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 2026-07-12 | 一般画面表示OK。現地写真と誤認させない。 |
| 岩手県-盛岡市 | 盛岡市 | 岩手県 | 岩手山・川沿い・城下町・自然と都市 | confirmed | /images/destinations/morioka/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 2026-07-12 | 一般画面表示OK。現地写真と誤認させない。 |
| 福島県-会津若松市 | 会津若松市 | 福島県 | 鶴ヶ城・城下町・桜・山並み・歴史散策 | confirmed | /images/destinations/aizuwakamatsu/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧aizuwakamatsu-hero.jpgや旧hero.svgは未使用候補。一般画面では使わない。 | 鶴ヶ城、城下町、桜、山並み、歴史散策を含む会津若松らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 静岡県-熱海市 | 熱海市 | 静岡県 | 海辺温泉・坂道・リゾート温泉街・夕景 | confirmed | /images/destinations/atami/hero-v2.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero-v1.webpは画像内テキスト入り、旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 海辺温泉、坂道、リゾート温泉街、夕景を含む熱海らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 石川県-金沢市 | 金沢市 | 石川県 | 茶屋街・兼六園・城下町・和の街並み | confirmed | /images/destinations/kanazawa/hero-v1.webp | - | ai_generated | ユーザー確認済み。高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 茶屋街、兼六園、城下町、和の街並みを含む金沢らしい雰囲気。現地写真ではなく上質な旅行イメージビジュアル。 |
| 岐阜県-高山市 | 高山市 | 岐阜県 | 古い町並み・飛騨高山・水路・山並み | confirmed | /images/destinations/takayama/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 古い町並み、飛騨高山、水路、山並みを含む高山らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 岐阜県-岐阜市 | 岐阜市 | 岐阜県 | 金華山・岐阜城・長良川・自然と街並み | confirmed | /images/destinations/gifu/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。現行の抽選用旅先データでは未登録の先行画像。 | 2026-07-12 | 一般画面表示OK。現地写真と誤認させない。 |
| 長野県-松本市 | 松本市 | 長野県 | 松本城・北アルプス・城下町・水辺 | confirmed | /images/destinations/matsumoto/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgがある場合も一般画面では使わない。 | 松本城、北アルプス、城下町、水辺を含む松本らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 山梨県-富士河口湖町 | 富士河口湖町 | 山梨県 | 河口湖・富士山・紅葉・湖畔・自然景観 | confirmed | /images/destinations/fujikawaguchiko/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 2026-07-12 | 一般画面表示OK。現地写真と誤認させない。 |
| 山梨県-山中湖村 | 山中湖村 | 山梨県 | 山中湖・富士山・湖畔・遊歩道・自然散策 | confirmed | /images/destinations/yamanakako/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。現行の抽選用旅先データでは未登録の先行画像。 | 2026-07-12 | 一般画面表示OK。現地写真と誤認させない。 |
| 静岡県-伊豆市 | 伊豆市 | 静岡県 | 温泉街・渓流・山あい・旅館街・夕景 | confirmed | /images/destinations/izu/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 2026-07-12 | 一般画面表示OK。現地写真と誤認させない。 |
| 京都府-京都市 | 京都市 | 京都府 | 寺社・石畳・町家・夕景・京都らしい街並み | confirmed | /images/destinations/kyoto/hero-v1.webp | - | ai_generated | ユーザー確認済み。高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 寺社、石畳、町家、やわらかい夕景を含む京都らしい街並み。現地写真ではなく上質な旅行イメージビジュアル。 |
| 大阪府-大阪市 | 大阪市 | 大阪府 | 都市夜景・水辺・繁華街・大阪らしい活気 | confirmed | /images/destinations/osaka/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 2026-07-12 | 一般画面表示OK。現地写真と誤認させない。 |
| 兵庫県-神戸市 | 神戸市 | 兵庫県 | 港町・神戸ポートタワー・海辺・夕景・夜景 | confirmed | /images/destinations/kobe/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 2026-07-12 | 一般画面表示OK。現地写真と誤認させない。 |
| 兵庫県-姫路市 | 姫路市 | 兵庫県 | 姫路城・白鷺城・桜・歴史散策 | confirmed | /images/destinations/himeji/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。現行の抽選用旅先データでは未登録の先行画像。 | 2026-07-12 | 一般画面表示OK。現地写真と誤認させない。 |
| 奈良県-奈良市 | 奈良市 | 奈良県 | 奈良公園・鹿・寺社・古都・夕景 | confirmed | /images/destinations/nara/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧nara-hero.jpgや旧hero.svgは未使用候補。一般画面では使わない。 | 奈良公園、鹿、寺社、古都、夕景を含む奈良らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 和歌山県-白浜町 | 白浜町 | 和歌山県 | 白い砂浜と温泉、海の絶景を満喫・温泉・海 | needs_review | /images/destinations/shirahama-hero.jpg | - | unknown | 通常。既存ローカル画像を固定hero候補として管理中。品質確認が完了するまで一般画面では非表示。WebP化と権利確認を継続。 | - | 白い砂浜と温泉、海の絶景を満喫・温泉・海をもとに、汎用背景に見えない高品質hero画像へ作り直す。 |
| 兵庫県-豊岡市 | 豊岡市 | 兵庫県 | 柳並木・外湯めぐり・川沿い温泉街・夜の灯り | confirmed | /images/destinations/kinosaki-onsen/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 柳並木、外湯めぐり、川沿い温泉街、夜の灯りを含む城崎温泉らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 福岡県-福岡市 | 福岡市 | 福岡県 | 屋台・夜景・博多グルメ・川沿い | confirmed | /images/destinations/fukuoka/hero-v2.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero-v1.webpは画像内テキスト入り、旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 屋台、夜景、博多グルメ、川沿いを含む福岡らしい夜のビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 長崎県-長崎市 | 長崎市 | 長崎県 | 港町・坂の街・夜景・異国情緒 | confirmed | /images/destinations/nagasaki/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 港町、坂の街、夜景、異国情緒を含む長崎らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 大分県-別府市 | 別府市 | 大分県 | 湯けむり・温泉街・地獄めぐり・山並み | confirmed | /images/destinations/beppu/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 湯けむり、温泉街、地獄めぐり、山並みを含む別府らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 大分県-由布市 | 由布市 | 大分県 | 由布岳・金鱗湖・湯けむり・温泉街・朝夕の光 | confirmed | /images/destinations/yufuin/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 由布岳、金鱗湖、湯けむり、温泉街、朝夕の光を含む湯布院らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 熊本県-熊本市 | 熊本市 | 熊本県 | 熊本城・石垣・城下町・歴史散策 | confirmed | /images/destinations/kumamoto/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgがある場合も一般画面では使わない。 | 熊本城、石垣、城下町、歴史散策を含む熊本らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 鹿児島県-鹿児島市 | 鹿児島市 | 鹿児島県 | 桜島・港町・市街地・夕景・火山のある景色 | confirmed | /images/destinations/kagoshima/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgがある場合も一般画面では使わない。 | 桜島、港町、市街地、夕景、火山のある景色を含む鹿児島らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 北海道-札幌市 | 札幌市 | 北海道 | 大通公園・札幌テレビ塔・花壇・都市と自然 | confirmed | /images/destinations/sapporo/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 大通公園、札幌テレビ塔、花壇、都市と自然を含む札幌らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 北海道-函館市 | 函館市 | 北海道 | 函館山夜景・港町・海辺・夕景 | confirmed | /images/destinations/hakodate/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 函館山夜景、港町、海辺、夕景を含む函館らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 北海道-小樽市 | 小樽市 | 北海道 | 小樽運河・倉庫群・ガス灯・港町・夕景 | confirmed | /images/destinations/otaru/hero-v1.webp | - | ai_generated | ユーザー確認済み。高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 小樽運河、倉庫群、ガス灯、港町、夕景を含む街歩きの雰囲気。現地写真ではなく上質な旅行イメージビジュアル。 |
| 東京都-台東区 | 台東区 | 東京都 | 浅草・浅草寺・下町・桜・歴史散策 | confirmed | /images/destinations/taito/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 2026-07-13 | 一般画面表示OK。現地写真と誤認させない。 |
| 東京都-墨田区 | 墨田区 | 東京都 | 東京スカイツリー・隅田川・水辺・都市景観 | confirmed | /images/destinations/sumida/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。現行の抽選用旅先データでは未登録の先行画像。 | 2026-07-13 | 一般画面表示OK。現地写真と誤認させない。 |
| 東京都-千代田区 | 千代田区 | 東京都 | 東京駅・丸の内・皇居周辺・都心散策 | confirmed | /images/destinations/chiyoda/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。現行の抽選用旅先データでは未登録の先行画像。 | 2026-07-13 | 一般画面表示OK。現地写真と誤認させない。 |
| 東京都-新宿区 | 新宿区 | 東京都 | 高層ビル・都心夜景・新宿御苑周辺・都市散策 | confirmed | /images/destinations/shinjuku/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。現行の抽選用旅先データでは未登録の先行画像。 | 2026-07-13 | 一般画面表示OK。現地写真と誤認させない。 |
| 東京都-江東区 | 江東区 | 東京都 | 湾岸・豊洲・お台場方面・橋・水辺・夕景 | confirmed | /images/destinations/koto/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。現行の抽選用旅先データでは未登録の先行画像。 | 2026-07-13 | 一般画面表示OK。現地写真と誤認させない。 |
| 千葉県-浦安市 | 浦安市 | 千葉県 | ベイエリア・舞浜周辺・水辺・リゾート感・夕景 | confirmed | /images/destinations/urayasu/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 2026-07-13 | 一般画面表示OK。現地写真と誤認させない。 |
| 埼玉県-秩父市 | 秩父市 | 埼玉県 | 山並み・神社・渓流・自然散策・秩父らしい山里 | confirmed | /images/destinations/chichibu/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 2026-07-13 | 一般画面表示OK。現地写真と誤認させない。 |
| 愛知県-名古屋市 | 名古屋市 | 愛知県 | 都市景観・高層ビル・緑・名古屋らしい街並み | confirmed | /images/destinations/nagoya/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 2026-07-12 | 一般画面表示OK。現地写真と誤認させない。 |
| 岐阜県-下呂市 | 下呂市 | 岐阜県 | 川沿いの温泉街・湯けむり・夕景・旅館街 | confirmed | /images/destinations/gero-onsen/hero-v2.webp | - | ai_generated | ユーザー確認済み。高品質AI生成hero画像として第1号confirmed登録。スマホキャッシュ対策としてファイル名をhero-v2.webpへ変更。 | 旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 川沿いの温泉街、湯けむり、足湯、やわらかい夕方の光、浴衣で散策したくなる雰囲気。現地写真ではなく上質な旅行イメージビジュアル。 |
| 岐阜県-白川村 | 白川村 | 岐阜県 | 合掌造り・山里・水辺・世界遺産・日本の原風景 | confirmed | /images/destinations/shirakawa/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgがある場合も一般画面では使わない。 | 合掌造り、山里、水辺、世界遺産、日本の原風景を含む白川郷らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 広島県-広島市 | 広島市 | 広島県 | 川沿い・平和記念公園・都市景観・橋 | confirmed | /images/destinations/hiroshima/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 川沿い、平和記念公園、都市景観、橋を含む広島らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 広島県-廿日市市 | 廿日市市 | 広島県 | 海上鳥居・瀬戸内海・厳島神社・島旅 | confirmed | /images/destinations/miyajima/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 海上鳥居、瀬戸内海、厳島神社、島旅を含む宮島らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 岡山県-倉敷市 | 倉敷市 | 岡山県 | 美観地区・白壁の町並み・柳並木・川舟 | confirmed | /images/destinations/kurashiki/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 美観地区、白壁の町並み、柳並木、川舟を含む倉敷らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 鳥取県-鳥取市 | 鳥取市 | 鳥取県 | 鳥取砂丘・日本海・砂丘散策・海辺 | confirmed | /images/destinations/tottori/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgがある場合も一般画面では使わない。 | 鳥取砂丘、日本海、砂丘散策、海辺を含む鳥取らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 香川県-高松市 | 高松市 | 香川県 | 栗林公園・庭園・池・橋・瀬戸内の街 | confirmed | /images/destinations/takamatsu/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgがある場合も一般画面では使わない。 | 栗林公園、庭園、池、橋、瀬戸内の街を含む高松らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 愛媛県-松山市 | 松山市 | 愛媛県 | 道後温泉本館・温泉街・レトロ建築・夕景 | confirmed | /images/destinations/dogo-onsen/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 道後温泉本館、温泉街、レトロ建築、夕景を含む道後温泉らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 高知県-高知市 | 高知市 | 高知県 | 桂浜・太平洋・坂本龍馬像・海辺・南国感 | confirmed | /images/destinations/kochi/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgがある場合も一般画面では使わない。 | 桂浜、太平洋、坂本龍馬像、海辺、南国感を含む高知らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 沖縄県-那覇市 | 那覇市 | 沖縄県 | 琉球の歴史と南国グルメを満喫・海・グルメ | needs_review | /images/destinations/naha-hero.jpg | - | unknown | 通常。既存ローカル画像を固定hero候補として管理中。品質確認が完了するまで一般画面では非表示。WebP化と権利確認を継続。 | - | 琉球の歴史と南国グルメを満喫・海・グルメをもとに、汎用背景に見えない高品質hero画像へ作り直す。 |
| 沖縄県-石垣市 | 石垣市 | 沖縄県 | 青い海・白い砂浜・南国植物・島旅 | confirmed | /images/destinations/ishigaki/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 青い海、白い砂浜、南国植物、島旅を含む石垣らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 宮崎県-宮崎市 | 宮崎市 | 宮崎県 | 海辺・南国・ヤシ並木・青島・リゾート感 | confirmed | /images/destinations/miyazaki/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgがある場合も一般画面では使わない。 | 海辺、南国、ヤシ並木、青島、リゾート感を含む宮崎らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 長崎県-佐世保市 | 佐世保市 | 長崎県 | 九十九島の絶景と港町グルメを満喫・海・グルメ | missing | /images/destinations/destination-050/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 九十九島の絶景と港町グルメを満喫・海・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 秋田県-秋田市 | 秋田市 | 秋田県 | 千秋公園・街並み・水辺・四季の風景 | confirmed | /images/destinations/akita/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 2026-07-12 | 一般画面表示OK。現地写真と誤認させない。 |
| 秋田県-仙北市 | 仙北市 | 秋田県 | 駅から観光エリアへの移動時間を加算・春,秋,冬・山・温泉 | missing | /images/destinations/destination-052/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から観光エリアへの移動時間を加算・春,秋,冬・山・温泉をもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 山形県-山形市 | 山形市 | 山形県 | 蔵王連峰・山形市街・雪山・自然景観 | confirmed | /images/destinations/yamagata/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 2026-07-12 | 一般画面表示OK。現地写真と誤認させない。 |
| 山形県-尾花沢市 | 尾花沢市 | 山形県 | 雪景色・木造旅館街・ガス灯・大正ロマン | confirmed | /images/destinations/ginzan-onsen/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 雪景色、木造旅館街、ガス灯、大正ロマンを含む銀山温泉らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 茨城県-水戸市 | 水戸市 | 茨城県 | 千波湖・街並み・公園・都市散策 | confirmed | /images/destinations/mito/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgがある場合も一般画面では使わない。 | 千波湖、街並み、公園、都市散策を含む水戸らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 茨城県-大洗町 | 大洗町 | 茨城県 | 海辺・鳥居・磯・港町・太平洋 | confirmed | /images/destinations/oarai/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgがある場合も一般画面では使わない。 | 海辺、鳥居、磯、港町、太平洋を含む大洗らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 茨城県-日立市 | 日立市 | 茨城県 | 海岸・灯台・太平洋・崖上の景色 | confirmed | /images/destinations/hitachi/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。現行の抽選用旅先データでは未登録の先行画像。 | 旧hero.svgがある場合も一般画面では使わない。 | 海岸、灯台、太平洋、崖上の景色を含む日立らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 茨城県-土浦市 | 土浦市 | 茨城県 | 霞ヶ浦・湖畔・夕景・橋・水辺の街 | confirmed | /images/destinations/tsuchiura/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。現行の抽選用旅先データでは未登録の先行画像。 | 旧hero.svgがある場合も一般画面では使わない。 | 霞ヶ浦、湖畔、夕景、橋、水辺の街を含む土浦らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 新潟県-新潟市 | 新潟市 | 新潟県 | 信濃川・水辺・都市景観・港町・日本海 | confirmed | /images/destinations/niigata/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 2026-07-12 | 一般画面表示OK。現地写真と誤認させない。 |
| 新潟県-佐渡市 | 佐渡市 | 新潟県 | 日本海・海岸・島旅・断崖・自然景観 | confirmed | /images/destinations/sado/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。現行の抽選用旅先データでは未登録の先行画像。 | 2026-07-12 | 一般画面表示OK。現地写真と誤認させない。 |
| 新潟県-湯沢町 | 湯沢町 | 新潟県 | 駅周辺・夏,秋,冬・温泉・山 | missing | /images/destinations/destination-058/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅周辺・夏,秋,冬・温泉・山をもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 富山県-富山市 | 富山市 | 富山県 | 駅から中心市街地への移動時間を加算・春,秋,冬・山・グルメ | missing | /images/destinations/destination-059/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から中心市街地への移動時間を加算・春,秋,冬・山・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 富山県-立山町 | 立山町 | 富山県 | 山岳観光の乗り換え時間を加算・夏,秋・山・温泉 | missing | /images/destinations/destination-060/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 山岳観光の乗り換え時間を加算・夏,秋・山・温泉をもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 福井県-福井市 | 福井市 | 福井県 | 海岸・自然・越前方面の景色・北陸の旅 | confirmed | /images/destinations/fukui/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 2026-07-12 | 一般画面表示OK。現地写真と誤認させない。 |
| 福井県-坂井市 | 坂井市 | 福井県 | 最寄り駅からバス・車移動が必要・春,夏,秋・海・グルメ | missing | /images/destinations/destination-062/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 最寄り駅からバス・車移動が必要・春,夏,秋・海・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 三重県-伊勢市 | 伊勢市 | 三重県 | 伊勢神宮・海辺・鳥居・朝夕の光・神聖な雰囲気 | confirmed | /images/destinations/ise/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧ise-hero.jpgや旧hero.svgは未使用候補。一般画面では使わない。 | 伊勢神宮、海辺、鳥居、朝夕の光、神聖な雰囲気を含む伊勢らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 三重県-鳥羽市 | 鳥羽市 | 三重県 | 駅から海辺の観光地への移動時間を加算・春,夏,秋・海・温泉 | missing | /images/destinations/destination-064/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から海辺の観光地への移動時間を加算・春,夏,秋・海・温泉をもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 滋賀県-大津市 | 大津市 | 滋賀県 | 駅から琵琶湖畔への移動時間を加算・春,夏,秋・海・グルメ | missing | /images/destinations/destination-065/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から琵琶湖畔への移動時間を加算・春,夏,秋・海・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 滋賀県-高島市 | 高島市 | 滋賀県 | 最寄り駅からバス・車移動が必要・春,夏,秋・山・カップル向け | missing | /images/destinations/destination-066/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 最寄り駅からバス・車移動が必要・春,夏,秋・山・カップル向けをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 島根県-松江市 | 松江市 | 島根県 | 松江城・宍道湖・水辺の街・城下町 | confirmed | /images/destinations/matsue/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 松江城、宍道湖、水辺の街、城下町を含む松江らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 島根県-出雲市 | 出雲市 | 島根県 | 出雲大社・社殿・神話・松並木・静かな参拝 | confirmed | /images/destinations/izumo/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。現行の抽選用旅先データでは未登録の先行画像。 | 旧hero.svgがある場合も一般画面では使わない。 | 出雲大社、社殿、神話、松並木、静かな参拝を含む出雲らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 山口県-下関市 | 下関市 | 山口県 | 駅から唐戸エリアへの移動時間を加算・春,夏,秋・海・グルメ | missing | /images/destinations/destination-069/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から唐戸エリアへの移動時間を加算・春,夏,秋・海・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 山口県-萩市 | 萩市 | 山口県 | 駅から城下町への移動時間を加算・春,秋・海・グルメ | missing | /images/destinations/destination-070/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から城下町への移動時間を加算・春,秋・海・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 徳島県-鳴門市 | 鳴門市 | 徳島県 | 鳴門海峡・渦潮・橋・海 | confirmed | /images/destinations/naruto/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 鳴門海峡、渦潮、橋、海を含む鳴門らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 徳島県-三好市 | 三好市 | 徳島県 | 山間部のため駅からバス・車移動が必要・夏,秋・山・温泉 | missing | /images/destinations/destination-072/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 山間部のため駅からバス・車移動が必要・夏,秋・山・温泉をもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 佐賀県-佐賀市 | 佐賀市 | 佐賀県 | 駅から中心市街地への移動時間を加算・春,秋・グルメ・カップル向け | missing | /images/destinations/destination-073/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から中心市街地への移動時間を加算・春,秋・グルメ・カップル向けをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 佐賀県-嬉野市 | 嬉野市 | 佐賀県 | 駅から温泉街への移動時間を加算・秋,冬・温泉・グルメ | missing | /images/destinations/destination-074/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から温泉街への移動時間を加算・秋,冬・温泉・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 長野県-長野市 | 長野市 | 長野県 | 善光寺・門前町・山並み・歴史散策・信州の街 | confirmed | /images/destinations/nagano/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 2026-07-12 | 一般画面表示OK。現地写真と誤認させない。 |
| 長野県-小布施町 | 小布施町 | 長野県 | 栗の町・古い町並み・水路・山里・散策 | confirmed | /images/destinations/obuse/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。現行の抽選用旅先データでは未登録の先行画像。 | 2026-07-12 | 一般画面表示OK。現地写真と誤認させない。 |
| 長野県-軽井沢町 | 軽井沢町 | 長野県 | 森・高原・別荘地・清流・避暑地 | confirmed | /images/destinations/karuizawa/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧karuizawa-hero.jpgや旧hero.svgは未使用候補。一般画面では使わない。 | 森、高原、別荘地、清流、避暑地を含む軽井沢らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 静岡県-静岡市 | 静岡市 | 静岡県 | 富士山・市街地・緑・駿河湾方面の景色 | confirmed | /images/destinations/shizuoka/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 2026-07-12 | 一般画面表示OK。現地写真と誤認させない。 |
| 静岡県-浜松市 | 浜松市 | 静岡県 | 浜名湖・湖畔・鳥居・水辺・自然散策 | confirmed | /images/destinations/hamamatsu/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 2026-07-12 | 一般画面表示OK。現地写真と誤認させない。 |
| 静岡県-沼津市 | 沼津市 | 静岡県 | 沼津港・富士山・海辺・港町・駿河湾 | confirmed | /images/destinations/numazu/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。現行の抽選用旅先データでは未登録の先行画像。 | 2026-07-12 | 一般画面表示OK。現地写真と誤認させない。 |
| 福岡県-北九州市 | 北九州市 | 福岡県 | 駅周辺・春,秋,冬・海・グルメ | missing | /images/destinations/destination-079/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅周辺・春,秋,冬・海・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 熊本県-阿蘇市 | 阿蘇市 | 熊本県 | 阿蘇山・草千里・火山・草原・雄大な自然 | confirmed | /images/destinations/aso/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。現行の抽選用旅先データでは未登録の先行画像。 | 旧hero.svgがある場合も一般画面では使わない。 | 阿蘇山、草千里、火山、草原、雄大な自然を含む阿蘇らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 北海道-釧路市 | 釧路市 | 北海道 | 駅から湿原方面への移動時間を加算・夏,秋,冬・海・グルメ | missing | /images/destinations/destination-081/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から湿原方面への移動時間を加算・夏,秋,冬・海・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 沖縄県-宮古島市 | 宮古島市 | 沖縄県 | 宮古ブルー・橋・白砂・リゾート感 | confirmed | /images/destinations/miyakojima/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 宮古ブルー、橋、白砂、リゾート感を含む宮古島らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 北海道-富良野市 | 富良野市 | 北海道 | ラベンダー畑・花畑・丘陵・北海道らしい自然 | confirmed | /images/destinations/furano/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧furano-hero.jpgや旧hero.svgは未使用候補。一般画面では使わない。 | ラベンダー畑、花畑、丘陵、北海道らしい自然を含む富良野らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 北海道-登別市 | 登別市 | 北海道 | 最寄り駅から温泉街への移動時間を加算・秋,冬・温泉・山 | missing | /images/destinations/destination-084/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 最寄り駅から温泉街への移動時間を加算・秋,冬・温泉・山をもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 東京都-渋谷区 | 渋谷区 | 東京都 | 渋谷・スクランブル交差点・都市夜景・若者文化 | confirmed | /images/destinations/shibuya/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 2026-07-13 | 一般画面表示OK。現地写真と誤認させない。 |
| 神奈川県-小田原市 | 小田原市 | 神奈川県 | 小田原城・城下町・桜・歴史散策・海の近い街 | confirmed | /images/destinations/odawara/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 2026-07-12 | 一般画面表示OK。現地写真と誤認させない。 |
| 神奈川県-三浦市 | 三浦市 | 神奈川県 | 海岸・灯台・岩場・三浦半島・海辺散策 | confirmed | /images/destinations/miura/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。現行の抽選用旅先データでは未登録の先行画像。 | 2026-07-13 | 一般画面表示OK。現地写真と誤認させない。 |
| 神奈川県-逗子市 | 逗子市 | 神奈川県 | 海辺・湾・湘南・ビーチ・穏やかな街並み | confirmed | /images/destinations/zushi/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。現行の抽選用旅先データでは未登録の先行画像。 | 2026-07-13 | 一般画面表示OK。現地写真と誤認させない。 |
| 神奈川県-葉山町 | 葉山町 | 神奈川県 | 海岸・砂浜・湘南・別荘地・落ち着いた海辺 | confirmed | /images/destinations/hayama/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。現行の抽選用旅先データでは未登録の先行画像。 | 2026-07-13 | 一般画面表示OK。現地写真と誤認させない。 |
| 神奈川県-藤沢市 | 藤沢市 | 神奈川県 | 江の島・湘南・海辺・砂浜・海沿い散策 | confirmed | /images/destinations/fujisawa/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。現行の抽選用旅先データでは未登録の先行画像。 | 2026-07-13 | 一般画面表示OK。現地写真と誤認させない。 |
| 神奈川県-横須賀市 | 横須賀市 | 神奈川県 | 港町・海辺・艦船・横須賀らしい街並み | confirmed | /images/destinations/yokosuka/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgがある場合も一般画面では使わない。 | 一般画面表示OK。現地写真と誤認させない。 |
| 千葉県-木更津市 | 木更津市 | 千葉県 | 東京湾・海辺・橋・港町・ベイエリア | confirmed | /images/destinations/kisarazu/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgがある場合も一般画面では使わない。 | 一般画面表示OK。現地写真と誤認させない。 |
| 千葉県-柏市 | 柏市 | 千葉県 | 公園・水辺・緑・街歩き・近郊都市 | confirmed | /images/destinations/kashiwa/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgがある場合も一般画面では使わない。 | 一般画面表示OK。現地写真と誤認させない。 |
| 東京都-町田市 | 町田市 | 東京都 | 街歩き・水辺・公園・緑・郊外散策 | confirmed | /images/destinations/machida/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgがある場合も一般画面では使わない。 | 一般画面表示OK。現地写真と誤認させない。 |
| 東京都-八王子市 | 八王子市 | 東京都 | 高尾山方面・山並み・市街地・自然散策 | confirmed | /images/destinations/hachioji/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgがある場合も一般画面では使わない。 | 一般画面表示OK。現地写真と誤認させない。 |
| 東京都-立川市 | 立川市 | 東京都 | 街並み・公園・広い通り・都市散策・緑 | confirmed | /images/destinations/tachikawa/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgがある場合も一般画面では使わない。 | 一般画面表示OK。現地写真と誤認させない。 |
| 東京都-調布市 | 調布市 | 東京都 | 深大寺周辺・桜・水辺・緑・落ち着いた街歩き | confirmed | /images/destinations/chofu/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgがある場合も一般画面では使わない。 | 一般画面表示OK。現地写真と誤認させない。 |
| 神奈川県-川崎市 | 川崎市 | 神奈川県 | 臨海部・水辺・都市景観・工場夜景・港町 | confirmed | /images/destinations/kawasaki/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgがある場合も一般画面では使わない。 | 一般画面表示OK。現地写真と誤認させない。 |
| 千葉県-千葉市 | 千葉市 | 千葉県 | 海辺・都市景観・ベイエリア・公園・港町 | confirmed | /images/destinations/chiba/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。現行の抽選用旅先データでは未登録の先行画像。 | 2026-07-12 | 一般画面表示OK。現地写真と誤認させない。 |
| 千葉県-銚子市 | 銚子市 | 千葉県 | 犬吠埼・灯台・太平洋・海岸・夕景 | confirmed | /images/destinations/choshi/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。現行の抽選用旅先データでは未登録の先行画像。 | 2026-07-12 | 一般画面表示OK。現地写真と誤認させない。 |
| 千葉県-成田市 | 成田市 | 千葉県 | 成田山新勝寺・参道・寺社・歴史散策 | confirmed | /images/destinations/narita/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。現行の抽選用旅先データでは未登録の先行画像。 | 2026-07-12 | 一般画面表示OK。現地写真と誤認させない。 |
| 京都府-宇治市 | 宇治市 | 京都府 | 駅から平等院周辺への移動時間を加算・春,夏,秋・山・グルメ | missing | /images/destinations/destination-087/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から平等院周辺への移動時間を加算・春,夏,秋・山・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 広島県-尾道市 | 尾道市 | 広島県 | 坂道・瀬戸内海・港町・夕景・レトロな街並み | confirmed | /images/destinations/onomichi/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 坂道、瀬戸内海、港町、夕景、レトロな街並みを含む尾道らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 鹿児島県-指宿市 | 指宿市 | 鹿児島県 | 砂むし温泉・海辺・南国・開聞岳・温泉旅 | confirmed | /images/destinations/ibusuki/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgがある場合も一般画面では使わない。 | 砂むし温泉、海辺、南国、開聞岳、温泉旅を含む指宿らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 岩手県-平泉町 | 平泉町 | 岩手県 | 駅から世界遺産エリアへの移動時間を加算・春,夏,秋・山・グルメ | missing | /images/destinations/destination-090/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から世界遺産エリアへの移動時間を加算・春,夏,秋・山・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 栃木県-那須町 | 那須町 | 栃木県 | 高原・山並み・牧場・自然散策・リゾート | confirmed | /images/destinations/nasu/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgがある場合も一般画面では使わない。 | 高原、山並み、牧場、自然散策、リゾート感を含む那須らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 栃木県-足利市 | 足利市 | 栃木県 | 駅から中心部へ徒歩・バスで移動しやすい・春,秋・グルメ・カップル向け | missing | /images/destinations/destination-092/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から中心部へ徒歩・バスで移動しやすい・春,秋・グルメ・カップル向けをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 埼玉県-川越市 | 川越市 | 埼玉県 | 蔵造り・時の鐘・小江戸・レトロ街歩き | confirmed | /images/destinations/kawagoe/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 蔵造り、時の鐘、小江戸、レトロ街歩きを含む川越らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 埼玉県-川口市 | 川口市 | 埼玉県 | 水辺・都市景観・川沿い・公園・街歩き | confirmed | /images/destinations/kawaguchi/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。現行の抽選用旅先データでは未登録の先行画像。 | 2026-07-13 | 一般画面表示OK。現地写真と誤認させない。 |
| 埼玉県-さいたま市 | さいたま市 | 埼玉県 | 都市景観・公園・緑・街歩き・近郊都市 | confirmed | /images/destinations/saitama/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。現行の抽選用旅先データでは未登録の先行画像。 | 2026-07-13 | 一般画面表示OK。現地写真と誤認させない。 |
| 埼玉県-越谷市 | 越谷市 | 埼玉県 | 水辺・桜・公園・川沿い・穏やかな街並み | confirmed | /images/destinations/koshigaya/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。現行の抽選用旅先データでは未登録の先行画像。 | 2026-07-13 | 一般画面表示OK。現地写真と誤認させない。 |
| 千葉県-館山市 | 館山市 | 千葉県 | 海岸・南房総・青い海・南国感・リゾート | confirmed | /images/destinations/tateyama/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 2026-07-12 | 一般画面表示OK。現地写真と誤認させない。 |
| 東京都-奥多摩町 | 奥多摩町 | 東京都 | 渓谷・清流・森林・橋・自然散策 | confirmed | /images/destinations/okutama/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgがある場合も一般画面では使わない。 | 渓谷、清流、森林、橋、自然散策を含む奥多摩らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 山形県-上山市 | 上山市 | 山形県 | 駅周辺に温泉街がまとまる・春,秋,冬・温泉・山 | missing | /images/destinations/destination-096/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅周辺に温泉街がまとまる・春,秋,冬・温泉・山をもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 山形県-酒田市 | 酒田市 | 山形県 | 駅から市街地・港方面へ移動しやすい・春,夏,秋・海・グルメ | missing | /images/destinations/destination-097/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から市街地・港方面へ移動しやすい・春,夏,秋・海・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 岩手県-花巻市 | 花巻市 | 岩手県 | 温泉郷へはバス・車移動を想定・春,秋,冬・温泉・山 | missing | /images/destinations/destination-098/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 温泉郷へはバス・車移動を想定・春,秋,冬・温泉・山をもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 青森県-八戸市 | 八戸市 | 青森県 | 中心街・港方面へバス移動を想定・春,夏,秋・海・グルメ | missing | /images/destinations/destination-099/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 中心街・港方面へバス移動を想定・春,夏,秋・海・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 福島県-郡山市 | 郡山市 | 福島県 | 駅周辺を起点にしやすい・春,秋,冬・グルメ・カップル向け | missing | /images/destinations/destination-100/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅周辺を起点にしやすい・春,秋,冬・グルメ・カップル向けをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 長野県-上田市 | 上田市 | 長野県 | 上田城跡・城下町・山並み・歴史散策 | confirmed | /images/destinations/ueda/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 上田城跡、城下町、山並み、歴史散策を含む上田らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 長野県-諏訪市 | 諏訪市 | 長野県 | 諏訪湖・山並み・湖畔・自然散策 | confirmed | /images/destinations/suwa/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。現行の抽選用旅先データでは未登録の先行画像。 | 旧hero.svgがある場合も一般画面では使わない。 | 諏訪湖、山並み、湖畔、自然散策を含む諏訪らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 岐阜県-郡上市 | 郡上市 | 岐阜県 | 市街地へは徒歩・バス移動を想定・春,夏,秋・山・グルメ | missing | /images/destinations/destination-102/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 市街地へは徒歩・バス移動を想定・春,夏,秋・山・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 福井県-敦賀市 | 敦賀市 | 福井県 | 港町・敦賀湾・山並み・北陸の海辺 | confirmed | /images/destinations/tsuruga/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 2026-07-12 | 一般画面表示OK。現地写真と誤認させない。 |
| 山梨県-甲府市 | 甲府市 | 山梨県 | 甲府城跡・山並み・都市景観・自然 | confirmed | /images/destinations/kofu/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 甲府城跡、山並み、都市景観、自然を含む甲府らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 静岡県-三島市 | 三島市 | 静岡県 | 富士山・水辺・清流・街歩き・自然と町並み | confirmed | /images/destinations/mishima/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 2026-07-13 | 一般画面表示OK。現地写真と誤認させない。 |
| 京都府-舞鶴市 | 舞鶴市 | 京都府 | 駅から赤れんがエリアへ移動しやすい・春,夏,秋・海・グルメ | missing | /images/destinations/destination-106/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から赤れんがエリアへ移動しやすい・春,夏,秋・海・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 兵庫県-明石市 | 明石市 | 兵庫県 | 駅から商店街・城跡へ歩きやすい・春,夏,秋・海・グルメ | missing | /images/destinations/destination-108/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から商店街・城跡へ歩きやすい・春,夏,秋・海・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 滋賀県-彦根市 | 彦根市 | 滋賀県 | 駅から城下町へ移動しやすい・春,秋,冬・山・グルメ | missing | /images/destinations/destination-109/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から城下町へ移動しやすい・春,秋,冬・山・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 和歌山県-和歌山市 | 和歌山市 | 和歌山県 | 和歌山城・海辺・城下町・紀州の風景 | confirmed | /images/destinations/wakayama/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 2026-07-12 | 一般画面表示OK。現地写真と誤認させない。 |
| 岡山県-津山市 | 津山市 | 岡山県 | 駅から城跡・中心街へ移動しやすい・春,秋,冬・グルメ・カップル向け | missing | /images/destinations/destination-111/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から城跡・中心街へ移動しやすい・春,秋,冬・グルメ・カップル向けをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 山口県-山口市 | 山口市 | 山口県 | 市街地・温泉街へバス移動を想定・春,秋,冬・山・グルメ | missing | /images/destinations/destination-112/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 市街地・温泉街へバス移動を想定・春,秋,冬・山・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 広島県-竹原市 | 竹原市 | 広島県 | 駅から町並み保存地区へ歩きやすい・春,秋,冬・グルメ・カップル向け | missing | /images/destinations/destination-113/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から町並み保存地区へ歩きやすい・春,秋,冬・グルメ・カップル向けをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 香川県-丸亀市 | 丸亀市 | 香川県 | 駅から城下町へ移動しやすい・春,秋,冬・グルメ・カップル向け | missing | /images/destinations/destination-114/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から城下町へ移動しやすい・春,秋,冬・グルメ・カップル向けをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 愛媛県-今治市 | 今治市 | 愛媛県 | 駅から市街地・港方面へ移動しやすい・春,夏,秋・海・グルメ | missing | /images/destinations/destination-115/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から市街地・港方面へ移動しやすい・春,夏,秋・海・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 徳島県-徳島市 | 徳島市 | 徳島県 | 駅周辺を起点にしやすい・春,夏,秋・グルメ・カップル向け | missing | /images/destinations/destination-116/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅周辺を起点にしやすい・春,夏,秋・グルメ・カップル向けをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 熊本県-天草市 | 天草市 | 熊本県 | 天草方面は車・バス移動を想定・春,夏,秋・海・グルメ | missing | /images/destinations/destination-117/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 天草方面は車・バス移動を想定・春,夏,秋・海・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 長崎県-島原市 | 島原市 | 長崎県 | 駅から湧水エリアへ歩きやすい・春,秋,冬・温泉・グルメ | missing | /images/destinations/destination-118/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から湧水エリアへ歩きやすい・春,秋,冬・温泉・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 宮崎県-日南市 | 日南市 | 宮崎県 | 日南海岸・太平洋・南国植物・海沿いドライブ | confirmed | /images/destinations/nichinan/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。現行の抽選用旅先データでは未登録の先行画像。 | 旧hero.svgがある場合も一般画面では使わない。 | 日南海岸、太平洋、南国植物、海沿いドライブを含む日南らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 沖縄県-本部町 | 本部町 | 沖縄県 | 空港から車・バス移動を想定・春,夏,秋・海・グルメ | missing | /images/destinations/destination-120/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 空港から車・バス移動を想定・春,夏,秋・海・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 栃木県-佐野市 | 佐野市 | 栃木県 | 街歩き・水辺・歴史ある街並み・佐野らしい散策 | confirmed | /images/destinations/sano/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。現行の抽選用旅先データでは未登録の先行画像。 | 旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 一般画面表示OK。現地写真と誤認させない。 |

## グルメ・スポット・映え画像の補足方針

- グルメ画像は料理名と一致するものだけ使い、料理専用画像がない場合は画像なしにします。
- スポット画像は権利確認済みで、スポットや旅先と一致するものだけ使います。
- 映え・トレンドページは、項目専用画像がない場合は画像なしで運用します。Instagram、SNS投稿、外部サイト画像は無断使用しません。
- 店舗・施設画像は、公式素材、自前撮影、利用許諾済み素材のみ追加対象にします。


