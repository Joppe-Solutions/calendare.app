import { auth } from "@clerk/nextjs/server"
import { sql } from "@/lib/db"
import { getBusinessForUser } from "@/lib/actions"
import { AgendaView } from "@/components/calendar/agenda-view"

export type AppointmentRow = {
  id: string
  business_id: string
  service_id: string
  client_id: string | null
  client_name: string
  client_phone: string | null
  start_time: string
  end_time: string
  status: string
  notes: string | null
  source: string
  created_at: string
  service_name: string
  service_color: string
  service_duration: number
}

export type TimeBlockRow = {
  id: string
  title: string
  start_time: string
  end_time: string
}

export type ServiceOption = {
  id: string
  name: string
  duration_minutes: number
  price_cents: number | null
  color: string
}

export type ClientOption = {
  id: string
  name: string
  phone: string | null
}

export type WorkingHoursRow = {
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
}

export default async function AgendaPage() {
  const { userId } = await auth()
  if (!userId) return null
  
  const business = await getBusinessForUser(userId)
  if (!business) return null

  const [services, clients, workingHours] = await Promise.all([
    sql`SELECT id, name, duration_minutes, price_cents, color FROM services WHERE business_id = ${business.id} AND is_active = true ORDER BY name`,
    sql`SELECT id, name, phone FROM clients WHERE business_id = ${business.id} ORDER BY name`,
    sql`SELECT day_of_week, start_time, end_time, is_active FROM working_hours WHERE business_id = ${business.id} ORDER BY day_of_week`,
  ])

  return (
    <AgendaView
      businessId={business.id as string}
      services={services as ServiceOption[]}
      clients={clients as ClientOption[]}
      workingHours={workingHours as WorkingHoursRow[]}
    />
  )
}
