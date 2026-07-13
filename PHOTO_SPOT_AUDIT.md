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
| `photoSpots` | 専用構造 | 136 | 408 | confirmedのみを「映え」詳細に表示 |

`trendHighlights`はすべて`sourceStatus: needs_review`を初期値にしており、既存文章をconfirmedへ移行していません。既存の表示を消さないまま、公式または施設公式サイトで確認した沖縄県の4旅先・12件を専用データへ新規登録しました。

## confirmed登録状況

- 正式旅先: 137件（`prefecture-city`キーで重複除外後136件。兵庫県豊岡市の重複データは元データのまま）
- 映えスポット対応済み旅先: 136件
- 未対応旅先: 0件
- confirmed: 408件（全正式旅先で3件）
- needs_review: 0件
- draft: 0件
- 情報源URL: 408件。`sourceName`と`sourceUrl`は監査用に保持し、一般画面には表示しません。
- 旅先あたりのconfirmed件数: 最小3件 / 最大3件 / 平均3.00件
- ID重複: 0件 / 同一旅先内名称重複: 0件 / 存在しないdestinationId: 0件

第1弾は沖縄県の4旅先・12件、第2弾は箱根町・京都市・小樽市・函館市の4旅先・12件、第3弾は横浜市など10旅先・30件、第4弾は奈良市など15旅先・45件です。第7弾は名古屋市など15旅先・45件を、第1工程5旅先と残り10旅先に分けて重複なく登録しました。第8弾は墨田区など15旅先・45件を、5旅先ずつ3工程で確認・登録しました。

## 現状の課題

- `trendHighlights`は旅先名をキーにした文章中心のデータで、固定ID・`destinationId`・確認日・写真向けの時間帯や季節情報を持ちません。
- 映えスポット、映えグルメ、街歩き候補が同じ配列に混在しています。
- `sourceStatus`がneeds_reviewでも既存画面に表示されるため、confirmedのみを厳格に出す専用表示には使えません。
- `touristSpots`は観光情報として有用ですが、写真向けの確認基準・気象注意・地図検索語を統一管理していません。

## 最終対応

最終監査で抽出した未登録13旅先へ、公式情報源を記録したconfirmedスポットを各3件、計39件追加しました。追加対象は松島町、豊岡市、郡上市、三島市、舞鶴市、宮津市、丹波篠山市、彦根市、和歌山市、津山市、竹原市、丸亀市、島原市です。

重複除外後の正式旅先136件すべてでconfirmedスポットが3件以上となり、未登録・不足旅先は0件です。`test:photo-spots`はこの最低3件ルールを継続的に検証します。

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
