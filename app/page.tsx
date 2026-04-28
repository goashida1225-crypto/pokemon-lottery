'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Lottery, LotteryStatus } from '@/lib/types'
import LotteryCard from '@/components/LotteryCard'
import AddLotteryModal from '@/components/AddLotteryModal'
import { Plus, Trophy, Clock, CheckCircle, XCircle, User, RefreshCw } from 'lucide-react'

const FILTERS: { key: LotteryStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'すべて' },
  { key: 'pending', label: '未応募' },
  { key: 'applied', label: '応募済' },
  { key: 'won', label: '当選' },
  { key: 'lost', label: '落選' },
]

export default function Home() {
  const [lotteries, setLotteries] = useState<Lottery[]>([])
  const [filter, setFilter] = useState<LotteryStatus | 'all'>('all')
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => { fetchLotteries() }, [])

  async function fetchLotteries() {
    setRefreshing(true)
    const { data, error } = await supabase
      .from('lotteries')
      .select('*')
      .order('deadline', { ascending: true })
    if (!error && data) setLotteries(data)
    setLoading(false)
    setRefreshing(false)
  }

  async function updateStatus(id: string, status: LotteryStatus) {
    await supabase.from('lotteries').update({ status }).eq('id', id)
    setLotteries(prev => prev.map(l => l.id === id ? { ...l, status } : l))
  }

  async function deleteLottery(id: string) {
    await supabase.from('lotteries').delete().eq('id', id)
    setLotteries(prev => prev.filter(l => l.id !== id))
  }

  const counts = {
    all: lotteries.length,
    pending: lotteries.filter(l => l.status === 'pending').length,
    applied: lotteries.filter(l => l.status === 'applied').length,
    won: lotteries.filter(l => l.status === 'won').length,
    lost: lotteries.filter(l => l.status === 'lost').length,
  }

  const filtered = filter === 'all' ? lotteries : lotteries.filter(l => l.status === filter)
  const urgentCount = lotteries.filter(l => {
    const days = Math.ceil((new Date(l.deadline).getTime() - new Date().setHours(0,0,0,0)) / 86400000)
    return l.status === 'pending' && days >= 0 && days <= 3
  }).length

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      {/* ヘッダー */}
      <div className="bg-gradient-to-br from-[#1e1b4b] to-[#312e81] px-4 pt-12 pb-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-indigo-300 text-xs font-medium tracking-widest uppercase mb-1">Pokemon Card</p>
              <h1 className="text-white text-2xl font-bold tracking-tight">抽選管理</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchLotteries}
                className={`w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all ${refreshing ? 'animate-spin' : ''}`}
              >
                <RefreshCw size={15} />
              </button>
              <a href="/profile" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all">
                <User size={15} />
              </a>
            </div>
          </div>

          {/* サマリー */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: Clock, count: counts.pending, label: '未応募', color: 'text-amber-300', bg: 'bg-amber-400/20' },
              { icon: CheckCircle, count: counts.applied, label: '応募済', color: 'text-blue-300', bg: 'bg-blue-400/20' },
              { icon: Trophy, count: counts.won, label: '当選', color: 'text-emerald-300', bg: 'bg-emerald-400/20' },
              { icon: XCircle, count: counts.lost, label: '落選', color: 'text-gray-400', bg: 'bg-gray-400/20' },
            ].map(({ icon: Icon, count, label, color, bg }) => (
              <div key={label} className={`${bg} rounded-2xl p-3 text-center`}>
                <Icon size={16} className={`mx-auto mb-1 ${color}`} />
                <div className={`text-xl font-bold ${color}`}>{count}</div>
                <div className="text-white/50 text-xs">{label}</div>
              </div>
            ))}
          </div>

          {urgentCount > 0 && (
            <div className="mt-3 bg-red-500/20 border border-red-400/30 rounded-xl px-3 py-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse shrink-0" />
              <span className="text-red-300 text-xs font-medium">締切まで3日以内の未応募が {urgentCount} 件あります</span>
            </div>
          )}
        </div>
      </div>

      {/* フィルター */}
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex gap-2 py-4 overflow-x-auto scrollbar-none">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                filter === key
                  ? 'bg-[#312e81] text-white shadow-md shadow-indigo-200'
                  : 'bg-white text-gray-500 border border-gray-200 hover:border-indigo-200'
              }`}
            >
              {label}
              <span className={`ml-1.5 text-xs ${filter === key ? 'text-indigo-200' : 'text-gray-400'}`}>
                {counts[key]}
              </span>
            </button>
          ))}
        </div>

        {/* リスト */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl h-28 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy size={28} className="text-indigo-300" />
            </div>
            <p className="text-gray-500 font-medium">抽選がありません</p>
            <p className="text-gray-400 text-sm mt-1">右下の＋から追加してください</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pb-24">
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
      </div>

      {/* 追加ボタン */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-br from-[#312e81] to-[#4f46e5] text-white w-14 h-14 rounded-full shadow-xl shadow-indigo-300 flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
      >
        <Plus size={26} />
      </button>

      {showModal && (
        <AddLotteryModal onClose={() => setShowModal(false)} onAdded={fetchLotteries} />
      )}
    </div>
  )
}
