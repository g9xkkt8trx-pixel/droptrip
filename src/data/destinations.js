import rawDestinations from './destinations.json'
import { getDestinationImages } from './destinationImages'
import { getDestinationTransit } from './destinationTransit'
import { supplementalDestinations } from './supplementalDestinations'

// 各自治体の代表地点。Routes APIの目的地座標として利用する。
const destinationCoordinates = {
  横浜市: [35.4437, 139.6380],
  鎌倉市: [35.3192, 139.5467],
  箱根町: [35.2324, 139.1069],
  日光市: [36.7199, 139.6982],
  草津町: [36.6209, 138.5961],
  那須塩原市: [36.9617, 140.0460],
  仙台市: [38.2682, 140.8694],
  松島町: [38.3809, 141.0670],
  青森市: [40.8222, 140.7474],
  弘前市: [40.6031, 140.4642],
  盛岡市: [39.7021, 141.1545],
  会津若松市: [37.4948, 139.9297],
  熱海市: [35.0959, 139.0716],
  金沢市: [36.5613, 136.6562],
  高山市: [36.1461, 137.2522],
  松本市: [36.2380, 137.9720],
  富士河口湖町: [35.4973, 138.7550],
  伊豆市: [34.9765, 138.9469],
  京都市: [35.0116, 135.7681],
  大阪市: [34.6937, 135.5023],
  神戸市: [34.6901, 135.1955],
  奈良市: [34.6851, 135.8048],
  白浜町: [33.6782, 135.3481],
  豊岡市: [35.5445, 134.8203],
  福岡市: [33.5904, 130.4017],
  長崎市: [32.7503, 129.8779],
  別府市: [33.2847, 131.4912],
  由布市: [33.1800, 131.4260],
  熊本市: [32.8031, 130.7079],
  鹿児島市: [31.5966, 130.5571],
  札幌市: [43.0618, 141.3545],
  函館市: [41.7687, 140.7288],
  小樽市: [43.1907, 140.9947],
  台東区: [35.7126, 139.7800],
  浦安市: [35.6530, 139.9020],
  秩父市: [35.9917, 139.0854],
  名古屋市: [35.1815, 136.9066],
  下呂市: [35.8059, 137.2441],
  白川村: [36.2707, 136.8986],
  広島市: [34.3853, 132.4553],
  廿日市市: [34.3489, 132.3317],
  倉敷市: [34.5850, 133.7720],
  鳥取市: [35.5011, 134.2351],
  高松市: [34.3428, 134.0466],
  松山市: [33.8392, 132.7657],
  高知市: [33.5597, 133.5311],
  那覇市: [26.2124, 127.6809],
  石垣市: [24.3448, 124.1572],
  宮崎市: [31.9077, 131.4202],
  佐世保市: [33.1799, 129.7151],
}

// 町村は郡名を含む正式な自治体住所を使用する。
const destinationAddresses = {
  箱根町: '神奈川県足柄下郡箱根町',
  草津町: '群馬県吾妻郡草津町',
  松島町: '宮城県宮城郡松島町',
  富士河口湖町: '山梨県南都留郡富士河口湖町',
  白浜町: '和歌山県西牟婁郡白浜町',
  白川村: '岐阜県大野郡白川村',
}

const getSeasonProfile = (destination) => {
  const { city, prefecture, tags } = destination
  const bestSeasons = new Set(['春', '秋'])

  if (tags.includes('海')) bestSeasons.add('夏')
  if (tags.includes('温泉')) bestSeasons.add('冬')
  if (tags.includes('山')) bestSeasons.add('秋')
  if (['北海道', '青森県', '岩手県'].includes(prefecture)) bestSeasons.add('冬')
  if (['沖縄県', '宮崎県'].includes(prefecture)) bestSeasons.add('夏')

  return {
    bestSeasons: [...bestSeasons],
    seasonHighlights: {
      春: tags.includes('山')
        ? `${city}の新緑と春の散策を楽しめる`
        : `${city}の穏やかな街歩きと春景色を楽しめる`,
      夏: tags.includes('海')
        ? `${city}の海景色と爽やかな夏の観光を満喫できる`
        : tags.includes('山')
          ? `${city}の自然に囲まれて涼やかに過ごせる`
          : `${city}の夏らしい街歩きとグルメを楽しめる`,
      秋: tags.includes('山') || tags.includes('温泉')
        ? `${city}の紅葉と${tags.includes('温泉') ? '温泉' : '自然散策'}の相性が良い`
        : `${city}の落ち着いた街並みと秋の味覚を楽しめる`,
      冬: tags.includes('温泉')
        ? `${city}で冬景色と温泉のぬくもりを楽しめる`
        : ['北海道', '青森県', '岩手県'].includes(prefecture)
          ? `${city}ならではの雪景色と冬の味覚に出会える`
          : `${city}の冬グルメと静かな観光を楽しめる`,
    },
  }
}

// 出発地によって移動時間が変わるため、固定の出発・到着時刻を柔軟な表記へ整える。
const normalizePlans = (plans, city) => Object.fromEntries(
  Object.entries(plans).map(([tripType, days]) => [
    tripType,
    days.map((day) => ({
      ...day,
      items: day.items.map((item) => {
        if (/^\d{2}:\d{2} 出発$/.test(item)) return '出発 移動時間に合わせて出発'
        if (item.includes(`${city}に到着`)) {
          return `${tripType === '2泊3日' ? '午後' : '午前'} ${city}に到着`
        }
        return item
      }),
    })),
  ]),
)

/**
 * UIで利用する旅行先データの公開モデル。
 * 元データを追加しても、このファイルで項目名と必須値を統一できる。
 */
const localFoodCandidatesByCity = {
  京都市: ['湯豆腐', '抹茶スイーツ', '京料理', '和カフェ'],
  奈良市: ['柿の葉寿司', '茶粥', '奈良漬', '和スイーツ'],
  小樽市: ['寿司', '海鮮丼', 'ルタオ系スイーツ', '市場グルメ'],
  札幌市: ['スープカレー', '味噌ラーメン', 'ジンギスカン', '海鮮'],
  函館市: ['海鮮丼', 'イカ料理', '塩ラーメン', '市場朝食'],
  金沢市: ['海鮮丼', '金沢おでん', '加賀料理', '和菓子'],
  箱根町: ['温泉まんじゅう', 'そば', '豆腐料理', 'ベーカリー'],
  熱海市: ['海鮮', '干物', '温泉まんじゅう', 'カフェスイーツ'],
  草津町: ['温泉まんじゅう', 'そば', '舞茸料理', '湯畑周辺スイーツ'],
  日光市: ['湯波料理', 'そば', '羊羹', 'カフェ'],
  鎌倉市: ['しらす丼', '鎌倉野菜', '和カフェ', 'スイーツ'],
  横浜市: ['中華街グルメ', '洋食', 'スイーツ', 'カフェ'],
  松島町: ['牡蠣', '海鮮', '笹かまぼこ', 'ずんだスイーツ'],
  仙台市: ['牛タン', 'ずんだ餅', '笹かまぼこ', '海鮮'],
  福岡市: ['豚骨ラーメン', 'もつ鍋', '明太子', '屋台グルメ'],
  長崎市: ['ちゃんぽん', '皿うどん', 'トルコライス', 'カステラ'],
  広島市: ['お好み焼き', '牡蠣', '穴子飯', '瀬戸内レモン'],
  廿日市市: ['あなごめし', '牡蠣', 'もみじ饅頭', '瀬戸内海鮮'],
  那覇市: ['沖縄そば', 'ゴーヤーチャンプルー', 'タコライス', 'ブルーシール'],
  石垣市: ['石垣牛', '八重山そば', '海鮮', '南国スイーツ'],
  高山市: ['飛騨牛', '高山ラーメン', 'みたらし団子', '郷土料理'],
  伊勢市: ['伊勢うどん', '赤福', 'てこね寿司', '海鮮'],
  白浜町: ['海鮮', 'クエ料理', '梅スイーツ', '温泉街グルメ'],
  軽井沢町: ['ベーカリー', '高原野菜', 'カフェ', 'ジャム'],
  富良野市: ['オムカレー', 'メロン', 'チーズ', 'スイーツ'],
  会津若松市: ['ソースカツ丼', 'こづゆ', '会津そば', '地酒'],
  尾道市: ['尾道ラーメン', '瀬戸内海鮮', 'レモンスイーツ', 'カフェ'],
  倉敷市: ['デミカツ丼', '白桃スイーツ', '町家カフェ', '瀬戸内グルメ'],
  松江市: ['出雲そば', '和菓子', 'しじみ料理', '茶文化'],
  別府市: ['地獄蒸し', 'とり天', '温泉プリン', '海鮮'],
}

const getLocalFoodCandidates = (city, tags = []) => {
  if (localFoodCandidatesByCity[city]) return localFoodCandidatesByCity[city]
  if (tags.includes('グルメ')) return ['ご当地グルメ', '市場グルメ', 'カフェ']
  if (tags.includes('海')) return ['海鮮', '市場グルメ', '港町の食事']
  if (tags.includes('温泉')) return ['温泉まんじゅう', 'そば', '温泉街グルメ']
  return ['ご当地グルメ', 'カフェ', '郷土料理']
}


const touristSpotsByCity = {
  "京都市": [
    {
      "name": "清水寺",
      "type": "神社・歴史",
      "description": "舞台から京都市街を見渡し、参道の坂道や門前町の店も歩いて回れます。",
      "bestFor": [
        "神社・歴史",
        "街歩き",
        "カップル"
      ],
      "stayTime": "1〜2時間"
    },
    {
      "name": "伏見稲荷大社",
      "type": "神社・歴史",
      "description": "千本鳥居をくぐりながら、稲荷山の入口周辺まで歩ける京都らしい参拝スポットです。",
      "bestFor": [
        "神社・歴史",
        "自然・絶景",
        "一人旅"
      ],
      "stayTime": "1〜2時間"
    },
    {
      "name": "錦市場",
      "type": "グルメ",
      "description": "惣菜、和菓子、漬物などを少しずつ選び、昼食や食べ歩きに組み込みやすい商店街です。",
      "bestFor": [
        "グルメ",
        "街歩き",
        "友達"
      ],
      "stayTime": "45分〜1時間"
    },
    {
      "name": "祇園・花見小路",
      "type": "街歩き",
      "description": "石畳の通りと町家の並びを夕方に歩くと、京都の落ち着いた雰囲気を感じられます。",
      "bestFor": [
        "街歩き",
        "ゆっくり",
        "カップル"
      ],
      "stayTime": "45分〜1時間"
    }
  ],
  "奈良市": [
    {
      "name": "東大寺",
      "type": "神社・歴史",
      "description": "大仏殿で奈良を代表する歴史に触れ、周辺の参道もあわせて歩けます。",
      "bestFor": [
        "神社・歴史",
        "ファミリー"
      ],
      "stayTime": "1〜1.5時間"
    },
    {
      "name": "奈良公園",
      "type": "自然・街歩き",
      "description": "芝生と鹿のいる広い公園を歩き、東大寺や春日大社への移動も自然につながります。",
      "bestFor": [
        "自然・絶景",
        "街歩き",
        "ペットあり"
      ],
      "stayTime": "1〜2時間"
    },
    {
      "name": "春日大社",
      "type": "神社・歴史",
      "description": "朱色の社殿と灯籠が続く参道を歩き、静かな森の空気も味わえます。",
      "bestFor": [
        "神社・歴史",
        "ゆっくり"
      ],
      "stayTime": "1時間前後"
    },
    {
      "name": "ならまち",
      "type": "街歩き",
      "description": "町家カフェや雑貨店をめぐり、古い町並みの中で休憩しやすいエリアです。",
      "bestFor": [
        "街歩き",
        "体験",
        "一人旅"
      ],
      "stayTime": "1〜2時間"
    }
  ],
  "小樽市": [
    {
      "name": "小樽運河",
      "type": "街歩き",
      "description": "倉庫群と運河沿いの景色を歩いて眺め、夕方は灯りの雰囲気も楽しめます。",
      "bestFor": [
        "街歩き",
        "カップル",
        "ゆっくり"
      ],
      "stayTime": "45分〜1時間"
    },
    {
      "name": "堺町通り",
      "type": "グルメ・街歩き",
      "description": "寿司、スイーツ、ガラス雑貨の店が並び、食べ歩きと買い物をまとめて楽しめます。",
      "bestFor": [
        "グルメ",
        "街歩き",
        "友達"
      ],
      "stayTime": "1〜2時間"
    },
    {
      "name": "三角市場",
      "type": "グルメ",
      "description": "駅近くで海鮮丼や刺身を選びやすく、到着後の昼食に組み込みやすい市場です。",
      "bestFor": [
        "グルメ",
        "一人旅"
      ],
      "stayTime": "45分〜1時間"
    },
    {
      "name": "北一硝子",
      "type": "体験・買い物",
      "description": "ガラス製品の店を見て回り、屋内で小樽らしい工芸の雰囲気に触れられます。",
      "bestFor": [
        "体験",
        "街歩き"
      ],
      "stayTime": "45分〜1時間"
    }
  ],
  "札幌市": [
    {
      "name": "大通公園",
      "type": "街歩き",
      "description": "中心部の長い公園を歩き、テレビ塔や季節イベントと組み合わせやすい場所です。",
      "bestFor": [
        "街歩き",
        "ゆっくり"
      ],
      "stayTime": "30分〜1時間"
    },
    {
      "name": "二条市場",
      "type": "グルメ",
      "description": "海鮮丼や焼き物を朝から選びやすく、札幌中心部で食を楽しむ起点になります。",
      "bestFor": [
        "グルメ",
        "一人旅"
      ],
      "stayTime": "45分〜1時間"
    },
    {
      "name": "すすきの",
      "type": "グルメ・夜景",
      "description": "ラーメンやジンギスカンの店が集まり、夕食の候補を探しやすい繁華街です。",
      "bestFor": [
        "グルメ",
        "友達"
      ],
      "stayTime": "1〜2時間"
    },
    {
      "name": "北海道大学周辺",
      "type": "自然・街歩き",
      "description": "並木道やキャンパスの緑を歩き、中心部にいながら落ち着いて過ごせます。",
      "bestFor": [
        "自然・絶景",
        "街歩き"
      ],
      "stayTime": "45分〜1時間"
    }
  ],
  "函館市": [
    {
      "name": "函館山展望台",
      "type": "夜景・絶景",
      "description": "港と市街地の光を一望でき、夜景目的の旅で外しにくい定番スポットです。",
      "bestFor": [
        "自然・絶景",
        "カップル"
      ],
      "stayTime": "1時間前後"
    },
    {
      "name": "函館朝市",
      "type": "グルメ",
      "description": "海鮮丼やイカ料理を朝食に選びやすく、駅近で移動前にも寄れます。",
      "bestFor": [
        "グルメ",
        "一人旅"
      ],
      "stayTime": "45分〜1時間"
    },
    {
      "name": "五稜郭公園",
      "type": "歴史・自然",
      "description": "星形の城郭跡を散策し、春は桜、冬は雪景色と合わせて楽しめます。",
      "bestFor": [
        "神社・歴史",
        "自然・絶景"
      ],
      "stayTime": "1〜1.5時間"
    },
    {
      "name": "金森赤レンガ倉庫",
      "type": "街歩き",
      "description": "港沿いの倉庫群で買い物やカフェ休憩をしながら歩けます。",
      "bestFor": [
        "街歩き",
        "カップル"
      ],
      "stayTime": "1時間前後"
    }
  ],
  "金沢市": [
    {
      "name": "兼六園",
      "type": "庭園・歴史",
      "description": "池や松、茶屋を眺めながら歩ける日本庭園で、季節ごとの景色がはっきり変わります。",
      "bestFor": [
        "神社・歴史",
        "自然・絶景",
        "ゆっくり"
      ],
      "stayTime": "1〜1.5時間"
    },
    {
      "name": "ひがし茶屋街",
      "type": "街歩き",
      "description": "格子戸の町家が並ぶ通りで、和菓子や工芸の店にも立ち寄れます。",
      "bestFor": [
        "街歩き",
        "体験"
      ],
      "stayTime": "1〜2時間"
    },
    {
      "name": "近江町市場",
      "type": "グルメ",
      "description": "海鮮丼や寿司を選びやすく、昼食を旅の中心にしやすい市場です。",
      "bestFor": [
        "グルメ",
        "友達"
      ],
      "stayTime": "1時間前後"
    },
    {
      "name": "金沢21世紀美術館",
      "type": "体験・アート",
      "description": "現代アートの展示や屋外作品を見て、雨の日でも過ごしやすいスポットです。",
      "bestFor": [
        "体験",
        "街歩き"
      ],
      "stayTime": "1〜2時間"
    }
  ],
  "箱根町": [
    {
      "name": "箱根神社",
      "type": "神社・歴史",
      "description": "芦ノ湖畔の鳥居と杉並木を歩き、湖の景色と参拝を一緒に楽しめます。",
      "bestFor": [
        "神社・歴史",
        "自然・絶景",
        "カップル"
      ],
      "stayTime": "45分〜1時間"
    },
    {
      "name": "大涌谷",
      "type": "自然・絶景",
      "description": "火山の煙が上がる斜面を見て、黒たまごや山景色も組み合わせられます。",
      "bestFor": [
        "自然・絶景",
        "グルメ"
      ],
      "stayTime": "1時間前後"
    },
    {
      "name": "芦ノ湖",
      "type": "自然・絶景",
      "description": "遊覧船や湖畔散策で、箱根の山と水辺をゆっくり味わえます。",
      "bestFor": [
        "自然・絶景",
        "ゆっくり"
      ],
      "stayTime": "1〜2時間"
    },
    {
      "name": "箱根湯本温泉街",
      "type": "温泉・街歩き",
      "description": "駅前の土産店や温泉まんじゅうをめぐり、宿の前後に歩きやすい温泉街です。",
      "bestFor": [
        "温泉",
        "街歩き",
        "ゆっくり"
      ],
      "stayTime": "45分〜1時間"
    }
  ],
  "熱海市": [
    {
      "name": "来宮神社",
      "type": "神社・歴史",
      "description": "大楠のまわりを歩き、熱海の市街地から短時間で立ち寄れます。",
      "bestFor": [
        "神社・歴史",
        "ゆっくり"
      ],
      "stayTime": "45分〜1時間"
    },
    {
      "name": "熱海サンビーチ",
      "type": "海・散歩",
      "description": "海沿いを歩き、温泉街の食事やカフェとつなげやすい砂浜です。",
      "bestFor": [
        "自然・絶景",
        "カップル",
        "ペットあり"
      ],
      "stayTime": "45分〜1時間"
    },
    {
      "name": "熱海駅前商店街",
      "type": "グルメ・街歩き",
      "description": "干物、温泉まんじゅう、海鮮の店を駅近で選べ、到着直後に寄りやすい通りです。",
      "bestFor": [
        "グルメ",
        "街歩き"
      ],
      "stayTime": "45分〜1時間"
    },
    {
      "name": "MOA美術館",
      "type": "体験・景色",
      "description": "展示と高台からの海の眺めを合わせて楽しめ、雨の日の候補にもなります。",
      "bestFor": [
        "体験",
        "ゆっくり"
      ],
      "stayTime": "1〜2時間"
    }
  ],
  "草津町": [
    {
      "name": "湯畑",
      "type": "温泉・街歩き",
      "description": "湯けむりの中心を歩き、夜はライトアップと温泉街の食事も楽しめます。",
      "bestFor": [
        "温泉",
        "街歩き",
        "ゆっくり"
      ],
      "stayTime": "30分〜1時間"
    },
    {
      "name": "西の河原公園",
      "type": "自然・温泉",
      "description": "温泉が流れる公園を散策し、露天風呂と組み合わせて過ごせます。",
      "bestFor": [
        "温泉",
        "自然・絶景"
      ],
      "stayTime": "1時間前後"
    },
    {
      "name": "熱乃湯",
      "type": "体験",
      "description": "湯もみショーで草津温泉の文化に触れられ、短時間で旅らしさが出ます。",
      "bestFor": [
        "体験",
        "温泉"
      ],
      "stayTime": "30分〜45分"
    },
    {
      "name": "湯もみ通り",
      "type": "グルメ・街歩き",
      "description": "温泉まんじゅうや土産店を見ながら、宿に戻る前後に歩きやすい通りです。",
      "bestFor": [
        "グルメ",
        "街歩き"
      ],
      "stayTime": "45分〜1時間"
    }
  ],
  "日光市": [
    {
      "name": "日光東照宮",
      "type": "神社・歴史",
      "description": "彫刻や社殿を見て回り、世界遺産の歴史をじっくり感じられます。",
      "bestFor": [
        "神社・歴史",
        "ファミリー"
      ],
      "stayTime": "1.5〜2時間"
    },
    {
      "name": "華厳の滝",
      "type": "自然・絶景",
      "description": "落差のある滝を展望台から眺め、中禅寺湖方面の自然散策につなげられます。",
      "bestFor": [
        "自然・絶景"
      ],
      "stayTime": "45分〜1時間"
    },
    {
      "name": "中禅寺湖",
      "type": "自然・散策",
      "description": "湖畔を歩き、カフェや遊覧船を組み合わせて滞在時間に余白を作れます。",
      "bestFor": [
        "自然・絶景",
        "ゆっくり"
      ],
      "stayTime": "1〜2時間"
    },
    {
      "name": "神橋",
      "type": "歴史・景色",
      "description": "朱色の橋を入口に、日光山内の参拝エリアへ歩いて向かえます。",
      "bestFor": [
        "神社・歴史",
        "街歩き"
      ],
      "stayTime": "30分〜45分"
    }
  ],
  "鎌倉市": [
    {
      "name": "鶴岡八幡宮",
      "type": "神社・歴史",
      "description": "参道から本宮まで歩き、小町通りの食べ歩きとも合わせやすい鎌倉の中心です。",
      "bestFor": [
        "神社・歴史",
        "街歩き"
      ],
      "stayTime": "1時間前後"
    },
    {
      "name": "小町通り",
      "type": "グルメ・街歩き",
      "description": "しらす丼、スイーツ、土産店が並び、昼食や休憩を取りやすい通りです。",
      "bestFor": [
        "グルメ",
        "街歩き"
      ],
      "stayTime": "1〜2時間"
    },
    {
      "name": "長谷寺",
      "type": "神社・歴史",
      "description": "海を望む境内と季節の花を見ながら、長谷エリアをゆっくり歩けます。",
      "bestFor": [
        "神社・歴史",
        "自然・絶景",
        "ゆっくり"
      ],
      "stayTime": "1時間前後"
    },
    {
      "name": "由比ヶ浜",
      "type": "海・散歩",
      "description": "海沿いを歩いて、寺社巡りの後に気分を切り替えやすい砂浜です。",
      "bestFor": [
        "自然・絶景",
        "ペットあり"
      ],
      "stayTime": "45分〜1時間"
    }
  ],
  "横浜市": [
    {
      "name": "みなとみらい",
      "type": "街歩き・夜景",
      "description": "海沿いのビル群と観覧車を眺めながら歩け、夜景の時間帯も選びやすいです。",
      "bestFor": [
        "街歩き",
        "カップル"
      ],
      "stayTime": "1〜2時間"
    },
    {
      "name": "横浜中華街",
      "type": "グルメ",
      "description": "点心や中華料理の店が集まり、食べ歩きと夕食のどちらにも使いやすいエリアです。",
      "bestFor": [
        "グルメ",
        "友達"
      ],
      "stayTime": "1〜2時間"
    },
    {
      "name": "山下公園",
      "type": "海・散歩",
      "description": "港を見ながら歩ける公園で、赤レンガ倉庫や中華街への移動も自然です。",
      "bestFor": [
        "自然・絶景",
        "ペットあり",
        "ゆっくり"
      ],
      "stayTime": "45分〜1時間"
    },
    {
      "name": "赤レンガ倉庫",
      "type": "街歩き・買い物",
      "description": "ショップやイベントを見て回り、雨の日でも休憩を取りやすいスポットです。",
      "bestFor": [
        "街歩き",
        "体験"
      ],
      "stayTime": "1時間前後"
    }
  ],
  "松島町": [
    {
      "name": "松島湾遊覧船",
      "type": "自然・絶景",
      "description": "湾に浮かぶ島々を船から眺め、松島らしい景色を短時間で味わえます。",
      "bestFor": [
        "自然・絶景",
        "ファミリー"
      ],
      "stayTime": "50分前後"
    },
    {
      "name": "瑞巌寺",
      "type": "神社・歴史",
      "description": "伊達家ゆかりの寺院を見学し、松島の歴史を落ち着いて感じられます。",
      "bestFor": [
        "神社・歴史",
        "ゆっくり"
      ],
      "stayTime": "45分〜1時間"
    },
    {
      "name": "五大堂",
      "type": "歴史・景色",
      "description": "海に突き出た堂へ橋を渡って向かい、湾の景色も近くで見られます。",
      "bestFor": [
        "神社・歴史",
        "自然・絶景"
      ],
      "stayTime": "30分〜45分"
    },
    {
      "name": "福浦橋",
      "type": "自然・散歩",
      "description": "赤い橋を渡って島の散策路を歩き、海辺の静かな時間を過ごせます。",
      "bestFor": [
        "自然・絶景",
        "ゆっくり"
      ],
      "stayTime": "45分〜1時間"
    }
  ],
  "仙台市": [
    {
      "name": "仙台城跡",
      "type": "歴史・景色",
      "description": "伊達政宗像と市街地の眺めを見て、仙台の歴史を短時間で感じられます。",
      "bestFor": [
        "神社・歴史",
        "自然・絶景"
      ],
      "stayTime": "1時間前後"
    },
    {
      "name": "瑞鳳殿",
      "type": "神社・歴史",
      "description": "杉木立の参道を歩き、伊達家ゆかりの建築と静かな空気を味わえます。",
      "bestFor": [
        "神社・歴史",
        "ゆっくり"
      ],
      "stayTime": "1時間前後"
    },
    {
      "name": "定禅寺通",
      "type": "街歩き",
      "description": "ケヤキ並木の通りを歩き、カフェや買い物と組み合わせやすい市街地です。",
      "bestFor": [
        "街歩き",
        "一人旅"
      ],
      "stayTime": "45分〜1時間"
    },
    {
      "name": "仙台朝市",
      "type": "グルメ",
      "description": "駅近くで惣菜や海鮮を見て回れ、牛タン以外の食の候補も探せます。",
      "bestFor": [
        "グルメ",
        "街歩き"
      ],
      "stayTime": "45分〜1時間"
    }
  ],
  "福岡市": [
    {
      "name": "中洲・天神の屋台エリア",
      "type": "グルメ",
      "description": "ラーメンや一品料理を夜に少しずつ選び、福岡らしい夕食にできます。",
      "bestFor": [
        "グルメ",
        "友達"
      ],
      "stayTime": "1〜2時間"
    },
    {
      "name": "大濠公園",
      "type": "自然・散歩",
      "description": "池の周りを歩き、中心部でもゆっくり過ごせる休憩スポットです。",
      "bestFor": [
        "自然・絶景",
        "ゆっくり",
        "ペットあり"
      ],
      "stayTime": "45分〜1時間"
    },
    {
      "name": "櫛田神社",
      "type": "神社・歴史",
      "description": "博多の街なかで参拝でき、川端商店街や祇園エリアの散策につながります。",
      "bestFor": [
        "神社・歴史",
        "街歩き"
      ],
      "stayTime": "30分〜45分"
    },
    {
      "name": "柳橋連合市場",
      "type": "グルメ",
      "description": "鮮魚や惣菜の店を見て回り、昼食や持ち帰りの候補を探せます。",
      "bestFor": [
        "グルメ",
        "体験"
      ],
      "stayTime": "45分〜1時間"
    }
  ],
  "長崎市": [
    {
      "name": "グラバー園",
      "type": "歴史・景色",
      "description": "洋館と港を見下ろす坂道を歩き、長崎らしい異国情緒を感じられます。",
      "bestFor": [
        "神社・歴史",
        "街歩き"
      ],
      "stayTime": "1〜1.5時間"
    },
    {
      "name": "大浦天主堂",
      "type": "神社・歴史",
      "description": "世界遺産の教会を見学し、周辺の坂道散策と合わせやすいスポットです。",
      "bestFor": [
        "神社・歴史",
        "ゆっくり"
      ],
      "stayTime": "45分〜1時間"
    },
    {
      "name": "稲佐山展望台",
      "type": "夜景・絶景",
      "description": "港町の夜景を一望でき、長崎の夜を印象的に締められます。",
      "bestFor": [
        "自然・絶景",
        "カップル"
      ],
      "stayTime": "1時間前後"
    },
    {
      "name": "長崎新地中華街",
      "type": "グルメ",
      "description": "ちゃんぽんや皿うどんの店を選びやすく、昼食にも夕食にも使えます。",
      "bestFor": [
        "グルメ",
        "街歩き"
      ],
      "stayTime": "1時間前後"
    }
  ],
  "広島市": [
    {
      "name": "平和記念公園",
      "type": "歴史・街歩き",
      "description": "資料館や原爆ドーム周辺を歩き、広島を訪れる意味を静かに考えられます。",
      "bestFor": [
        "神社・歴史",
        "一人旅"
      ],
      "stayTime": "1.5〜2時間"
    },
    {
      "name": "原爆ドーム",
      "type": "歴史",
      "description": "川沿いから建物を見学し、平和記念公園の散策と合わせて回れます。",
      "bestFor": [
        "神社・歴史",
        "街歩き"
      ],
      "stayTime": "30分〜45分"
    },
    {
      "name": "お好み村",
      "type": "グルメ",
      "description": "複数のお好み焼き店から選べ、広島の食を夕食の主役にできます。",
      "bestFor": [
        "グルメ",
        "友達"
      ],
      "stayTime": "1時間前後"
    },
    {
      "name": "広島城",
      "type": "歴史・街歩き",
      "description": "市街地に近い城跡を歩き、中心部観光の合間に立ち寄れます。",
      "bestFor": [
        "神社・歴史",
        "街歩き"
      ],
      "stayTime": "1時間前後"
    }
  ],
  "廿日市市": [
    {
      "name": "厳島神社",
      "type": "神社・歴史",
      "description": "海上に立つ大鳥居と社殿を見て、潮の時間で表情が変わる景色を楽しめます。",
      "bestFor": [
        "神社・歴史",
        "自然・絶景"
      ],
      "stayTime": "1〜1.5時間"
    },
    {
      "name": "宮島表参道商店街",
      "type": "グルメ・街歩き",
      "description": "あなごめし、焼き牡蠣、もみじ饅頭の店を歩きながら選べます。",
      "bestFor": [
        "グルメ",
        "街歩き"
      ],
      "stayTime": "1時間前後"
    },
    {
      "name": "弥山",
      "type": "自然・絶景",
      "description": "ロープウェーや登山で島の高台へ向かい、瀬戸内海の島々を見渡せます。",
      "bestFor": [
        "自然・絶景",
        "アクティビティ"
      ],
      "stayTime": "2〜3時間"
    },
    {
      "name": "もみじ谷公園",
      "type": "自然・散歩",
      "description": "紅葉や緑の中を歩き、参拝後に少し静かに過ごせます。",
      "bestFor": [
        "自然・絶景",
        "ゆっくり"
      ],
      "stayTime": "45分〜1時間"
    }
  ],
  "那覇市": [
    {
      "name": "国際通り",
      "type": "グルメ・街歩き",
      "description": "沖縄そば、土産店、カフェを歩いて選べ、到着日にも寄りやすい通りです。",
      "bestFor": [
        "グルメ",
        "街歩き"
      ],
      "stayTime": "1〜2時間"
    },
    {
      "name": "首里城公園",
      "type": "歴史・文化",
      "description": "琉球王国の歴史に触れながら、城跡の高台を歩けます。",
      "bestFor": [
        "神社・歴史",
        "体験"
      ],
      "stayTime": "1〜1.5時間"
    },
    {
      "name": "牧志公設市場",
      "type": "グルメ",
      "description": "沖縄の魚や惣菜を見て回り、市場周辺の食堂にもつなげやすい場所です。",
      "bestFor": [
        "グルメ",
        "体験"
      ],
      "stayTime": "45分〜1時間"
    },
    {
      "name": "波上宮",
      "type": "神社・海景色",
      "description": "海沿いの崖上にある神社で、市街地から短時間で海の景色も見られます。",
      "bestFor": [
        "神社・歴史",
        "自然・絶景"
      ],
      "stayTime": "30分〜45分"
    }
  ],
  "石垣市": [
    {
      "name": "川平湾",
      "type": "自然・絶景",
      "description": "透明度の高い湾を展望台から眺め、グラスボートで海の色を近くに感じられます。",
      "bestFor": [
        "自然・絶景",
        "アクティビティ"
      ],
      "stayTime": "1〜1.5時間"
    },
    {
      "name": "ユーグレナモール",
      "type": "グルメ・街歩き",
      "description": "石垣牛、八重山そば、土産店を中心部でまとめて探せます。",
      "bestFor": [
        "グルメ",
        "街歩き"
      ],
      "stayTime": "45分〜1時間"
    },
    {
      "name": "玉取崎展望台",
      "type": "自然・絶景",
      "description": "岬と海を見渡す展望台で、ドライブ中の立ち寄りにも向いています。",
      "bestFor": [
        "自然・絶景",
        "カップル"
      ],
      "stayTime": "30分〜45分"
    },
    {
      "name": "白保海岸",
      "type": "海・自然",
      "description": "サンゴ礁の海辺を眺め、長めの滞在で静かに海を感じられます。",
      "bestFor": [
        "自然・絶景",
        "ゆっくり"
      ],
      "stayTime": "45分〜1時間"
    }
  ],
  "高山市": [
    {
      "name": "古い町並",
      "type": "歴史・街歩き",
      "description": "格子戸の町家が続く通りを歩き、酒蔵や土産店にも立ち寄れます。",
      "bestFor": [
        "神社・歴史",
        "街歩き"
      ],
      "stayTime": "1〜2時間"
    },
    {
      "name": "宮川朝市",
      "type": "グルメ・体験",
      "description": "野菜、漬物、みたらし団子などを朝に見て回り、地元の食に触れられます。",
      "bestFor": [
        "グルメ",
        "体験"
      ],
      "stayTime": "45分〜1時間"
    },
    {
      "name": "高山陣屋",
      "type": "歴史",
      "description": "江戸時代の役所建築を見学し、高山の町の歴史を具体的に知れます。",
      "bestFor": [
        "神社・歴史"
      ],
      "stayTime": "1時間前後"
    },
    {
      "name": "飛騨の里",
      "type": "文化体験",
      "description": "合掌造りの民家を見て、飛騨の暮らしや工芸の雰囲気に触れられます。",
      "bestFor": [
        "体験",
        "ファミリー"
      ],
      "stayTime": "1〜2時間"
    }
  ],
  "伊勢市": [
    {
      "name": "伊勢神宮 内宮",
      "type": "神社・歴史",
      "description": "五十鈴川沿いの参道を歩き、日本を代表する神宮へ参拝できます。",
      "bestFor": [
        "神社・歴史",
        "ゆっくり"
      ],
      "stayTime": "1〜1.5時間"
    },
    {
      "name": "おかげ横丁",
      "type": "グルメ・街歩き",
      "description": "伊勢うどんや赤福を選びながら、参拝前後の食べ歩きに使いやすい通りです。",
      "bestFor": [
        "グルメ",
        "街歩き"
      ],
      "stayTime": "1〜2時間"
    },
    {
      "name": "伊勢神宮 外宮",
      "type": "神社・歴史",
      "description": "内宮と合わせて参拝し、伊勢の旅の流れを丁寧に作れます。",
      "bestFor": [
        "神社・歴史"
      ],
      "stayTime": "45分〜1時間"
    },
    {
      "name": "五十鈴川",
      "type": "自然・散歩",
      "description": "内宮近くの川沿いを歩き、参拝後に静かな時間を取りやすい場所です。",
      "bestFor": [
        "自然・絶景",
        "ゆっくり"
      ],
      "stayTime": "30分〜45分"
    }
  ],
  "白浜町": [
    {
      "name": "白良浜",
      "type": "海・絶景",
      "description": "白い砂浜と青い海を眺め、温泉旅の合間に散歩しやすい海辺です。",
      "bestFor": [
        "自然・絶景",
        "カップル",
        "ファミリー"
      ],
      "stayTime": "1時間前後"
    },
    {
      "name": "円月島",
      "type": "自然・絶景",
      "description": "夕景の時間帯に海に浮かぶ岩を眺めると、白浜らしい景色を味わえます。",
      "bestFor": [
        "自然・絶景",
        "ゆっくり"
      ],
      "stayTime": "30分〜45分"
    },
    {
      "name": "崎の湯",
      "type": "温泉",
      "description": "海を近くに感じる露天風呂で、温泉目的の旅に組み込みやすい場所です。",
      "bestFor": [
        "温泉",
        "ゆっくり"
      ],
      "stayTime": "1時間前後"
    },
    {
      "name": "アドベンチャーワールド",
      "type": "体験・ファミリー",
      "description": "動物展示やアトラクションを中心に、家族で半日以上過ごしやすい施設です。",
      "bestFor": [
        "体験",
        "ファミリー"
      ],
      "stayTime": "3〜5時間"
    }
  ],
  "軽井沢町": [
    {
      "name": "旧軽井沢銀座",
      "type": "街歩き",
      "description": "ベーカリー、ジャム、雑貨店を歩いて回り、高原の買い物時間を作れます。",
      "bestFor": [
        "街歩き",
        "グルメ"
      ],
      "stayTime": "1〜2時間"
    },
    {
      "name": "雲場池",
      "type": "自然・散歩",
      "description": "池の周りをゆっくり歩き、紅葉や新緑の景色を近くで楽しめます。",
      "bestFor": [
        "自然・絶景",
        "ゆっくり",
        "ペットあり"
      ],
      "stayTime": "45分〜1時間"
    },
    {
      "name": "ハルニレテラス",
      "type": "グルメ・買い物",
      "description": "川沿いの店やカフェで休憩し、雨の日でも過ごし方を作りやすい場所です。",
      "bestFor": [
        "グルメ",
        "ゆっくり"
      ],
      "stayTime": "1〜2時間"
    },
    {
      "name": "白糸の滝",
      "type": "自然・絶景",
      "description": "細く流れる滝を見に行き、ドライブやバス移動の途中に立ち寄れます。",
      "bestFor": [
        "自然・絶景"
      ],
      "stayTime": "30分〜45分"
    }
  ],
  "富良野市": [
    {
      "name": "ファーム富田",
      "type": "花・自然",
      "description": "ラベンダー畑や花畑を歩き、季節の色を写真に残しやすいスポットです。",
      "bestFor": [
        "自然・絶景",
        "カップル"
      ],
      "stayTime": "1〜1.5時間"
    },
    {
      "name": "富良野チーズ工房",
      "type": "体験・グルメ",
      "description": "チーズやスイーツを味わい、食体験を旅に入れやすい施設です。",
      "bestFor": [
        "グルメ",
        "体験"
      ],
      "stayTime": "45分〜1時間"
    },
    {
      "name": "ふらのワイン工場",
      "type": "体験",
      "description": "ワイン造りの雰囲気を見学し、土産選びにも使いやすいスポットです。",
      "bestFor": [
        "体験",
        "カップル"
      ],
      "stayTime": "45分〜1時間"
    },
    {
      "name": "麓郷エリア",
      "type": "自然・散策",
      "description": "丘や畑の景色をドライブでめぐり、富良野らしい広さを感じられます。",
      "bestFor": [
        "自然・絶景",
        "ゆっくり"
      ],
      "stayTime": "1〜2時間"
    }
  ],
  "会津若松市": [
    {
      "name": "鶴ヶ城",
      "type": "歴史",
      "description": "天守と城跡公園を歩き、会津の歴史を旅の中心にできます。",
      "bestFor": [
        "神社・歴史",
        "ファミリー"
      ],
      "stayTime": "1〜1.5時間"
    },
    {
      "name": "七日町通り",
      "type": "街歩き",
      "description": "蔵や古い商店を見ながら歩き、カフェや土産店に立ち寄れます。",
      "bestFor": [
        "街歩き",
        "一人旅"
      ],
      "stayTime": "1〜2時間"
    },
    {
      "name": "飯盛山",
      "type": "歴史・景色",
      "description": "白虎隊ゆかりの地を訪ね、市街地を見下ろす景色も味わえます。",
      "bestFor": [
        "神社・歴史"
      ],
      "stayTime": "1時間前後"
    },
    {
      "name": "御薬園",
      "type": "庭園・ゆっくり",
      "description": "池泉回遊式庭園を歩き、旅の中に静かな休憩時間を作れます。",
      "bestFor": [
        "ゆっくり",
        "自然・絶景"
      ],
      "stayTime": "45分〜1時間"
    }
  ],
  "尾道市": [
    {
      "name": "千光寺",
      "type": "歴史・絶景",
      "description": "坂道やロープウェイで高台へ向かい、尾道水道の景色を眺められます。",
      "bestFor": [
        "神社・歴史",
        "自然・絶景"
      ],
      "stayTime": "1〜1.5時間"
    },
    {
      "name": "尾道本通り商店街",
      "type": "グルメ・街歩き",
      "description": "尾道ラーメンやカフェを探しながら、アーケードを歩けます。",
      "bestFor": [
        "グルメ",
        "街歩き"
      ],
      "stayTime": "1時間前後"
    },
    {
      "name": "猫の細道",
      "type": "街歩き",
      "description": "坂道と路地を歩き、小さな店やアートを見つける散策ができます。",
      "bestFor": [
        "街歩き",
        "一人旅"
      ],
      "stayTime": "45分〜1時間"
    },
    {
      "name": "しまなみ海道入口",
      "type": "海・アクティビティ",
      "description": "海沿いの橋や島景色を眺め、サイクリング旅への広がりも作れます。",
      "bestFor": [
        "自然・絶景",
        "アクティビティ"
      ],
      "stayTime": "1〜2時間"
    }
  ],
  "倉敷市": [
    {
      "name": "倉敷美観地区",
      "type": "歴史・街歩き",
      "description": "白壁の町並みと倉敷川沿いを歩き、町家カフェや土産店にも寄れます。",
      "bestFor": [
        "神社・歴史",
        "街歩き"
      ],
      "stayTime": "1〜2時間"
    },
    {
      "name": "大原美術館",
      "type": "体験・アート",
      "description": "西洋美術や建築を見学し、雨の日でも旅の主役にしやすい施設です。",
      "bestFor": [
        "体験",
        "ゆっくり"
      ],
      "stayTime": "1〜2時間"
    },
    {
      "name": "倉敷川舟流し",
      "type": "体験・景色",
      "description": "川から白壁の町を眺め、短時間で美観地区らしい体験ができます。",
      "bestFor": [
        "体験",
        "街歩き"
      ],
      "stayTime": "30分〜45分"
    },
    {
      "name": "本町通り",
      "type": "街歩き",
      "description": "古い町家を改装した店を見て回り、夕方の散策にも向いています。",
      "bestFor": [
        "街歩き",
        "グルメ"
      ],
      "stayTime": "45分〜1時間"
    }
  ],
  "松江市": [
    {
      "name": "松江城",
      "type": "歴史",
      "description": "現存天守を見学し、城下町らしい雰囲気を歩いて感じられます。",
      "bestFor": [
        "神社・歴史",
        "街歩き"
      ],
      "stayTime": "1〜1.5時間"
    },
    {
      "name": "堀川遊覧船",
      "type": "体験・街歩き",
      "description": "堀を船でめぐり、城下町の景色を座って楽しめます。",
      "bestFor": [
        "体験",
        "ゆっくり"
      ],
      "stayTime": "50分前後"
    },
    {
      "name": "宍道湖夕日スポット",
      "type": "自然・絶景",
      "description": "湖に沈む夕日を眺め、旅の終わりに静かな時間を作れます。",
      "bestFor": [
        "自然・絶景",
        "カップル"
      ],
      "stayTime": "30分〜1時間"
    },
    {
      "name": "塩見縄手",
      "type": "歴史・街歩き",
      "description": "武家屋敷の通りを歩き、松江の落ち着いた城下町を感じられます。",
      "bestFor": [
        "神社・歴史",
        "街歩き"
      ],
      "stayTime": "45分〜1時間"
    }
  ],
  "別府市": [
    {
      "name": "地獄めぐり",
      "type": "温泉・体験",
      "description": "色や湯けむりの違う温泉噴出口をめぐり、別府らしさをまとめて感じられます。",
      "bestFor": [
        "温泉",
        "体験",
        "ファミリー"
      ],
      "stayTime": "2〜3時間"
    },
    {
      "name": "竹瓦温泉",
      "type": "温泉・歴史",
      "description": "レトロな建物の共同浴場で、温泉街の歴史ある空気を味わえます。",
      "bestFor": [
        "温泉",
        "ゆっくり"
      ],
      "stayTime": "1時間前後"
    },
    {
      "name": "別府公園",
      "type": "自然・散歩",
      "description": "市街地で緑の中を歩け、温泉巡りの合間に休憩しやすい公園です。",
      "bestFor": [
        "自然・絶景",
        "ペットあり"
      ],
      "stayTime": "45分〜1時間"
    },
    {
      "name": "海地獄",
      "type": "温泉・景色",
      "description": "青い熱泉を見学でき、地獄めぐりの中でも写真に残しやすいスポットです。",
      "bestFor": [
        "温泉",
        "自然・絶景"
      ],
      "stayTime": "30分〜45分"
    }
  ]
}

const localFoodDetailsByCity = Object.fromEntries(Object.entries(localFoodCandidatesByCity).map(([city, foods]) => [
  city,
  foods.slice(0, 4).map((name, index) => ({
    name,
    description: city + 'で選びやすい' + name + '。観光の合間の昼食や休憩に組み込みやすく、街歩きの満足感を上げてくれます。',
    type: index === 0 ? '名物' : index === 1 ? '食事' : index === 2 ? '甘味・軽食' : 'カフェ・土産',
  })),
]))

const createFallbackTouristSpots = (destination) => {
  const tags = destination.tags ?? []
  const city = destination.city
  const spots = []
  if (tags.includes('温泉')) spots.push({ name: city + '温泉街', type: '温泉・街歩き', description: '湯けむりや土産店のある温泉街を歩き、宿の前後に短時間で雰囲気を味わえます。', bestFor: ['温泉', 'ゆっくり'], stayTime: '45分〜1時間' })
  if (tags.includes('海')) spots.push({ name: city + '海辺エリア', type: '海・散歩', description: '海沿いの景色を眺めながら歩き、昼食やカフェ休憩と組み合わせやすいエリアです。', bestFor: ['自然・絶景', '街歩き'], stayTime: '45分〜1時間' })
  if (tags.includes('山')) spots.push({ name: city + '自然散策エリア', type: '自然・絶景', description: '山や高原の景色を見ながら、短い散策で旅先らしい空気を感じられます。', bestFor: ['自然・絶景', 'アクティビティ'], stayTime: '1時間前後' })
  if (tags.includes('グルメ')) spots.push({ name: city + '中心街グルメ散策', type: 'グルメ・街歩き', description: '駅周辺や中心街で食事処を探し、地元の味を旅の予定に入れやすいエリアです。', bestFor: ['グルメ', '街歩き'], stayTime: '45分〜1時間' })
  spots.push({ name: city + '駅周辺散策', type: '街歩き', description: '到着後に土産店やカフェを確認し、移動前後の空き時間を使いやすいエリアです。', bestFor: ['街歩き', '一人旅'], stayTime: '30分〜45分' })
  spots.push({ name: city + 'ご当地ランチ', type: 'グルメ', description: '昼食に郷土料理やカフェを選び、観光の合間にその土地らしい食事を入れられます。', bestFor: ['グルメ', 'ゆっくり'], stayTime: '45分〜1時間' })
  return spots.filter((spot, index, list) => list.findIndex((item) => item.name === spot.name) === index).slice(0, 4)
}

const createLocalFoodDetails = (destination) => {
  const foods = Array.isArray(destination.localFoodCandidates) && destination.localFoodCandidates.length > 0
    ? destination.localFoodCandidates
    : getLocalFoodCandidates(destination.city, destination.tags)
  return foods.slice(0, 4).map((name, index) => ({
    name,
    description: destination.city + 'で食事候補にしやすい' + name + '。観光スポットの前後に入れると、移動だけで終わらない旅にできます。',
    type: index === 0 ? '名物' : index === 1 ? '食事' : index === 2 ? '甘味・軽食' : 'カフェ・土産',
  }))
}

const prefectureRegionMap = {
  北海道: '北海道',
  青森県: '東北', 岩手県: '東北', 宮城県: '東北', 秋田県: '東北', 山形県: '東北', 福島県: '東北',
  茨城県: '関東', 栃木県: '関東', 群馬県: '関東', 埼玉県: '関東', 千葉県: '関東', 東京都: '関東', 神奈川県: '関東',
  新潟県: '中部', 富山県: '中部', 石川県: '中部', 福井県: '中部', 山梨県: '中部', 長野県: '中部', 岐阜県: '中部', 静岡県: '中部', 愛知県: '中部',
  三重県: '関西', 滋賀県: '関西', 京都府: '関西', 大阪府: '関西', 兵庫県: '関西', 奈良県: '関西', 和歌山県: '関西',
  鳥取県: '中国', 島根県: '中国', 岡山県: '中国', 広島県: '中国', 山口県: '中国',
  徳島県: '四国', 香川県: '四国', 愛媛県: '四国', 高知県: '四国',
  福岡県: '九州', 佐賀県: '九州', 長崎県: '九州', 熊本県: '九州', 大分県: '九州', 宮崎県: '九州', 鹿児島県: '九州',
  沖縄県: '沖縄',
}

const normalizeRegion = (prefecture, region) => {
  if (prefectureRegionMap[prefecture]) return prefectureRegionMap[prefecture]
  if (['北海道', '東北', '関東', '中部', '関西', '中国', '四国', '九州', '沖縄'].includes(region)) return region
  return region === '中国四国' ? '中国' : region
}

const destinationHintMap = {
  京都市: ['奈良市', '大阪市', '宇治方面', '滋賀方面'],
  奈良市: ['京都市', '大阪市', '宇治方面'],
  小樽市: ['札幌市', '函館市', '余市方面'],
  札幌市: ['小樽市', '富良野市', '函館市'],
  函館市: ['札幌市', '小樽市', '大沼方面'],
  金沢市: ['高山市', '富山方面', '能登方面'],
  箱根町: ['小田原方面', '熱海市', '鎌倉市'],
  熱海市: ['箱根町', '伊東市', '伊豆方面'],
  草津町: ['軽井沢町', '伊香保方面', '長野方面'],
  日光市: ['那須塩原市', '宇都宮方面', '会津若松市'],
  鎌倉市: ['横浜市', '箱根町', '湘南方面'],
  横浜市: ['鎌倉市', '箱根町', '東京方面'],
  松島町: ['仙台市', '石巻方面', '蔵王方面'],
  仙台市: ['松島町', '山形方面', '会津若松市'],
  福岡市: ['長崎市', '別府市', '熊本方面'],
  長崎市: ['福岡市', '佐世保市', '熊本方面'],
  広島市: ['廿日市市', '尾道市', '倉敷市'],
  廿日市市: ['広島市', '宮島周辺', '尾道市'],
  那覇市: ['石垣市', '宮古島市', '沖縄本島周辺'],
  石垣市: ['石垣島周辺', '離島方面', '自然・海辺滞在'],
  高山市: ['金沢市', '白川郷方面', '松本市'],
  伊勢市: ['鳥羽方面', '志摩方面', '名古屋市'],
  白浜町: ['和歌山市', '熊野方面', '大阪市'],
  軽井沢町: ['草津町', '小諸方面', '長野方面'],
  富良野市: ['札幌市', '美瑛方面', '旭川方面'],
  会津若松市: ['日光市', '仙台市', '喜多方方面'],
  尾道市: ['広島市', '倉敷市', 'しまなみ海道方面'],
  倉敷市: ['尾道市', '広島市', '岡山市'],
  松江市: ['出雲市', '鳥取市', '境港方面'],
  別府市: ['福岡市', '由布市', '熊本方面'],
}

const scoreCap = (value) => Math.max(0, Math.min(100, Math.round(value)))
const hasAnyTag = (destination, tags) => tags.some((tag) => destination.tags?.includes(tag))
const inCityList = (destination, cities) => cities.includes(destination.city)

const createCompanionFit = (destination) => {
  const scenic = hasAnyTag(destination, ['温泉', '海', '山', 'カップル向け'])
  const easyAccess = Number.isFinite(destination.stationAccessMinutes) && destination.stationAccessMinutes <= 35
  return {
    couple: scoreCap((scenic ? 48 : 22) + (hasAnyTag(destination, ['温泉', '海', 'カップル向け']) ? 24 : 0) + (easyAccess ? 8 : 0)),
    solo: scoreCap(36 + (hasAnyTag(destination, ['グルメ', '山']) ? 18 : 0) + (inCityList(destination, ['京都市', '奈良市', '鎌倉市', '金沢市', '小樽市', '尾道市', '倉敷市', '高山市']) ? 24 : 0)),
    friends: scoreCap(34 + (hasAnyTag(destination, ['グルメ', '海']) ? 22 : 0) + (inCityList(destination, ['札幌市', '福岡市', '大阪市', '横浜市', '那覇市', '長崎市', '広島市']) ? 20 : 0)),
    family: scoreCap(32 + (hasAnyTag(destination, ['山', '海']) ? 18 : 0) + (easyAccess ? 18 : 0) + (inCityList(destination, ['横浜市', '浦安市', '日光市', '仙台市', '札幌市', '福岡市', '軽井沢町']) ? 14 : 0)),
    pet: scoreCap(18 + (hasAnyTag(destination, ['山', '海']) ? 22 : 0) + (inCityList(destination, ['軽井沢町', '鎌倉市', '箱根町', '富良野市', '石垣市', '日光市']) ? 16 : 0)),
  }
}

const createPurposeFit = (destination) => {
  const foods = Array.isArray(destination.localFoodCandidates) ? destination.localFoodCandidates : []
  const historyCities = ['京都市', '奈良市', '鎌倉市', '伊勢市', '廿日市市', '日光市', '高山市', '会津若松市', '松江市', '金沢市', '尾道市', '倉敷市', '長崎市', '広島市']
  const onsenCities = ['箱根町', '熱海市', '草津町', '別府市', '白浜町', '伊東市', '由布市', '下呂市']
  const walkingCities = ['小樽市', '金沢市', '鎌倉市', '横浜市', '京都市', '尾道市', '倉敷市', '高山市', '長崎市', '函館市', '松江市']
  return {
    gourmet: scoreCap((foods.length > 0 ? 68 : 30) + (hasAnyTag(destination, ['グルメ']) ? 22 : 0)),
    history: scoreCap((inCityList(destination, historyCities) ? 78 : 24) + (hasAnyTag(destination, ['カップル向け']) ? 8 : 0)),
    onsen: scoreCap((hasAnyTag(destination, ['温泉']) ? 82 : 18) + (inCityList(destination, onsenCities) ? 12 : 0)),
    nature: scoreCap((hasAnyTag(destination, ['山', '海']) ? 72 : 28) + (['北海道', '沖縄'].includes(destination.region) ? 12 : 0)),
    activity: scoreCap((hasAnyTag(destination, ['山', '海']) ? 62 : 22) + (['沖縄', '北海道'].includes(destination.region) ? 10 : 0)),
    experience: scoreCap(34 + (hasAnyTag(destination, ['温泉', 'グルメ']) ? 20 : 0) + (inCityList(destination, historyCities) ? 18 : 0)),
    walking: scoreCap(34 + (inCityList(destination, walkingCities) ? 42 : 0) + (hasAnyTag(destination, ['グルメ', 'カップル向け']) ? 12 : 0)),
    relax: scoreCap(32 + (hasAnyTag(destination, ['温泉', '山', '海']) ? 34 : 0) + (inCityList(destination, ['箱根町', '熱海市', '草津町', '別府市', '軽井沢町', '富良野市', '石垣市']) ? 18 : 0)),
  }
}

const createStayFit = (destination, purposeFit) => {
  const accessMinutes = Number.isFinite(destination.stationAccessMinutes) ? destination.stationAccessMinutes : 45
  const hintCount = destinationHintMap[destination.city]?.length ?? 0
  const isHub = ['京都市', '大阪市', '福岡市', '金沢市', '札幌市', '長崎市', '広島市', '那覇市', '仙台市', '横浜市'].includes(destination.city)
  const themeWidth = ['gourmet', 'history', 'onsen', 'nature', 'walking'].filter((key) => purposeFit[key] >= 60).length
  return {
    dayTrip: scoreCap(78 - Math.min(accessMinutes, 90) * 0.35 + (hasAnyTag(destination, ['グルメ', '温泉']) ? 8 : 0)),
    oneNight: scoreCap(48 + (hasAnyTag(destination, ['温泉', '海', '山', 'グルメ']) ? 22 : 0) + (accessMinutes <= 60 ? 8 : 0)),
    twoNights: scoreCap(42 + themeWidth * 8 + Math.min(hintCount, 2) * 10 + (isHub ? 8 : 0)),
    longStay: scoreCap(30 + themeWidth * 9 + Math.min(hintCount, 3) * 11 + (isHub ? 14 : 0) + (['北海道', '沖縄', '九州', '関西'].includes(destination.region) ? 8 : 0)),
  }
}

const createLongStayStyle = (destination, stayFit) => {
  if (stayFit.longStay < 55) return 'メイン旅先をゆっくり楽しむ滞在向きです。'
  if (destination.region === '沖縄') return '島内や離島方面を組み合わせ、自然・海辺・グルメを深く楽しむ滞在向きです。'
  if (destination.region === '北海道') return '広い地域の自然・街歩き・食をゆったり組み合わせる滞在向きです。'
  return '同じ地域の周辺候補を組み合わせる周遊滞在に向いています。'
}

const createTravelBaseScoreNote = (destination, purposeFit, stayFit) => {
  const strongPurposes = Object.entries(purposeFit).filter(([, value]) => value >= 70).map(([key]) => key).slice(0, 3)
  const stayLabels = Object.entries(stayFit).filter(([, value]) => value >= 70).map(([key]) => key).slice(0, 2)
  return destination.city + 'は' + (strongPurposes.join('・') || '複数テーマ') + 'に強く、' + (stayLabels.join('・') || '滞在') + 'の加点対象です。'
}

const enrichDestination = (destination) => {
  const region = normalizeRegion(destination.prefecture, destination.region)
  const base = { ...destination, region }
  const companionFit = destination.companionFit ?? createCompanionFit(base)
  const purposeFit = destination.purposeFit ?? createPurposeFit(base)
  const stayFit = destination.stayFit ?? createStayFit(base, purposeFit)
  const nearbyDestinationHints = destination.nearbyDestinationHints ?? destinationHintMap[base.city] ?? []
  const touristSpots = destination.touristSpots ?? touristSpotsByCity[base.city] ?? createFallbackTouristSpots(base)
  const localFoodDetails = destination.localFoodDetails ?? localFoodDetailsByCity[base.city] ?? createLocalFoodDetails(base)
  return {
    ...base,
    companionFit,
    purposeFit,
    stayFit,
    nearbyDestinationHints,
    touristSpots,
    localFoodDetails,
    goodForDayTrip: destination.goodForDayTrip ?? stayFit.dayTrip >= 62,
    goodForOneNight: destination.goodForOneNight ?? stayFit.oneNight >= 62,
    goodForLongStay: destination.goodForLongStay ?? stayFit.longStay >= 62,
    longStayStyle: destination.longStayStyle ?? createLongStayStyle(base, stayFit),
    travelBaseScoreNote: destination.travelBaseScoreNote ?? createTravelBaseScoreNote(base, purposeFit, stayFit),
  }
}

const baseDestinations = rawDestinations.map((destination) => {
  const [latitude, longitude] = destinationCoordinates[destination.city]
  const address = destinationAddresses[destination.city]
    ?? `${destination.prefecture}${destination.city}`
  const seasonProfile = getSeasonProfile(destination)
  const localFoodCandidates = getLocalFoodCandidates(destination.city, destination.tags)
  const images = getDestinationImages(destination.prefecture, destination.city, destination.tags, {
    localFoodCandidates,
    region: normalizeRegion(destination.prefecture, destination.region),
  })
  const transit = getDestinationTransit(destination.city)

  return enrichDestination({
    id: `${destination.prefecture}-${destination.city}`,
    city: destination.city,
    prefecture: destination.prefecture,
    region: destination.region,
    address,
    latitude,
    longitude,
    googleMapsQuery: `${address} 観光`,
    tags: destination.tags,
    recommendation: destination.recommendation,
    recommendText: destination.recommendation,
    reason: `${destination.city}では「${destination.recommendation}」を軸に、${destination.tags.join('・')}の時間を旅程へ入れやすいです。`,
    budgets: destination.budget,
    budget: destination.budget,
    plans: normalizePlans(destination.schedule, destination.city),
    highlights: destination.highlight,
    bestSeasons: seasonProfile.bestSeasons,
    seasonHighlights: seasonProfile.seasonHighlights,
    localFoodCandidates,
    ...images,
    ...transit,
  })
})

const expandedDestinations = supplementalDestinations.map((destination) => {
  const localFoodCandidates = getLocalFoodCandidates(destination.city, destination.tags)
  const images = getDestinationImages(destination.prefecture, destination.city, destination.tags, {
    localFoodCandidates,
    region: normalizeRegion(destination.prefecture, destination.region),
  })
  return enrichDestination({
    ...destination,
    id: `${destination.prefecture}-${destination.city}`,
    googleMapsQuery: `${destination.address} 観光`,
    reason: `${destination.city}では「${destination.recommendText}」を軸に、${destination.tags.join('・')}の時間を旅程へ入れやすいです。`,
    localFoodCandidates,
    ...images,
  })
})

const destinations = [...baseDestinations, ...expandedDestinations]

export default destinations
