export interface ShopConfig {
  name: string
  category: 'アグリゲーター' | 'カードショップ' | '量販店' | '本屋・アニメショップ' | 'おもちゃ・ホビー'
  checkUrl: string
  keywords: string[]
  // アグリゲーター用の専用セレクタ
  selectors?: {
    items: string
    title: string
    link: string
    date?: string
  }
}

export const LOTTERY_KEYWORDS = ['抽選', '抽せん', '応募', 'ロッテリー']
export const POKEMON_KEYWORDS = ['ポケモンカード', 'ポケカ', 'ポケットモンスター', 'pokemon card', 'カードゲーム']

export const shops: ShopConfig[] = [

  // ===== アグリゲーター（最優先・全抽選情報を網羅）=====
  {
    name: 'ポケカウォッチ',
    category: 'アグリゲーター',
    checkUrl: 'https://pokecawatch.com/category/%E6%8A%BD%E9%81%B8%E3%83%BB%E4%BA%88%E7%B4%84%E6%83%85%E5%A0%B1/',
    keywords: ['抽選', 'ポケモンカード', '予約'],
    selectors: {
      items: 'article',
      title: 'h2 a, h3 a',
      link: 'h2 a, h3 a',
      date: 'time, .date',
    },
  },
  {
    name: '入荷NOW',
    category: 'アグリゲーター',
    checkUrl: 'https://nyuka-now.com/archives/2459',
    keywords: ['抽選', 'ポケモンカード', '予約'],
    selectors: {
      items: 'tr, .lottery-item',
      title: 'td a, h3',
      link: 'a[href*="pokemon"], a[href*="lottery"], td a',
      date: 'td',
    },
  },

  // ===== 公式・主要カードショップ =====
  {
    name: 'ポケモンセンターオンライン',
    category: 'カードショップ',
    checkUrl: 'https://www.pokemoncenter-online.com/lottery/apply.html',
    keywords: ['抽選', 'ポケモンカード', 'カードゲーム'],
  },
  {
    name: '遊々亭',
    category: 'カードショップ',
    checkUrl: 'https://yuyu-tei.jp/top/poc',
    keywords: ['抽選', '予約受付', 'ポケモンカード'],
  },
  {
    name: 'カードラッシュ',
    category: 'カードショップ',
    checkUrl: 'https://www.cardrush-pokemon.jp/',
    keywords: ['抽選', 'ポケモンカード', '予約'],
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
    name: 'あみあみ',
    category: 'カードショップ',
    checkUrl: 'https://www.amiami.jp/top/page/t/lottery.html',
    keywords: ['抽選', 'ポケモンカード', 'ポケカ'],
  },
  {
    name: 'メロンブックス',
    category: 'カードショップ',
    checkUrl: 'https://www.melonbooks.co.jp/corner/detail.php?corner_id=1006',
    keywords: ['抽選', 'ポケモンカード', 'ポケカ'],
  },

  // ===== 量販店・EC =====
  {
    name: 'GEOオンライン',
    category: '量販店',
    checkUrl: 'https://geo-online.co.jp/',
    keywords: ['抽選', 'ポケモンカード', 'ポケカ'],
  },
  {
    name: '楽天ブックス',
    category: '量販店',
    checkUrl: 'https://books.rakuten.co.jp/event/game/card/entry/',
    keywords: ['抽選', 'ポケモンカード', 'ポケカ', '応募'],
  },
  {
    name: 'セブンネット',
    category: '量販店',
    checkUrl: 'https://7net.omni7.jp/search_result/?keyword=ポケモンカード+抽選',
    keywords: ['抽選', 'ポケモンカード'],
  },

  // ===== 本屋・アニメショップ =====
  {
    name: 'アニメイト',
    category: '本屋・アニメショップ',
    checkUrl: 'https://www.animate.co.jp/news/',
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
]
