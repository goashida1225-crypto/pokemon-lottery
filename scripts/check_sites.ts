import { chromium } from 'playwright'
import { shops } from './shops'

async function main() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'ja-JP',
  })

  const results: { name: string; category: string; status: string }[] = []

  for (const shop of shops) {
    const page = await context.newPage()
    try {
      const res = await page.goto(shop.checkUrl, { waitUntil: 'domcontentloaded', timeout: 12000 })
      const status = res?.status() ?? 0
      if (status === 200) {
        results.push({ name: shop.name, category: shop.category, status: '✅ アクセス可' })
      } else {
        results.push({ name: shop.name, category: shop.category, status: `⚠️  HTTP ${status}` })
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('ERR_NAME_NOT_RESOLVED')) {
        results.push({ name: shop.name, category: shop.category, status: '❌ URLが無効' })
      } else if (msg.includes('Timeout')) {
        results.push({ name: shop.name, category: shop.category, status: '❌ タイムアウト（Bot対策）' })
      } else if (msg.includes('ERR_HTTP2')) {
        results.push({ name: shop.name, category: shop.category, status: '❌ 接続拒否（Bot対策）' })
      } else {
        results.push({ name: shop.name, category: shop.category, status: '❌ エラー' })
      }
    } finally {
      await page.close()
    }
  }

  const categories = [...new Set(results.map(r => r.category))]
  for (const cat of categories) {
    console.log(`\n【${cat}】`)
    results.filter(r => r.category === cat).forEach(r => {
      console.log(`  ${r.status}  ${r.name}`)
    })
  }

  const ok = results.filter(r => r.status.startsWith('✅')).length
  console.log(`\n合計: ${ok}/${results.length} サイトにアクセス可能`)
  await browser.close()
}
main().catch(console.error)
