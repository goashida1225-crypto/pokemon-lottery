export interface ShopConfig {
  name: string
  category: 'カードショップ' | '量販店' | '本屋・アニメショップ' | 'おもちゃ・ホビー'
  checkUrl: string
  keywords: string[]
}

export const shops: ShopConfig[] = [
  // ===== カードショップ =====
  {
    name: 'ポケモンセンターオンライン',
    category: 'カードショップ',
    checkUrl: 'https://www.pokemoncenter-online.com/topics/',
    keywords: ['抽選', 'ポケモンカード', 'カードゲーム', 'TCG'],
  },
  {
    name: '遊々亭',
    category: 'カードショップ',
    checkUrl: 'https://yuyu-tei.jp/top/poke',
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
    checkUrl: 'https://www.hobbystation.jp/c/newinfo',
    keywords: ['抽選', 'ポケモンカード', 'ポケカ'],
  },
  {
    name: 'カーナベル',
    category: 'カードショップ',
    checkUrl: 'https://www.ka-nabell.com/info/',
    keywords: ['抽選', 'ポケモンカード', 'ポケカ'],
  },
  {
    name: '晴れる屋',
    category: 'カードショップ',
    checkUrl: 'https://www.hareruyamtg.com/ja/news/',
    keywords: ['抽選', 'ポケモンカード', 'ポケカ'],
  },
  {
    name: '駿河屋',
    category: 'カードショップ',
    checkUrl: 'https://www.suruga-ya.jp/top/ct/250401',
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
  {
    name: 'トレカパーク',
    category: 'カードショップ',
    checkUrl: 'https://www.trecapark.com/news/',
    keywords: ['抽選', 'ポケモンカード', 'ポケカ'],
  },
  {
    name: 'プレイスペース ドラゴンスター',
    category: 'カードショップ',
    checkUrl: 'https://www.dragonstar.co.jp/news/',
    keywords: ['抽選', 'ポケモンカード', 'ポケカ'],
  },
  {
    name: 'カードショップ 岩本町',
    category: 'カードショップ',
    checkUrl: 'https://iwamotocho.com/news/',
    keywords: ['抽選', 'ポケモンカード'],
  },

  // ===== 量販店 =====
  {
    name: 'ヨドバシカメラ',
    category: '量販店',
    checkUrl: 'https://www.yodobashi.com/category/10000/10001/10002/10003/',
    keywords: ['抽選', 'ポケモンカード', 'ポケカ', 'カードゲーム'],
  },
  {
    name: 'ビックカメラ',
    category: '量販店',
    checkUrl: 'https://www.biccamera.com/bc/c/game/card/pokemon/',
    keywords: ['抽選', 'ポケモンカード', 'ポケカ'],
  },
  {
    name: 'ヤマダ電機',
    category: '量販店',
    checkUrl: 'https://www.yamada-denkiweb.com/search/?keyword=%E3%83%9D%E3%82%B1%E3%83%A2%E3%83%B3%E3%82%AB%E3%83%BC%E3%83%89+%E6%8A%BD%E9%81%B8',
    keywords: ['抽選', 'ポケモンカード'],
  },
  {
    name: 'ジョーシン',
    category: '量販店',
    checkUrl: 'https://joshinweb.jp/game/card/pokemon.html',
    keywords: ['抽選', 'ポケモンカード', 'ポケカ'],
  },
  {
    name: 'ケーズデンキ',
    category: '量販店',
    checkUrl: 'https://www.ksdenki.com/search/?keyword=ポケモンカード+抽選',
    keywords: ['抽選', 'ポケモンカード'],
  },
  {
    name: 'エディオン',
    category: '量販店',
    checkUrl: 'https://www.edion.com/s/?search=ポケモンカード+抽選',
    keywords: ['抽選', 'ポケモンカード'],
  },
  {
    name: 'コジマ',
    category: '量販店',
    checkUrl: 'https://www.kojima.net/search/?keyword=ポケモンカード+抽選',
    keywords: ['抽選', 'ポケモンカード'],
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
    checkUrl: 'https://www.aeon.com/activity/campaign/',
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
    checkUrl: 'https://www.toranoana.jp/mailorder/article/chapter_news/',
    keywords: ['抽選', 'ポケモンカード', 'ポケカ'],
  },
  {
    name: 'まんだらけ',
    category: '本屋・アニメショップ',
    checkUrl: 'https://order.mandarake.co.jp/order/listPage/list?categoryCode=15&keyword=ポケモンカード',
    keywords: ['抽選', 'ポケモンカード'],
  },

  // ===== おもちゃ・ホビー =====
  {
    name: 'トイザらス',
    category: 'おもちゃ・ホビー',
    checkUrl: 'https://www.toysrus.co.jp/Search?Ntt=ポケモンカード&Nrpp=24',
    keywords: ['抽選', 'ポケモンカード', 'ポケカ'],
  },
  {
    name: 'ハピネット・オンライン',
    category: 'おもちゃ・ホビー',
    checkUrl: 'https://www.happinet-onlineshop.com/fs/hpnet/gr-card-pokemon',
    keywords: ['抽選', 'ポケモンカード', 'ポケカ'],
  },
]
