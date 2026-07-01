# CHANGELOG

DROPTRIP のβ版リリース履歴を管理するためのメモです。

## v0.1.0-beta

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
- 交通手段比較
- AIプラン生成準備
- Vercel公開対応
- APIサーバー経由化
- 画像管理改善
- βテストメモ機能

## Unreleased

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
