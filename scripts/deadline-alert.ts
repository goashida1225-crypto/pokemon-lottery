import { createClient } from '@supabase/supabase-js'
import { sendLine } from '../lib/line'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function getWebhook() {
  return process.env.DISCORD_WEBHOOK_URL ?? ''
}

function daysUntil(deadline: string): number {
  return Math.ceil((new Date(deadline).getTime() - new Date().setHours(0,0,0,0)) / 86400000)
}

async function main() {
  const { data, error } = await supabase
    .from('lotteries')
    .select('*')
    .eq('status', 'pending')
    .order('deadline', { ascending: true })

  if (error || !data) { console.error(error); return }

  const urgent = data.filter(l => {
    const d = daysUntil(l.deadline)
    return d >= 0 && d <= 3
  })

  if (urgent.length === 0) {
    console.log('締切が近い抽選なし')
    return
  }

  const webhook = getWebhook()
  if (!webhook) return

  const embeds = urgent.slice(0, 10).map(l => {
    const days = daysUntil(l.deadline)
    return {
      title: l.product_name,
      url: l.url || undefined,
      color: days === 0 ? 0xff0000 : 0xef4444,
      fields: [
        { name: '🏪 ショップ', value: l.site_name || '不明', inline: true },
        { name: '⏰ 締切', value: l.deadline, inline: true },
        { name: '⚡ 残り', value: days === 0 ? '本日締切！' : `${days}日`, inline: true },
      ],
      footer: { text: 'ポケカ抽選管理 | 締切アラート' },
    }
  })

  try {
    const res = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `⏰ **締切が近い未応募の抽選が ${urgent.length}件** あります！`,
        embeds,
      }),
    })
    if (!res.ok) console.error(`Discord失敗: ${res.status}`)
    else console.log(`🔔 Discord: ${urgent.length}件の締切アラートを送信`)
  } catch (e) {
    console.error(e)
  }

  // LINE通知
  const lineText = urgent.slice(0, 10).map(l => {
    const days = daysUntil(l.deadline)
    return `${days === 0 ? '🚨 本日締切！' : `⏰ 残り${days}日`} ${l.product_name}\n🏪 ${l.site_name}\n📅 ${l.deadline}`
  }).join('\n\n')
  await sendLine([{ type: 'text', text: `【締切アラート ${urgent.length}件】\n\n` + lineText }])
  console.log(`🔔 LINE: ${urgent.length}件の締切アラートを送信`)
}

main().catch(console.error)
