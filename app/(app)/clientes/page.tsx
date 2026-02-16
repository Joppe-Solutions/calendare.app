import { auth } from "@clerk/nextjs/server"
import { sql } from "@/lib/db"
import { getBusinessForUser } from "@/lib/actions"
import { ClientList } from "@/components/clients/client-list"

export default async function ClientesPage() {
  const { userId } = await auth()
  if (!userId) return null
  
  const business = await getBusinessForUser(userId)
  if (!business) return null

  const clients = await sql`
    SELECT id, name, phone, email, notes, created_at
    FROM clients
    WHERE business_id = ${business.id}
    ORDER BY name
  `

  return (
    <ClientList
      clients={clients.map((c) => ({
        id: c.id as string,
        name: c.name as string,
        phone: c.phone as string | null,
        email: c.email as string | null,
        notes: c.notes as string | null,
        created_at: c.created_at as string,
      }))}
    />
  )
}