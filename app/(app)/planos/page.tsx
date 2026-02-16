import { auth, clerkClient } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { PricingPage } from "./pricing-client"

export default async function PlanosPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect("/sign-in")
  }

  const client = await clerkClient()
  const user = await client.users.getUser(userId)

  return (
    <PricingPage 
      userEmail={user.emailAddresses[0]?.emailAddress || ""}
      userName={[user.firstName, user.lastName].filter(Boolean).join(" ") || "Usuário"}
    />
  )
}