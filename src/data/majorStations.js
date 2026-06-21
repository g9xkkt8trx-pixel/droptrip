/**
 * 代表駅の選定ルール
 * - 市区町村の中心駅を優先
 * - 市区町村名と同名の駅を優先
 * - JR駅を優先
 * - 同格なら利用者数・中心性を優先
 * - 主要度が判断できない場合は五十音順で選ぶ
 */
export const majorStations = [
  { prefecture: '北海道', city: '札幌市', station: '札幌駅', priority: 'major', company: 'JR' },
  { prefecture: '青森県', city: '青森市', station: '青森駅', priority: 'major', company: 'JR' },
  { prefecture: '岩手県', city: '盛岡市', station: '盛岡駅', priority: 'major', company: 'JR' },
  { prefecture: '宮城県', city: '仙台市', station: '仙台駅', priority: 'major', company: 'JR' },
  { prefecture: '秋田県', city: '秋田市', station: '秋田駅', priority: 'major', company: 'JR' },
  { prefecture: '山形県', city: '山形市', station: '山形駅', priority: 'major', company: 'JR' },
  { prefecture: '福島県', city: '福島市', station: '福島駅', priority: 'major', company: 'JR' },
  { prefecture: '茨城県', city: '水戸市', station: '水戸駅', priority: 'major', company: 'JR' },
  { prefecture: '栃木県', city: '宇都宮市', station: '宇都宮駅', priority: 'major', company: 'JR' },
  { prefecture: '群馬県', city: '前橋市', station: '前橋駅', priority: 'major', company: 'JR' },
  { prefecture: '埼玉県', city: 'さいたま市', station: '大宮駅', priority: 'major', company: 'JR' },
  { prefecture: '千葉県', city: '千葉市', station: '千葉駅', priority: 'major', company: 'JR' },
  { prefecture: '東京都', city: '千代田区', station: '東京駅', priority: 'major', company: 'JR' },
  { prefecture: '神奈川県', city: '横浜市', station: '横浜駅', priority: 'major', company: 'JR' },
  { prefecture: '新潟県', city: '新潟市', station: '新潟駅', priority: 'major', company: 'JR' },
  { prefecture: '富山県', city: '富山市', station: '富山駅', priority: 'major', company: 'JR' },
  { prefecture: '石川県', city: '金沢市', station: '金沢駅', priority: 'major', company: 'JR' },
  { prefecture: '福井県', city: '福井市', station: '福井駅', priority: 'major', company: 'JR' },
  { prefecture: '山梨県', city: '甲府市', station: '甲府駅', priority: 'major', company: 'JR' },
  { prefecture: '長野県', city: '長野市', station: '長野駅', priority: 'major', company: 'JR' },
  { prefecture: '岐阜県', city: '岐阜市', station: '岐阜駅', priority: 'major', company: 'JR' },
  { prefecture: '静岡県', city: '静岡市', station: '静岡駅', priority: 'major', company: 'JR' },
  { prefecture: '愛知県', city: '名古屋市', station: '名古屋駅', priority: 'major', company: 'JR' },
  { prefecture: '三重県', city: '津市', station: '津駅', priority: 'major', company: 'JR' },
  { prefecture: '滋賀県', city: '大津市', station: '大津駅', priority: 'major', company: 'JR' },
  { prefecture: '京都府', city: '京都市', station: '京都駅', priority: 'major', company: 'JR' },
  { prefecture: '大阪府', city: '大阪市', station: '大阪駅', priority: 'major', company: 'JR' },
  { prefecture: '兵庫県', city: '神戸市', station: '三ノ宮駅', priority: 'major', company: 'JR' },
  { prefecture: '奈良県', city: '奈良市', station: '奈良駅', priority: 'major', company: 'JR' },
  { prefecture: '和歌山県', city: '和歌山市', station: '和歌山駅', priority: 'major', company: 'JR' },
  { prefecture: '鳥取県', city: '鳥取市', station: '鳥取駅', priority: 'major', company: 'JR' },
  { prefecture: '島根県', city: '松江市', station: '松江駅', priority: 'major', company: 'JR' },
  { prefecture: '岡山県', city: '岡山市', station: '岡山駅', priority: 'major', company: 'JR' },
  { prefecture: '広島県', city: '広島市', station: '広島駅', priority: 'major', company: 'JR' },
  { prefecture: '山口県', city: '山口市', station: '新山口駅', priority: 'major', company: 'JR' },
  { prefecture: '徳島県', city: '徳島市', station: '徳島駅', priority: 'major', company: 'JR' },
  { prefecture: '香川県', city: '高松市', station: '高松駅', priority: 'major', company: 'JR' },
  { prefecture: '愛媛県', city: '松山市', station: '松山駅', priority: 'major', company: 'JR' },
  { prefecture: '高知県', city: '高知市', station: '高知駅', priority: 'major', company: 'JR' },
  { prefecture: '福岡県', city: '福岡市', station: '博多駅', priority: 'major', company: 'JR' },
  { prefecture: '佐賀県', city: '佐賀市', station: '佐賀駅', priority: 'major', company: 'JR' },
  { prefecture: '長崎県', city: '長崎市', station: '長崎駅', priority: 'major', company: 'JR' },
  { prefecture: '熊本県', city: '熊本市', station: '熊本駅', priority: 'major', company: 'JR' },
  { prefecture: '大分県', city: '大分市', station: '大分駅', priority: 'major', company: 'JR' },
  { prefecture: '宮崎県', city: '宮崎市', station: '宮崎駅', priority: 'major', company: 'JR' },
  { prefecture: '鹿児島県', city: '鹿児島市', station: '鹿児島中央駅', priority: 'major', company: 'JR' },
  { prefecture: '沖縄県', city: '那覇市', station: '県庁前駅', priority: 'major', company: 'ゆいレール' },
  { prefecture: '茨城県', city: 'つくば市', station: 'つくば駅', priority: 'major', company: '首都圏新都市鉄道' },
  { prefecture: '東京都', city: '新宿区', station: '新宿駅', priority: 'major', company: 'JR' },
  { prefecture: '神奈川県', city: '鎌倉市', station: '鎌倉駅', priority: 'tourism', company: 'JR' },
  { prefecture: '神奈川県', city: '箱根町', station: '箱根湯本駅', priority: 'tourism', company: '箱根登山電車' },
  { prefecture: '栃木県', city: '日光市', station: '東武日光駅', priority: 'tourism', company: '東武鉄道' },
  { prefecture: '群馬県', city: '草津町', station: '長野原草津口駅', priority: 'tourism', company: 'JR' },
  { prefecture: '栃木県', city: '那須塩原市', station: '那須塩原駅', priority: 'major', company: 'JR' },
  { prefecture: '宮城県', city: '松島町', station: '松島海岸駅', priority: 'tourism', company: 'JR' },
  { prefecture: '青森県', city: '弘前市', station: '弘前駅', priority: 'major', company: 'JR' },
  { prefecture: '福島県', city: '会津若松市', station: '会津若松駅', priority: 'major', company: 'JR' },
  { prefecture: '静岡県', city: '熱海市', station: '熱海駅', priority: 'major', company: 'JR' },
  { prefecture: '岐阜県', city: '高山市', station: '高山駅', priority: 'major', company: 'JR' },
  { prefecture: '長野県', city: '松本市', station: '松本駅', priority: 'major', company: 'JR' },
  { prefecture: '山梨県', city: '富士河口湖町', station: '河口湖駅', priority: 'tourism', company: '富士急行' },
  { prefecture: '静岡県', city: '伊豆市', station: '修善寺駅', priority: 'tourism', company: '伊豆箱根鉄道' },
  { prefecture: '和歌山県', city: '白浜町', station: '白浜駅', priority: 'tourism', company: 'JR' },
  { prefecture: '兵庫県', city: '豊岡市', station: '豊岡駅', priority: 'major', company: 'JR' },
  { prefecture: '大分県', city: '別府市', station: '別府駅', priority: 'major', company: 'JR' },
  { prefecture: '大分県', city: '由布市', station: '由布院駅', priority: 'tourism', company: 'JR' },
  { prefecture: '北海道', city: '函館市', station: '函館駅', priority: 'major', company: 'JR' },
  { prefecture: '北海道', city: '小樽市', station: '小樽駅', priority: 'major', company: 'JR' },
  { prefecture: '東京都', city: '台東区', station: '上野駅', priority: 'major', company: 'JR' },
  { prefecture: '千葉県', city: '浦安市', station: '舞浜駅', priority: 'tourism', company: 'JR' },
  { prefecture: '埼玉県', city: '秩父市', station: '西武秩父駅', priority: 'tourism', company: '西武鉄道' },
  { prefecture: '岐阜県', city: '下呂市', station: '下呂駅', priority: 'tourism', company: 'JR' },
  { prefecture: '岐阜県', city: '白川村', station: '高山駅', priority: 'tourism', company: 'JR' },
  { prefecture: '広島県', city: '廿日市市', station: '宮島口駅', priority: 'tourism', company: 'JR' },
  { prefecture: '岡山県', city: '倉敷市', station: '倉敷駅', priority: 'major', company: 'JR' },
  { prefecture: '長崎県', city: '佐世保市', station: '佐世保駅', priority: 'major', company: 'JR' },
]

const normalize = (value) => value?.replace(/\s/g, '') ?? ''

export const findMajorStation = (input, prefecture = '', city = '') => {
  const normalizedInput = normalize(input)
  const normalizedPrefecture = normalize(prefecture)
  const normalizedCity = normalize(city)

  if (normalizedPrefecture && normalizedCity) {
    const exact = majorStations.find((item) => (
      item.prefecture === normalizedPrefecture && item.city === normalizedCity
    ))
    if (exact) return exact.station
  }

  const exactInput = majorStations.find((item) => (
    normalizedInput === `${item.prefecture}${item.city}` || normalizedInput === item.city
  ))
  if (exactInput) return exactInput.station

  const prefectureOnly = majorStations.find((item) => normalizedInput === item.prefecture)
  return prefectureOnly?.station ?? null
}
