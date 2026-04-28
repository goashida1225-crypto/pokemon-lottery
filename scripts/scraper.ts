import * as cheerio from 'cheerio'
import { createClient } from '@supabase/supabase-js'
import { shops } from './shops'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const LOTTERY_KEYWORDS = ['抽選', '抽せん', 'ロッテリー', '申込', '応募']
const POKEMON_KEYWORDS = ['ポケモンカード', 'ポケカ', 'ポケットモンスター', 'pokemon card', 'TCG']

interface ScrapedItem {
  site_name: string
  product_name: string
  url: string
  deadline: string | null
  note: string
  status: 'pending'
  auto_scraped: boolean
}

function containsKeywords(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase()
  return keywords.some(k => lower.includes(k.toLowerCase()))
}

function extractDeadline(text: string): string | null {
  // 「XX月XX日」「XXXX年XX月XX日」「締切: XX/XX」などを検出
  const patterns = [
    /(\d{4})年(\d{1,2})月(\d{1,2})日/,
    /(\d{1,2})月(\d{1,2})日/,
    /(\d{4})[-/](\d{1,2})[-/](\d{1,2})/,
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const now = new Date()
      if (match[1] && match[1].length === 4) {
        return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`
      } else {
        const year = match[1] && parseInt(match[1]) <= 12 ? now.getFullYear() : parseInt(match[1])
        const month = match[1].length <= 2 ? match[1] : match[2]
        const day = match[1].length <= 2 ? match[2] : match[3]
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      }
    }
  }
  return null
}

async function scrapeShop(shop: typeof shops[0]): Promise<ScrapedItem[]> {
  const results: ScrapedItem[] = []

  try {
    console.log(`🔍 チェック中: ${shop.name}`)
    const res = await fetch(shop.checkUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept-Language': 'ja,en;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      console.log(`  ⚠️ ${shop.name}: HTTP ${res.status}`)
      return []
    }

    const html = await res.text()
    const $ = cheerio.load(html)

    // ページ全体のテキストを取得してポケカ抽選関連かチェック
    const pageText = $('body').text()
    if (!containsKeywords(pageText, POKEMON_KEYWORDS)) {
      console.log(`  ℹ️ ${shop.name}: ポケカ情報なし`)
      return []
    }

    // リンク要素を探索してキーワードを含むものを収集
    $('a').each((_, el) => {
      const linkText = $(el).text().trim()
      const href = $(el).attr('href') || ''

      if (!linkText || linkText.length < 5) return

      const isLottery = containsKeywords(linkText, LOTTERY_KEYWORDS)
      const isPokemon = containsKeywords(linkText, [...POKEMON_KEYWORDS, ...shop.keywords])

      if (isLottery && isPokemon) {
        const fullUrl = href.startsWith('http')
          ? href
          : new URL(href, shop.checkUrl).toString()

        // 周辺テキストも取得して締切日を探す
        const surroundingText = $(el).parent().text() + linkText
        const deadline = extractDeadline(surroundingText)

        results.push({
          site_name: shop.name,
          product_name: linkText.slice(0, 100),
          url: fullUrl,
          deadline: deadline ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          note: `自動取得: ${shop.category}`,
          status: 'pending',
          auto_scraped: true,
        })
      }
    })

    console.log(`  ✅ ${shop.name}: ${results.length}件発見`)
  } catch (err) {
    console.log(`  ❌ ${shop.name}: ${err}`)
  }

  return results
}

async function saveNewItems(items: ScrapedItem[]) {
  if (items.length === 0) return

  // 既存のURLを取得して重複チェック
  const { data: existing } = await supabase
    .from('lotteries')
    .select('url')
    .eq('auto_scraped', true)

  const existingUrls = new Set((existing ?? []).map(r => r.url))

  const newItems = items.filter(item => !existingUrls.has(item.url))

  if (newItems.length === 0) {
    console.log('新着なし')
    return
  }

  const { error } = await supabase.from('lotteries').insert(newItems)
  if (error) {
    console.error('保存エラー:', error)
  } else {
    console.log(`💾 ${newItems.length}件の新着抽選を保存しました`)
  }
}

async function main() {
  console.log('🚀 ポケカ抽選スクレイパー開始')
  console.log(`対象ショップ数: ${shops.length}`)

  const allResults: ScrapedItem[] = []

  for (const shop of shops) {
    const items = await scrapeShop(shop)
    allResults.push(...items)
    // サーバーへの負荷を減らすため少し待つ
    await new Promise(r => setTimeout(r, 1000))
  }

  console.log(`\n合計 ${allResults.length}件の抽選情報を収集`)
  await saveNewItems(allResults)
  console.log('✨ 完了')
}

main().catch(console.error)
