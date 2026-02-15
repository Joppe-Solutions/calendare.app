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
    SELECT id, name, description, duration_minutes, price_cents, color, is_active, created_at
    FROM services
    WHERE business_id = ${business.id}
    ORDER BY name
  `

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-balance">Serviços</h1>
        <p className="text-muted-foreground">Configure os serviços que você oferece.</p>
      </div>
      <ServiceList
        services={services.map((s) => ({
          id: s.id as string,
          name: s.name as string,
          description: s.description as string | null,
          duration_minutes: s.duration_minutes as number,
          price_cents: s.price_cents as number | null,
          color: s.color as string,
          is_active: s.is_active as boolean,
          created_at: s.created_at as string,
        }))}
      />
    </div>
  )
}
