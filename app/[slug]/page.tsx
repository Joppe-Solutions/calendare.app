import { sql } from "@/lib/db"
import { notFound } from "next/navigation"
import { PublicBookingForm } from "./booking-form"

interface Props {
  params: Promise<{ slug: string }>
}

export default async function PublicBookingPage({ params }: Props) {
  const { slug } = await params

  const businesses = await sql`
    SELECT id, name, phone, address FROM businesses WHERE slug = ${slug}
  `
  if (businesses.length === 0) {
    notFound()
  }

  const business = businesses[0]

  const services = await sql`
    SELECT id, name, description, duration_minutes, price_cents 
    FROM services 
    WHERE business_id = ${business.id} AND is_active = true
    ORDER BY name
  `

  if (services.length === 0) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-muted p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{business.name as string}</h1>
          <p className="text-muted-foreground mt-2">Nenhum serviço disponível para agendamento.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted p-4">
      <PublicBookingForm
        slug={slug}
        business={{
          name: business.name as string,
          phone: business.phone as string | null,
          address: business.address as string | null,
        }}
        services={services.map((s) => ({
          id: s.id as string,
          name: s.name as string,
          description: s.description as string | null,
          duration_minutes: s.duration_minutes as number,
          price_cents: s.price_cents as number | null,
        }))}
      />
    </main>
  )
}
