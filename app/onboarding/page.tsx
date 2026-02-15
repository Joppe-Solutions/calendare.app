import { auth, clerkClient } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { sql } from "@/lib/db"
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard"

export default async function OnboardingPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect("/sign-in")
  }

  const businesses = await sql`
    SELECT id FROM businesses WHERE user_id = ${userId}
  `
  if (businesses.length > 0) {
    redirect("/agenda")
  }

  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  
  const userName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "Usuário"

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted p-4">
      <OnboardingWizard userName={userName} />
    </main>
  )
}
