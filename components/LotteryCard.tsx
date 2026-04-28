'use client'

import { Lottery, LotteryStatus } from '@/lib/types'
import { ExternalLink, Trash2, Bot, Calendar } from 'lucide-react'

interface Props {
  lottery: Lottery
  onUpdateStatus: (id: string, status: LotteryStatus) => void
  onDelete: (id: string) => void
}

const STATUS_CONFIG: Record<LotteryStatus, { label: string; bg: string; text: string; border: string }> = {
  pending:  { label: '未応募', bg: 'bg-amber-50',   text: 'text-amber-600',  border: 'border-l-amber-400' },
  applied:  { label: '応募済', bg: 'bg-blue-50',    text: 'text-blue-600',   border: 'border-l-blue-400' },
  won:      { label: '当選🎉', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-l-emerald-400' },
  lost:     { label: '落選',   bg: 'bg-gray-50',    text: 'text-gray-400',   border: 'border-l-gray-300' },
}

function daysUntil(deadline: string) {
  return Math.ceil((new Date(deadline).getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000)
}

function DeadlineBadge({ deadline }: { deadline: string }) {
  const days = daysUntil(deadline)
  if (days < 0) return <span className="text-xs text-gray-400">期限切れ</span>
  if (days === 0) return <span className="text-xs font-bold text-red-500 animate-pulse">本日締切！</span>
  if (days <= 3) return <span className="text-xs font-bold text-red-500">残り{days}日</span>
  if (days <= 7) return <span className="text-xs font-medium text-orange-500">残り{days}日</span>
  return <span className="text-xs text-gray-400">残り{days}日</span>
}

export default function LotteryCard({ lottery, onUpdateStatus, onDelete }: Props) {
  const config = STATUS_CONFIG[lottery.status]
  const days = daysUntil(lottery.deadline)
  const isExpired = days < 0

  return (
    <div className={`bg-white rounded-2xl shadow-sm border-l-4 ${config.border} overflow-hidden transition-all hover:shadow-md ${isExpired ? 'opacity-50' : ''}`}>
      <div className="p-4">
        {/* 上段 */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs text-gray-400 truncate">{lottery.site_name}</span>
              {lottery.auto_scraped && (
                <span className="flex items-center gap-0.5 text-xs text-violet-500 bg-violet-50 px-1.5 py-0.5 rounded-full shrink-0">
                  <Bot size={9} />自動
                </span>
              )}
            </div>
            <p className="font-semibold text-gray-800 leading-snug line-clamp-2">{lottery.product_name}</p>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${config.bg} ${config.text}`}>
            {config.label}
          </span>
        </div>

        {/* 締切 */}
        <div className="flex items-center gap-1.5 mb-3">
          <Calendar size={13} className="text-gray-300 shrink-0" />
          <span className="text-xs text-gray-400">
            {new Date(lottery.deadline).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })}
          </span>
          <span className="text-gray-200">·</span>
          <DeadlineBadge deadline={lottery.deadline} />
        </div>

        {/* ステータス変更ボタン */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {(Object.keys(STATUS_CONFIG) as LotteryStatus[]).map(s => (
              <button
                key={s}
                onClick={() => onUpdateStatus(lottery.id, s)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                  lottery.status === s
                    ? `${STATUS_CONFIG[s].bg} ${STATUS_CONFIG[s].text} border-transparent font-medium`
                    : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                }`}
              >
                {STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>

          <div className="flex gap-2 items-center">
            {lottery.url && (
              <a href={lottery.url} target="_blank" rel="noopener noreferrer"
                className="text-gray-300 hover:text-indigo-500 transition-colors">
                <ExternalLink size={15} />
              </a>
            )}
            <button onClick={() => onDelete(lottery.id)}
              className="text-gray-200 hover:text-red-400 transition-colors">
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
