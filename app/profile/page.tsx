'use client'

import { useState, useEffect } from 'react'
import { Profile } from '@/lib/types'
import { Copy, Check, ArrowLeft } from 'lucide-react'

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
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <a href="/" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </a>
        <h1 className="text-2xl font-bold text-gray-800">プロフィール</h1>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        抽選応募時にワンタップでコピーできます。データはこのデバイスにのみ保存されます。
      </p>

      <div className="flex flex-col gap-3">
        {FIELDS.map(({ key, label, placeholder }) => (
          <div key={key} className="bg-white border rounded-xl p-3">
            <label className="text-xs text-gray-400 mb-1 block">{label}</label>
            <div className="flex gap-2 items-center">
              <input
                name={key}
                value={profile[key]}
                onChange={handleChange}
                placeholder={placeholder}
                className="flex-1 text-sm focus:outline-none text-gray-800"
              />
              <button
                onClick={() => handleCopy(key)}
                className="text-gray-300 hover:text-blue-500 transition-colors shrink-0"
                title="コピー"
              >
                {copied === key ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        className="w-full mt-6 bg-blue-600 text-white rounded-xl py-3 font-medium hover:bg-blue-700 transition-colors"
      >
        {saved ? '保存しました ✓' : '保存する'}
      </button>
    </div>
  )
}
