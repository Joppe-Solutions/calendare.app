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

const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

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
    <Card className="w-full max-w-lg mx-4">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500">
          <CalendarDays className="h-7 w-7 text-white" />
        </div>
        <CardTitle className="text-xl sm:text-2xl font-bold text-balance">
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
            <Button type="button" onClick={() => setStep(1)} className="w-full h-11">
              Continuar <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>

          <div className={step === 1 ? "flex flex-col gap-3" : "hidden"}>
            {hours.map((h, i) => (
              <div key={i} className="flex items-center gap-2 sm:gap-3">
                <Switch
                  checked={h.active}
                  onCheckedChange={(checked) => {
                    const next = [...hours]
                    next[i] = { ...next[i], active: checked }
                    setHours(next)
                  }}
                />
                <span className="w-10 sm:w-16 text-sm font-medium">{DAY_NAMES[i]}</span>
                {h.active ? (
                  <div className="flex items-center gap-1 sm:gap-2 ml-auto">
                    <Input
                      type="time"
                      value={h.start}
                      onChange={(e) => {
                        const next = [...hours]
                        next[i] = { ...next[i], start: e.target.value }
                        setHours(next)
                      }}
                      className="w-24 sm:w-28 h-9"
                    />
                    <span className="text-muted-foreground text-sm">-</span>
                    <Input
                      type="time"
                      value={h.end}
                      onChange={(e) => {
                        const next = [...hours]
                        next[i] = { ...next[i], end: e.target.value }
                        setHours(next)
                      }}
                      className="w-24 sm:w-28 h-9"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground ml-auto">Fechado</span>
                )}
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setStep(0)} className="flex-1 sm:flex-none">
                <ChevronLeft className="mr-1 h-4 w-4" /> Voltar
              </Button>
              <Button type="button" onClick={() => setStep(2)} className="flex-1 h-11">
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
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="serviceDuration" className="text-xs sm:text-sm">Duração</Label>
                <Input
                  id="serviceDuration"
                  name="serviceDuration"
                  type="number"
                  min="5"
                  step="5"
                  defaultValue="240"
                  placeholder="240"
                />
                <p className="text-xs text-muted-foreground">min</p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="serviceCapacity" className="text-xs sm:text-sm">Capacidade</Label>
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
                <Label htmlFor="servicePrice" className="text-xs sm:text-sm">Preço (R$)</Label>
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
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 sm:flex-none">
                <ChevronLeft className="mr-1 h-4 w-4" /> Voltar
              </Button>
              <Button type="submit" className="flex-1 h-11" disabled={isPending}>
                {isPending ? "Finalizando..." : "Começar a usar"}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}