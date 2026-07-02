# DROPTRIP 公開前テスト

アプリを公開する前に、主要機能が正常に動作するか手動で確認するためのチェックリストです。

## β版公開前の最小チェック

- [ ] トップ画面が表示される
- [ ] 旅先抽選ができる
- [ ] 車の距離・時間が出る
- [ ] 旅行先一覧が使える
- [ ] お気に入り登録ができる
- [ ] 比較に追加できる
- [ ] 抽選履歴が保存される
- [ ] スマホ表示が崩れない
- [ ] APIキー全文が表示されない

## テスト前の準備

- `npm install` を実行する
- `npm run dev` でアプリを起動する
- Chrome、Edge、Safariなど公開後に利用されるブラウザで確認する
- 保存機能を最初から確認する場合は、ブラウザのDROPTRIP用 `localStorage` を削除する
- Google Maps APIとOpenAI APIを使う確認では、公開用ではなくテスト用の制限済みAPIキーを使用する

## 基本操作

- [ ] 出発地を入力できる
- [ ] 旅行日程を選べる
- [ ] 季節を選べる
- [ ] 同行者・旅のスタイルを選べる
- [ ] 「旅先を決める」ボタンで抽選できる

## 抽選結果

- [ ] 旅先名が表示される
- [ ] 写真が表示される
- [ ] 画像がない場合はプレースホルダーが表示される
- [ ] 運命度が表示される
- [ ] おすすめ理由が表示される
- [ ] 季節との相性が表示される
- [ ] 詳細プランが表示される

## Google Mapsアクセス確認

- [ ] 車の距離・時間・料金目安が表示される
- [ ] 電車の目安時間が表示される
- [ ] 電車の「Google Mapsで確認する」ボタンが動作する
- [ ] 飛行機の目安時間・料金目安が表示される
- [ ] 「計算方法の内容はこちら」から計算方法ページに移動できる
- [ ] 計算方法ページからメイン画面へ戻れる

## 保存系

- [ ] お気に入り登録できる
- [ ] お気に入りページで登録内容を確認できる
- [ ] お気に入りを削除できる
- [ ] 抽選履歴が保存される
- [ ] 抽選履歴ページで履歴を確認できる
- [ ] 履歴から旅先を再表示できる
- [ ] お気に入りの旅先を比較対象に追加できる

## AI・プレミアム

- [ ] 無料状態ではAIプラン生成が実行されない
- [ ] プレミアム案内が表示される
- [ ] 開発者ページでプレミアム状態をONにできる
- [ ] OpenAI APIキー未設定時は設定案内が表示される
- [ ] OpenAI APIキー設定時かつプレミアムONの場合のみAI生成を試せる

## 開発者ページ

- [ ] 通常画面に開発者ページボタンが表示されない
- [ ] 「DROPTRIP」タイトルを5回連続クリックすると開発者ページが開く
- [ ] APIキー全文が画面に表示されない
- [ ] Google Maps APIキーを保存・削除できる
- [ ] OpenAI APIキーを保存・削除できる
- [ ] 品質チェックの集計と要確認項目が表示される

## スマホ表示

- [ ] 375px幅で横にはみ出したり表示が崩れたりしない
- [ ] 430px幅で横にはみ出したり表示が崩れたりしない
- [ ] ボタンが指で押しやすい大きさになっている
- [ ] アクセス確認のGoogle Mapsボタンが1列で押しやすい
- [ ] 結果画面で薄い旅のイメージ画像カードが出ず、詳細は3つの大きなボタンへ整理されている

## テスト完了後

- [ ] `npm run lint` が成功する
- [ ] `npm run build` が成功する
- [ ] ブラウザの開発者ツールに重大なエラーが表示されていない
- [ ] テスト用APIキーや個人情報がコード、画面、ログに残っていない

## テスト結果メモ

- 実施日：
- 実施者：
- ブラウザ・端末：
- 確認したコミットまたはバージョン：
- 未解決の問題：

## 条件UI追加チェック

- [ ] 同行者・旅のスタイルを未選択でも抽選できる
- [ ] 旅の目的を未選択でも抽選できる
- [ ] 自分で入力を選ぶと泊数・日数入力が表示される
- [ ] 0泊は日帰り、1泊は1泊2日、2泊以上は自分入力の日程として扱われる
- [ ] 3泊4日以上で複数旅先候補が表示される場合がある
- [ ] 追加候補ごとに移動情報カードが増えず、詳しい移動はGoogle Maps確認に寄っている

## 旅行先データ品質の確認
- 開発者ページの品質チェックで region、localFoodCandidates、companionFit、purposeFit、stayFit、nearbyDestinationHints の未設定件数を確認します。
- 優先30件の整備率が表示され、京都市・福岡市・金沢市・石垣市などの長期旅行候補が自然な周遊先または滞在型提案を持つことを確認します。
- 近場/中距離/遠出の移動範囲を変えても、追加メタ情報は除外ではなく加点中心に働くことを確認します。

## 条件別抽選テスト（開発者ページ）
- [ ] 開発者ページの「条件別抽選テスト」で固定ケースを実行できる
- [ ] APIを呼ばず、抽選傾向だけを20回単位で確認できる
- [ ] 近場・長期旅行・同行者・旅の目的に対して、不自然な候補や警告が表示される
- [ ] region分布、出現回数、目的一致、同行者一致、長期旅行の追加候補有無を確認できる

## 共有前チェックリスト
- [ ] スマホでトップ画面がすぐ開く
- [ ] 共有リンクのタイトルが DROPTRIP になっている
- [ ] サブコピーが短く表示されている
- [ ] 旅先抽選ができる
- [ ] 結果画面の画像が大きく崩れていない
- [ ] 近場で遠方が出すぎない
- [ ] 長期旅行で関連候補が出る
- [ ] APIキーや開発者向け情報が一般画面に出ていない

## 観光スポット・ご当地グルメ表示の確認

- 抽選結果で「ここで行きたいスポット」が3件程度表示されることを確認します。
- 旅の目的をグルメ、神社・歴史、温泉、自然・絶景、街歩きなどに変え、スポットの表示順が自然に変わることを確認します。
- ご当地グルメはチップだけでなく、名称・種別・短い説明が表示されることを確認します。
- 開発者ページで touristSpots / localFoodDetails の不足、旅行先件数、region別件数を確認します。

## AIプラン具体性チェック

- AIプラン生成で、観光スポット名・ご当地グルメ名・周辺候補名が本文に含まれるか確認します。
- 日帰り、1泊2日、3泊以上、5泊以上で、出力構成が日程に合っているか確認します。
- 開発者ページで、AI送信 touristSpots / localFoodDetails / 周辺候補の件数と、表示診断を確認します。
- touristSpots や localFoodDetails が不足している旅行先でも、結果画面が崩れないことを確認します。

## 結果画面の具体性チェック

- 東京駅/温泉、東京駅/遠出、東京駅/5泊6日、福岡駅/自然、札幌駅/街歩きなどの条件で、観光スポット名・ご当地グルメ名・周辺候補名が表示されるか確認します。
- 「魅力的」「おすすめ」だけで終わらず、どこで何をする旅かが分かる文になっているか確認します。
- スマホ幅では、観光スポットカード、ご当地グルメ説明、長期旅行の周辺候補が横にはみ出さないことを確認します。

## Local Food Display Checks

- Confirm that abstract gourmet categories alone do not create detail cards.
- Confirm that localFoodDetails cards appear only when the name is a concrete dish or local specialty.
- Confirm that destinations with only abstract localFoodCandidates hide the local food section naturally.
- Confirm the developer page flags abstract names, template descriptions, generic food-image risk, and concrete food shortages.

## Concrete Tourist Spot Checks

- Confirm that result cards show real tourist spot names or specific area names.
- Confirm that generic names such as sightseeing spot, nature spot, or popular spot do not appear as spot card titles.
- Confirm that simple plans include spot names and local food names when data exists.
- Confirm that destinations with weak touristSpots do not show forced abstract cards or empty-state text.

## Pseudo Spot Name Checks

- Confirm that generated names such as city + local lunch, seaside area, cafe, and generic sightseeing spot do not appear on result screens.
- Confirm that destinations without concrete touristSpots hide the spot card section without showing empty-state text.
- Confirm that Naruto City, when present in data, uses concrete spots and local foods such as Uzu no Michi, Naruto Park, Naruto tai, and Naruto wakame.

## Natural Local Food Copy Checks

- Confirm that local food detail cards do not repeat the same generic sentence across multiple dishes.
- Confirm that detail cards include concrete timing or area hints when available.
- Confirm that AI plan prompts include local food description, timing, area hints, and trip-fit context without changing /api files.
- Confirm that generic or mismatched food images are not promoted as confirmed local specialty photos.
## 簡易モデルコース確認

- 結果画面の初期表示では、グルメ / スポット / モデルコースの3つだけが大きなボタンとして表示されることを確認します。
- 移動は3ボタンとは別のアクセス確認枠に分かれ、移動時間・料金を出さずにGoogle Maps確認だけへ誘導することを確認します。
- グルメ、スポット、モデルコースを押したとき、それぞれの詳細だけが表示され、行けそう度・予算目安・薄いおすすめポイント・ここで楽しみたいことが一般結果に出ないことを確認します。
- 日帰りでは、午前 / 昼 / 午後 / 夕方の流れに具体スポット名または具体グルメ名が入ることを確認します。
- 1泊2日では、1日目と2日目に分かれ、スポット名と料理名が最低1つずつ入ることを確認します。
- 2泊3日では、中心エリア、観光、食事、帰路の流れが短くまとまっていることを確認します。
- 3泊以上では、nearbyDestinationHints がある場合に周辺候補名が自然に表示されることを確認します。
- touristSpots や localFoodDetails が不足している旅行先で、都市名 + ランチ、都市名 + 観光スポットのような疑似名称が出ないことを確認します。
- 折りたたみの詳細プランでも「ご当地ランチ」のような抽象表示ではなく、具体的な料理名に置き換わることを確認します。
- 開発者ページで、疑似スポット名、抽象グルメ名、モデルコース不足、food image / dish mismatch risk を確認します。
- 一般結果画面に交通手段比較、未取得の車ルート、近距離の飛行機カード、取得失敗メッセージが表示されないことを確認します。
- ルート確認リンクの目的地が、広すぎる市区町村だけではなく最寄り駅や具体クエリに寄っていることを確認します。
- モデルコースは具体スポット名と具体グルメ名がある場合だけ表示され、データ不足時に汎用文だけで出ないことを確認します。
- 旅のイメージ画像や横スクロール画像カードが一般結果画面に残っていないことを確認します。
