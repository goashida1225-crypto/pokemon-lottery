'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { X } from 'lucide-react'

interface Props {
  onClose: () => void
  onAdded: () => void
}

export default function AddLotteryModal({ onClose, onAdded }: Props) {
  const [form, setForm] = useState({
    site_name: '',
    product_name: '',
    deadline: '',
    url: '',
    note: '',
  })
  const [saving, setSaving] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.product_name || !form.deadline) return
    setSaving(true)
    await supabase.from('lotteries').insert({
      ...form,
      status: 'pending',
    })
    setSaving(false)
    onAdded()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-bold text-gray-800">抽選を追加</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">サイト名</label>
            <input
              name="site_name"
              value={form.site_name}
              onChange={handleChange}
              placeholder="例: ポケモンセンターオンライン"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">商品名 *</label>
            <input
              name="product_name"
              value={form.product_name}
              onChange={handleChange}
              placeholder="例: スカーレットex SAR"
              required
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">締切日 *</label>
            <input
              name="deadline"
              type="date"
              value={form.deadline}
              onChange={handleChange}
              required
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">URL</label>
            <input
              name="url"
              value={form.url}
              onChange={handleChange}
              placeholder="https://..."
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">メモ</label>
            <textarea
              name="note"
              value={form.note}
              onChange={handleChange}
              placeholder="自由メモ"
              rows={2}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors mt-1"
          >
            {saving ? '追加中...' : '追加する'}
          </button>
        </form>
      </div>
    </div>
  )
}
