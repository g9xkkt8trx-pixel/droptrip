# PHOTO SPOT AUDIT

## 監査対象

- `src/App.jsx`
- `src/data/destinations.js`
- `src/data/destinations.json`
- `src/data/supplementalDestinations.js`

## 現在の関連データ

| 種別 | 構造 | 登録旅先 | 登録件数 | 一般画面での扱い |
| --- | --- | ---: | ---: | --- |
| `trendHighlights` | `name`、`category`、`description`、`mapQuery`、`bestFor`、`sourceStatus`、`note` | 29 | 116 | 「映え・トレンド」詳細に表示 |
| `touristSpots` | `name`、`type`、`description`、`bestFor`、`stayTime`、`sourceStatus`、`note` | 既存データ由来 | 旅先ごとに可変 | 「行きたい場所」詳細に表示 |
| `highlight` / `recommendText` | 文章 | 137 | 旅先ごとに1件 | 旅先紹介に使用 |
| `photoSpots` | 専用構造 | 123 | 369 | confirmedのみを「映え」詳細に表示 |

`trendHighlights`はすべて`sourceStatus: needs_review`を初期値にしており、既存文章をconfirmedへ移行していません。既存の表示を消さないまま、公式または施設公式サイトで確認した沖縄県の4旅先・12件を専用データへ新規登録しました。

## confirmed登録状況

- 対象旅先: 那覇市、石垣市、宮古島市、本部町、箱根町、京都市、小樽市、函館市、横浜市、札幌市、釧路市、天草市、白浜町、富山市、佐世保市、山口市、明石市、鳥羽市
- confirmed: 369件
- needs_review: 0件
- draft: 0件
- 情報源URL: 369件。`sourceName`と`sourceUrl`は監査用に保持し、一般画面には表示しません。

第1弾は沖縄県の4旅先・12件、第2弾は箱根町・京都市・小樽市・函館市の4旅先・12件、第3弾は横浜市など10旅先・30件、第4弾は奈良市など15旅先・45件です。第7弾は名古屋市など15旅先・45件を、第1工程5旅先と残り10旅先に分けて重複なく登録しました。第8弾は墨田区など15旅先・45件を、5旅先ずつ3工程で確認・登録しました。

## 現状の課題

- `trendHighlights`は旅先名をキーにした文章中心のデータで、固定ID・`destinationId`・確認日・写真向けの時間帯や季節情報を持ちません。
- 映えスポット、映えグルメ、街歩き候補が同じ配列に混在しています。
- `sourceStatus`がneeds_reviewでも既存画面に表示されるため、confirmedのみを厳格に出す専用表示には使えません。
- `touristSpots`は観光情報として有用ですが、写真向けの確認基準・気象注意・地図検索語を統一管理していません。

## 映えスポット未登録旅先

正式旅先は137件、`prefecture-city`キーでの重複除外後は136件です。confirmed映えスポット登録は123旅先、未登録は13旅先です。以下は次回の公式情報確認候補であり、confirmed登録前に所在地・名称・運営状況を再確認します。

| destination.id | 候補スポット3件 |
| --- | --- |
| 宮城県-松島町 | 松島湾、瑞巌寺、五大堂 |
| 兵庫県-豊岡市 | 城崎温泉街、玄武洞公園、竹野浜 |
| 岐阜県-郡上市 | 郡上八幡城、宗祇水、吉田川 |
| 静岡県-三島市 | 三嶋大社、源兵衛川、三島スカイウォーク |
| 京都府-舞鶴市 | 赤れんがパーク、五老スカイタワー、舞鶴引揚記念館 |
| 京都府-宮津市 | 天橋立、元伊勢籠神社、傘松公園 |
| 兵庫県-丹波篠山市 | 篠山城跡、河原町妻入商家群、安間家史料館 |
| 滋賀県-彦根市 | 彦根城、玄宮園、彦根城博物館 |
| 和歌山県-和歌山市 | 和歌山城、紀三井寺、和歌山マリーナシティ |
| 岡山県-津山市 | 津山城跡、衆楽園、城東町並み保存地区 |
| 広島県-竹原市 | たけはら町並み保存地区、西方寺普明閣、竹原市歴史民俗資料館 |
| 香川県-丸亀市 | 丸亀城、丸亀市猪熊弦一郎現代美術館、丸亀港 |
| 長崎県-島原市 | 島原城、武家屋敷、水無川本陣跡 |

## 専用データ構造

`src/data/photoSpots.js`を追加しました。1件ごとに次を管理します。

- `id`、`destinationId`、`name`、`category`、`summary`
- `appealTags`、`bestTime`、`bestSeason`、`weatherNote`、`accessNote`
- `mapQuery`、`sourceStatus`、`sourceCheckedAt`、`sourceName`、`sourceUrl`、`status`

`getConfirmedPhotoSpots(destination)`は、`destination.id`と都道府県-市区町村キーで照合し、confirmedのみを重複なく返します。needs_reviewとdraftは一般画面へ出しません。

## 移行方針

1. 既存の`trendHighlights`は、実在・名称・旅先対応・地図検索語・確認日を確認できた項目だけを手動で`photoSpots`へ登録します。
2. 既存データの文章を推測でconfirmed化しません。
3. 同一内容は既存の「映え・トレンド」と二重表示しないよう、移行前に表示方針を確認します。
4. 専用データは「映え」詳細を開いた時だけ遅延読み込みし、初期バンドルを増やしません。
