import rawDestinations from '../src/data/destinations.json' with { type: 'json' }
import { supplementalDestinations } from '../src/data/supplementalDestinations.js'
import {
  filterDestinationSearchResults,
  getDestinationDedupeKey,
} from '../src/utils/destinationSearch.js'

const officialDestinations = [...rawDestinations, ...supplementalDestinations].map((destination) => ({
  ...destination,
  id: `${destination.prefecture}-${destination.city}`,
}))

const failures = []
for (const destination of officialDestinations) {
  const destinationKey = getDestinationDedupeKey(destination)
  const searchTerms = [...new Set([destination.name, destination.city].filter(Boolean))]
  for (const searchTerm of searchTerms) {
    const matches = filterDestinationSearchResults(officialDestinations, searchTerm)
    if (!matches.some((place) => getDestinationDedupeKey(place) === destinationKey)) {
      failures.push(`${destination.id}: ${searchTerm}`)
    }
  }
}

const requiredQueries = [
  ['郡上', '岐阜県-郡上市'],
  ['明石', '兵庫県-明石市'],
  ['天草', '熊本県-天草市'],
  ['島原', '長崎県-島原市'],
  ['本部', '沖縄県-本部町'],
  ['白浜', '和歌山県-白浜町'],
  ['那覇', '沖縄県-那覇市'],
  ['松島', '宮城県-松島町'],
  ['高島', '滋賀県-高島市'],
  ['登別', '北海道-登別市'],
  ['釧路', '北海道-釧路市'],
  ['沖縄', '沖縄県-那覇市'],
  ['熊本県 天草市', '熊本県-天草市'],
]
for (const [query, expectedKey] of requiredQueries) {
  const matches = filterDestinationSearchResults(officialDestinations, query)
  if (!matches.some((destination) => getDestinationDedupeKey(destination) === expectedKey)) {
    failures.push(`required query: ${query} -> ${expectedKey}`)
  }
}

const toyookaMatches = filterDestinationSearchResults(officialDestinations, '豊岡')
const toyookaCount = toyookaMatches.filter((place) => place.prefecture === '兵庫県' && place.city === '豊岡市').length
if (toyookaCount !== 1) failures.push(`豊岡市の重複排除: ${toyookaCount}件`)

if (failures.length > 0) {
  console.error(`旅先検索検証に失敗しました。\n${failures.join('\n')}`)
  process.exitCode = 1
} else {
  console.log(`旅先検索検証OK: 正式旅先 ${officialDestinations.length}件 / 検索母集団 ${filterDestinationSearchResults(officialDestinations).length}件 / 必須検索 ${requiredQueries.length}件 / 豊岡市 1件`)
}
