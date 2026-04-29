import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const LINE_REPLY = 'https://api.line.me/v2/bot/message/reply'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
)

async function reply(replyToken: string, text: string) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token) return
  await fetch(LINE_REPLY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ replyToken, messages: [{ type: 'text', text }] }),
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const events = body.events ?? []

  for (const event of events) {
    if (event.type !== 'message' || event.message?.type !== 'text') continue
    const userId: string = event.source?.userId ?? ''
    if (!userId) continue

    // Supabaseのsettingsテーブルに保存
    await supabase.from('settings').upsert({ key: 'line_user_id', value: userId })

    await reply(event.replyToken, `✅ 登録完了！\nあなたのUser ID:\n${userId}\n\nこれでポケカ抽選の通知が届くようになります🎰`)
  }

  return NextResponse.json({ ok: true })
}

// LINE webhookの疎通確認用
export async function GET() {
  return NextResponse.json({ ok: true })
}
