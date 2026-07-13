# 映えスポット登録テンプレート

```js
{
  id: '東京都-台東区-asakusa-sensoji',
  destinationId: '東京都-台東区',
  name: 'スポットの正式名称',
  category: '寺社・街並み',
  summary: '写真に残したくなる理由を短く記述します。',
  appealTags: ['街歩き', '建築'],
  bestTime: '朝',
  bestSeason: '春・秋',
  weatherNote: '天候による見え方や注意点。',
  accessNote: '最寄り駅からの簡潔な補足。',
  mapQuery: '東京都台東区 スポットの正式名称',
  sourceStatus: 'manual_verified',
  sourceCheckedAt: 'YYYY-MM-DD',
  sourceName: '確認した公式観光サイトまたは施設公式サイト',
  sourceUrl: 'https://example.com/official-spot-page',
  status: 'confirmed',
}
```

## 項目

- `id`: 全スポットで重複しない固定ID。`destinationId`と英字slugを組み合わせます。
- `destinationId`: `src/data/destinations.js`で使う`都道府県-市区町村`キーです。
- `name` / `summary`: 一般画面に表示する必須情報です。
- `category`: 景色、建築、街並み、寺社など、短い分類です。
- `appealTags`: 写真の魅力を表す短いタグです。
- `bestTime` / `bestSeason` / `weatherNote` / `accessNote`: 確認できた項目だけ登録します。
- `mapQuery`: Google Maps検索に使う、地名を含む検索語です。
- `sourceStatus` / `sourceCheckedAt`: 確認方法と確認日です。confirmedは`manual_verified`と確認日を必須にします。
- `sourceName` / `sourceUrl`: 監査用の情報源です。confirmedは原則として公式観光サイトまたは施設公式サイトの名称とHTTP(S) URLを記録します。一般画面には表示しません。

## 採用基準

`confirmed`にできるのは、実在・名称・旅先との対応・紹介文・地図検索語を公式情報で確認できたスポットだけです。`sourceStatus: 'manual_verified'`、確認日、公式情報源の名称とURLを記録します。営業状況、撮影可否、季節・天候に依存する内容は断定せず、必要なら`weatherNote`へ短く記録します。

`needs_review`は候補として保存できますが、一般画面には表示されません。`draft`は編集途中の情報です。根拠不明、名称が曖昧、別自治体との区別ができない候補は登録しません。

## 表記・重複防止

- 名称は確認済みの正式表記を優先し、略称や俗称で二重登録しません。
- 同一`destinationId`内で同名スポットは1件だけにします。
- 同名自治体を避けるため、`destinationId`は必ず`src/data/destinations.js`の都道府県・cityから確認します。
- 複数旅先を一括追加する場合も、旅先ごとのconfirmed件数と既存登録との重複を検証します。
- 所在自治体が旅先と異なる可能性がある候補は、公式情報で所在地を確認できる場合だけ登録します。
- 季節限定・運行依存・自然条件に左右される候補は、固定の営業情報を記載せず公式案内の確認を促します。
- 中断したバッチを再開する時は、対象旅先ごとのconfirmed件数を集計し、不足分だけを追加します。

## 追加後の検証

1. `npm run test:photo-spots` を実行します。
2. confirmedデータに`manual_verified`、確認日、公式情報源の名称とHTTP(S) URLがあることを確認します。
3. `npm run lint` と `npm run build` を実行します。
4. 該当旅先の「映え」詳細で、confirmedの項目だけが表示されることを確認します。
5. 未登録項目の空ラベル、重複表示、検索・heroへの影響がないことを確認します。
