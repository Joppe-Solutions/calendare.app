"use client"

import { useState } from "react"
import { Check, Zap, Crown, Building2, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useClerk } from "@clerk/nextjs"

const plans = [
  {
    id: "free",
    name: "Gratuito",
    description: "Para começar a usar o sistema",
    price: 0,
    period: "para sempre",
    features: [
      "1 serviço cadastrado",
      "Até 20 agendamentos/mês",
      "Página pública de agendamento",
      "Dashboard básico",
    ],
    limitations: [
      "Sem personalização de marca",
      "Sem relatórios avançados",
    ],
    buttonText: "Plano atual",
    buttonVariant: "outline" as const,
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    description: "Para profissionais e pequenos negócios",
    price: 49,
    period: "/mês",
    features: [
      "Serviços ilimitados",
      "Agendamentos ilimitados",
      "Personalização de marca (logo, cores)",
      "Relatórios e gráficos avançados",
      "Bloqueio de horários",
      "Suporte por e-mail",
    ],
    limitations: [],
    buttonText: "Começar agora",
    buttonVariant: "default" as const,
    popular: true,
  },
  {
    id: "business",
    name: "Business",
    description: "Para empresas em crescimento",
    price: 149,
    period: "/mês",
    features: [
      "Tudo do Pro, mais:",
      "Múltiplos usuários",
      "Notificações por WhatsApp",
      "Pagamento de sinal online",
      "API para integrações",
      "Suporte prioritário",
      "Onboarding personalizado",
    ],
    limitations: [],
    buttonText: "Fale conosco",
    buttonVariant: "outline" as const,
    popular: false,
  },
]

interface PricingPageProps {
  userEmail: string
  userName: string
}

export function PricingPage({ userEmail, userName }: PricingPageProps) {
  const { openSignIn } = useClerk()
  const [loading, setLoading] = useState<string | null>(null)

  const handleSubscribe = async (planId: string) => {
    if (planId === "free") return
    
    setLoading(planId)
    
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      })
      
      const data = await response.json()
      
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error("Error creating checkout session:", error)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Escolha seu plano</h1>
        <p className="text-muted-foreground mt-1">
          Comece grátis e evolua conforme seu negócio cresce
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative flex flex-col ${plan.popular ? "border-primary shadow-lg shadow-primary/10" : ""}`}
          >
            {plan.popular && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2" variant="default">
                Mais popular
              </Badge>
            )}
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {plan.id === "free" && <Zap className="h-5 w-5" />}
                {plan.id === "pro" && <Crown className="h-5 w-5 text-primary" />}
                {plan.id === "business" && <Building2 className="h-5 w-5" />}
                {plan.name}
              </CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="mb-6">
                <span className="text-4xl font-bold">
                  {plan.price === 0 ? "Grátis" : `R$ ${plan.price}`}
                </span>
                {plan.price > 0 && (
                  <span className="text-muted-foreground">{plan.period}</span>
                )}
              </div>
              
              <ul className="space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
                {plan.limitations.map((limitation, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="h-4 w-4 shrink-0 mt-0.5">—</span>
                    <span>{limitation}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                variant={plan.buttonVariant}
                className="w-full"
                onClick={() => handleSubscribe(plan.id)}
                disabled={loading !== null || plan.id === "free"}
              >
                {loading === plan.id && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {plan.buttonText}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Todos os planos incluem 7 dias de teste grátis. Cancele quando quiser.
      </p>
    </div>
  )
}