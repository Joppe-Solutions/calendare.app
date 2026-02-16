"use client"

import { useState, useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { completeOnboarding } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { CalendarDays, ChevronRight, ChevronLeft } from "lucide-react"

const DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]

const DEFAULT_HOURS = [
  { active: false, start: "09:00", end: "18:00" },
  { active: true, start: "09:00", end: "18:00" },
  { active: true, start: "09:00", end: "18:00" },
  { active: true, start: "09:00", end: "18:00" },
  { active: true, start: "09:00", end: "18:00" },
  { active: true, start: "09:00", end: "18:00" },
  { active: true, start: "09:00", end: "13:00" },
]

interface OnboardingWizardProps {
  userName: string
}

export function OnboardingWizard({ userName }: OnboardingWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [hours, setHours] = useState(DEFAULT_HOURS)

  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string; success?: boolean; redirectTo?: string } | null, formData: FormData) => {
      hours.forEach((h, i) => {
        if (h.active) formData.append(`day_${i}_active`, "on")
        formData.append(`day_${i}_start`, h.start)
        formData.append(`day_${i}_end`, h.end)
      })
      return await completeOnboarding(formData)
    },
    null
  )

  useEffect(() => {
    if (state?.success && state.redirectTo) {
      router.push(state.redirectTo)
    }
  }, [state, router])

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500">
          <CalendarDays className="h-6 w-6 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold text-balance">
          {step === 0 && `Olá, ${userName}!`}
          {step === 1 && "Horário de funcionamento"}
          {step === 2 && "Seu primeiro serviço"}
        </CardTitle>
        <CardDescription>
          {step === 0 && "Vamos configurar seu negócio. Leva menos de 2 minutos."}
          {step === 1 && "Defina os dias e horários em que você atende."}
          {step === 2 && "Adicione um serviço para começar a agendar. (Opcional)"}
        </CardDescription>
        <div className="flex items-center justify-center gap-2 pt-2">
          {[0, 1, 2].map((s) => (
            <div
              key={s}
              className={`h-2 w-8 rounded-full transition-colors ${
                s <= step ? "bg-emerald-500" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          {state?.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}

          <div className={step === 0 ? "flex flex-col gap-4" : "hidden"}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="businessName">Nome do negócio *</Label>
              <Input
                id="businessName"
                name="businessName"
                placeholder="Ex: Barco do João"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">Telefone / WhatsApp</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="(11) 99999-9999"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="address">Endereço / Local</Label>
              <Input
                id="address"
                name="address"
                placeholder="Ex: Marina Porto Belo"
              />
            </div>
            <Button type="button" onClick={() => setStep(1)} className="w-full">
              Continuar <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>

          <div className={step === 1 ? "flex flex-col gap-3" : "hidden"}>
            {hours.map((h, i) => (
              <div key={i} className="flex items-center gap-3">
                <Switch
                  checked={h.active}
                  onCheckedChange={(checked) => {
                    const next = [...hours]
                    next[i] = { ...next[i], active: checked }
                    setHours(next)
                  }}
                />
                <span className="w-20 text-sm font-medium">{DAY_NAMES[i]}</span>
                {h.active ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={h.start}
                      onChange={(e) => {
                        const next = [...hours]
                        next[i] = { ...next[i], start: e.target.value }
                        setHours(next)
                      }}
                      className="w-28"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                      type="time"
                      value={h.end}
                      onChange={(e) => {
                        const next = [...hours]
                        next[i] = { ...next[i], end: e.target.value }
                        setHours(next)
                      }}
                      className="w-28"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Fechado</span>
                )}
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setStep(0)}>
                <ChevronLeft className="mr-1 h-4 w-4" /> Voltar
              </Button>
              <Button type="button" onClick={() => setStep(2)} className="flex-1">
                Continuar <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className={step === 2 ? "flex flex-col gap-4" : "hidden"}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="serviceName">Nome do serviço</Label>
              <Input
                id="serviceName"
                name="serviceName"
                placeholder="Ex: Passeio de barco (4h)"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="serviceDuration">Duração</Label>
                <Input
                  id="serviceDuration"
                  name="serviceDuration"
                  type="number"
                  min="5"
                  step="5"
                  defaultValue="240"
                  placeholder="240"
                />
                <p className="text-xs text-muted-foreground">minutos</p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="serviceCapacity">Capacidade</Label>
                <Input
                  id="serviceCapacity"
                  name="serviceCapacity"
                  type="number"
                  min="1"
                  defaultValue="6"
                  placeholder="6"
                />
                <p className="text-xs text-muted-foreground">pessoas</p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="servicePrice">Preço (R$)</Label>
                <Input
                  id="servicePrice"
                  name="servicePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="150"
                />
                <p className="text-xs text-muted-foreground">por pessoa</p>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                <ChevronLeft className="mr-1 h-4 w-4" /> Voltar
              </Button>
              <Button type="submit" className="flex-1" disabled={isPending}>
                {isPending ? "Finalizando..." : "Começar a usar"}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
