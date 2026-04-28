import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'
import { shops, LOTTERY_KEYWORDS, POKEMON_KEYWORDS } from './shops'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_URL!

async function notifyDiscord(items: ScrapedItem[]) {
  if (!DISCORD_WEBHOOK || items.length === 0) return

  const embeds = items.slice(0, 10).map(item => ({
    title: item.product_name,
    url: item.url,
    color: 0x3b82f6,
    fields: [
      { name: '🏪 ショップ', value: item.site_name, inline: true },
      { name: '⏰ 締切', value: item.deadline ?? '不明', inline: true },
    ],
    footer: { text: '自動取得 | ポケカ抽選管理' },
    timestamp: new Date().toISOString(),
  }))

  await fetch(DISCORD_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: `🎰 **新着抽選情報 ${items.length}件** が見つかりました！`,
      embeds,
    }),
  })
}

interface ScrapedItem {
  site_name: string
  product_name: string
  url: string
  deadline: string
  note: string
  status: 'pending'
  auto_scraped: boolean
}

function containsAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase()
  return keywords.some(k => lower.includes(k.toLowerCase()))
}

function extractDeadline(text: string): string {
  const patterns = [
    /(\d{4})年(\d{1,2})月(\d{1,2})日/,
    /(\d{1,2})月(\d{1,2})日/,
    /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
  ]
  for (const pattern of patterns) {
    const m = text.match(pattern)
    if (m) {
      const now = new Date()
      if (m[1]?.length === 4) {
        return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`
      } else {
        return `${now.getFullYear()}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`
      }
    }
  }
  const future = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
  return future.toISOString().split('T')[0]
}

async function main() {
  console.log('🚀 ポケカ抽選スクレイパー開始')
  console.log(`対象ショップ数: ${shops.length}`)

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'ja-JP',
    extraHTTPHeaders: { 'Accept-Language': 'ja,en;q=0.9' },
  })

  const allResults: ScrapedItem[] = []

  for (const shop of shops) {
    console.log(`\n🔍 ${shop.name}`)
    const page = await context.newPage()

    try {
      await page.goto(shop.checkUrl, { waitUntil: 'domcontentloaded', timeout: 15000 })
      await page.waitForTimeout(2000)

      const pageText = await page.innerText('body').catch(() => '')
      const hasLottery = containsAny(pageText, LOTTERY_KEYWORDS)
      const hasPokemon = containsAny(pageText, POKEMON_KEYWORDS)

      if (!hasPokemon) {
        console.log(`  ℹ️ ポケカ情報なし`)
        continue
      }

      if (!hasLottery) {
        console.log(`  ℹ️ 抽選情報なし（現在実施中の抽選なし）`)
        continue
      }

      // 抽選 × ポケカ情報が両方ある場合、関連リンクを抽出
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
        if (!link.href.startsWith('http')) continue
        const combined = link.text + ' ' + link.parentText

        const isLottery = containsAny(combined, LOTTERY_KEYWORDS)
        const isPokemon = containsAny(combined, [...POKEMON_KEYWORDS, ...shop.keywords])

        if (isLottery && isPokemon && link.text.length > 3) {
          const title = link.text.length > 10 ? link.text : link.parentText.split('\n')[0]
          allResults.push({
            site_name: shop.name,
            product_name: title.slice(0, 100).trim(),
            url: link.href,
            deadline: extractDeadline(combined),
            note: `自動取得 (${shop.category})`,
            status: 'pending',
            auto_scraped: true,
          })
          found++
          if (found >= 10) break // 1サイト最大10件
        }
      }

      if (found === 0 && hasLottery && hasPokemon) {
        // リンクで見つからなかった場合、ページ自体を抽選情報として登録
        const firstLine = pageText.split('\n').find(l =>
          containsAny(l, LOTTERY_KEYWORDS) && containsAny(l, POKEMON_KEYWORDS)
        )
        if (firstLine && firstLine.trim().length > 5) {
          allResults.push({
            site_name: shop.name,
            product_name: firstLine.trim().slice(0, 100),
            url: shop.checkUrl,
            deadline: extractDeadline(pageText),
            note: `自動取得 (${shop.category}) ※要確認`,
            status: 'pending',
            auto_scraped: true,
          })
          found++
        }
      }

      console.log(`  ✅ ${found}件発見`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.log(`  ❌ ${msg.slice(0, 80)}`)
    } finally {
      await page.close()
    }
  }

  await browser.close()

  console.log(`\n合計 ${allResults.length}件の抽選情報を収集`)

  if (allResults.length === 0) {
    console.log('現在アクティブな抽選情報なし')
    return
  }

  const { data: existing } = await supabase
    .from('lotteries')
    .select('url')
    .eq('auto_scraped', true)

  const existingUrls = new Set((existing ?? []).map((r: { url: string }) => r.url))
  const newItems = allResults.filter(item => !existingUrls.has(item.url))

  if (newItems.length === 0) {
    console.log('すべて既存データです')
    return
  }

  const { error } = await supabase.from('lotteries').insert(newItems)
  if (error) {
    console.error('保存エラー:', error.message)
  } else {
    console.log(`💾 ${newItems.length}件の新着を保存しました`)
    await notifyDiscord(newItems)
    console.log('🔔 Discord通知を送信しました')
  }

  console.log('\n✨ 完了')
}

main().catch(console.error)
