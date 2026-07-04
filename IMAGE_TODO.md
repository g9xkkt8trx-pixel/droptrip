# DROPTRIP 画像改善TODO

DROPTRIPの旅先画像は、カテゴリ代替やランダム表示ではなく、旅先ごとの専用hero画像を固定表示する方針です。外部画像取得、直リンク、権利不明画像は使いません。

## 旅先固定hero画像の運用ルール

- 結果画面のhero画像は `destination_fixed` の旅先専用画像がある場合だけ表示します。
- `category fallback`、`generic`、`common`、ランダム画像は一般結果画面のheroに使いません。
- 画像がない旅先では画像セクションを出さず、「写真準備中」も一般画面に出しません。
- 旅先イメージ画像は `destination.id` で `destinationImages` の対応表へ登録します。
- イメージ画像やAI生成画像を使う場合は `isIllustration: true`、`type: "destination_fixed"`、`status: "needs_review"` を付け、altは「〇〇をイメージしたビジュアル」とします。
- 現地写真とは書かず、現地写真と誤認させる説明を避けます。
- 画像ファイルは `public/images/destinations/{slug}/hero.webp` を推奨します。既存jpgは移行完了まで固定heroとして管理します。

## 画像サイズ・形式ルール

- WebP優先、jpgも可、pngは必要な場合のみ。
- 横幅は1200px前後、比率は16:9または4:3を目安にします。
- 1枚あたり100KB〜400KB程度、最大でも1MB未満を目標にします。
- ファイル名・フォルダ名は英数字とハイフンで統一し、日本語ファイル名は避けます。

## 現在の整備状況

- 現在の登録旅先: 119件
- 固定hero画像あり: 35件
- 固定hero画像なし: 84件
- 第1弾SVG作成済み: 16件（現行登録旅先で表示対象15件 + 佐野市先行作成1件）

## 第1弾 SVG固定hero作成済み

下呂市、京都市、小樽市、箱根町、草津町、熱海市、金沢市、鎌倉市、仙台市、福岡市、鳴門市、別府市、甲府市、川越市、佐野市、上田市に軽量SVGの旅先イメージビジュアルを追加しました。佐野市は現行の旅行先データには未登録ですが、画像ファイルと `destinationImages` 側の対応は先行作成済みです。

## 第2弾候補

石垣市、宮古島市、札幌市、函館市、長崎市、広島市、廿日市市、高山市、尾道市、倉敷市、松江市、由布市、松山市、神戸市、豊岡市、尾花沢市。

## 全旅先 hero画像管理表

| id | 旅先名 | 都道府県 | 必要画像テーマ | 状態 | ファイル | status | メモ |
|---|---|---|---|---|---|---|---|
| 神奈川県-横浜市 | 横浜市 | 神奈川県 | 港町の景色と多彩なグルメを満喫・海・グルメ | 既存jpgあり / 要確認 | /images/destinations/yokohama-hero.jpg | needs_review | 通常。既存ローカル画像を固定heroとして使用中。WebP化と権利確認を継続。 |
| 神奈川県-鎌倉市 | 鎌倉市 | 神奈川県 | 鶴岡八幡宮・江ノ電・海・古都散策 | 第1弾SVG作成済み | /images/destinations/kamakura/hero.svg | needs_review | 最優先。現地写真ではなく旅先イメージビジュアルとして固定表示。 |
| 神奈川県-箱根町 | 箱根町 | 神奈川県 | 芦ノ湖・箱根神社・山並み・温泉 | 第1弾SVG作成済み | /images/destinations/hakone/hero.svg | needs_review | 最優先。現地写真ではなく旅先イメージビジュアルとして固定表示。 |
| 栃木県-日光市 | 日光市 | 栃木県 | 世界遺産と豊かな自然を一度に巡る・温泉・山 | 既存jpgあり / 要確認 | /images/destinations/nikko-hero.jpg | needs_review | 通常。既存ローカル画像を固定heroとして使用中。WebP化と権利確認を継続。 |
| 群馬県-草津町 | 草津町 | 群馬県 | 湯畑・湯けむり・温泉街・夜の灯り | 第1弾SVG作成済み | /images/destinations/kusatsu/hero.svg | needs_review | 最優先。現地写真ではなく旅先イメージビジュアルとして固定表示。 |
| 栃木県-那須塩原市 | 那須塩原市 | 栃木県 | 温泉と自然、高原カフェを満喫・温泉・山 | 未作成 | /images/destinations/destination-006/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 宮城県-仙台市 | 仙台市 | 宮城県 | 杜の都・青葉城跡・牛タン・街と緑 | 第1弾SVG作成済み | /images/destinations/sendai/hero.svg | needs_review | 最優先。現地写真ではなく旅先イメージビジュアルとして固定表示。 |
| 宮城県-松島町 | 松島町 | 宮城県 | 日本三景の島々と新鮮な海鮮に出会う・海・グルメ | 既存jpgあり / 要確認 | /images/destinations/matsushima-hero.jpg | needs_review | 通常。既存ローカル画像を固定heroとして使用中。WebP化と権利確認を継続。 |
| 青森県-青森市 | 青森市 | 青森県 | ねぶた文化と海の幸、雄大な自然を味わう・海・山 | 未作成 | /images/destinations/destination-009/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 青森県-弘前市 | 弘前市 | 青森県 | 城下町の洋館とりんごスイーツを巡る・山・グルメ | 未作成 | /images/destinations/destination-010/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 岩手県-盛岡市 | 盛岡市 | 岩手県 | レトロな街並みと三大麺を堪能・山・グルメ | 未作成 | /images/destinations/destination-011/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 福島県-会津若松市 | 会津若松市 | 福島県 | 城下町の歴史と会津グルメに触れる・温泉・山 | 既存jpgあり / 要確認 | /images/destinations/aizuwakamatsu-hero.jpg | needs_review | 通常。既存ローカル画像を固定heroとして使用中。WebP化と権利確認を継続。 |
| 静岡県-熱海市 | 熱海市 | 静岡県 | 海・温泉街・坂道・レトロ観光地 | 第1弾SVG作成済み | /images/destinations/atami/hero.svg | needs_review | 最優先。現地写真ではなく旅先イメージビジュアルとして固定表示。 |
| 石川県-金沢市 | 金沢市 | 石川県 | 兼六園・ひがし茶屋街・金箔感・しっとりした街並み | 第1弾SVG作成済み | /images/destinations/kanazawa/hero.svg | needs_review | 最優先。現地写真ではなく旅先イメージビジュアルとして固定表示。 |
| 岐阜県-高山市 | 高山市 | 岐阜県 | 古い町並みと飛騨の味覚を堪能・温泉・山 | 既存jpgあり / 要確認 | /images/destinations/takayama-hero.jpg | needs_review | 次点。既存ローカル画像を固定heroとして使用中。WebP化と権利確認を継続。 |
| 長野県-松本市 | 松本市 | 長野県 | 国宝の城と北アルプスの空気を楽しむ・温泉・山 | 未作成 | /images/destinations/destination-016/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 山梨県-富士河口湖町 | 富士河口湖町 | 山梨県 | 富士山と湖の絶景に包まれる・温泉・山 | 未作成 | /images/destinations/destination-017/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 静岡県-伊豆市 | 伊豆市 | 静岡県 | 温泉郷と伊豆の海山の恵みを味わう・温泉・海 | 未作成 | /images/destinations/destination-018/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 京都府-京都市 | 京都市 | 京都府 | 寺社・石畳・町家・和の雰囲気 | 第1弾SVG作成済み | /images/destinations/kyoto/hero.svg | needs_review | 最優先。現地写真ではなく旅先イメージビジュアルとして固定表示。 |
| 大阪府-大阪市 | 大阪市 | 大阪府 | 活気ある街で食い倒れと夜景を楽しむ・グルメ・カップル向け | 未作成 | /images/destinations/destination-020/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 兵庫県-神戸市 | 神戸市 | 兵庫県 | 港町の異国情緒と夜景にときめく・海・山 | 未作成 | /images/destinations/destination-021/hero.webp | missing | 次点。専用hero作成後に destinationImages の対応表へ登録。 |
| 奈良県-奈良市 | 奈良市 | 奈良県 | 古寺と鹿に出会う穏やかな古都旅・山・グルメ | 既存jpgあり / 要確認 | /images/destinations/nara-hero.jpg | needs_review | 通常。既存ローカル画像を固定heroとして使用中。WebP化と権利確認を継続。 |
| 和歌山県-白浜町 | 白浜町 | 和歌山県 | 白い砂浜と温泉、海の絶景を満喫・温泉・海 | 既存jpgあり / 要確認 | /images/destinations/shirahama-hero.jpg | needs_review | 通常。既存ローカル画像を固定heroとして使用中。WebP化と権利確認を継続。 |
| 兵庫県-豊岡市 | 豊岡市 | 兵庫県 | 城崎温泉の外湯と日本海の味覚を楽しむ・温泉・海 | 未作成 | /images/destinations/destination-024/hero.webp | missing | 次点。専用hero作成後に destinationImages の対応表へ登録。 |
| 福岡県-福岡市 | 福岡市 | 福岡県 | 屋台・博多ラーメン・夜の街・港町感 | 第1弾SVG作成済み | /images/destinations/fukuoka/hero.svg | needs_review | 最優先。現地写真ではなく旅先イメージビジュアルとして固定表示。 |
| 長崎県-長崎市 | 長崎市 | 長崎県 | 異国情緒ある坂の街と夜景を巡る・海・グルメ | 既存jpgあり / 要確認 | /images/destinations/nagasaki-hero.jpg | needs_review | 次点。既存ローカル画像を固定heroとして使用中。WebP化と権利確認を継続。 |
| 大分県-別府市 | 別府市 | 大分県 | 湯けむり・地獄めぐり・温泉街・坂のある街 | 第1弾SVG作成済み | /images/destinations/beppu/hero.svg | needs_review | 最優先。現地写真ではなく旅先イメージビジュアルとして固定表示。 |
| 大分県-由布市 | 由布市 | 大分県 | 由布岳を望む温泉街とカフェを散策・温泉・山 | 未作成 | /images/destinations/destination-028/hero.webp | missing | 次点。専用hero作成後に destinationImages の対応表へ登録。 |
| 熊本県-熊本市 | 熊本市 | 熊本県 | 名城と熊本の郷土料理を満喫・山・グルメ | 未作成 | /images/destinations/destination-029/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 鹿児島県-鹿児島市 | 鹿児島市 | 鹿児島県 | 桜島の雄大な景色と薩摩の味を楽しむ・温泉・海 | 未作成 | /images/destinations/destination-030/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 北海道-札幌市 | 札幌市 | 北海道 | 時計台や市場を巡り、札幌グルメを満喫・山・グルメ | 既存jpgあり / 要確認 | /images/destinations/sapporo-hero.jpg | needs_review | 次点。既存ローカル画像を固定heroとして使用中。WebP化と権利確認を継続。 |
| 北海道-函館市 | 函館市 | 北海道 | 異国情緒ある街並みと函館夜景を楽しむ・温泉・海 | 既存jpgあり / 要確認 | /images/destinations/hakodate-hero.jpg | needs_review | 次点。既存ローカル画像を固定heroとして使用中。WebP化と権利確認を継続。 |
| 北海道-小樽市 | 小樽市 | 北海道 | 小樽運河・倉庫群・港町・夜景の雰囲気 | 第1弾SVG作成済み | /images/destinations/otaru/hero.svg | needs_review | 最優先。現地写真ではなく旅先イメージビジュアルとして固定表示。 |
| 東京都-台東区 | 台東区 | 東京都 | 浅草の下町文化と上野の名所を巡る・グルメ・カップル向け | 未作成 | /images/destinations/destination-034/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 千葉県-浦安市 | 浦安市 | 千葉県 | テーマパークと東京湾の景色を満喫・海・グルメ | 未作成 | /images/destinations/destination-035/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 埼玉県-秩父市 | 秩父市 | 埼玉県 | 渓谷と寺社、自然豊かな里山を巡る・温泉・山 | 未作成 | /images/destinations/destination-036/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 愛知県-名古屋市 | 名古屋市 | 愛知県 | 名城と個性豊かな名古屋めしを楽しむ・グルメ・カップル向け | 未作成 | /images/destinations/destination-037/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 岐阜県-下呂市 | 下呂市 | 岐阜県 | 温泉街・川沿い・足湯・やわらかい湯けむり | 第1弾SVG作成済み | /images/destinations/gero-onsen/hero.svg | needs_review | 最優先。現地写真ではなく旅先イメージビジュアルとして固定表示。 |
| 岐阜県-白川村 | 白川村 | 岐阜県 | 世界遺産の合掌造り集落と山里の景色を楽しむ・山・グルメ | 未作成 | /images/destinations/destination-039/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 広島県-広島市 | 広島市 | 広島県 | 平和と歴史を学び広島グルメを味わう・グルメ・カップル向け | 既存jpgあり / 要確認 | /images/destinations/hiroshima-hero.jpg | needs_review | 次点。既存ローカル画像を固定heroとして使用中。WebP化と権利確認を継続。 |
| 広島県-廿日市市 | 廿日市市 | 広島県 | 海に浮かぶ大鳥居と宮島の自然を楽しむ・海・山 | 既存jpgあり / 要確認 | /images/destinations/miyajima-hero.jpg | needs_review | 次点。既存ローカル画像を固定heroとして使用中。WebP化と権利確認を継続。 |
| 岡山県-倉敷市 | 倉敷市 | 岡山県 | 白壁の町並みとアートをのんびり巡る・グルメ・カップル向け | 既存jpgあり / 要確認 | /images/destinations/kurashiki-hero.jpg | needs_review | 次点。既存ローカル画像を固定heroとして使用中。WebP化と権利確認を継続。 |
| 鳥取県-鳥取市 | 鳥取市 | 鳥取県 | 雄大な砂丘と日本海の味覚を満喫・海・山 | 未作成 | /images/destinations/destination-043/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 香川県-高松市 | 高松市 | 香川県 | 瀬戸内の景色と本場の讃岐うどんを楽しむ・海・グルメ | 未作成 | /images/destinations/destination-044/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 愛媛県-松山市 | 松山市 | 愛媛県 | 日本最古級の温泉と城下町を巡る・温泉・海 | 未作成 | /images/destinations/destination-045/hero.webp | missing | 次点。専用hero作成後に destinationImages の対応表へ登録。 |
| 高知県-高知市 | 高知市 | 高知県 | 太平洋の景色とカツオ料理を味わう・海・山 | 未作成 | /images/destinations/destination-046/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 沖縄県-那覇市 | 那覇市 | 沖縄県 | 琉球の歴史と南国グルメを満喫・海・グルメ | 既存jpgあり / 要確認 | /images/destinations/naha-hero.jpg | needs_review | 通常。既存ローカル画像を固定heroとして使用中。WebP化と権利確認を継続。 |
| 沖縄県-石垣市 | 石垣市 | 沖縄県 | 透明な海と島時間、八重山の自然を楽しむ・海・山 | 既存jpgあり / 要確認 | /images/destinations/ishigaki-hero.jpg | needs_review | 次点。既存ローカル画像を固定heroとして使用中。WebP化と権利確認を継続。 |
| 宮崎県-宮崎市 | 宮崎市 | 宮崎県 | 南国の海岸線と宮崎グルメを楽しむ・海・山 | 未作成 | /images/destinations/destination-049/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 長崎県-佐世保市 | 佐世保市 | 長崎県 | 九十九島の絶景と港町グルメを満喫・海・グルメ | 未作成 | /images/destinations/destination-050/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 秋田県-秋田市 | 秋田市 | 秋田県 | 駅周辺・夏,秋・グルメ・海 | 未作成 | /images/destinations/destination-051/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 秋田県-仙北市 | 仙北市 | 秋田県 | 駅から観光エリアへの移動時間を加算・春,秋,冬・山・温泉 | 未作成 | /images/destinations/destination-052/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 山形県-山形市 | 山形市 | 山形県 | 駅から山寺方面への移動時間を加算・春,夏,秋・山・グルメ | 未作成 | /images/destinations/destination-053/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 山形県-尾花沢市 | 尾花沢市 | 山形県 | 最寄り駅からバス・車移動が必要・秋,冬・温泉・山 | 未作成 | /images/destinations/destination-054/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 茨城県-水戸市 | 水戸市 | 茨城県 | 駅から観光エリアへの移動時間を加算・春,秋・グルメ・カップル向け | 未作成 | /images/destinations/destination-055/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 茨城県-大洗町 | 大洗町 | 茨城県 | 駅から海辺の観光地への移動時間を加算・春,夏・海・グルメ | 未作成 | /images/destinations/destination-056/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 新潟県-新潟市 | 新潟市 | 新潟県 | 駅から港エリアへの移動時間を加算・春,夏,秋・海・グルメ | 未作成 | /images/destinations/destination-057/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 新潟県-湯沢町 | 湯沢町 | 新潟県 | 駅周辺・夏,秋,冬・温泉・山 | 未作成 | /images/destinations/destination-058/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 富山県-富山市 | 富山市 | 富山県 | 駅から中心市街地への移動時間を加算・春,秋,冬・山・グルメ | 未作成 | /images/destinations/destination-059/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 富山県-立山町 | 立山町 | 富山県 | 山岳観光の乗り換え時間を加算・夏,秋・山・温泉 | 未作成 | /images/destinations/destination-060/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 福井県-福井市 | 福井市 | 福井県 | 駅から中心市街地への移動時間を加算・春,秋・グルメ・カップル向け | 未作成 | /images/destinations/destination-061/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 福井県-坂井市 | 坂井市 | 福井県 | 最寄り駅からバス・車移動が必要・春,夏,秋・海・グルメ | 未作成 | /images/destinations/destination-062/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 三重県-伊勢市 | 伊勢市 | 三重県 | 駅から内宮方面への移動時間を加算・春,秋・グルメ・カップル向け | 既存jpgあり / 要確認 | /images/destinations/ise-hero.jpg | needs_review | 通常。既存ローカル画像を固定heroとして使用中。WebP化と権利確認を継続。 |
| 三重県-鳥羽市 | 鳥羽市 | 三重県 | 駅から海辺の観光地への移動時間を加算・春,夏,秋・海・温泉 | 未作成 | /images/destinations/destination-064/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 滋賀県-大津市 | 大津市 | 滋賀県 | 駅から琵琶湖畔への移動時間を加算・春,夏,秋・海・グルメ | 未作成 | /images/destinations/destination-065/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 滋賀県-高島市 | 高島市 | 滋賀県 | 最寄り駅からバス・車移動が必要・春,夏,秋・山・カップル向け | 未作成 | /images/destinations/destination-066/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 島根県-松江市 | 松江市 | 島根県 | 駅から城下町エリアへの移動時間を加算・春,秋・海・グルメ | 既存jpgあり / 要確認 | /images/destinations/matsue-hero.jpg | needs_review | 次点。既存ローカル画像を固定heroとして使用中。WebP化と権利確認を継続。 |
| 島根県-出雲市 | 出雲市 | 島根県 | 駅から出雲大社への移動時間を加算・春,秋・海・グルメ | 未作成 | /images/destinations/destination-068/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 山口県-下関市 | 下関市 | 山口県 | 駅から唐戸エリアへの移動時間を加算・春,夏,秋・海・グルメ | 未作成 | /images/destinations/destination-069/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 山口県-萩市 | 萩市 | 山口県 | 駅から城下町への移動時間を加算・春,秋・海・グルメ | 未作成 | /images/destinations/destination-070/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 徳島県-鳴門市 | 鳴門市 | 徳島県 | 渦潮・鳴門海峡・橋・海の迫力 | 第1弾SVG作成済み | /images/destinations/naruto/hero.svg | needs_review | 最優先。現地写真ではなく旅先イメージビジュアルとして固定表示。 |
| 徳島県-三好市 | 三好市 | 徳島県 | 山間部のため駅からバス・車移動が必要・夏,秋・山・温泉 | 未作成 | /images/destinations/destination-072/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 佐賀県-佐賀市 | 佐賀市 | 佐賀県 | 駅から中心市街地への移動時間を加算・春,秋・グルメ・カップル向け | 未作成 | /images/destinations/destination-073/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 佐賀県-嬉野市 | 嬉野市 | 佐賀県 | 駅から温泉街への移動時間を加算・秋,冬・温泉・グルメ | 未作成 | /images/destinations/destination-074/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 長野県-長野市 | 長野市 | 長野県 | 駅から善光寺への移動時間を加算・春,秋,冬・山・グルメ | 未作成 | /images/destinations/destination-075/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 長野県-軽井沢町 | 軽井沢町 | 長野県 | 駅から旧軽井沢への移動時間を加算・春,夏,秋・山・グルメ | 既存jpgあり / 要確認 | /images/destinations/karuizawa-hero.jpg | needs_review | 通常。既存ローカル画像を固定heroとして使用中。WebP化と権利確認を継続。 |
| 静岡県-静岡市 | 静岡市 | 静岡県 | 駅から日本平方面への移動時間を加算・春,秋・海・山 | 未作成 | /images/destinations/destination-077/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 静岡県-浜松市 | 浜松市 | 静岡県 | 駅から浜名湖方面への移動時間を加算・春,夏・海・グルメ | 未作成 | /images/destinations/destination-078/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 福岡県-北九州市 | 北九州市 | 福岡県 | 駅周辺・春,秋,冬・海・グルメ | 未作成 | /images/destinations/destination-079/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 熊本県-阿蘇市 | 阿蘇市 | 熊本県 | 山間部のため駅からバス・車移動が必要・春,夏,秋・山・温泉 | 未作成 | /images/destinations/destination-080/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 北海道-釧路市 | 釧路市 | 北海道 | 駅から湿原方面への移動時間を加算・夏,秋,冬・海・グルメ | 未作成 | /images/destinations/destination-081/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 沖縄県-宮古島市 | 宮古島市 | 沖縄県 | 鉄道がないため空港からの移動時間を加算・春,夏,秋・海・グルメ | 未作成 | /images/destinations/destination-082/hero.webp | missing | 次点。専用hero作成後に destinationImages の対応表へ登録。 |
| 北海道-富良野市 | 富良野市 | 北海道 | 駅から丘陵・花畑エリアへの移動時間を加算・夏,秋・山・グルメ | 既存jpgあり / 要確認 | /images/destinations/furano-hero.jpg | needs_review | 通常。既存ローカル画像を固定heroとして使用中。WebP化と権利確認を継続。 |
| 北海道-登別市 | 登別市 | 北海道 | 最寄り駅から温泉街への移動時間を加算・秋,冬・温泉・山 | 未作成 | /images/destinations/destination-084/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 東京都-渋谷区 | 渋谷区 | 東京都 | 駅周辺・春,秋,冬・グルメ・カップル向け | 未作成 | /images/destinations/destination-085/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 神奈川県-小田原市 | 小田原市 | 神奈川県 | 駅から城址公園への移動時間を加算・春,夏,秋・海・グルメ | 未作成 | /images/destinations/destination-086/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 京都府-宇治市 | 宇治市 | 京都府 | 駅から平等院周辺への移動時間を加算・春,夏,秋・山・グルメ | 未作成 | /images/destinations/destination-087/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 広島県-尾道市 | 尾道市 | 広島県 | 駅周辺・春,夏,秋・海・グルメ | 既存jpgあり / 要確認 | /images/destinations/onomichi-hero.jpg | needs_review | 次点。既存ローカル画像を固定heroとして使用中。WebP化と権利確認を継続。 |
| 鹿児島県-指宿市 | 指宿市 | 鹿児島県 | 駅から温泉・海辺エリアへの移動時間を加算・秋,冬・温泉・海 | 未作成 | /images/destinations/destination-089/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 岩手県-平泉町 | 平泉町 | 岩手県 | 駅から世界遺産エリアへの移動時間を加算・春,夏,秋・山・グルメ | 未作成 | /images/destinations/destination-090/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 栃木県-那須町 | 那須町 | 栃木県 | 高原エリアはバス・車移動を想定・春,夏,秋・山・温泉 | 未作成 | /images/destinations/destination-091/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 栃木県-足利市 | 足利市 | 栃木県 | 駅から中心部へ徒歩・バスで移動しやすい・春,秋・グルメ・カップル向け | 未作成 | /images/destinations/destination-092/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 埼玉県-川越市 | 川越市 | 埼玉県 | 蔵造りの町並み・時の鐘・菓子屋横丁・レトロ街歩き | 第1弾SVG作成済み | /images/destinations/kawagoe/hero.svg | needs_review | 最優先。現地写真ではなく旅先イメージビジュアルとして固定表示。 |
| 千葉県-館山市 | 館山市 | 千葉県 | 駅から海辺や市街地へ移動しやすい・春,夏,秋・海・グルメ | 未作成 | /images/destinations/destination-094/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 東京都-奥多摩町 | 奥多摩町 | 東京都 | 駅から渓谷散策を始めやすい・春,夏,秋・山・カップル向け | 未作成 | /images/destinations/destination-095/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 山形県-上山市 | 上山市 | 山形県 | 駅周辺に温泉街がまとまる・春,秋,冬・温泉・山 | 未作成 | /images/destinations/destination-096/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 山形県-酒田市 | 酒田市 | 山形県 | 駅から市街地・港方面へ移動しやすい・春,夏,秋・海・グルメ | 未作成 | /images/destinations/destination-097/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 岩手県-花巻市 | 花巻市 | 岩手県 | 温泉郷へはバス・車移動を想定・春,秋,冬・温泉・山 | 未作成 | /images/destinations/destination-098/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 青森県-八戸市 | 八戸市 | 青森県 | 中心街・港方面へバス移動を想定・春,夏,秋・海・グルメ | 未作成 | /images/destinations/destination-099/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 福島県-郡山市 | 郡山市 | 福島県 | 駅周辺を起点にしやすい・春,秋,冬・グルメ・カップル向け | 未作成 | /images/destinations/destination-100/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 長野県-上田市 | 上田市 | 長野県 | 上田城跡・真田・城下町・信州の山並み | 第1弾SVG作成済み | /images/destinations/ueda/hero.svg | needs_review | 最優先。現地写真ではなく旅先イメージビジュアルとして固定表示。 |
| 岐阜県-郡上市 | 郡上市 | 岐阜県 | 市街地へは徒歩・バス移動を想定・春,夏,秋・山・グルメ | 未作成 | /images/destinations/destination-102/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 福井県-敦賀市 | 敦賀市 | 福井県 | 駅から中心部・港方面へ移動しやすい・春,夏,秋・海・グルメ | 未作成 | /images/destinations/destination-103/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 山梨県-甲府市 | 甲府市 | 山梨県 | 甲府城跡・昇仙峡・ぶどう畑・山梨の山並み | 第1弾SVG作成済み | /images/destinations/kofu/hero.svg | needs_review | 第1弾。現地写真ではなく旅先イメージビジュアルとして固定表示。 |
| 静岡県-三島市 | 三島市 | 静岡県 | 駅から水辺の散策路へ歩きやすい・春,夏,秋・グルメ・カップル向け | 未作成 | /images/destinations/destination-105/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 京都府-舞鶴市 | 舞鶴市 | 京都府 | 駅から赤れんがエリアへ移動しやすい・春,夏,秋・海・グルメ | 未作成 | /images/destinations/destination-106/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 兵庫県-明石市 | 明石市 | 兵庫県 | 駅から商店街・城跡へ歩きやすい・春,夏,秋・海・グルメ | 未作成 | /images/destinations/destination-108/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 滋賀県-彦根市 | 彦根市 | 滋賀県 | 駅から城下町へ移動しやすい・春,秋,冬・山・グルメ | 未作成 | /images/destinations/destination-109/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 和歌山県-和歌山市 | 和歌山市 | 和歌山県 | 駅から中心部へ移動しやすい・春,夏,秋・海・グルメ | 未作成 | /images/destinations/destination-110/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 岡山県-津山市 | 津山市 | 岡山県 | 駅から城跡・中心街へ移動しやすい・春,秋,冬・グルメ・カップル向け | 未作成 | /images/destinations/destination-111/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 山口県-山口市 | 山口市 | 山口県 | 市街地・温泉街へバス移動を想定・春,秋,冬・山・グルメ | 未作成 | /images/destinations/destination-112/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 広島県-竹原市 | 竹原市 | 広島県 | 駅から町並み保存地区へ歩きやすい・春,秋,冬・グルメ・カップル向け | 未作成 | /images/destinations/destination-113/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 香川県-丸亀市 | 丸亀市 | 香川県 | 駅から城下町へ移動しやすい・春,秋,冬・グルメ・カップル向け | 未作成 | /images/destinations/destination-114/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 愛媛県-今治市 | 今治市 | 愛媛県 | 駅から市街地・港方面へ移動しやすい・春,夏,秋・海・グルメ | 未作成 | /images/destinations/destination-115/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 徳島県-徳島市 | 徳島市 | 徳島県 | 駅周辺を起点にしやすい・春,夏,秋・グルメ・カップル向け | 未作成 | /images/destinations/destination-116/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 熊本県-天草市 | 天草市 | 熊本県 | 天草方面は車・バス移動を想定・春,夏,秋・海・グルメ | 未作成 | /images/destinations/destination-117/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 長崎県-島原市 | 島原市 | 長崎県 | 駅から湧水エリアへ歩きやすい・春,秋,冬・温泉・グルメ | 未作成 | /images/destinations/destination-118/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 宮崎県-日南市 | 日南市 | 宮崎県 | 海岸線は車・バス移動を想定・春,夏,秋・海・グルメ | 未作成 | /images/destinations/destination-119/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 沖縄県-本部町 | 本部町 | 沖縄県 | 空港から車・バス移動を想定・春,夏,秋・海・グルメ | 未作成 | /images/destinations/destination-120/hero.webp | missing | 通常。専用hero作成後に destinationImages の対応表へ登録。 |
| 栃木県-佐野市 | 佐野市 | 栃木県 | 佐野ラーメン・厄除け大師・日帰り街歩き | 第1弾SVG先行作成済み | /images/destinations/sano/hero.svg | needs_review | 現行旅行先データ未登録。登録時に `栃木県-佐野市` で固定heroを利用可能。 |

## グルメ・スポット・映え画像の補足方針

- グルメ画像は料理名と一致するものだけ使い、料理専用画像がない場合は画像なしにします。
- スポット画像は権利確認済みで、スポットや旅先と一致するものだけ使います。
- 映え・トレンドページは、項目専用画像がない場合は画像なしで運用します。Instagram、SNS投稿、外部サイト画像は無断使用しません。
- 店舗・施設画像は、公式素材、自前撮影、利用許諾済み素材のみ追加対象にします。
