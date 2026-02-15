import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { sql } from "@/lib/db"

export default async function Home() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  const businesses = await sql`
    SELECT id FROM businesses WHERE user_id = ${userId}
  `

  if (businesses.length === 0) {
    redirect("/onboarding")
  }

  redirect("/agenda")
}
