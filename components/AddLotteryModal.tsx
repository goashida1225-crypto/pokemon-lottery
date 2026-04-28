'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { X, Plus } from 'lucide-react'

interface Props {
  onClose: () => void
  onAdded: () => void
}

export default function AddLotteryModal({ onClose, onAdded }: Props) {
  const [form, setForm] = useState({ site_name: '', product_name: '', deadline: '', url: '', note: '' })
  const [saving, setSaving] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.product_name || !form.deadline) return
    setSaving(true)
    await supabase.from('lotteries').insert({ ...form, status: 'pending', auto_scraped: false })
    setSaving(false)
    onAdded()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center">
              <Plus size={15} className="text-indigo-600" />
            </div>
            <h2 className="font-bold text-gray-800">抽選を追加</h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-all">
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {[
            { name: 'site_name', label: 'サイト名', placeholder: 'ポケモンセンターオンライン', required: false },
            { name: 'product_name', label: '商品名', placeholder: 'スカーレットex SAR', required: true },
            { name: 'url', label: 'URL', placeholder: 'https://...', required: false },
          ].map(field => (
            <div key={field.name}>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                {field.label} {field.required && <span className="text-red-400">*</span>}
              </label>
              <input
                name={field.name}
                value={form[field.name as keyof typeof form]}
                onChange={handleChange}
                placeholder={field.placeholder}
                required={field.required}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
              />
            </div>
          ))}

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              締切日 <span className="text-red-400">*</span>
            </label>
            <input
              name="deadline"
              type="date"
              value={form.deadline}
              onChange={handleChange}
              required
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">メモ</label>
            <textarea
              name="note"
              value={form.note}
              onChange={handleChange}
              placeholder="自由メモ"
              rows={2}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gradient-to-r from-[#312e81] to-[#4f46e5] text-white rounded-xl py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all mt-1 shadow-lg shadow-indigo-200"
          >
            {saving ? '追加中...' : '追加する'}
          </button>
        </form>
      </div>
    </div>
  )
}
