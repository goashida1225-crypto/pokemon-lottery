const LINE_API = 'https://api.line.me/v2/bot/message/push'

export async function sendLine(messages: { type: 'text'; text: string }[]) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  const userId = process.env.LINE_USER_ID
  if (!token || !userId) return

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
