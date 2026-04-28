export type LotteryStatus = 'pending' | 'applied' | 'won' | 'lost'

export interface Lottery {
  id: string
  site_name: string
  product_name: string
  deadline: string
  url: string
  status: LotteryStatus
  note: string
  auto_scraped: boolean
  deadline_estimated: boolean
  created_at: string
}

export interface Profile {
  last_name: string
  first_name: string
  last_name_kana: string
  first_name_kana: string
  postal_code: string
  prefecture: string
  city: string
  address: string
  phone: string
  email: string
}
