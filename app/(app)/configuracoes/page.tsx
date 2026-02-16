import { auth } from "@clerk/nextjs/server"
import { sql } from "@/lib/db"
import { getBusinessForUser } from "@/lib/actions"
import { BusinessProfileForm } from "@/components/settings/business-profile-form"
import { WorkingHoursForm } from "@/components/settings/working-hours-form"
import { BrandingForm } from "@/components/settings/branding-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreditCard } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default async function ConfiguracoesPage() {
  const { userId } = await auth()
  if (!userId) return null
  
  const business = await getBusinessForUser(userId)
  if (!business) return null

  const [workingHours, businessData] = await Promise.all([
    sql`
      SELECT * FROM working_hours
      WHERE business_id = ${business.id}
      ORDER BY day_of_week
    `,
    sql`
      SELECT name, slug, phone, address, logo_url, cover_url, primary_color, payment_gateway
      FROM businesses
      WHERE id = ${business.id}
    `,
  ])

  const b = businessData[0]

  return (
    <ConfiguracoesClient
      workingHours={workingHours.map((wh) => ({
        day_of_week: wh.day_of_week as number,
        start_time: wh.start_time as string,
        end_time: wh.end_time as string,
        is_active: wh.is_active as boolean,
      }))}
      business={{
        name: b.name as string,
        slug: b.slug as string,
        phone: b.phone as string | null,
        address: b.address as string | null,
        logo_url: b.logo_url as string | null,
        cover_url: b.cover_url as string | null,
        primary_color: (b.primary_color as string) || '#10B981',
        payment_gateway: b.payment_gateway as string | null,
      }}
    />
  )
}

function ConfiguracoesClient({ 
  workingHours, 
  business 
}: { 
  workingHours: Array<{
    day_of_week: number
    start_time: string
    end_time: string
    is_active: boolean
  }>
  business: {
    name: string
    slug: string
    phone: string | null
    address: string | null
    logo_url: string | null
    cover_url: string | null
    primary_color: string
    payment_gateway: string | null
  }
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* Desktop Header */}
      <div className="hidden md:block">
        <h1 className="text-2xl font-bold tracking-tight text-balance">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as informações do seu negócio.</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto p-1">
          <TabsTrigger value="profile" className="text-xs sm:text-sm py-2">Perfil</TabsTrigger>
          <TabsTrigger value="branding" className="text-xs sm:text-sm py-2">Identidade</TabsTrigger>
          <TabsTrigger value="hours" className="text-xs sm:text-sm py-2">Horários</TabsTrigger>
          <TabsTrigger value="payments" className="text-xs sm:text-sm py-2">Pagamentos</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-4">
          <BusinessProfileForm
            business={{
              name: business.name,
              slug: business.slug,
              phone: business.phone,
              address: business.address,
            }}
          />
        </TabsContent>
        <TabsContent value="branding" className="mt-4">
          <BrandingForm
            business={{
              name: business.name,
              logo_url: business.logo_url,
              cover_url: business.cover_url,
              primary_color: business.primary_color,
            }}
          />
        </TabsContent>
        <TabsContent value="hours" className="mt-4">
          <WorkingHoursForm workingHours={workingHours} />
        </TabsContent>
        <TabsContent value="payments" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Gateway de Pagamento</h3>
                  {business.payment_gateway ? (
                    <p className="text-sm text-muted-foreground mb-4">
                      Você está usando <span className="font-medium capitalize">{business.payment_gateway.replace('pagarme', 'Pagar.me').replace('mercadopago', 'Mercado Pago')}</span>
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground mb-4">
                      Configure um gateway para receber pagamentos online dos seus clientes.
                    </p>
                  )}
                  <Link href="/configuracoes/pagamentos">
                    <Button>
                      Configurar pagamentos
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}