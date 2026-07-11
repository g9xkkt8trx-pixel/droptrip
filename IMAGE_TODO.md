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
- 固定hero登録あり: 42件
- 一般画面に表示するconfirmed hero: 30件
- needs_review hero: 10件
- rejected hero: 2件
- missing hero: 78件
- 第1弾SVG作成済み: 16件（一般画面では非表示 / 佐野市先行作成1件を含む）
- 第2弾SVG作成済み: 16件（一般画面では非表示）

## confirmed hero表示対象

下呂市（`/images/destinations/gero-onsen/hero-v2.webp`）、京都市（`/images/destinations/kyoto/hero-v1.webp`）、箱根町（`/images/destinations/hakone/hero-v1.webp`）、小樽市（`/images/destinations/otaru/hero-v1.webp`）、草津町（`/images/destinations/kusatsu/hero-v1.webp`）、金沢市（`/images/destinations/kanazawa/hero-v1.webp`）、鎌倉市（`/images/destinations/kamakura/hero-v2.webp`）、熱海市（`/images/destinations/atami/hero-v2.webp`）、仙台市（`/images/destinations/sendai/hero-v2.webp`）、福岡市（`/images/destinations/fukuoka/hero-v2.webp`）、鳴門市（`/images/destinations/naruto/hero-v1.webp`）、別府市（`/images/destinations/beppu/hero-v1.webp`）、甲府市（`/images/destinations/kofu/hero-v1.webp`）、川越市（`/images/destinations/kawagoe/hero-v1.webp`）、石垣市（`/images/destinations/ishigaki/hero-v1.webp`）、宮古島市（`/images/destinations/miyakojima/hero-v1.webp`）、札幌市（`/images/destinations/sapporo/hero-v1.webp`）、函館市（`/images/destinations/hakodate/hero-v1.webp`）、長崎市（`/images/destinations/nagasaki/hero-v1.webp`）、広島市（`/images/destinations/hiroshima/hero-v1.webp`）、廿日市市（宮島: `/images/destinations/miyajima/hero-v1.webp`）、高山市（`/images/destinations/takayama/hero-v1.webp`）、尾道市（`/images/destinations/onomichi/hero-v1.webp`）、倉敷市（`/images/destinations/kurashiki/hero-v1.webp`）、松江市（`/images/destinations/matsue/hero-v1.webp`）、由布市（湯布院: `/images/destinations/yufuin/hero-v1.webp`）、松山市（道後温泉: `/images/destinations/dogo-onsen/hero-v1.webp`）、神戸市（有馬温泉: `/images/destinations/arima-onsen/hero-v1.webp`）、豊岡市（城崎温泉: `/images/destinations/kinosaki-onsen/hero-v1.webp`）、尾花沢市（銀山温泉: `/images/destinations/ginzan-onsen/hero-v1.webp`）。簡易SVGや画像内文字入りheroは一般画面に表示しません。confirmed画像はGit管理に入れてVercelへ反映し、原因切り分け用の直書き表示ではなく `destinationImages` の正式登録から表示します。

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
| 神奈川県-横浜市 | 横浜市 | 神奈川県 | 港町の景色と多彩なグルメを満喫・海・グルメ | needs_review | /images/destinations/yokohama-hero.jpg | - | unknown | 通常。既存ローカル画像を固定hero候補として管理中。品質確認が完了するまで一般画面では非表示。WebP化と権利確認を継続。 | - | 港町の景色と多彩なグルメを満喫・海・グルメをもとに、汎用背景に見えない高品質hero画像へ作り直す。 |
| 神奈川県-鎌倉市 | 鎌倉市 | 神奈川県 | 江ノ電・海・古都・寺社・紫陽花 | confirmed | /images/destinations/kamakura/hero-v2.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero-v1.webpは画像内テキスト入り、旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 江ノ電、海、古都、寺社、紫陽花を含む鎌倉らしい古都散策のビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 神奈川県-箱根町 | 箱根町 | 神奈川県 | 芦ノ湖・鳥居・山並み・温泉旅 | confirmed | /images/destinations/hakone/hero-v1.webp | - | ai_generated | ユーザー確認済み。高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 芦ノ湖、鳥居、山並み、温泉旅の静かな雰囲気。現地写真ではなく上質な旅行イメージビジュアル。 |
| 栃木県-日光市 | 日光市 | 栃木県 | 世界遺産と豊かな自然を一度に巡る・温泉・山 | needs_review | /images/destinations/nikko-hero.jpg | - | unknown | 通常。既存ローカル画像を固定hero候補として管理中。品質確認が完了するまで一般画面では非表示。WebP化と権利確認を継続。 | - | 世界遺産と豊かな自然を一度に巡る・温泉・山をもとに、汎用背景に見えない高品質hero画像へ作り直す。 |
| 群馬県-草津町 | 草津町 | 群馬県 | 湯畑・湯けむり・温泉街・夜景 | confirmed | /images/destinations/kusatsu/hero-v1.webp | - | ai_generated | ユーザー確認済み。高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 湯畑、湯けむり、温泉街、夜景を含む草津らしい温泉旅の雰囲気。現地写真ではなく上質な旅行イメージビジュアル。 |
| 栃木県-那須塩原市 | 那須塩原市 | 栃木県 | 温泉と自然、高原カフェを満喫・温泉・山 | missing | /images/destinations/destination-006/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 温泉と自然、高原カフェを満喫・温泉・山をもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 宮城県-仙台市 | 仙台市 | 宮城県 | 杜の都・青葉城跡・街と緑・都市景観 | confirmed | /images/destinations/sendai/hero-v2.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero-v1.webpは画像内テキスト入り、旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 街並み、緑、歴史、都市景観を含む仙台らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 宮城県-松島町 | 松島町 | 宮城県 | 日本三景の島々と新鮮な海鮮に出会う・海・グルメ | needs_review | /images/destinations/matsushima-hero.jpg | - | unknown | 通常。既存ローカル画像を固定hero候補として管理中。品質確認が完了するまで一般画面では非表示。WebP化と権利確認を継続。 | - | 日本三景の島々と新鮮な海鮮に出会う・海・グルメをもとに、汎用背景に見えない高品質hero画像へ作り直す。 |
| 青森県-青森市 | 青森市 | 青森県 | ねぶた文化と海の幸、雄大な自然を味わう・海・山 | missing | /images/destinations/destination-009/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | ねぶた文化と海の幸、雄大な自然を味わう・海・山をもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 青森県-弘前市 | 弘前市 | 青森県 | 城下町の洋館とりんごスイーツを巡る・山・グルメ | missing | /images/destinations/destination-010/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 城下町の洋館とりんごスイーツを巡る・山・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 岩手県-盛岡市 | 盛岡市 | 岩手県 | レトロな街並みと三大麺を堪能・山・グルメ | missing | /images/destinations/destination-011/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | レトロな街並みと三大麺を堪能・山・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 福島県-会津若松市 | 会津若松市 | 福島県 | 城下町の歴史と会津グルメに触れる・温泉・山 | needs_review | /images/destinations/aizuwakamatsu-hero.jpg | - | unknown | 通常。既存ローカル画像を固定hero候補として管理中。品質確認が完了するまで一般画面では非表示。WebP化と権利確認を継続。 | - | 城下町の歴史と会津グルメに触れる・温泉・山をもとに、汎用背景に見えない高品質hero画像へ作り直す。 |
| 静岡県-熱海市 | 熱海市 | 静岡県 | 海辺温泉・坂道・リゾート温泉街・夕景 | confirmed | /images/destinations/atami/hero-v2.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero-v1.webpは画像内テキスト入り、旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 海辺温泉、坂道、リゾート温泉街、夕景を含む熱海らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 石川県-金沢市 | 金沢市 | 石川県 | 茶屋街・兼六園・城下町・和の街並み | confirmed | /images/destinations/kanazawa/hero-v1.webp | - | ai_generated | ユーザー確認済み。高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 茶屋街、兼六園、城下町、和の街並みを含む金沢らしい雰囲気。現地写真ではなく上質な旅行イメージビジュアル。 |
| 岐阜県-高山市 | 高山市 | 岐阜県 | 古い町並み・飛騨高山・水路・山並み | confirmed | /images/destinations/takayama/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 古い町並み、飛騨高山、水路、山並みを含む高山らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 長野県-松本市 | 松本市 | 長野県 | 国宝の城と北アルプスの空気を楽しむ・温泉・山 | missing | /images/destinations/destination-016/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 国宝の城と北アルプスの空気を楽しむ・温泉・山をもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 山梨県-富士河口湖町 | 富士河口湖町 | 山梨県 | 富士山と湖の絶景に包まれる・温泉・山 | missing | /images/destinations/destination-017/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 富士山と湖の絶景に包まれる・温泉・山をもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 静岡県-伊豆市 | 伊豆市 | 静岡県 | 温泉郷と伊豆の海山の恵みを味わう・温泉・海 | missing | /images/destinations/destination-018/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 温泉郷と伊豆の海山の恵みを味わう・温泉・海をもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 京都府-京都市 | 京都市 | 京都府 | 寺社・石畳・町家・夕景・京都らしい街並み | confirmed | /images/destinations/kyoto/hero-v1.webp | - | ai_generated | ユーザー確認済み。高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 寺社、石畳、町家、やわらかい夕景を含む京都らしい街並み。現地写真ではなく上質な旅行イメージビジュアル。 |
| 大阪府-大阪市 | 大阪市 | 大阪府 | 活気ある街で食い倒れと夜景を楽しむ・グルメ・カップル向け | missing | /images/destinations/destination-020/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 活気ある街で食い倒れと夜景を楽しむ・グルメ・カップル向けをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 兵庫県-神戸市 | 神戸市 | 兵庫県 | 温泉街・川沿い・夜景・山あいの温泉地 | confirmed | /images/destinations/arima-onsen/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 温泉街、川沿い、夜景、山あいの温泉地を含む有馬温泉らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 奈良県-奈良市 | 奈良市 | 奈良県 | 古寺と鹿に出会う穏やかな古都旅・山・グルメ | needs_review | /images/destinations/nara-hero.jpg | - | unknown | 通常。既存ローカル画像を固定hero候補として管理中。品質確認が完了するまで一般画面では非表示。WebP化と権利確認を継続。 | - | 古寺と鹿に出会う穏やかな古都旅・山・グルメをもとに、汎用背景に見えない高品質hero画像へ作り直す。 |
| 和歌山県-白浜町 | 白浜町 | 和歌山県 | 白い砂浜と温泉、海の絶景を満喫・温泉・海 | needs_review | /images/destinations/shirahama-hero.jpg | - | unknown | 通常。既存ローカル画像を固定hero候補として管理中。品質確認が完了するまで一般画面では非表示。WebP化と権利確認を継続。 | - | 白い砂浜と温泉、海の絶景を満喫・温泉・海をもとに、汎用背景に見えない高品質hero画像へ作り直す。 |
| 兵庫県-豊岡市 | 豊岡市 | 兵庫県 | 柳並木・外湯めぐり・川沿い温泉街・夜の灯り | confirmed | /images/destinations/kinosaki-onsen/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 柳並木、外湯めぐり、川沿い温泉街、夜の灯りを含む城崎温泉らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 福岡県-福岡市 | 福岡市 | 福岡県 | 屋台・夜景・博多グルメ・川沿い | confirmed | /images/destinations/fukuoka/hero-v2.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero-v1.webpは画像内テキスト入り、旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 屋台、夜景、博多グルメ、川沿いを含む福岡らしい夜のビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 長崎県-長崎市 | 長崎市 | 長崎県 | 港町・坂の街・夜景・異国情緒 | confirmed | /images/destinations/nagasaki/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 港町、坂の街、夜景、異国情緒を含む長崎らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 大分県-別府市 | 別府市 | 大分県 | 湯けむり・温泉街・地獄めぐり・山並み | confirmed | /images/destinations/beppu/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 湯けむり、温泉街、地獄めぐり、山並みを含む別府らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 大分県-由布市 | 由布市 | 大分県 | 由布岳・金鱗湖・湯けむり・温泉街・朝夕の光 | confirmed | /images/destinations/yufuin/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 由布岳、金鱗湖、湯けむり、温泉街、朝夕の光を含む湯布院らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 熊本県-熊本市 | 熊本市 | 熊本県 | 名城と熊本の郷土料理を満喫・山・グルメ | missing | /images/destinations/destination-029/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 名城と熊本の郷土料理を満喫・山・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 鹿児島県-鹿児島市 | 鹿児島市 | 鹿児島県 | 桜島の雄大な景色と薩摩の味を楽しむ・温泉・海 | missing | /images/destinations/destination-030/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 桜島の雄大な景色と薩摩の味を楽しむ・温泉・海をもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 北海道-札幌市 | 札幌市 | 北海道 | 大通公園・札幌テレビ塔・花壇・都市と自然 | confirmed | /images/destinations/sapporo/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 大通公園、札幌テレビ塔、花壇、都市と自然を含む札幌らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 北海道-函館市 | 函館市 | 北海道 | 函館山夜景・港町・海辺・夕景 | confirmed | /images/destinations/hakodate/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 函館山夜景、港町、海辺、夕景を含む函館らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 北海道-小樽市 | 小樽市 | 北海道 | 小樽運河・倉庫群・ガス灯・港町・夕景 | confirmed | /images/destinations/otaru/hero-v1.webp | - | ai_generated | ユーザー確認済み。高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 小樽運河、倉庫群、ガス灯、港町、夕景を含む街歩きの雰囲気。現地写真ではなく上質な旅行イメージビジュアル。 |
| 東京都-台東区 | 台東区 | 東京都 | 浅草の下町文化と上野の名所を巡る・グルメ・カップル向け | missing | /images/destinations/destination-034/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 浅草の下町文化と上野の名所を巡る・グルメ・カップル向けをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 千葉県-浦安市 | 浦安市 | 千葉県 | テーマパークと東京湾の景色を満喫・海・グルメ | missing | /images/destinations/destination-035/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | テーマパークと東京湾の景色を満喫・海・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 埼玉県-秩父市 | 秩父市 | 埼玉県 | 渓谷と寺社、自然豊かな里山を巡る・温泉・山 | missing | /images/destinations/destination-036/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 渓谷と寺社、自然豊かな里山を巡る・温泉・山をもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 愛知県-名古屋市 | 名古屋市 | 愛知県 | 名城と個性豊かな名古屋めしを楽しむ・グルメ・カップル向け | missing | /images/destinations/destination-037/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 名城と個性豊かな名古屋めしを楽しむ・グルメ・カップル向けをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 岐阜県-下呂市 | 下呂市 | 岐阜県 | 川沿いの温泉街・湯けむり・夕景・旅館街 | confirmed | /images/destinations/gero-onsen/hero-v2.webp | - | ai_generated | ユーザー確認済み。高品質AI生成hero画像として第1号confirmed登録。スマホキャッシュ対策としてファイル名をhero-v2.webpへ変更。 | 旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 川沿いの温泉街、湯けむり、足湯、やわらかい夕方の光、浴衣で散策したくなる雰囲気。現地写真ではなく上質な旅行イメージビジュアル。 |
| 岐阜県-白川村 | 白川村 | 岐阜県 | 世界遺産の合掌造り集落と山里の景色を楽しむ・山・グルメ | missing | /images/destinations/destination-039/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 世界遺産の合掌造り集落と山里の景色を楽しむ・山・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 広島県-広島市 | 広島市 | 広島県 | 川沿い・平和記念公園・都市景観・橋 | confirmed | /images/destinations/hiroshima/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 川沿い、平和記念公園、都市景観、橋を含む広島らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 広島県-廿日市市 | 廿日市市 | 広島県 | 海上鳥居・瀬戸内海・厳島神社・島旅 | confirmed | /images/destinations/miyajima/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 海上鳥居、瀬戸内海、厳島神社、島旅を含む宮島らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 岡山県-倉敷市 | 倉敷市 | 岡山県 | 美観地区・白壁の町並み・柳並木・川舟 | confirmed | /images/destinations/kurashiki/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 美観地区、白壁の町並み、柳並木、川舟を含む倉敷らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 鳥取県-鳥取市 | 鳥取市 | 鳥取県 | 雄大な砂丘と日本海の味覚を満喫・海・山 | missing | /images/destinations/destination-043/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 雄大な砂丘と日本海の味覚を満喫・海・山をもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 香川県-高松市 | 高松市 | 香川県 | 瀬戸内の景色と本場の讃岐うどんを楽しむ・海・グルメ | missing | /images/destinations/destination-044/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 瀬戸内の景色と本場の讃岐うどんを楽しむ・海・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 愛媛県-松山市 | 松山市 | 愛媛県 | 道後温泉本館・温泉街・レトロ建築・夕景 | confirmed | /images/destinations/dogo-onsen/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 道後温泉本館、温泉街、レトロ建築、夕景を含む道後温泉らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 高知県-高知市 | 高知市 | 高知県 | 太平洋の景色とカツオ料理を味わう・海・山 | missing | /images/destinations/destination-046/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 太平洋の景色とカツオ料理を味わう・海・山をもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 沖縄県-那覇市 | 那覇市 | 沖縄県 | 琉球の歴史と南国グルメを満喫・海・グルメ | needs_review | /images/destinations/naha-hero.jpg | - | unknown | 通常。既存ローカル画像を固定hero候補として管理中。品質確認が完了するまで一般画面では非表示。WebP化と権利確認を継続。 | - | 琉球の歴史と南国グルメを満喫・海・グルメをもとに、汎用背景に見えない高品質hero画像へ作り直す。 |
| 沖縄県-石垣市 | 石垣市 | 沖縄県 | 青い海・白い砂浜・南国植物・島旅 | confirmed | /images/destinations/ishigaki/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 青い海、白い砂浜、南国植物、島旅を含む石垣らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 宮崎県-宮崎市 | 宮崎市 | 宮崎県 | 南国の海岸線と宮崎グルメを楽しむ・海・山 | missing | /images/destinations/destination-049/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 南国の海岸線と宮崎グルメを楽しむ・海・山をもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 長崎県-佐世保市 | 佐世保市 | 長崎県 | 九十九島の絶景と港町グルメを満喫・海・グルメ | missing | /images/destinations/destination-050/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 九十九島の絶景と港町グルメを満喫・海・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 秋田県-秋田市 | 秋田市 | 秋田県 | 駅周辺・夏,秋・グルメ・海 | missing | /images/destinations/destination-051/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅周辺・夏,秋・グルメ・海をもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 秋田県-仙北市 | 仙北市 | 秋田県 | 駅から観光エリアへの移動時間を加算・春,秋,冬・山・温泉 | missing | /images/destinations/destination-052/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から観光エリアへの移動時間を加算・春,秋,冬・山・温泉をもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 山形県-山形市 | 山形市 | 山形県 | 駅から山寺方面への移動時間を加算・春,夏,秋・山・グルメ | missing | /images/destinations/destination-053/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から山寺方面への移動時間を加算・春,夏,秋・山・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 山形県-尾花沢市 | 尾花沢市 | 山形県 | 雪景色・木造旅館街・ガス灯・大正ロマン | confirmed | /images/destinations/ginzan-onsen/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 雪景色、木造旅館街、ガス灯、大正ロマンを含む銀山温泉らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 茨城県-水戸市 | 水戸市 | 茨城県 | 駅から観光エリアへの移動時間を加算・春,秋・グルメ・カップル向け | missing | /images/destinations/destination-055/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から観光エリアへの移動時間を加算・春,秋・グルメ・カップル向けをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 茨城県-大洗町 | 大洗町 | 茨城県 | 駅から海辺の観光地への移動時間を加算・春,夏・海・グルメ | missing | /images/destinations/destination-056/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から海辺の観光地への移動時間を加算・春,夏・海・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 新潟県-新潟市 | 新潟市 | 新潟県 | 駅から港エリアへの移動時間を加算・春,夏,秋・海・グルメ | missing | /images/destinations/destination-057/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から港エリアへの移動時間を加算・春,夏,秋・海・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 新潟県-湯沢町 | 湯沢町 | 新潟県 | 駅周辺・夏,秋,冬・温泉・山 | missing | /images/destinations/destination-058/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅周辺・夏,秋,冬・温泉・山をもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 富山県-富山市 | 富山市 | 富山県 | 駅から中心市街地への移動時間を加算・春,秋,冬・山・グルメ | missing | /images/destinations/destination-059/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から中心市街地への移動時間を加算・春,秋,冬・山・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 富山県-立山町 | 立山町 | 富山県 | 山岳観光の乗り換え時間を加算・夏,秋・山・温泉 | missing | /images/destinations/destination-060/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 山岳観光の乗り換え時間を加算・夏,秋・山・温泉をもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 福井県-福井市 | 福井市 | 福井県 | 駅から中心市街地への移動時間を加算・春,秋・グルメ・カップル向け | missing | /images/destinations/destination-061/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から中心市街地への移動時間を加算・春,秋・グルメ・カップル向けをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 福井県-坂井市 | 坂井市 | 福井県 | 最寄り駅からバス・車移動が必要・春,夏,秋・海・グルメ | missing | /images/destinations/destination-062/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 最寄り駅からバス・車移動が必要・春,夏,秋・海・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 三重県-伊勢市 | 伊勢市 | 三重県 | 駅から内宮方面への移動時間を加算・春,秋・グルメ・カップル向け | needs_review | /images/destinations/ise-hero.jpg | - | unknown | 通常。既存ローカル画像を固定hero候補として管理中。品質確認が完了するまで一般画面では非表示。WebP化と権利確認を継続。 | - | 駅から内宮方面への移動時間を加算・春,秋・グルメ・カップル向けをもとに、汎用背景に見えない高品質hero画像へ作り直す。 |
| 三重県-鳥羽市 | 鳥羽市 | 三重県 | 駅から海辺の観光地への移動時間を加算・春,夏,秋・海・温泉 | missing | /images/destinations/destination-064/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から海辺の観光地への移動時間を加算・春,夏,秋・海・温泉をもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 滋賀県-大津市 | 大津市 | 滋賀県 | 駅から琵琶湖畔への移動時間を加算・春,夏,秋・海・グルメ | missing | /images/destinations/destination-065/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から琵琶湖畔への移動時間を加算・春,夏,秋・海・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 滋賀県-高島市 | 高島市 | 滋賀県 | 最寄り駅からバス・車移動が必要・春,夏,秋・山・カップル向け | missing | /images/destinations/destination-066/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 最寄り駅からバス・車移動が必要・春,夏,秋・山・カップル向けをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 島根県-松江市 | 松江市 | 島根県 | 松江城・宍道湖・水辺の街・城下町 | confirmed | /images/destinations/matsue/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 松江城、宍道湖、水辺の街、城下町を含む松江らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 島根県-出雲市 | 出雲市 | 島根県 | 駅から出雲大社への移動時間を加算・春,秋・海・グルメ | missing | /images/destinations/destination-068/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から出雲大社への移動時間を加算・春,秋・海・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 山口県-下関市 | 下関市 | 山口県 | 駅から唐戸エリアへの移動時間を加算・春,夏,秋・海・グルメ | missing | /images/destinations/destination-069/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から唐戸エリアへの移動時間を加算・春,夏,秋・海・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 山口県-萩市 | 萩市 | 山口県 | 駅から城下町への移動時間を加算・春,秋・海・グルメ | missing | /images/destinations/destination-070/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から城下町への移動時間を加算・春,秋・海・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 徳島県-鳴門市 | 鳴門市 | 徳島県 | 鳴門海峡・渦潮・橋・海 | confirmed | /images/destinations/naruto/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 鳴門海峡、渦潮、橋、海を含む鳴門らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 徳島県-三好市 | 三好市 | 徳島県 | 山間部のため駅からバス・車移動が必要・夏,秋・山・温泉 | missing | /images/destinations/destination-072/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 山間部のため駅からバス・車移動が必要・夏,秋・山・温泉をもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 佐賀県-佐賀市 | 佐賀市 | 佐賀県 | 駅から中心市街地への移動時間を加算・春,秋・グルメ・カップル向け | missing | /images/destinations/destination-073/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から中心市街地への移動時間を加算・春,秋・グルメ・カップル向けをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 佐賀県-嬉野市 | 嬉野市 | 佐賀県 | 駅から温泉街への移動時間を加算・秋,冬・温泉・グルメ | missing | /images/destinations/destination-074/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から温泉街への移動時間を加算・秋,冬・温泉・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 長野県-長野市 | 長野市 | 長野県 | 駅から善光寺への移動時間を加算・春,秋,冬・山・グルメ | missing | /images/destinations/destination-075/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から善光寺への移動時間を加算・春,秋,冬・山・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 長野県-軽井沢町 | 軽井沢町 | 長野県 | 駅から旧軽井沢への移動時間を加算・春,夏,秋・山・グルメ | needs_review | /images/destinations/karuizawa-hero.jpg | - | unknown | 通常。既存ローカル画像を固定hero候補として管理中。品質確認が完了するまで一般画面では非表示。WebP化と権利確認を継続。 | - | 駅から旧軽井沢への移動時間を加算・春,夏,秋・山・グルメをもとに、汎用背景に見えない高品質hero画像へ作り直す。 |
| 静岡県-静岡市 | 静岡市 | 静岡県 | 駅から日本平方面への移動時間を加算・春,秋・海・山 | missing | /images/destinations/destination-077/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から日本平方面への移動時間を加算・春,秋・海・山をもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 静岡県-浜松市 | 浜松市 | 静岡県 | 駅から浜名湖方面への移動時間を加算・春,夏・海・グルメ | missing | /images/destinations/destination-078/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から浜名湖方面への移動時間を加算・春,夏・海・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 福岡県-北九州市 | 北九州市 | 福岡県 | 駅周辺・春,秋,冬・海・グルメ | missing | /images/destinations/destination-079/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅周辺・春,秋,冬・海・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 熊本県-阿蘇市 | 阿蘇市 | 熊本県 | 山間部のため駅からバス・車移動が必要・春,夏,秋・山・温泉 | missing | /images/destinations/destination-080/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 山間部のため駅からバス・車移動が必要・春,夏,秋・山・温泉をもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 北海道-釧路市 | 釧路市 | 北海道 | 駅から湿原方面への移動時間を加算・夏,秋,冬・海・グルメ | missing | /images/destinations/destination-081/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から湿原方面への移動時間を加算・夏,秋,冬・海・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 沖縄県-宮古島市 | 宮古島市 | 沖縄県 | 宮古ブルー・橋・白砂・リゾート感 | confirmed | /images/destinations/miyakojima/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 宮古ブルー、橋、白砂、リゾート感を含む宮古島らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 北海道-富良野市 | 富良野市 | 北海道 | 駅から丘陵・花畑エリアへの移動時間を加算・夏,秋・山・グルメ | needs_review | /images/destinations/furano-hero.jpg | - | unknown | 通常。既存ローカル画像を固定hero候補として管理中。品質確認が完了するまで一般画面では非表示。WebP化と権利確認を継続。 | - | 駅から丘陵・花畑エリアへの移動時間を加算・夏,秋・山・グルメをもとに、汎用背景に見えない高品質hero画像へ作り直す。 |
| 北海道-登別市 | 登別市 | 北海道 | 最寄り駅から温泉街への移動時間を加算・秋,冬・温泉・山 | missing | /images/destinations/destination-084/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 最寄り駅から温泉街への移動時間を加算・秋,冬・温泉・山をもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 東京都-渋谷区 | 渋谷区 | 東京都 | 駅周辺・春,秋,冬・グルメ・カップル向け | missing | /images/destinations/destination-085/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅周辺・春,秋,冬・グルメ・カップル向けをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 神奈川県-小田原市 | 小田原市 | 神奈川県 | 駅から城址公園への移動時間を加算・春,夏,秋・海・グルメ | missing | /images/destinations/destination-086/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から城址公園への移動時間を加算・春,夏,秋・海・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 京都府-宇治市 | 宇治市 | 京都府 | 駅から平等院周辺への移動時間を加算・春,夏,秋・山・グルメ | missing | /images/destinations/destination-087/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から平等院周辺への移動時間を加算・春,夏,秋・山・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 広島県-尾道市 | 尾道市 | 広島県 | 坂道・瀬戸内海・港町・夕景・レトロな街並み | confirmed | /images/destinations/onomichi/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 坂道、瀬戸内海、港町、夕景、レトロな街並みを含む尾道らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 鹿児島県-指宿市 | 指宿市 | 鹿児島県 | 駅から温泉・海辺エリアへの移動時間を加算・秋,冬・温泉・海 | missing | /images/destinations/destination-089/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から温泉・海辺エリアへの移動時間を加算・秋,冬・温泉・海をもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 岩手県-平泉町 | 平泉町 | 岩手県 | 駅から世界遺産エリアへの移動時間を加算・春,夏,秋・山・グルメ | missing | /images/destinations/destination-090/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から世界遺産エリアへの移動時間を加算・春,夏,秋・山・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 栃木県-那須町 | 那須町 | 栃木県 | 高原エリアはバス・車移動を想定・春,夏,秋・山・温泉 | missing | /images/destinations/destination-091/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 高原エリアはバス・車移動を想定・春,夏,秋・山・温泉をもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 栃木県-足利市 | 足利市 | 栃木県 | 駅から中心部へ徒歩・バスで移動しやすい・春,秋・グルメ・カップル向け | missing | /images/destinations/destination-092/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から中心部へ徒歩・バスで移動しやすい・春,秋・グルメ・カップル向けをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 埼玉県-川越市 | 川越市 | 埼玉県 | 蔵造り・時の鐘・小江戸・レトロ街歩き | confirmed | /images/destinations/kawagoe/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 蔵造り、時の鐘、小江戸、レトロ街歩きを含む川越らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 千葉県-館山市 | 館山市 | 千葉県 | 駅から海辺や市街地へ移動しやすい・春,夏,秋・海・グルメ | missing | /images/destinations/destination-094/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から海辺や市街地へ移動しやすい・春,夏,秋・海・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 東京都-奥多摩町 | 奥多摩町 | 東京都 | 駅から渓谷散策を始めやすい・春,夏,秋・山・カップル向け | missing | /images/destinations/destination-095/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から渓谷散策を始めやすい・春,夏,秋・山・カップル向けをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 山形県-上山市 | 上山市 | 山形県 | 駅周辺に温泉街がまとまる・春,秋,冬・温泉・山 | missing | /images/destinations/destination-096/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅周辺に温泉街がまとまる・春,秋,冬・温泉・山をもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 山形県-酒田市 | 酒田市 | 山形県 | 駅から市街地・港方面へ移動しやすい・春,夏,秋・海・グルメ | missing | /images/destinations/destination-097/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から市街地・港方面へ移動しやすい・春,夏,秋・海・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 岩手県-花巻市 | 花巻市 | 岩手県 | 温泉郷へはバス・車移動を想定・春,秋,冬・温泉・山 | missing | /images/destinations/destination-098/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 温泉郷へはバス・車移動を想定・春,秋,冬・温泉・山をもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 青森県-八戸市 | 八戸市 | 青森県 | 中心街・港方面へバス移動を想定・春,夏,秋・海・グルメ | missing | /images/destinations/destination-099/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 中心街・港方面へバス移動を想定・春,夏,秋・海・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 福島県-郡山市 | 郡山市 | 福島県 | 駅周辺を起点にしやすい・春,秋,冬・グルメ・カップル向け | missing | /images/destinations/destination-100/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅周辺を起点にしやすい・春,秋,冬・グルメ・カップル向けをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 長野県-上田市 | 上田市 | 長野県 | 上田城跡・真田・城下町・信州の山並み | rejected | /images/destinations/ueda/hero.svg | - | ai_generated | 作成済みだが一般画面非表示。高品質画像で再作成する。 | 簡易SVGのため一般画面非表示。旅先固有要素と旅行アプリheroとしての魅力を高品質画像で再作成する。 | 上田城跡・真田・城下町・信州の山並みをもとに、汎用背景に見えない高品質hero画像へ作り直す。 |
| 岐阜県-郡上市 | 郡上市 | 岐阜県 | 市街地へは徒歩・バス移動を想定・春,夏,秋・山・グルメ | missing | /images/destinations/destination-102/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 市街地へは徒歩・バス移動を想定・春,夏,秋・山・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 福井県-敦賀市 | 敦賀市 | 福井県 | 駅から中心部・港方面へ移動しやすい・春,夏,秋・海・グルメ | missing | /images/destinations/destination-103/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から中心部・港方面へ移動しやすい・春,夏,秋・海・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 山梨県-甲府市 | 甲府市 | 山梨県 | 甲府城跡・山並み・都市景観・自然 | confirmed | /images/destinations/kofu/hero-v1.webp | - | ai_generated | ユーザー確認済み。文字なし高品質AI生成hero画像としてconfirmed登録。 | 旧hero.svgは簡易SVGのため未使用 / rejected扱い。一般画面では使わない。 | 甲府城跡、山並み、都市景観、自然を含む甲府らしいビジュアル。現地写真ではなく上質な旅行イメージビジュアル。 |
| 静岡県-三島市 | 三島市 | 静岡県 | 駅から水辺の散策路へ歩きやすい・春,夏,秋・グルメ・カップル向け | missing | /images/destinations/destination-105/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から水辺の散策路へ歩きやすい・春,夏,秋・グルメ・カップル向けをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 京都府-舞鶴市 | 舞鶴市 | 京都府 | 駅から赤れんがエリアへ移動しやすい・春,夏,秋・海・グルメ | missing | /images/destinations/destination-106/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から赤れんがエリアへ移動しやすい・春,夏,秋・海・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 兵庫県-明石市 | 明石市 | 兵庫県 | 駅から商店街・城跡へ歩きやすい・春,夏,秋・海・グルメ | missing | /images/destinations/destination-108/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から商店街・城跡へ歩きやすい・春,夏,秋・海・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 滋賀県-彦根市 | 彦根市 | 滋賀県 | 駅から城下町へ移動しやすい・春,秋,冬・山・グルメ | missing | /images/destinations/destination-109/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から城下町へ移動しやすい・春,秋,冬・山・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 和歌山県-和歌山市 | 和歌山市 | 和歌山県 | 駅から中心部へ移動しやすい・春,夏,秋・海・グルメ | missing | /images/destinations/destination-110/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から中心部へ移動しやすい・春,夏,秋・海・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 岡山県-津山市 | 津山市 | 岡山県 | 駅から城跡・中心街へ移動しやすい・春,秋,冬・グルメ・カップル向け | missing | /images/destinations/destination-111/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から城跡・中心街へ移動しやすい・春,秋,冬・グルメ・カップル向けをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 山口県-山口市 | 山口市 | 山口県 | 市街地・温泉街へバス移動を想定・春,秋,冬・山・グルメ | missing | /images/destinations/destination-112/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 市街地・温泉街へバス移動を想定・春,秋,冬・山・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 広島県-竹原市 | 竹原市 | 広島県 | 駅から町並み保存地区へ歩きやすい・春,秋,冬・グルメ・カップル向け | missing | /images/destinations/destination-113/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から町並み保存地区へ歩きやすい・春,秋,冬・グルメ・カップル向けをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 香川県-丸亀市 | 丸亀市 | 香川県 | 駅から城下町へ移動しやすい・春,秋,冬・グルメ・カップル向け | missing | /images/destinations/destination-114/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から城下町へ移動しやすい・春,秋,冬・グルメ・カップル向けをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 愛媛県-今治市 | 今治市 | 愛媛県 | 駅から市街地・港方面へ移動しやすい・春,夏,秋・海・グルメ | missing | /images/destinations/destination-115/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から市街地・港方面へ移動しやすい・春,夏,秋・海・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 徳島県-徳島市 | 徳島市 | 徳島県 | 駅周辺を起点にしやすい・春,夏,秋・グルメ・カップル向け | missing | /images/destinations/destination-116/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅周辺を起点にしやすい・春,夏,秋・グルメ・カップル向けをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 熊本県-天草市 | 天草市 | 熊本県 | 天草方面は車・バス移動を想定・春,夏,秋・海・グルメ | missing | /images/destinations/destination-117/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 天草方面は車・バス移動を想定・春,夏,秋・海・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 長崎県-島原市 | 島原市 | 長崎県 | 駅から湧水エリアへ歩きやすい・春,秋,冬・温泉・グルメ | missing | /images/destinations/destination-118/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 駅から湧水エリアへ歩きやすい・春,秋,冬・温泉・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 宮崎県-日南市 | 日南市 | 宮崎県 | 海岸線は車・バス移動を想定・春,夏,秋・海・グルメ | missing | /images/destinations/destination-119/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 海岸線は車・バス移動を想定・春,夏,秋・海・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 沖縄県-本部町 | 本部町 | 沖縄県 | 空港から車・バス移動を想定・春,夏,秋・海・グルメ | missing | /images/destinations/destination-120/hero.webp | - | unknown | 未作成。候補画像作成待ち。 | - | 空港から車・バス移動を想定・春,夏,秋・海・グルメをもとに、旅先固有要素が2つ以上伝わる高品質hero画像を作成。 |
| 栃木県-佐野市 | 佐野市 | 栃木県 | 佐野ラーメン・厄除け大師・日帰り街歩き | rejected | /images/destinations/sano/hero.svg | - | ai_generated | 作成済みだが一般画面非表示。高品質画像で再作成する。 | 簡易SVGのため一般画面非表示。旅先固有要素と旅行アプリheroとしての魅力を高品質画像で再作成する。 | 佐野ラーメン・厄除け大師・日帰り街歩きをもとに、汎用背景に見えない高品質hero画像へ作り直す。 |

## グルメ・スポット・映え画像の補足方針

- グルメ画像は料理名と一致するものだけ使い、料理専用画像がない場合は画像なしにします。
- スポット画像は権利確認済みで、スポットや旅先と一致するものだけ使います。
- 映え・トレンドページは、項目専用画像がない場合は画像なしで運用します。Instagram、SNS投稿、外部サイト画像は無断使用しません。
- 店舗・施設画像は、公式素材、自前撮影、利用許諾済み素材のみ追加対象にします。


