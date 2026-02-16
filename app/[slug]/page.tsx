import { sql } from "@/lib/db"
import { notFound } from "next/navigation"
import { PublicBookingForm } from "./booking-form"

interface Props {
  params: Promise<{ slug: string }>
}

export default async function PublicBookingPage({ params }: Props) {
  const { slug } = await params

  const businesses = await sql`
    SELECT id, name, phone, address, show_weather_warning, logo_url, cover_url, primary_color, payment_gateway, payment_access_token 
    FROM businesses 
    WHERE slug = ${slug}
  `
  if (businesses.length === 0) {
    notFound()
  }

  const business = businesses[0]

  const services = await sql`
    SELECT id, name, description, duration_minutes, price_cents, price_type, capacity, meeting_point, meeting_instructions, payment_type, deposit_percentage 
    FROM services 
    WHERE business_id = ${business.id} AND is_active = true
    ORDER BY name
  `

  if (services.length === 0) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-muted p-4">
        <div className="text-center">
          {business.logo_url && (
            <img src={business.logo_url as string} alt={business.name as string} className="w-20 h-20 mx-auto mb-4 object-contain" />
          )}
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
          showWeatherWarning: business.show_weather_warning as boolean,
          logoUrl: business.logo_url as string | null,
          coverUrl: business.cover_url as string | null,
          primaryColor: (business.primary_color as string) || '#10B981',
          paymentEnabled: !!(business.payment_gateway && business.payment_access_token),
        }}
        services={services.map((s) => ({
          id: s.id as string,
          name: s.name as string,
          description: s.description as string | null,
          duration_minutes: s.duration_minutes as number,
          price_cents: s.price_cents as number | null,
          price_type: (s.price_type as 'total' | 'per_person') || 'total',
          capacity: (s.capacity as number) || 1,
          meeting_point: s.meeting_point as string | null,
          meeting_instructions: s.meeting_instructions as string | null,
          payment_type: (s.payment_type as 'on_site' | 'deposit' | 'full') || 'on_site',
          deposit_percentage: (s.deposit_percentage as number) || 50,
        }))}
      />
    </main>
  )
}
