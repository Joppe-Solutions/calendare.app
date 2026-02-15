import Link from "next/link"
import { CheckCircle2, CalendarDays } from "lucide-react"

const features = [
  "Gerencie todos os seus agendamentos em um só lugar",
  "Página pública de agendamento para seus clientes",
  "Controle de horários e serviços",
  "Notificações automáticas",
]

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-emerald-700" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-400/30 via-emerald-500/10 to-transparent" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
              <CalendarDays className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold">Calendare</span>
          </Link>

          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold leading-tight lg:text-4xl">
                Simplifique seus agendamentos,
                <br />
                economize tempo.
              </h1>
              <p className="mt-4 text-lg text-white/70">
                Gerencie sua agenda, clientes e serviços de forma simples e eficiente.
              </p>
            </div>

            <ul className="space-y-4">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-white/80">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-sm text-white/40">
            © {new Date().getFullYear()} Calendare. Todos os direitos reservados.
          </p>
        </div>
      </div>

      <div className="flex flex-col bg-background">
        <header className="flex items-center justify-between border-b p-4 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
              <CalendarDays className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold">Calendare</span>
          </Link>
        </header>

        <main className="flex flex-1 items-center justify-center p-4 lg:p-8">
          <div className="w-full max-w-md">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
