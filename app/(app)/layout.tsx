import { auth, clerkClient } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { sql } from "@/lib/db"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Separator } from "@/components/ui/separator"

async function ensureUserExists(userId: string) {
  const existing = await sql`SELECT id, name, email FROM users WHERE id = ${userId}`
  
  if (existing.length === 0) {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    
    const email = user.emailAddresses[0]?.emailAddress || ""
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || "Usuário"
    const imageUrl = user.imageUrl

    await sql`
      INSERT INTO users (id, email, name, image_url)
      VALUES (${userId}, ${email}, ${name}, ${imageUrl || null})
      ON CONFLICT (id) DO NOTHING
    `
    
    return { name, email }
  }
  
  return existing[0]
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  
  if (!userId) {
    redirect("/sign-in")
  }

  const user = await ensureUserExists(userId)

  const businesses = await sql`
    SELECT id, slug FROM businesses WHERE user_id = ${userId}
  `
  if (businesses.length === 0) {
    redirect("/onboarding")
  }

  const business = businesses[0]

  return (
    <SidebarProvider>
      <AppSidebar
        user={user ? { name: user.name as string, email: user.email as string } : { name: "Usuário", email: "" }}
        businessSlug={business.slug as string}
      />
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
