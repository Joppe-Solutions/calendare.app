import { auth, clerkClient } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { sql } from "@/lib/db"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { MobileHeader } from "@/components/layout/mobile-header"

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
    SELECT id, slug, plan_id FROM businesses WHERE user_id = ${userId}
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
        plan={(business.plan_id as string) || "free"}
      />
      <SidebarInset className="flex flex-col">
        {/* Desktop Header */}
        <header className="hidden md:flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger />
        </header>
        
        {/* Mobile Header */}
        <MobileHeader businessSlug={business.slug as string} plan={(business.plan_id as string) || "free"} />
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto pt-4 md:pt-0 md:p-6">
          <div className="max-w-6xl mx-auto w-full px-4 md:px-0 pb-6 md:pb-0">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}