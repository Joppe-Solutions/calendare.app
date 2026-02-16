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
  price_type: 'total' | 'per_person'
  capacity: number
  color: string
  meeting_point: string | null
  meeting_instructions: string | null
  cover_image_url: string | null
  payment_type: 'on_site' | 'deposit' | 'full'
  deposit_percentage: number
  is_active: boolean
  created_at: string
}

export type AppointmentWithSpots = {
  id: string
  service_id: string
  spots: number
  status: string
  start_time: string
  end_time: string
}
