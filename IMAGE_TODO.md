# DROPTRIP 画像改善TODO

現地写真・ご当地グルメ画像を安全に増やすための管理メモです。画像を追加するときは、権利確認済みのローカル画像として `public/images/destinations/` に配置し、`source`・`credit`・`license`・`status` を更新します。

## 2026-07-03 旅先固定hero画像への移行方針

- 結果画面のhero画像は、旅先ごとの `destination_fixed` 画像がある場合だけ表示します。
- カテゴリ画像、汎用画像、ランダム画像は一般結果画面のheroとして使いません。
- 画像がない旅先では画像枠ごと非表示にし、「写真準備中」は一般画面に出しません。
- 旅先イメージ画像を使う場合は `isIllustration: true`、`type: "destination_fixed"`、`status: "needs_review"` を付け、altは「〇〇をイメージしたビジュアル」とします。
- 画像ファイルは `public/images/destinations/` 配下に英数字・ハイフンで置きます。今後は `public/images/destinations/{slug}/hero.webp` 形式を推奨します。
- サイズ目安は横幅1200px前後、16:9または4:3、WebP優先、1枚100KB〜400KB程度です。大きくても1MB未満を目安にします。
- グルメ画像は料理名と一致するものだけ使い、料理専用画像がない場合は画像なしにします。

| id / slug | 旅先名 | 必要画像テーマ | 状態 | 想定ファイル |
|---|---|---|---|---|
| gifu-gero / gero-onsen | 下呂温泉・下呂市 | 温泉街・川沿い・足湯 | 未作成または要確認 | /images/destinations/gero-onsen/hero.webp |
| kyoto | 京都市 | 寺社・街歩き・和の雰囲気 | 既存jpgあり / 要確認 | /images/destinations/kyoto/hero.webp |
| otaru | 小樽市 | 小樽運河・港町・夜景 | 既存jpgあり / 要確認 | /images/destinations/otaru/hero.webp |
| hakone | 箱根町 | 芦ノ湖・温泉・箱根神社周辺 | 既存jpgあり / 要確認 | /images/destinations/hakone/hero.webp |
| kusatsu | 草津町 | 湯畑・湯けむり・温泉街 | 既存jpgあり / 要確認 | /images/destinations/kusatsu/hero.webp |
| atami | 熱海市 | 海と温泉街・サンビーチ | 既存jpgあり / 要確認 | /images/destinations/atami/hero.webp |
| kanazawa | 金沢市 | 兼六園・茶屋街・城下町 | 既存jpgあり / 要確認 | /images/destinations/kanazawa/hero.webp |
| kamakura | 鎌倉市 | 寺社・海・江ノ電 | 既存jpgあり / 要確認 | /images/destinations/kamakura/hero.webp |
| sendai | 仙台市 | 並木道・城跡・街歩き | 既存jpgあり / 要確認 | /images/destinations/sendai/hero.webp |
| fukuoka | 福岡市 | 博多・天神・屋台 | 既存jpgあり / 要確認 | /images/destinations/fukuoka/hero.webp |
| naruto | 鳴門市 | 渦潮・鳴門公園・海峡 | 未作成 | /images/destinations/naruto/hero.webp |
| beppu | 別府市 | 湯けむり・地獄めぐり・温泉街 | 既存jpgあり / 要確認 | /images/destinations/beppu/hero.webp |
| kawagoe | 川越 | 蔵造りの町並み・菓子屋横丁 | 未作成 | /images/destinations/kawagoe/hero.webp |
| sano | 佐野市 | 佐野ラーメン・厄除け大師・街歩き | 未作成 | /images/destinations/sano/hero.webp |
| ueda | 上田市 | 上田城跡・城下町 | 未作成 | /images/destinations/ueda/hero.webp |
| kofu | 甲府市 | 甲府城跡・昇仙峡・ぶどう畑/ワイン・山梨の山並み・ほうとう | 未作成 | /images/destinations/kofu/hero.webp |

次点で固定heroを整備したい旅先：石垣市、宮古島、札幌市、函館市、長崎市、広島市、宮島、高山市、尾道市、倉敷市、松江市、湯布院、道後温泉、有馬温泉、城崎温泉。

甲府市メモ：専用hero画像ができるまでは結果画面に画像を出しません。カテゴリfallbackや汎用画像で代替せず、固定画像作成後に `destinationImages` の対応表へ登録します。

## 2026-07-02 グルメ・スポット大幅強化に伴う画像課題

- localFoodCandidates を7〜10件、localFoodDetails を5件へ広げたため、料理専用画像の不足が増えています。
- restaurantHints を追加した旅行先では、実店舗名に直接ひもづく画像は権利確認ができるまで使用しません。
- 店舗外観、店内、商品写真は、公式素材・自前撮影・利用許諾済み素材だけを追加対象にします。
- 温泉街、商店街、市場、食べ歩き通りの写真は、グルメページとスポットページの両方で有効なので優先度を上げます。

## 2026-07-02 スポット画像の非表示・追加方針

- スポットページでは、権利確認できていない施設写真や旅先と一致しない汎用カテゴリ画像を表示しません。
- 代表スポット画像を追加する場合は、スポット名単位で `source` / `credit` / `license` / `status` を管理します。
- 施設画像は `needs_review` の段階では大きく表示せず、営業時間・料金・営業状況とあわせて公式情報確認を前提にします。
- 代表スポット画像が必要: 銀山温泉街、九十九島パールシーリゾート、上高地 河童橋、阿蘇草千里ヶ浜、蔵王ロープウェイ、塩原温泉郷。
- 温泉街画像が必要: 下呂温泉街、道後温泉本館周辺、城崎温泉街、銀山温泉街、蔵王温泉街、塩原温泉郷。
- 街歩き画像が必要: 川越一番街、菓子屋横丁、中町通り、旧居留地、道後ハイカラ通り、備瀬のフクギ並木。
- 権利確認前のスポット画像は、代替画像としても使用しません。画像がない場合は画像枠ごと非表示にします。

## 2026-07-02 グルメ・スポット画像最終監査

- グルメページでは、料理名と `foodTheme` が一致しない汎用画像を大きく表示しない方針を維持します。
- スポットページでは、権利確認済みで旅先・スポットに一致する画像がない限り、スポットカード内に画像枠を出しません。
- 画像不足は画面上で「準備中」と出さず、このファイルで継続管理します。

## 2026-07-02 グルメ画像の原則非表示

- グルメページでは、料理名と完全に一致する権利確認済み画像がない限り、画像枠ごと表示しません。
- 汎用和食画像、刺身画像、カテゴリ画像、fallback画像、料理イメージ写真は料理写真として使用しません。
- 料理写真を追加する場合は、料理名単位で `source` / `credit` / `license` / `status` と、対応する `foodTheme` を明確にします。
- 優先して権利確認済み写真が必要: 若鶏半身揚げ、あんかけ焼きそば、湯豆腐、抹茶スイーツ、牛タン、あんこう鍋、佐野ラーメン、のどぐろ、函館塩ラーメン、鳴門鯛、地獄蒸し、温玉ソフト、石垣牛。

## 2026-07-02 グルメ写真の厳格化

- グルメページでは、料理名と一致しない汎用画像・category fallback画像・temporary画像を大きく表示しません。
- `foodImage` は、`isLocalFood` が true、`status` が confirmed または needs_review、かつ `foodTheme` が表示中の具体料理名と一致する場合だけ表示します。
- 一致する料理写真がない旅行先では、画像枠ごと非表示にします。一般画面に「写真準備中」は出しません。
- 抽象的な `foodTheme`（料理イメージ、ご当地グルメ候補、汎用料理イメージ）は、料理写真として扱いません。

料理名と一致する写真が必要な例：

- 仙台市：牛タン、ずんだ餅、笹かまぼこ
- 下呂市：飛騨牛、温玉ソフト、下呂プリン、鶏ちゃん
- 水戸市：あんこう鍋、納豆料理、常陸牛
- 佐野市：佐野ラーメン、いもフライ
- 金沢市：のどぐろ、金沢おでん、金沢カレー
- 函館市：函館塩ラーメン、いか刺し、函館朝市の海産物
- 鳴門市：鳴門鯛、鳴門わかめ、鳴ちゅるうどん
- 別府市：地獄蒸し、とり天、別府冷麺

foodImage を非表示にしやすい旅行先：

- 料理テーマが「料理イメージ」「ご当地グルメ候補」など抽象的な旅行先
- category fallback のfood画像しかない旅行先
- 料理名と画像テーマが一致しない旅行先

優先したい画像カテゴリ：

- 料理専用画像：飛騨牛、温玉ソフト、下呂プリン、湯豆腐、海鮮丼、牛タン、豚骨ラーメン、石垣牛、とり天、鯛めし
- 食べ歩き画像：温泉街の食べ歩き、商店街の惣菜、市場グルメ、和菓子、湯上がりスイーツ
- 温泉街画像：下呂温泉街、箱根湯本、熱海駅前商店街、草津湯畑、鉄輪温泉街、道後温泉街、城崎温泉街
- 代表スポット画像：下呂温泉合掌村、温泉寺、ゆあみ屋周辺、金森赤レンガ倉庫、近江町市場、錦市場、厳島神社
- 雨の日施設画像：美術館、博物館、温泉博物館、屋内市場、駅ビル

店舗名候補に対応する画像の扱い：

- restaurantHints の実店名は `needs_review` の検索候補です。
- 画像を追加する場合は、権利確認、撮影者、ライセンス、利用範囲を必ず記録します。
- 権利確認前の店舗写真や商品写真は、代替画像としても使用しません。

## 2026-07-02 データ強化に伴う画像課題

- グルメ候補を全旅行先で5件以上に補完したため、具体料理名に合うfood画像の追加が必要です。
- 優先30件のtouristSpotsを5件以上に補完したため、代表スポットのhero/scenery画像差し替え候補を増やします。
- 外部画像取得は行わず、権利確認済みローカル画像だけを追加します。

優先追加したい画像例：

- 京都市：湯豆腐、抹茶スイーツ、嵐山、錦市場
- 小樽市：寿司、海鮮丼、小樽運河、堺町通り、天狗山
- 仙台市：牛タン、ずんだ餅、仙台城跡、定禅寺通
- 金沢市：海鮮丼、金沢おでん、兼六園、21世紀美術館周辺
- 鳴門市：鳴門鯛、鳴門わかめ、渦の道、鳴門公園、大塚国際美術館
- 別府市：地獄蒸し、とり天、別府地獄めぐり、鉄輪温泉街

## 運用方針

- `hero` / `scenery` / `food` の3種類を基本にする
- `food` はできるだけご当地グルメ写真を優先する
- 権利不明画像、無断転載画像、外部サイトからの直リンクは使わない
- 自治体・観光協会・素材サイトの画像は利用規約を確認してから登録する
- 仮画像は `status: temporary`、確認が必要なものは `needs_review`、権利確認済みは `confirmed` とする

## 優先30件

### 京都市

- hero候補：京都らしい街並み、寺社、鴨川、祇園
- scenery候補：清水寺、嵐山、伏見稲荷、東山エリア
- food候補：湯豆腐、抹茶スイーツ、京料理、和カフェ
- 必要画像：hero / scenery / food
- 現在の状態：個別画像改善済み / temporary
- 権利確認：未確認
- メモ：hero / scenery / food を個別ローカル画像へ割り当て済み。次の課題：公式素材または権利確認済み写真へ差し替え。

### 奈良市

- hero候補：奈良公園、鹿、古都の街並み
- scenery候補：東大寺、春日大社、ならまち
- food候補：柿の葉寿司、茶粥、奈良漬、和スイーツ
- 必要画像：hero / scenery / food
- 現在の状態：個別画像改善済み / temporary
- 権利確認：未確認
- メモ：hero / scenery / food を個別ローカル画像へ割り当て済み。次の課題：公式素材または権利確認済み写真へ差し替え。

### 小樽市

- hero候補：小樽運河、レンガ倉庫、港町
- scenery候補：運河夜景、天狗山、堺町通り
- food候補：寿司、海鮮丼、スイーツ、市場グルメ
- 必要画像：hero / scenery / food
- 現在の状態：個別画像改善済み / temporary
- 権利確認：未確認
- メモ：hero / scenery / food を個別ローカル画像へ割り当て済み。次の課題：公式素材または権利確認済み写真へ差し替え。

### 札幌市

- hero候補：大通公園、時計台、冬の街並み
- scenery候補：藻岩山夜景、北海道大学、雪景色
- food候補：スープカレー、味噌ラーメン、ジンギスカン、海鮮
- 必要画像：hero / scenery / food
- 現在の状態：temporary / individual imageあり
- 権利確認：未確認
- メモ：

### 函館市

- hero候補：函館山夜景、港町、異国情緒の街並み
- scenery候補：五稜郭、元町、ベイエリア
- food候補：海鮮丼、イカ料理、塩ラーメン、市場朝食
- 必要画像：hero / scenery / food
- 現在の状態：temporary / individual imageあり
- 権利確認：未確認
- メモ：

### 金沢市

- hero候補：ひがし茶屋街、兼六園、金沢駅
- scenery候補：兼六園、21世紀美術館、浅野川
- food候補：海鮮丼、金沢おでん、加賀料理、和菓子
- 必要画像：hero / scenery / food
- 現在の状態：個別画像改善済み / temporary
- 権利確認：未確認
- メモ：hero / scenery / food を個別ローカル画像へ割り当て済み。次の課題：公式素材または権利確認済み写真へ差し替え。

### 箱根町

- hero候補：芦ノ湖、温泉旅館、富士山が見える風景
- scenery候補：大涌谷、箱根神社、ロープウェイ
- food候補：温泉まんじゅう、そば、豆腐料理、ベーカリー
- 必要画像：hero / scenery / food
- 現在の状態：個別画像改善済み / temporary
- 権利確認：未確認
- メモ：hero / scenery / food を個別ローカル画像へ割り当て済み。次の課題：公式素材または権利確認済み写真へ差し替え。

### 熱海市

- hero候補：海と温泉街、熱海サンビーチ、夜景
- scenery候補：来宮神社、海岸線、温泉街
- food候補：海鮮、干物、温泉まんじゅう、カフェスイーツ
- 必要画像：hero / scenery / food
- 現在の状態：個別画像改善済み / temporary
- 権利確認：未確認
- メモ：hero / scenery / food を個別ローカル画像へ割り当て済み。次の課題：公式素材または権利確認済み写真へ差し替え。

### 草津町

- hero候補：湯畑、温泉街、湯けむり
- scenery候補：西の河原公園、温泉街夜景、雪景色
- food候補：温泉まんじゅう、そば、舞茸料理、湯畑周辺スイーツ
- 必要画像：hero / scenery / food
- 現在の状態：個別画像改善済み / temporary
- 権利確認：未確認
- メモ：hero / scenery / food を個別ローカル画像へ割り当て済み。次の課題：公式素材または権利確認済み写真へ差し替え。

### 日光市

- hero候補：東照宮、杉並木、奥日光
- scenery候補：華厳の滝、中禅寺湖、紅葉
- food候補：湯波料理、そば、羊羹、カフェ
- 必要画像：hero / scenery / food
- 現在の状態：temporary / individual imageあり
- 権利確認：未確認
- メモ：

### 鎌倉市

- hero候補：海と寺社、江ノ電、鎌倉大仏
- scenery候補：長谷、由比ヶ浜、小町通り
- food候補：しらす丼、鎌倉野菜、和カフェ、スイーツ
- 必要画像：hero / scenery / food
- 現在の状態：個別画像改善済み / temporary
- 権利確認：未確認
- メモ：hero / scenery / food を個別ローカル画像へ割り当て済み。次の課題：公式素材または権利確認済み写真へ差し替え。

### 横浜市

- hero候補：みなとみらい、赤レンガ倉庫、夜景
- scenery候補：山下公園、中華街、港の風景
- food候補：中華街グルメ、洋食、スイーツ、カフェ
- 必要画像：hero / scenery / food
- 現在の状態：temporary / individual imageあり
- 権利確認：未確認
- メモ：

### 松島町

- hero候補：松島湾、島々、遊覧船
- scenery候補：五大堂、瑞巌寺、海辺の風景
- food候補：牡蠣、海鮮、笹かまぼこ、ずんだスイーツ
- 必要画像：hero / scenery / food
- 現在の状態：temporary / individual imageあり
- 権利確認：未確認
- メモ：

### 仙台市

- hero候補：仙台駅周辺、青葉城跡、並木道
- scenery候補：定禅寺通、瑞鳳殿、夜景
- food候補：牛タン、ずんだ餅、笹かまぼこ、海鮮
- 必要画像：hero / scenery / food
- 現在の状態：temporary / individual imageあり
- 権利確認：未確認
- メモ：

### 福岡市

- hero候補：博多・天神の街並み、屋台、海辺
- scenery候補：中洲、福岡タワー、大濠公園
- food候補：博多ラーメン、もつ鍋、水炊き、屋台グルメ
- 必要画像：hero / scenery / food
- 現在の状態：個別画像改善済み / temporary
- 権利確認：未確認
- メモ：hero / scenery / food を個別ローカル画像へ割り当て済み。次の課題：公式素材または権利確認済み写真へ差し替え。

### 長崎市

- hero候補：坂の街、港、夜景
- scenery候補：グラバー園、眼鏡橋、稲佐山
- food候補：ちゃんぽん、皿うどん、トルコライス、カステラ
- 必要画像：hero / scenery / food
- 現在の状態：temporary / individual imageあり
- 権利確認：未確認
- メモ：

### 広島市

- hero候補：平和記念公園、川沿い、街並み
- scenery候補：原爆ドーム、広島城、瀬戸内方面
- food候補：お好み焼き、牡蠣、穴子飯、瀬戸内レモン
- 必要画像：hero / scenery / food
- 現在の状態：temporary / individual imageあり
- 権利確認：未確認
- メモ：

### 宮島

- hero候補：厳島神社、大鳥居、宮島の海
- scenery候補：弥山、表参道商店街、夕景
- food候補：あなごめし、牡蠣、もみじ饅頭、瀬戸内海鮮
- 必要画像：hero / scenery / food
- 現在の状態：temporary / individual imageあり
- 権利確認：未確認
- メモ：データ上は廿日市市として管理している場合があります。

### 那覇市

- hero候補：国際通り、首里城周辺、南国の街並み
- scenery候補：港、夜の街歩き、沖縄らしい建物
- food候補：沖縄そば、ゴーヤーチャンプルー、タコライス、ブルーシール
- 必要画像：hero / scenery / food
- 現在の状態：temporary / individual imageあり
- 権利確認：未確認
- メモ：

### 石垣市

- hero候補：青い海、離島ターミナル、川平湾
- scenery候補：ビーチ、夕景、南国の自然
- food候補：石垣牛、八重山そば、海鮮、南国スイーツ
- 必要画像：hero / scenery / food
- 現在の状態：個別画像改善済み / temporary
- 権利確認：未確認
- メモ：hero / scenery / food を個別ローカル画像へ割り当て済み。次の課題：公式素材または権利確認済み写真へ差し替え。

### 高山市

- hero候補：古い町並み、朝市、飛騨の街並み
- scenery候補：宮川、古民家、雪景色
- food候補：飛騨牛、高山ラーメン、みたらし団子、郷土料理
- 必要画像：hero / scenery / food
- 現在の状態：temporary / individual imageあり
- 権利確認：未確認
- メモ：

### 伊勢市

- hero候補：伊勢神宮、おはらい町、五十鈴川
- scenery候補：内宮、外宮、街歩き
- food候補：伊勢うどん、赤福、てこね寿司、海鮮
- 必要画像：hero / scenery / food
- 現在の状態：temporary / individual imageあり
- 権利確認：未確認
- メモ：

### 白浜町

- hero候補：白良浜、温泉、海岸線
- scenery候補：円月島、三段壁、夕景
- food候補：海鮮、クエ料理、梅スイーツ、温泉街グルメ
- 必要画像：hero / scenery / food
- 現在の状態：temporary / individual imageあり
- 権利確認：未確認
- メモ：

### 軽井沢町

- hero候補：高原の街並み、旧軽井沢、森の道
- scenery候補：雲場池、白糸の滝、カフェテラス
- food候補：ベーカリー、高原野菜、カフェ、ジャム
- 必要画像：hero / scenery / food
- 現在の状態：temporary / individual imageあり
- 権利確認：未確認
- メモ：

### 富良野市

- hero候補：ラベンダー畑、丘陵地、北海道らしい風景
- scenery候補：花畑、雪景色、農園
- food候補：オムカレー、メロン、チーズ、スイーツ
- 必要画像：hero / scenery / food
- 現在の状態：temporary / individual imageあり
- 権利確認：未確認
- メモ：

### 会津若松市

- hero候補：鶴ヶ城、城下町、歴史ある街並み
- scenery候補：七日町通り、飯盛山、雪景色
- food候補：ソースカツ丼、こづゆ、会津そば、地酒
- 必要画像：hero / scenery / food
- 現在の状態：temporary / individual imageあり
- 権利確認：未確認
- メモ：

### 尾道市

- hero候補：坂道、海、猫の細道
- scenery候補：しまなみ海道、千光寺、港町
- food候補：尾道ラーメン、瀬戸内海鮮、レモンスイーツ、カフェ
- 必要画像：hero / scenery / food
- 現在の状態：temporary / individual imageあり
- 権利確認：未確認
- メモ：

### 倉敷市

- hero候補：美観地区、白壁の街並み、川舟
- scenery候補：夜の美観地区、町家、カフェ通り
- food候補：デミカツ丼、白桃スイーツ、町家カフェ、瀬戸内グルメ
- 必要画像：hero / scenery / food
- 現在の状態：temporary / individual imageあり
- 権利確認：未確認
- メモ：

### 松江市

- hero候補：松江城、堀川、城下町
- scenery候補：宍道湖夕景、堀川めぐり、茶室
- food候補：出雲そば、和菓子、しじみ料理、茶文化
- 必要画像：hero / scenery / food
- 現在の状態：temporary / individual imageあり
- 権利確認：未確認
- メモ：

### 別府市

- hero候補：湯けむり、温泉街、地獄めぐり
- scenery候補：海と温泉街、別府湾、鉄輪温泉
- food候補：地獄蒸し、とり天、温泉プリン、海鮮
- 必要画像：hero / scenery / food
- 現在の状態：temporary / individual imageあり
- 権利確認：未確認
- メモ：

## 画像以外の旅行先データ品質メモ
旅行先ごとの companionFit / purposeFit / stayFit / nearbyDestinationHints を整備しました。画像方針は変更せず、長期旅行時の関連候補や抽選加点に使うメタ情報だけを追加しています。

## 条件別抽選テスト後の画像改善メモ
- 既存カテゴリ画像を、街歩き・歴史・自然・離島・雪景色・ファミリー向け・一人旅向けなどにも割り当てられるようにしました。
- 今後追加したい画像：神社仏閣、街歩き、夜景、離島、雪景色、花・季節感、ファミリー向け、体験系の権利確認済みローカル画像。
- ご当地グルメ画像は、小樽・福岡・京都・石垣・仙台・金沢など優先30件から正式素材へ差し替える方針です。
- 個別画像が temporary の旅行先は、公開前に権利確認済みの現地写真または生成素材へ置き換えてください。

## 画像サイズと読み込み速度メモ
- 現在はコード側で lazy loading と async decoding を使い、重要なhero画像以外の読み込み負荷を抑えています。
- 画像圧縮やWebP/AVIF化は外部ツール依存になるため未実施です。公開前にローカルで権利確認済み画像を圧縮し、必要に応じて軽量版を追加してください。

## 2026-07-01 具体的な提案強化に伴う画像課題

- touristSpots の追加により、観光スポット単位の写真が不足している旅行先があります。まずは優先30件の hero / scenery / food を正式素材へ差し替える方針を継続します。
- localFoodDetails を表示するため、小樽・福岡・京都・石垣・仙台・金沢・別府などはご当地グルメ写真の追加優先度が高いです。
- 今回は外部画像取得や無断転載は行わず、既存ローカル画像とカテゴリ代替画像で表示を維持しています。

## Local Food Image Follow-up

- Generic food images should not be promoted as concrete local specialty photos.
- Priority destinations still need safe local image assets for dishes such as sushi, seafood bowls, tonkotsu ramen, beef tongue, matcha sweets, and onsen manju.
- Category-only food images should be replaced over time with verified local assets stored under public/images/.

## Pseudo Spot Data Follow-up

- Destinations that only have generic fallback-like spot names should be treated as concrete tourist spot data shortages, not as image-ready destinations.
- Priority follow-up targets include smaller or newly added destinations where real spot photos and concrete spot metadata are still missing.
- Naruto City now has concrete metadata, but safe local images for whirlpools, Naruto Park, and local foods should be considered separately before adding photos.

## Local Food Copy and Image Fit

- Local food copy now names timing and area hints; image follow-up should prioritize photos that match those specific dishes and areas.
- If a food image is generic or does not match the named dish, keep it visually modest and track the missing dish-specific asset here.
- Restaurant-level names should not be added from external sources unless manually reviewed with source, checkedAt, and status metadata.
- Result quality checks now include a food image / dish mismatch risk diagnostic. Destinations flagged there should be reviewed here before adding or promoting food images.
- Missing or fallback images should stay as tracked local asset needs; do not replace them with unverified external images.
- Result screens now omit the trip image gallery when only category fallback or weak generic images are available. Add verified destination-specific hero/scenery/food assets here before promoting images back into that section.
- Osaka City needs safe local image coverage for Dotonbori, Osaka Castle Park, Shinsekai, Nakanoshima, takoyaki, okonomiyaki, and kushikatsu before image-led presentation is expanded.
