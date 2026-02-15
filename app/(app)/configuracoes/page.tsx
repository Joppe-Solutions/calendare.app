import { auth } from "@clerk/nextjs/server"
import { sql } from "@/lib/db"
import { getBusinessForUser } from "@/lib/actions"
import { BusinessProfileForm } from "@/components/settings/business-profile-form"
import { WorkingHoursForm } from "@/components/settings/working-hours-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function ConfiguracoesPage() {
  const { userId } = await auth()
  if (!userId) return null
  
  const business = await getBusinessForUser(userId)
  if (!business) return null

  const workingHours = await sql`
    SELECT * FROM working_hours
    WHERE business_id = ${business.id}
    ORDER BY day_of_week
  `

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-balance">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as informações do seu negócio e horário de funcionamento.</p>
      </div>
      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="hours">Horários</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-4">
          <BusinessProfileForm
            business={{
              name: business.name as string,
              slug: business.slug as string,
              phone: business.phone as string | null,
              address: business.address as string | null,
            }}
          />
        </TabsContent>
        <TabsContent value="hours" className="mt-4">
          <WorkingHoursForm
            workingHours={workingHours.map((wh) => ({
              day_of_week: wh.day_of_week as number,
              start_time: wh.start_time as string,
              end_time: wh.end_time as string,
              is_active: wh.is_active as boolean,
            }))}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
