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
import { userButtonTheme } from "@/lib/clerk-theme"

const navItems = [
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/servicos", label: "Serviços", icon: Scissors },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
]

interface AppSidebarProps {
  user: { name: string; email: string }
  businessSlug?: string
}

export function AppSidebar({ user, businessSlug }: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/agenda" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
            <CalendarDays className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-sidebar-foreground">Calendare</span>
        </Link>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)}>
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
