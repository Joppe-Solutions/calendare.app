import { auth } from "@clerk/nextjs/server"
import { sql } from "@/lib/db"
import { getBusinessForUser } from "@/lib/actions"
import { ServiceList } from "@/components/services/service-list"

export default async function ServicosPage() {
  const { userId } = await auth()
  if (!userId) return null
  
  const business = await getBusinessForUser(userId)
  if (!business) return null

  const services = await sql`
    SELECT id, name, description, duration_minutes, price_cents, price_type, capacity, color, meeting_point, meeting_instructions, cover_image_url, payment_type, deposit_percentage, is_active, created_at
    FROM services
    WHERE business_id = ${business.id}
    ORDER BY name
  `

  return (
    <ServiceList
      services={services.map((s) => ({
        id: s.id as string,
        name: s.name as string,
        description: s.description as string | null,
        duration_minutes: s.duration_minutes as number,
        price_cents: s.price_cents as number | null,
        price_type: (s.price_type as 'total' | 'per_person') || 'total',
        capacity: (s.capacity as number) || 1,
        color: s.color as string,
        meeting_point: s.meeting_point as string | null,
        meeting_instructions: s.meeting_instructions as string | null,
        cover_image_url: s.cover_image_url as string | null,
        payment_type: (s.payment_type as 'on_site' | 'deposit' | 'full') || 'on_site',
        deposit_percentage: (s.deposit_percentage as number) || 0,
        is_active: s.is_active as boolean,
        created_at: s.created_at as string,
      }))}
    />
  )
}