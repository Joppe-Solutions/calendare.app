"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserButton } from "@clerk/nextjs"
import { CalendarDays, ExternalLink, LayoutDashboard, Scissors, Users, Settings, CreditCard, Link2, Menu, X, Sparkles } from "lucide-react"
import { userButtonTheme } from "@/lib/clerk-theme"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { useState } from "react"

const navItems = [
  { href: "/dashboard", label: "Início", icon: LayoutDashboard },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/servicos", label: "Serviços", icon: Scissors },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
]

interface MobileHeaderProps {
  businessSlug: string
  plan?: string
}

export function MobileHeader({ businessSlug, plan = "free" }: MobileHeaderProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const isFree = plan === "free"

  return (
    <header className="md:hidden sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <Link href="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
                  <CalendarDays className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-lg">Calendare</span>
              </Link>
            </SheetTitle>
          </SheetHeader>
          
          <div className="flex flex-col h-[calc(100vh-80px)]">
            {isFree && (
              <div className="px-3 py-3">
                <Link href="/planos" onClick={() => setOpen(false)}>
                  <div className="rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-3">
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
            
            <nav className="flex-1 px-3 py-2 space-y-1">
              <p className="text-xs font-medium text-muted-foreground px-3 py-2">Menu</p>
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                      isActive 
                        ? "bg-primary/10 text-primary font-medium" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
            
            <div className="px-3 py-2 space-y-1 border-t">
              <p className="text-xs font-medium text-muted-foreground px-3 py-2">Assinatura</p>
              <Link
                href="/planos"
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  pathname === "/planos"
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <CreditCard className="h-5 w-5" />
                <span>Meu plano</span>
                {isFree && (
                  <span className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">Free</span>
                )}
              </Link>
            </div>
            
            {businessSlug && (
              <div className="px-3 py-2 border-t">
                <p className="text-xs font-medium text-muted-foreground px-3 py-2">Link Público</p>
                <Link
                  href={`/${businessSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Link2 className="h-5 w-5" />
                  <span className="truncate">/{businessSlug}</span>
                  <ExternalLink className="h-4 w-4 ml-auto" />
                </Link>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
      
      <Link href="/dashboard" className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
          <CalendarDays className="h-4 w-4 text-white" />
        </div>
        <span className="font-bold text-lg">Calendare</span>
      </Link>
      
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          asChild
        >
          <Link href={`/${businessSlug}`} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
          </Link>
        </Button>
        <UserButton 
          appearance={{ elements: userButtonTheme.elements }}
          afterSignOutUrl="/sign-in"
        />
      </div>
    </header>
  )
}
