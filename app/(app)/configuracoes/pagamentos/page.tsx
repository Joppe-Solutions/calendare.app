import { auth } from "@clerk/nextjs/server"
import { sql } from "@/lib/db"
import { getBusinessForUser } from "@/lib/actions"
import { PaymentSettingsForm } from "./payment-settings-form"

export default async function PagamentosPage() {
  const { userId } = await auth()
  if (!userId) return null
  
  const business = await getBusinessForUser(userId)
  if (!business) return null

  const businessData = await sql`
    SELECT payment_gateway, payment_access_token, payment_public_key
    FROM businesses
    WHERE id = ${business.id}
  `

  const b = businessData[0]

  return (
    <PaymentSettingsForm
      initialData={{
        payment_gateway: (b?.payment_gateway as string) || null,
        payment_access_token: (b?.payment_access_token as string) || null,
        payment_public_key: (b?.payment_public_key as string) || null,
      }}
    />
  )
}