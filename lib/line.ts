import { createClient } from '@supabase/supabase-js'

const LINE_API = 'https://api.line.me/v2/bot/message/push'

async function getUserId(): Promise<string> {
  // 環境変数 → Supabase settingsの順で取得
  if (process.env.LINE_USER_ID) return process.env.LINE_USER_ID

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  )
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'line_user_id')
    .single()

  return data?.value ?? ''
}

export async function sendLine(messages: { type: 'text'; text: string }[]) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token) return

  const userId = await getUserId()
  if (!userId) {
    console.log('LINE User ID未設定 - スキップ')
    return
  }

  try {
    const res = await fetch(LINE_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ to: userId, messages }),
    })
    if (!res.ok) {
      const body = await res.text()
      console.error(`LINE送信失敗: HTTP ${res.status} ${body}`)
    }
  } catch (e) {
    console.error('LINE送信エラー:', e instanceof Error ? e.message : e)
  }
}
