'use client'

import { useState, useEffect } from 'react'
import { Profile } from '@/lib/types'
import { Copy, Check, ArrowLeft, User } from 'lucide-react'

const FIELDS: { key: keyof Profile; label: string; placeholder: string }[] = [
  { key: 'last_name', label: '姓', placeholder: '山田' },
  { key: 'first_name', label: '名', placeholder: '太郎' },
  { key: 'last_name_kana', label: '姓（カナ）', placeholder: 'ヤマダ' },
  { key: 'first_name_kana', label: '名（カナ）', placeholder: 'タロウ' },
  { key: 'postal_code', label: '郵便番号', placeholder: '123-4567' },
  { key: 'prefecture', label: '都道府県', placeholder: '東京都' },
  { key: 'city', label: '市区町村', placeholder: '渋谷区' },
  { key: 'address', label: '番地・建物名', placeholder: '1-2-3 ○○マンション101' },
  { key: 'phone', label: '電話番号', placeholder: '090-1234-5678' },
  { key: 'email', label: 'メールアドレス', placeholder: 'example@email.com' },
]

const EMPTY: Profile = {
  last_name: '', first_name: '', last_name_kana: '', first_name_kana: '',
  postal_code: '', prefecture: '', city: '', address: '', phone: '', email: '',
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>(EMPTY)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState<keyof Profile | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('profile')
    if (stored) setProfile(JSON.parse(stored))
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setProfile(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSave() {
    localStorage.setItem('profile', JSON.stringify(profile))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleCopy(key: keyof Profile) {
    const value = profile[key]
    if (!value) return
    await navigator.clipboard.writeText(value)
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      {/* ヘッダー */}
      <div className="bg-gradient-to-br from-[#1e1b4b] to-[#312e81] px-4 pt-12 pb-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <a href="/" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all">
              <ArrowLeft size={16} />
            </a>
            <div>
              <p className="text-indigo-300 text-xs font-medium tracking-widest uppercase">Profile</p>
              <h1 className="text-white text-2xl font-bold">プロフィール</h1>
            </div>
          </div>
          <p className="text-indigo-300 text-xs mt-2 ml-11">
            タップでコピー ・ データはこのデバイスにのみ保存されます
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 pb-24">
        {/* アバター */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-white rounded-full shadow-md flex items-center justify-center">
            <User size={30} className="text-indigo-300" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {FIELDS.map(({ key, label, placeholder }) => (
            <div key={key} className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
              <div className="flex-1 min-w-0">
                <label className="text-xs text-gray-400 font-medium block mb-0.5">{label}</label>
                <input
                  name={key}
                  value={profile[key]}
                  onChange={handleChange}
                  placeholder={placeholder}
                  className="w-full text-sm text-gray-800 focus:outline-none bg-transparent placeholder-gray-300"
                />
              </div>
              <button
                onClick={() => handleCopy(key)}
                className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  profile[key] ? 'text-gray-300 hover:bg-indigo-50 hover:text-indigo-500' : 'text-gray-100'
                }`}
              >
                {copied === key
                  ? <Check size={15} className="text-emerald-500" />
                  : <Copy size={15} />
                }
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 保存ボタン */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#f0f4f8] to-transparent">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleSave}
            className={`w-full py-3.5 rounded-2xl text-sm font-bold transition-all shadow-lg ${
              saved
                ? 'bg-emerald-500 text-white shadow-emerald-200'
                : 'bg-gradient-to-r from-[#312e81] to-[#4f46e5] text-white shadow-indigo-200 hover:opacity-90'
            }`}
          >
            {saved ? '✓ 保存しました' : '保存する'}
          </button>
        </div>
      </div>
    </div>
  )
}
