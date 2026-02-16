"use client"

import Link from "next/link"
import { UserButton } from "@clerk/nextjs"
import { CalendarDays, ExternalLink } from "lucide-react"
import { userButtonTheme } from "@/lib/clerk-theme"
import { Button } from "@/components/ui/button"

interface MobileHeaderProps {
  businessSlug: string
}

export function MobileHeader({ businessSlug }: MobileHeaderProps) {
  return (
    <header className="md:hidden sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
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
