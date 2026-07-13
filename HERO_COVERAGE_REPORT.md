# DROPTRIP Hero Coverage Report

監査日: 2026-07-13

## 結論

`src/data/destinations.js` の実際の旅先は137件です。従来の120件という想定とは一致しません。内訳は、表示可能なconfirmed heroが107件、ファイルはあるがレビュー待ちが3件、画像未作成が27件です。

| 項目 | 件数 | 判定 |
|---|---:|---|
| 正式旅先総数 | 137 | 同一キーの兵庫県-豊岡市が2件含まれる |
| confirmed hero | 107 | 実ファイルあり、`shouldShowHero: true` |
| shouldShowHero true | 107 | confirmed数と一致 |
| registration_fix_needed | 0 | キー不一致は検出されず |
| file_missing | 0 | 登録済み参照の欠落なし |
| needs_review | 3 | 松島町・白浜町・那覇市。一般表示なし |
| image_missing | 27 | 新規画像作成が必要 |
| 旅先データ重複 | 1 | 兵庫県-豊岡市が2行 |
| 互換エイリアス登録 | 124組 | `都道府県-市区町村` と `市区町村` の意図的な重複 |
| 未参照のhero WebP | 21 | 削除せず管理対象として残す |

## 表示条件

一般画面で表示するのは、`status === "confirmed"`、`type === "destination_fixed"`、画像URLとaltがあり、`isIllustration` または `isPhoto` がtrue、かつ `hasEmbeddedText !== true` のheroだけです。確認済みの107件はいずれもこの条件を満たし、参照先ファイルも `public` 配下に存在します。古い `hero.svg`、カテゴリ・汎用・ランダムfallbackは解決結果に含まれません。

## 本当に画像作成が必要な旅先（27件）

高島市、下関市、萩市、三好市、佐賀市、嬉野市、北九州市、釧路市、登別市、平泉町、足利市、上山市、酒田市、花巻市、八戸市、郡山市、郡上市、明石市、津山市、山口市、竹原市、丸亀市、今治市、徳島市、天草市、島原市、本部町。

## ファイルはあるが表示しない旅先（3件）

| 正式キー | src | 状態 | 表示しない理由 |
|---|---|---|---|
| 宮城県-松島町 | `/images/destinations/matsushima-hero.jpg` | needs_review | confirmed前のため |
| 和歌山県-白浜町 | `/images/destinations/shirahama-hero.jpg` | needs_review | confirmed前のため |
| 沖縄県-那覇市 | `/images/destinations/naha-hero.jpg` | needs_review | confirmed前のため |

## 登録修正だけで解決できた旅先

今回の監査では0件です。全confirmed heroは正式旅先の `id` / `prefecture-city key` に解決し、ファイル不存在もありませんでした。名称の揺れは、廿日市市（宮島）、由布市（湯布院）、松山市（道後温泉）、神戸市（有馬温泉）、豊岡市（城崎温泉）、尾花沢市（銀山温泉）、渋川市（伊香保温泉）、富士河口湖町（河口湖）について確認済みです。

## 重複・孤立の整理対象

- 正式旅先データの重複は兵庫県-豊岡市の2件です。画像解決は同じconfirmed assetへ収束しており、今回の画像監査では変更しません。
- `DESTINATION_LOCAL_IMAGES` は後方互換のため、124旅先に都道府県キーと市区町村キーの2系統を持ちます。これは意図的なエイリアスであり、表示の重複ではありません。
- 未参照WebPは21件です。現在の `destinations.js` に未登録の先行heroと、文字入り旧v1（鎌倉・熱海・仙台・福岡）、有馬温泉用の先行assetを含みます。削除は行いません。
- 古いSVGは存在しても一般画面の解決結果には使われません。

## 2026-07-13 登録追加

那須塩原市、佐世保市、仙北市、湯沢町、富山市、立山町、坂井市、鳥羽市の文字なしheroをconfirmed登録しました。館山市と立山町で競合していた `tateyama/hero-v1.webp` は館山市をHEAD版へ復元し、立山町を `tateyama-toyama/hero-v1.webp` へ分離しています。両方の表示条件はtrueです。

## 開発者ページで確認する項目

既存のhero画像レビュー台帳で、全旅先数、confirmed / needs_review / missing、各heroのsrc、status、表示可否と非表示理由、直接画像リンク、プレビューを確認できます。未作成は `hero missing` 一覧で確認します。実ファイルの最終照合はこのレポート作成時に `public` 配下で実施しました。
