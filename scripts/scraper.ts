import { chromium, BrowserContext, Page } from 'playwright'
import { createClient } from '@supabase/supabase-js'
import { shops, LOTTERY_KEYWORDS, POKEMON_KEYWORDS, ShopConfig } from './shops'
import { sendLine } from '../lib/line'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function getWebhook() {
  return process.env.DISCORD_WEBHOOK_URL ?? ''
}

interface ScrapedItem {
  site_name: string
  product_name: string
  url: string
  deadline: string
  deadline_estimated: boolean
  note: string
  status: 'pending'
  auto_scraped: boolean
}

// ショップドメイン → 表示名マッピング
const SHOP_DOMAINS: Record<string, string> = {
  'yodobashi.com': 'ヨドバシカメラ',
  'biccamera.com': 'ビックカメラ',
  'joshin.co.jp': 'ジョーシン',
  'edion.co.jp': 'エディオン',
  'geo-online.co.jp': 'GEO',
  'pokemon.co.jp': 'ポケモンセンター',
  'pokemoncenter-online.com': 'ポケモンセンターオンライン',
  'amazon.co.jp': 'Amazon',
  'rakuten.co.jp': '楽天',
  'books.rakuten.co.jp': '楽天ブックス',
  '7net.omni7.jp': 'セブンネット',
  'animate.co.jp': 'アニメイト',
  'amiami.jp': 'あみあみ',
  'melonbooks.co.jp': 'メロンブックス',
  'cardrush-pokemon.jp': 'カードラッシュ',
  'yuyu-tei.jp': '遊々亭',
  'hareruyamtg.com': '晴れる屋',
  'ka-nabell.com': 'カーナベル',
  'toysrus.co.jp': 'トイザらス',
  'sofmap.com': 'ソフマップ',
  'yamada-denki.jp': 'ヤマダ電機',
  'kojima.net': 'コジマ',
  'tsutaya.tsite.jp': 'TSUTAYA',
  'honto.jp': 'honto',
  'surugaya.co.jp': 'surugaya',
  'lashinbang.com': 'らしんばん',
  'mandarake.co.jp': 'まんだらけ',
}

function shopNameFromUrl(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    for (const [domain, name] of Object.entries(SHOP_DOMAINS)) {
      if (host.includes(domain)) return name
    }
    // ドメインの最初の部分を使用
    return host.split('.')[0]
  } catch {
    return '不明'
  }
}

// ===== ユーティリティ =====

function containsAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase()
  return keywords.some(k => lower.includes(k.toLowerCase()))
}

function extractDeadline(text: string, shopName: string): { date: string; estimated: boolean } {
  const patterns = [
    /(\d{4})年(\d{1,2})月(\d{1,2})日/,
    /(\d{1,2})月(\d{1,2})日/,
    /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
  ]
  for (const pat of patterns) {
    const m = text.match(pat)
    if (m) {
      if (m[1]?.length === 4) {
        return { date: `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`, estimated: false }
      }
      const year = new Date().getFullYear()
      return { date: `${year}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`, estimated: false }
    }
  }
  const future = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
  return { date: future.toISOString().split('T')[0], estimated: true }
}

// ===== アグリゲーター記事から実ショップURLを抽出 =====

async function resolveShopUrl(
  context: BrowserContext,
  articleUrl: string,
  aggregatorHost: string,
  title: string,
  deadlineText: string,
): Promise<ScrapedItem[]> {
  const page = await context.newPage()
  const results: ScrapedItem[] = []

  try {
    await page.goto(articleUrl, { waitUntil: 'domcontentloaded', timeout: 12000 })

    const pageText = await page.innerText('body').catch(() => '')
    const { date, estimated } = extractDeadline(pageText + deadlineText, title)

    // 外部リンク（アグリゲーター以外）を全て取得
    const links = await page.$$eval('a[href]', (els, aggHost) =>
      els.map(el => ({
        text: ((el as HTMLElement).textContent ?? '').trim().slice(0, 100),
        href: (el as HTMLAnchorElement).href ?? '',
      })).filter(l =>
        l.href.startsWith('http') &&
        !l.href.includes(aggHost) &&
        l.href.length > 10
      ),
      aggregatorHost
    )

    // 抽選関連キーワードを含むリンクを優先
    const APPLY_WORDS = ['抽選', '応募', 'apply', 'lottery', 'entry', '購入', '予約']
    const lotteryLinks = links.filter(l =>
      APPLY_WORDS.some(w => l.href.toLowerCase().includes(w) || l.text.includes(w))
    )
    const candidates = lotteryLinks.length > 0 ? lotteryLinks : links

    // ショップ別に1件ずつ（同じショップの重複を避ける）
    const seenShops = new Set<string>()
    for (const link of candidates.slice(0, 15)) {
      const shopName = shopNameFromUrl(link.href)
      if (seenShops.has(shopName)) continue
      seenShops.add(shopName)

      results.push({
        site_name: shopName,
        product_name: title.slice(0, 100),
        url: link.href,
        deadline: date,
        deadline_estimated: estimated,
        note: `自動取得 (アグリゲーター経由)${estimated ? ' ※締切推定' : ''}`,
        status: 'pending',
        auto_scraped: true,
      })
    }

    // 外部リンクが見つからない場合はアグリゲーター記事URLそのままを使用
    if (results.length === 0) {
      results.push({
        site_name: '情報元: ' + aggregatorHost.split('.')[0],
        product_name: title.slice(0, 100),
        url: articleUrl,
        deadline: date,
        deadline_estimated: estimated,
        note: `自動取得 (アグリゲーター)${estimated ? ' ※締切推定' : ''}`,
        status: 'pending',
        auto_scraped: true,
      })
    }
  } catch {
    // 記事ページ取得失敗は無視
  } finally {
    await page.close()
  }

  return results
}

// ===== アグリゲーター一覧ページをスクレイピング =====

async function scrapeAggregator(page: Page, context: BrowserContext, shop: ShopConfig): Promise<ScrapedItem[]> {
  const sel = shop.selectors!
  const aggregatorHost = new URL(shop.checkUrl).hostname

  await page.goto(shop.checkUrl, { waitUntil: 'domcontentloaded', timeout: 25000 })
  await page.waitForTimeout(2000)

  const items = await page.$$(sel.items)

  // 記事リストを収集
  interface ArticleInfo { title: string; url: string; dateText: string }
  const articles: ArticleInfo[] = []

  for (const item of items.slice(0, 20)) {
    try {
      const titleEl = await item.$(sel.title)
      const linkEl = await item.$(sel.link)
      if (!titleEl || !linkEl) continue

      const title = (await titleEl.innerText()).trim()
      const href = await linkEl.getAttribute('href') ?? ''
      const fullUrl = href.startsWith('http') ? href : new URL(href, shop.checkUrl).toString()
      const itemText = (await item.innerText()).trim()

      if (!containsAny(title + itemText, [...POKEMON_KEYWORDS, ...shop.keywords])) continue

      const dateText = sel.date ? (await item.$(sel.date))?.innerText() ?? '' : ''
      articles.push({ title, url: fullUrl, dateText: dateText + itemText })
    } catch { /* skip */ }
  }

  console.log(`  📋 [${shop.name}] 記事${articles.length}件 → 各ショップURLを取得中...`)

  // 記事を並列でフォロー（最大4件同時、最大10記事）
  const BATCH = 4
  const results: ScrapedItem[] = []
  for (let i = 0; i < Math.min(articles.length, 10); i += BATCH) {
    const batch = articles.slice(i, i + BATCH)
    const batchResults = await Promise.all(
      batch.map(a => resolveShopUrl(context, a.url, aggregatorHost, a.title, a.dateText))
    )
    results.push(...batchResults.flat())
  }

  return results
}

// ===== 通常ショップのスクレイパー =====

async function scrapeShop(context: BrowserContext, shop: ShopConfig): Promise<ScrapedItem[]> {
  const results: ScrapedItem[] = []
  const page = await context.newPage()

  try {
    if (shop.selectors) {
      const items = await scrapeAggregator(page, context, shop)
      console.log(`  ✅ [${shop.name}] ${items.length}件 (ショップURL解決済み)`)
      return items
    }

    await page.goto(shop.checkUrl, { waitUntil: 'domcontentloaded', timeout: 15000 })

    const pageText = await page.innerText('body').catch(() => '')

    if (!containsAny(pageText, POKEMON_KEYWORDS)) {
      console.log(`  ℹ️  [${shop.name}] ポケカ情報なし`)
      return []
    }
    if (!containsAny(pageText, LOTTERY_KEYWORDS)) {
      console.log(`  ℹ️  [${shop.name}] 現在抽選なし`)
      return []
    }

    const links = await page.$$eval('a', (els) =>
      els.map(el => {
        const text = (el as HTMLElement).innerText?.trim() ?? ''
        const parent = el.closest('li,div,article,section,p')
        const parentText = parent ? (parent as HTMLElement).innerText?.trim() ?? '' : ''
        return { text, parentText: parentText.slice(0, 200), href: (el as HTMLAnchorElement).href }
      })
    )

    let found = 0
    for (const link of links) {
      if (!link.href.startsWith('http') || link.text.length <= 3) continue
      const combined = link.text + ' ' + link.parentText

      if (containsAny(combined, LOTTERY_KEYWORDS) && containsAny(combined, [...POKEMON_KEYWORDS, ...shop.keywords])) {
        const title = link.text.length > 10 ? link.text : link.parentText.split('\n')[0]
        const { date, estimated } = extractDeadline(combined, shop.name)
        results.push({
          site_name: shop.name,
          product_name: title.slice(0, 100).trim(),
          url: link.href,
          deadline: date,
          deadline_estimated: estimated,
          note: `自動取得 (${shop.category})${estimated ? ' ※締切推定' : ''}`,
          status: 'pending',
          auto_scraped: true,
        })
        if (++found >= 10) break
      }
    }

    if (found === 0) {
      const line = pageText.split('\n').find(l =>
        containsAny(l, LOTTERY_KEYWORDS) && containsAny(l, POKEMON_KEYWORDS)
      )
      if (line && line.trim().length > 5) {
        const { date, estimated } = extractDeadline(pageText, shop.name)
        results.push({
          site_name: shop.name,
          product_name: line.trim().slice(0, 100),
          url: shop.checkUrl,
          deadline: date,
          deadline_estimated: estimated,
          note: `自動取得 (${shop.category}) ※要確認`,
          status: 'pending',
          auto_scraped: true,
        })
      }
    }

    console.log(`  ✅ [${shop.name}] ${results.length}件`)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.log(`  ❌ [${shop.name}] ${msg.slice(0, 80)}`)
  } finally {
    await page.close()
  }

  return results
}

// ===== 並列処理（アグリゲーター先行・通常ショップ並列）=====

async function scrapeAllShops(context: BrowserContext): Promise<ScrapedItem[]> {
  const aggregators = shops.filter(s => s.selectors)
  const normalShops = shops.filter(s => !s.selectors)
  const results: ScrapedItem[] = []

  // アグリゲーターを1件ずつ先に処理（重いので直列）
  for (const shop of aggregators) {
    const items = await scrapeShop(context, shop)
    results.push(...items)
  }

  // 通常ショップは4件並列
  const CONCURRENCY = 4
  for (let i = 0; i < normalShops.length; i += CONCURRENCY) {
    const batch = normalShops.slice(i, i + CONCURRENCY)
    const batchResults = await Promise.all(batch.map(shop => scrapeShop(context, shop)))
    results.push(...batchResults.flat())
  }

  return results
}

// ===== Supabase保存（URL＋商品名で重複防止）=====

async function saveNewItems(items: ScrapedItem[]): Promise<ScrapedItem[]> {
  const { data: existing } = await supabase
    .from('lotteries')
    .select('url, product_name')
    .eq('auto_scraped', true)

  const existingKeys = new Set(
    (existing ?? []).map((r: { url: string; product_name: string }) => `${r.url}::${r.product_name}`)
  )

  const newItems = items.filter(item => !existingKeys.has(`${item.url}::${item.product_name}`))
  if (newItems.length === 0) return []

  const { error } = await supabase.from('lotteries').insert(newItems)
  if (error) {
    console.error('保存エラー:', error.message)
    return []
  }

  console.log(`💾 ${newItems.length}件保存`)
  return newItems
}

// ===== Discord通知 =====

async function notifyDiscord(items: ScrapedItem[]) {
  const webhook = getWebhook()
  if (!webhook || items.length === 0) return

  const embeds = items.slice(0, 10).map(item => ({
    title: item.product_name.slice(0, 256),
    url: item.url,
    color: 0x4f46e5,
    fields: [
      { name: '🏪 ショップ', value: item.site_name, inline: true },
      { name: '⏰ 締切', value: item.deadline_estimated ? `${item.deadline}（推定）` : item.deadline, inline: true },
    ],
    footer: { text: `自動取得 | ${item.note}` },
    timestamp: new Date().toISOString(),
  }))

  try {
    const res = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `🎰 **新着ポケカ抽選 ${items.length}件！**`,
        embeds,
      }),
    })
    if (!res.ok) console.error(`Discord通知失敗: HTTP ${res.status}`)
  } catch (err) {
    console.error('Discord通知エラー:', err instanceof Error ? err.message : err)
  }
}

// ===== LINE通知 =====

async function notifyLine(items: ScrapedItem[]) {
  const lines = items.slice(0, 10).map(item =>
    `🎰 ${item.product_name}\n🏪 ${item.site_name}\n⏰ ${item.deadline}${item.deadline_estimated ? '（推定）' : ''}\n🔗 ${item.url}`
  )
  const text = `【新着ポケカ抽選 ${items.length}件】\n\n` + lines.join('\n\n')
  await sendLine([{ type: 'text', text }])
}

// ===== メイン =====

async function main() {
  const start = Date.now()
  console.log('🚀 ポケカ抽選スクレイパー開始（2段階スクレイピング）')
  console.log(`対象: ${shops.length}サイト`)

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'ja-JP',
    extraHTTPHeaders: { 'Accept-Language': 'ja,en;q=0.9' },
  })

  const allResults = await scrapeAllShops(context)
  await browser.close()

  // URLで重複排除
  const deduped = allResults.filter((item, i, arr) =>
    arr.findIndex(x => x.url === item.url) === i
  )

  // ショップ別内訳を表示
  const byShop = deduped.reduce((acc, item) => {
    acc[item.site_name] = (acc[item.site_name] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)
  console.log('\n📊 ショップ別内訳:')
  Object.entries(byShop).sort((a, b) => b[1] - a[1]).forEach(([name, count]) => {
    console.log(`  ${name}: ${count}件`)
  })

  console.log(`\n収集: ${allResults.length}件 → 重複除去後: ${deduped.length}件`)

  if (deduped.length === 0) {
    console.log('現在アクティブな抽選情報なし')
  } else {
    const saved = await saveNewItems(deduped)
    if (saved.length > 0) {
      await notifyDiscord(saved)
      await notifyLine(saved)
      console.log('🔔 Discord・LINE通知完了')
    } else {
      console.log('新着なし（すべて既存データ）')
    }
  }

  console.log(`\n✨ 完了 (${((Date.now() - start) / 1000).toFixed(1)}秒)`)
}

main().catch(console.error)
