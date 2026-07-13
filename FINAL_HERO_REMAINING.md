# DROPTRIP Hero Final Remaining

監査日: 2026-07-13

## 集計

| 項目 | 件数 |
|---|---:|
| 正式旅先総数 | 137 |
| confirmed hero | 133 |
| shouldShowHero true | 133 |
| 未完成hero | 4 |
| 新規画像生成が必要 | 3 |
| needs_review | 1 |
| registration_fix_needed | 0 |
| file_missing | 0 |
| 旅先データ重複 | 1（兵庫県-豊岡市） |
| 孤立hero WebP | 5 |

正式旅先に未登録の先行confirmed assetは29件ありますが、ここでの集計には含めません。

## 新規画像生成が必要な旅先

| 優先 | 正式キー | 旅先 | 推奨slug | 現在の状態 | 登録修正だけで解決 |
|---:|---|---|---|---|---|
| 1 | 熊本県-天草市 | 天草市 | `amakusa` | image_missing | 不可 |
| 2 | 長崎県-島原市 | 島原市 | `shimabara` | image_missing | 不可 |
| 3 | 沖縄県-本部町 | 本部町 | `motobu` | image_missing | 不可 |

## 品質レビュー待ち

| 正式キー | 旅先 | 現在のsrc | 状態 | 次の対応 |
|---|---|---|---|---|
| 和歌山県-白浜町 | 白浜町 | `/images/destinations/shirahama-hero.jpg` | needs_review | 画像の品質・権利・画像内文字を確認し、confirmed可否を決める |

## 次の画像生成バッチ

1. 天草市、島原市、本部町

各画像は文字なし・旅先固有要素2つ以上・`destination_fixed`・`confirmed`前のメタデータ確認を満たしてから一般画面へ出します。
