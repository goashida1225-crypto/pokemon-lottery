'use client'

import { Lottery, LotteryStatus } from '@/lib/types'
import { ExternalLink, Trash2, Bot } from 'lucide-react'

interface Props {
  lottery: Lottery
  onUpdateStatus: (id: string, status: LotteryStatus) => void
  onDelete: (id: string) => void
}

const STATUS_STYLES: Record<LotteryStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  applied: 'bg-blue-100 text-blue-700',
  won: 'bg-green-100 text-green-700',
  lost: 'bg-gray-100 text-gray-500',
}

const STATUS_LABELS: Record<LotteryStatus, string> = {
  pending: '未応募',
  applied: '応募済',
  won: '当選',
  lost: '落選',
}

function daysUntil(deadline: string) {
  const diff = new Date(deadline).getTime() - new Date().setHours(0, 0, 0, 0)
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function LotteryCard({ lottery, onUpdateStatus, onDelete }: Props) {
  const days = daysUntil(lottery.deadline)
  const isExpired = days < 0

  return (
    <div className={`bg-white rounded-xl border p-4 shadow-sm ${isExpired ? 'opacity-60' : ''} ${lottery.auto_scraped ? 'border-l-4 border-l-purple-400' : ''}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-xs text-gray-400">{lottery.site_name}</span>
            {lottery.auto_scraped && (
              <span className="flex items-center gap-0.5 text-xs text-purple-500 bg-purple-50 px-1.5 py-0.5 rounded-full">
                <Bot size={10} />自動取得
              </span>
            )}
          </div>
          <div className="font-semibold text-gray-800 truncate">{lottery.product_name}</div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${STATUS_STYLES[lottery.status]}`}>
          {STATUS_LABELS[lottery.status]}
        </span>
      </div>

      <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
        <span>
          締切: {new Date(lottery.deadline).toLocaleDateString('ja-JP')}
        </span>
        {!isExpired && (
          <span className={`font-medium ${days <= 3 ? 'text-red-500' : 'text-gray-500'}`}>
            残り{days}日
          </span>
        )}
        {isExpired && <span className="text-gray-400">期限切れ</span>}
      </div>

      {lottery.note && (
        <p className="text-xs text-gray-400 mb-3 truncate">{lottery.note}</p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {(['pending', 'applied', 'won', 'lost'] as LotteryStatus[]).map(s => (
            <button
              key={s}
              onClick={() => onUpdateStatus(lottery.id, s)}
              className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                lottery.status === s
                  ? STATUS_STYLES[s] + ' border-transparent'
                  : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {lottery.url && (
            <a
              href={lottery.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-700"
            >
              <ExternalLink size={16} />
            </a>
          )}
          <button
            onClick={() => onDelete(lottery.id)}
            className="text-gray-300 hover:text-red-400 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
