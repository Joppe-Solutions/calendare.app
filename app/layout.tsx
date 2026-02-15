import type { Metadata, Viewport } from "next"
import type { ComponentProps } from "react"
import { Inter } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import { ptBR } from "@clerk/localizations"
import { Toaster } from "sonner"
import { clerkTheme } from "@/lib/clerk-theme"

import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

const clerkLocalization = ptBR as unknown as ComponentProps<typeof ClerkProvider>["localization"]

export const metadata: Metadata = {
  title: {
    default: "Calendare - Agendamento Online",
    template: "%s | Calendare",
  },
  description: "Simplifique o agendamento do seu negócio. Gerencie horários, clientes e serviços em um só lugar.",
  keywords: ["agendamento online", "agenda", "reservas", "booking", "gestão de horários"],
  authors: [{ name: "Calendare" }],
  creator: "Calendare",
}

export const viewport: Viewport = {
  themeColor: "#10B981",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider
      localization={clerkLocalization}
      appearance={{
        baseTheme: undefined,
        variables: clerkTheme.variables,
        elements: clerkTheme.elements,
      }}
    >
      <html lang="pt-BR" className={inter.variable}>
        <body className="font-sans antialiased">
          {children}
          <Toaster richColors position="top-right" />
        </body>
      </html>
    </ClerkProvider>
  )
}
