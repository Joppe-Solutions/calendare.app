export type ClientRow = {
  id: string
  name: string
  phone: string | null
  email: string | null
  notes: string | null
  created_at: string
}

export type ServiceRow = {
  id: string
  name: string
  description: string | null
  duration_minutes: number
  price_cents: number | null
  color: string
  is_active: boolean
  created_at: string
}
