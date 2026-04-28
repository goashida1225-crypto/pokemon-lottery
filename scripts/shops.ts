export interface ShopConfig {
  name: string
  category: 'カードショップ' | '量販店' | '本屋・アニメショップ' | 'おもちゃ・ホビー'
  checkUrl: string
  lotterySelectors?: string  // 抽選情報が載っている要素のセレクタ
  keywords: string[]
}

export const LOTTERY_KEYWORDS = ['抽選', '抽せん', '応募', 'ロッテリー']
export const POKEMON_KEYWORDS = ['ポケモンカード', 'ポケカ', 'ポケットモンスター', 'pokemon card', 'カードゲーム']

export const shops: ShopConfig[] = [
  // ===== カードショップ =====
  {
    name: 'ポケモンセンターオンライン',
    category: 'カードショップ',
    checkUrl: 'https://www.pokemoncenter-online.com/topics/',
    keywords: ['抽選', 'ポケモンカード', 'カードゲーム'],
  },
  {
    name: '遊々亭',
    category: 'カードショップ',
    checkUrl: 'https://yuyu-tei.jp/',
    keywords: ['抽選', '予約受付', 'ポケモンカード'],
  },
  {
    name: 'カードラッシュ',
    category: 'カードショップ',
    checkUrl: 'https://www.cardrush-pokemon.jp/',
    keywords: ['抽選', 'ポケモンカード', '予約'],
  },
  {
    name: 'ホビーステーション',
    category: 'カードショップ',
    checkUrl: 'https://hobbystation.co.jp/',
    keywords: ['抽選', 'ポケモンカード', 'ポケカ'],
  },
  {
    name: 'カーナベル',
    category: 'カードショップ',
    checkUrl: 'https://www.ka-nabell.com/',
    keywords: ['抽選', 'ポケモンカード', 'ポケカ'],
  },
  {
    name: '晴れる屋',
    category: 'カードショップ',
    checkUrl: 'https://www.hareruyamtg.com/ja/',
    keywords: ['抽選', 'ポケモンカード', 'ポケカ'],
  },
  {
    name: '駿河屋',
    category: 'カードショップ',
    checkUrl: 'https://www.suruga-ya.jp/product/other/250401',
    keywords: ['抽選', 'ポケモンカード', '予約'],
  },
  {
    name: 'あみあみ',
    category: 'カードショップ',
    checkUrl: 'https://www.amiami.jp/top/detail/detail?gcode=CARD-00001',
    keywords: ['抽選', 'ポケモンカード', 'ポケカ'],
  },
  {
    name: 'メロンブックス',
    category: 'カードショップ',
    checkUrl: 'https://www.melonbooks.co.jp/corner/detail.php?corner_id=1006',
    keywords: ['抽選', 'ポケモンカード', 'ポケカ'],
  },

  // ===== 量販店 =====
  {
    name: 'ヨドバシカメラ',
    category: '量販店',
    checkUrl: 'https://www.yodobashi.com/ec/category/index.html?id=57',
    keywords: ['抽選', 'ポケモンカード', 'ポケカ'],
  },
  {
    name: 'ビックカメラ',
    category: '量販店',
    checkUrl: 'https://www.biccamera.com/bc/c/game/card/',
    keywords: ['抽選', 'ポケモンカード', 'ポケカ'],
  },
  {
    name: 'ヤマダ電機',
    category: '量販店',
    checkUrl: 'https://www.yamada-denkiweb.com/ct/10011001011000000/',
    keywords: ['抽選', 'ポケモンカード'],
  },
  {
    name: 'ジョーシン',
    category: '量販店',
    checkUrl: 'https://joshinweb.jp/game/card.html',
    keywords: ['抽選', 'ポケモンカード', 'ポケカ'],
  },
  {
    name: 'ドン・キホーテ',
    category: '量販店',
    checkUrl: 'https://www.donki.com/campaign/',
    keywords: ['抽選', 'ポケモンカード', 'ポケカ'],
  },
  {
    name: 'イオン',
    category: '量販店',
    checkUrl: 'https://www.aeon.com/activity/',
    keywords: ['抽選', 'ポケモンカード', 'ポケカ'],
  },

  // ===== 本屋・アニメショップ =====
  {
    name: 'アニメイト',
    category: '本屋・アニメショップ',
    checkUrl: 'https://www.animate.co.jp/news/',
    keywords: ['抽選', 'ポケモンカード', 'ポケカ'],
  },
  {
    name: 'とらのあな',
    category: '本屋・アニメショップ',
    checkUrl: 'https://ecs.toranoana.jp/tora/ec/cot/genre/04/0420/',
    keywords: ['抽選', 'ポケモンカード', 'ポケカ'],
  },
  {
    name: 'まんだらけ',
    category: '本屋・アニメショップ',
    checkUrl: 'https://mandarake.co.jp/',
    keywords: ['抽選', 'ポケモンカード'],
  },

  // ===== おもちゃ・ホビー =====
  {
    name: 'トイザらス',
    category: 'おもちゃ・ホビー',
    checkUrl: 'https://www.toysrus.co.jp/',
    keywords: ['抽選', 'ポケモンカード', 'ポケカ'],
  },
  {
    name: 'ハピネット・オンライン',
    category: 'おもちゃ・ホビー',
    checkUrl: 'https://www.happinet-onlineshop.com/fs/hpnet/gr-card-pokemon',
    keywords: ['抽選', 'ポケモンカード', 'ポケカ'],
  },
]
