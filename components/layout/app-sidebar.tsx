"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserButton } from "@clerk/nextjs"
import {
  CalendarDays,
  Scissors,
  Users,
  Settings,
  Link2,
  LayoutDashboard,
  CreditCard,
  Sparkles,
  DollarSign,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { userButtonTheme } from "@/lib/clerk-theme"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/servicos", label: "Serviços", icon: Scissors },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
]

interface AppSidebarProps {
  user: { name: string; email: string }
  businessSlug?: string
  plan?: string
}

export function AppSidebar({ user, businessSlug, plan = "free" }: AppSidebarProps) {
  const pathname = usePathname()
  const isFree = plan === "free"

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
            <CalendarDays className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-sidebar-foreground">Calendare</span>
        </Link>
      </SidebarHeader>
      <SidebarSeparator />
      
      {/* Upgrade Banner for Free Users */}
      {isFree && (
        <div className="px-3 py-2">
          <Link href="/planos">
            <div className="rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-3 hover:from-primary/15 hover:to-primary/10 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Upgrade para Pro</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Serviços ilimitados e mais recursos
              </p>
            </div>
          </Link>
        </div>
      )}
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>Assinatura</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/planos"}>
                  <Link href="/planos">
                    <CreditCard className="h-4 w-4" />
                    <span>Meu plano</span>
                    {isFree && (
                      <span className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">Free</span>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {businessSlug && (
          <SidebarGroup>
            <SidebarGroupLabel>Link Público</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href={`/${businessSlug}`} target="_blank" rel="noopener noreferrer">
                      <Link2 className="h-4 w-4" />
                      <span className="truncate">/{businessSlug}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-sidebar-foreground">{user.name}</span>
            <span className="text-xs text-muted-foreground truncate">{user.email}</span>
          </div>
          <UserButton appearance={{ elements: userButtonTheme.elements }} />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}