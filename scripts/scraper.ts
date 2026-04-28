import { chromium, BrowserContext } from 'playwright'
import { createClient } from '@supabase/supabase-js'
import { shops, LOTTERY_KEYWORDS, POKEMON_KEYWORDS } from './shops'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Discord: モジュール初期化時ではなく実行時に参照（env未設定でもクラッシュしない）
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
  for (const pattern of patterns) {
    const m = text.match(pattern)
    if (m) {
      if (m[1]?.length === 4) {
        return { date: `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`, estimated: false }
      }
      const year = new Date().getFullYear()
      return { date: `${year}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`, estimated: false }
    }
  }
  // 締切が取れなかった場合は推定値（14日後）
  console.log(`    ⚠️ [${shopName}] 締切日が取得できませんでした。14日後を設定します。`)
  const future = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
  return { date: future.toISOString().split('T')[0], estimated: true }
}

// ===== スクレイピング（1ショップ） =====

async function scrapeShop(context: BrowserContext, shop: typeof shops[0]): Promise<ScrapedItem[]> {
  const results: ScrapedItem[] = []
  const page = await context.newPage()

  try {
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

    // リンクから見つからない場合、ページ自体を登録
    if (found === 0) {
      const line = pageText.split('\n').find(l =>
        containsAny(l, LOTTERY_KEYWORDS) && containsAny(l, POKEMON_KEYWORDS)
      )
      if (line?.trim().length ?? 0 > 5) {
        const { date, estimated } = extractDeadline(pageText, shop.name)
        results.push({
          site_name: shop.name,
          product_name: line!.trim().slice(0, 100),
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

// ===== 並列処理（最大5件同時） =====

async function scrapeAllShops(context: BrowserContext): Promise<ScrapedItem[]> {
  const CONCURRENCY = 5
  const results: ScrapedItem[] = []

  for (let i = 0; i < shops.length; i += CONCURRENCY) {
    const batch = shops.slice(i, i + CONCURRENCY)
    const batchResults = await Promise.all(batch.map(shop => scrapeShop(context, shop)))
    results.push(...batchResults.flat())
  }

  return results
}

// ===== Supabase保存（URL＋商品名で重複防止） =====

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

  console.log(`💾 ${newItems.length}件保存しました`)
  return newItems
}

// ===== Discord通知 =====

async function notifyDiscord(items: ScrapedItem[]) {
  const webhook = getWebhook()
  if (!webhook || items.length === 0) return

  // Discord は1メッセージあたり最大10 embeds
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
        content: `🎰 **新着ポケカ抽選 ${items.length}件** が見つかりました！`,
        embeds,
      }),
    })
    if (!res.ok) {
      console.error(`Discord通知失敗: HTTP ${res.status}`)
    }
  } catch (err) {
    console.error('Discord通知エラー:', err instanceof Error ? err.message : err)
  }
}

// ===== メイン =====

async function main() {
  const start = Date.now()
  console.log('🚀 ポケカ抽選スクレイパー開始')
  console.log(`対象ショップ数: ${shops.length}`)

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'ja-JP',
    extraHTTPHeaders: { 'Accept-Language': 'ja,en;q=0.9' },
  })

  const allResults = await scrapeAllShops(context)
  await browser.close()

  console.log(`\n収集: ${allResults.length}件`)

  if (allResults.length === 0) {
    console.log('現在アクティブな抽選情報なし')
  } else {
    const saved = await saveNewItems(allResults)
    if (saved.length > 0) {
      await notifyDiscord(saved)
      console.log('🔔 Discord通知送信完了')
    } else {
      console.log('新着なし（すべて既存データ）')
    }
  }

  console.log(`\n✨ 完了 (${((Date.now() - start) / 1000).toFixed(1)}秒)`)
}

main().catch(console.error)
