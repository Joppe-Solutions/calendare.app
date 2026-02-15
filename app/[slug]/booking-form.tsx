"use client"

import { useState, useEffect } from "react"
import { format, addDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CalendarDays, MapPin, Phone, Clock, CheckCircle } from "lucide-react"

interface Service {
  id: string
  name: string
  description: string | null
  duration_minutes: number
  price_cents: number | null
}

interface PublicBookingFormProps {
  slug: string
  business: {
    name: string
    phone: string | null
    address: string | null
  }
  services: Service[]
}

export function PublicBookingForm({ slug, business, services }: PublicBookingFormProps) {
  const [step, setStep] = useState(0)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [clientName, setClientName] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const today = new Date()
  const maxDate = addDays(today, 30)

  useEffect(() => {
    async function fetchSlots() {
      if (!selectedDate || !selectedService) {
        setAvailableSlots([])
        return
      }

      setLoadingSlots(true)
      setSelectedTime(null)

      try {
        const dateStr = format(selectedDate, "yyyy-MM-dd")
        const res = await fetch(`/api/availability?slug=${slug}&date=${dateStr}&service_id=${selectedService.id}`)
        const data = await res.json()
        setAvailableSlots(data.slots || [])
      } catch {
        setAvailableSlots([])
      } finally {
        setLoadingSlots(false)
      }
    }

    fetchSlots()
  }, [selectedDate, selectedService, slug])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedService || !selectedDate || !selectedTime || !clientName) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          serviceId: selectedService.id,
          clientName,
          clientPhone: clientPhone || null,
          date: format(selectedDate, "yyyy-MM-dd"),
          time: selectedTime,
          notes: notes || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Erro ao agendar. Tente novamente.")
        return
      }

      setSuccess(true)
    } catch {
      setError("Erro ao agendar. Tente novamente.")
    } finally {
      setSubmitting(false)
    }
  }

  function formatPrice(priceCents: number | null) {
    if (priceCents === null) return null
    return (priceCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
  }

  function formatDuration(minutes: number) {
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
  }

  if (success) {
    return (
      <Card className="w-full max-w-lg">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold">Agendamento confirmado!</h2>
          <p className="text-muted-foreground mt-2">
            {business.name}
          </p>
          <p className="text-muted-foreground">
            {selectedDate && format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
            {selectedTime && ` às ${selectedTime}`}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
          <CalendarDays className="h-6 w-6 text-primary-foreground" />
        </div>
        <CardTitle className="text-2xl font-bold">{business.name}</CardTitle>
        <CardDescription>Agende seu horário</CardDescription>
        {business.address && (
          <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {business.address}
          </div>
        )}
        {business.phone && (
          <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            {business.phone}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[0, 1, 2].map((s) => (
            <div
              key={s}
              className={`h-2 w-8 rounded-full transition-colors ${
                s <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Step 0: Select service */}
        {step === 0 && (
          <div className="space-y-4">
            <Label className="text-base font-semibold">Selecione o serviço</Label>
            <RadioGroup
              value={selectedService?.id || ""}
              onValueChange={(value) => {
                const service = services.find((s) => s.id === value)
                setSelectedService(service || null)
              }}
            >
              {services.map((service) => (
                <div
                  key={service.id}
                  className={`flex items-center justify-between rounded-lg border p-4 cursor-pointer transition-colors ${
                    selectedService?.id === service.id ? "border-primary bg-primary/5" : "hover:border-muted-foreground/50"
                  }`}
                  onClick={() => setSelectedService(service)}
                >
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value={service.id} id={service.id} />
                    <div>
                      <Label htmlFor={service.id} className="font-medium cursor-pointer">
                        {service.name}
                      </Label>
                      {service.description && (
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDuration(service.duration_minutes)}
                      </div>
                    </div>
                  </div>
                  {service.price_cents !== null && (
                    <span className="font-semibold">{formatPrice(service.price_cents)}</span>
                  )}
                </div>
              ))}
            </RadioGroup>
            <Button
              className="w-full"
              disabled={!selectedService}
              onClick={() => setStep(1)}
            >
              Continuar
            </Button>
          </div>
        )}

        {/* Step 1: Select date and time */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < today || date > maxDate}
                locale={ptBR}
              />
            </div>

            {selectedDate && (
              <div className="space-y-2">
                <Label className="text-base font-semibold">Horários disponíveis</Label>
                {loadingSlots ? (
                  <p className="text-center text-muted-foreground py-4">Carregando horários...</p>
                ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots.map((slot) => (
                      <Button
                        key={slot}
                        type="button"
                        variant={selectedTime === slot ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTime(slot)}
                      >
                        {slot}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    Nenhum horário disponível para esta data.
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setStep(0)}>
                Voltar
              </Button>
              <Button
                className="flex-1"
                disabled={!selectedDate || !selectedTime}
                onClick={() => setStep(2)}
              >
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Client info */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-lg bg-muted p-4 space-y-1">
              <p className="font-medium">{selectedService?.name}</p>
              <p className="text-sm text-muted-foreground">
                {selectedDate && format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                {selectedTime && ` às ${selectedTime}`}
              </p>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="clientName">Seu nome *</Label>
              <Input
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Digite seu nome"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientPhone">Telefone / WhatsApp</Label>
              <Input
                id="clientPhone"
                type="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Alguma informação adicional?"
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                Voltar
              </Button>
              <Button type="submit" className="flex-1" disabled={submitting || !clientName}>
                {submitting ? "Agendando..." : "Confirmar agendamento"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
