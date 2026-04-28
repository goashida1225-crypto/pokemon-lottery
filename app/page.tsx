'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Lottery, LotteryStatus } from '@/lib/types'
import LotteryCard from '@/components/LotteryCard'
import AddLotteryModal from '@/components/AddLotteryModal'
import { Plus, Trophy, Clock, CheckCircle, XCircle } from 'lucide-react'

const STATUS_LABELS: Record<LotteryStatus, string> = {
  pending: '未応募',
  applied: '応募済',
  won: '当選',
  lost: '落選',
}

export default function Home() {
  const [lotteries, setLotteries] = useState<Lottery[]>([])
  const [filter, setFilter] = useState<LotteryStatus | 'all'>('all')
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLotteries()
  }, [])

  async function fetchLotteries() {
    setLoading(true)
    const { data, error } = await supabase
      .from('lotteries')
      .select('*')
      .order('deadline', { ascending: true })
    if (!error && data) setLotteries(data)
    setLoading(false)
  }

  async function updateStatus(id: string, status: LotteryStatus) {
    await supabase.from('lotteries').update({ status }).eq('id', id)
    setLotteries(prev => prev.map(l => l.id === id ? { ...l, status } : l))
  }

  async function deleteLottery(id: string) {
    await supabase.from('lotteries').delete().eq('id', id)
    setLotteries(prev => prev.filter(l => l.id !== id))
  }

  const filtered = filter === 'all' ? lotteries : lotteries.filter(l => l.status === filter)

  const counts = {
    all: lotteries.length,
    pending: lotteries.filter(l => l.status === 'pending').length,
    applied: lotteries.filter(l => l.status === 'applied').length,
    won: lotteries.filter(l => l.status === 'won').length,
    lost: lotteries.filter(l => l.status === 'lost').length,
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">ポケカ抽選管理</h1>
        <a href="/profile" className="text-sm text-blue-600 underline">プロフィール</a>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-center">
          <Clock size={18} className="mx-auto text-yellow-500 mb-1" />
          <div className="text-xl font-bold text-yellow-600">{counts.pending}</div>
          <div className="text-xs text-gray-500">未応募</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
          <CheckCircle size={18} className="mx-auto text-blue-500 mb-1" />
          <div className="text-xl font-bold text-blue-600">{counts.applied}</div>
          <div className="text-xs text-gray-500">応募済</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
          <Trophy size={18} className="mx-auto text-green-500 mb-1" />
          <div className="text-xl font-bold text-green-600">{counts.won}</div>
          <div className="text-xs text-gray-500">当選</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
          <XCircle size={18} className="mx-auto text-gray-400 mb-1" />
          <div className="text-xl font-bold text-gray-500">{counts.lost}</div>
          <div className="text-xs text-gray-500">落選</div>
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {(['all', 'pending', 'applied', 'won', 'lost'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap border transition-colors ${
              filter === s
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300'
            }`}
          >
            {s === 'all' ? `すべて(${counts.all})` : `${STATUS_LABELS[s]}(${counts[s]})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-12">読み込み中...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          <p>抽選がありません</p>
          <p className="text-sm mt-1">右下の＋ボタンから追加してください</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(lottery => (
            <LotteryCard
              key={lottery.id}
              lottery={lottery}
              onUpdateStatus={updateStatus}
              onDelete={deleteLottery}
            />
          ))}
        </div>
      )}

      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
      >
        <Plus size={28} />
      </button>

      {showModal && (
        <AddLotteryModal
          onClose={() => setShowModal(false)}
          onAdded={fetchLotteries}
        />
      )}
    </div>
  )
}
