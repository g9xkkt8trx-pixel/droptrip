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
| `photoSpots` | 専用構造 | 0 | 0 | confirmedのみ表示する基盤 |

`trendHighlights`はすべて`sourceStatus: needs_review`を初期値にしており、写真スポット専用のconfirmedデータとして移行できる確認情報はありません。既存の表示を消さないため、今回の専用データへの移行は0件です。

## 現状の課題

- `trendHighlights`は旅先名をキーにした文章中心のデータで、固定ID・`destinationId`・確認日・写真向けの時間帯や季節情報を持ちません。
- 映えスポット、映えグルメ、街歩き候補が同じ配列に混在しています。
- `sourceStatus`がneeds_reviewでも既存画面に表示されるため、confirmedのみを厳格に出す専用表示には使えません。
- `touristSpots`は観光情報として有用ですが、写真向けの確認基準・気象注意・地図検索語を統一管理していません。

## 専用データ構造

`src/data/photoSpots.js`を追加しました。1件ごとに次を管理します。

- `id`、`destinationId`、`name`、`category`、`summary`
- `appealTags`、`bestTime`、`bestSeason`、`weatherNote`、`accessNote`
- `mapQuery`、`sourceStatus`、`sourceCheckedAt`、`status`

`getConfirmedPhotoSpots(destination)`は、`destination.id`と都道府県-市区町村キーで照合し、confirmedのみを重複なく返します。needs_reviewとdraftは一般画面へ出しません。

## 移行方針

1. 既存の`trendHighlights`は、実在・名称・旅先対応・地図検索語・確認日を確認できた項目だけを手動で`photoSpots`へ登録します。
2. 既存データの文章を推測でconfirmed化しません。
3. 同一内容は既存の「映え・トレンド」と二重表示しないよう、移行前に表示方針を確認します。
4. 専用データは「映え」詳細を開いた時だけ遅延読み込みし、初期バンドルを増やしません。
