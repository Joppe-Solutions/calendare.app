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
import { CalendarDays, MapPin, Phone, Clock, CheckCircle, Users, AlertTriangle, CreditCard, QrCode, Landmark, Loader2, Copy, Check } from "lucide-react"

interface Service {
  id: string
  name: string
  description: string | null
  duration_minutes: number
  price_cents: number | null
  price_type: 'total' | 'per_person'
  capacity: number
  meeting_point: string | null
  meeting_instructions: string | null
  payment_type: 'on_site' | 'deposit' | 'full'
  deposit_percentage: number
}

interface PublicBookingFormProps {
  slug: string
  business: {
    name: string
    phone: string | null
    address: string | null
    showWeatherWarning: boolean
    logoUrl: string | null
    coverUrl: string | null
    primaryColor: string
    paymentEnabled: boolean
  }
  services: Service[]
}

interface PaymentResult {
  id: string
  value: number
  billingType: string
  status: string
  invoiceUrl: string
  bankSlipUrl?: string
  qrCode?: {
    payload: string
    encodedImage: string
  }
}

export function PublicBookingForm({ slug, business, services }: PublicBookingFormProps) {
  const [step, setStep] = useState(0)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [availableSpots, setAvailableSpots] = useState<number>(0)
  const [serviceCapacity, setServiceCapacity] = useState<number>(1)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [spots, setSpots] = useState(1)
  const [clientName, setClientName] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [clientCpfCnpj, setClientCpfCnpj] = useState("")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card' | 'boleto'>('pix')
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null)
  const [copiedPix, setCopiedPix] = useState(false)

  const today = new Date()
  const maxDate = addDays(today, 30)

  const primaryColor = business.primaryColor || '#10B981'

  const requiresPayment = !!(
    selectedService && 
    selectedService.payment_type !== 'on_site' && 
    business.paymentEnabled
  )

  const totalSteps = requiresPayment ? 4 : 3

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
        setAvailableSpots(data.capacity ? data.capacity - (data.bookedSpots || 0) : selectedService.capacity)
        setServiceCapacity(data.capacity || selectedService.capacity)
      } catch {
        setAvailableSlots([])
        setAvailableSpots(0)
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
          spots,
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

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedService || !selectedDate || !selectedTime || !clientName) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          serviceId: selectedService.id,
          clientName,
          clientPhone: clientPhone || null,
          clientEmail: clientEmail || null,
          clientCpfCnpj: clientCpfCnpj || null,
          date: format(selectedDate, "yyyy-MM-dd"),
          time: selectedTime,
          notes: notes || null,
          spots,
          paymentMethod,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Erro ao processar pagamento. Tente novamente.")
        return
      }

      setPaymentResult(data.payment)
      
      if (paymentMethod === 'credit_card' && data.payment.invoiceUrl) {
        window.open(data.payment.invoiceUrl, '_blank')
      }
      
      setStep(4)
    } catch {
      setError("Erro ao processar pagamento. Tente novamente.")
    } finally {
      setSubmitting(false)
    }
  }

  function formatPrice(priceCents: number | null, priceType: string) {
    if (priceCents === null) return null
    const value = (priceCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    return priceType === 'per_person' ? `${value}/pessoa` : value
  }

  function formatDuration(minutes: number) {
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
  }

  function calculateTotalPrice() {
    if (!selectedService || selectedService.price_cents === null) return null
    let total = selectedService.price_cents / 100
    if (selectedService.price_type === 'per_person') {
      total = total * spots
    }
    return total
  }

  function calculatePaymentAmount() {
    const total = calculateTotalPrice()
    if (!total || !selectedService) return null
    if (selectedService.payment_type === 'deposit') {
      return total * (selectedService.deposit_percentage / 100)
    }
    return total
  }

  function getPaymentLabel() {
    if (!selectedService) return ''
    switch (selectedService.payment_type) {
      case 'deposit':
        return `Sinal (${selectedService.deposit_percentage}%)`
      case 'full':
        return 'Pagamento integral'
      default:
        return 'Pagar no local'
    }
  }

  async function copyPixCode() {
    if (paymentResult?.qrCode?.payload) {
      await navigator.clipboard.writeText(paymentResult.qrCode.payload)
      setCopiedPix(true)
      setTimeout(() => setCopiedPix(false), 2000)
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-lg">
        {business.coverUrl && (
          <div className="h-32 w-full rounded-t-lg overflow-hidden">
            <img src={business.coverUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <Card className={business.coverUrl ? "rounded-t-none" : ""}>
          <CardContent className="pt-8 pb-8 text-center">
            <div 
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: `${primaryColor}20` }}
            >
              <CheckCircle className="h-8 w-8" style={{ color: primaryColor }} />
            </div>
            <h2 className="text-xl font-bold">Agendamento confirmado!</h2>
            <p className="text-muted-foreground mt-2">{business.name}</p>
            <p className="text-muted-foreground">
              {selectedDate && format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
              {selectedTime && ` às ${selectedTime}`}
            </p>
            {spots > 1 && <p className="text-muted-foreground">{spots} pessoas</p>}
            {selectedService?.meeting_point && (
              <div className="mt-4 p-3 bg-muted rounded-lg text-left">
                <p className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Local de encontro:
                </p>
                <p className="text-sm text-muted-foreground">{selectedService.meeting_point}</p>
                {selectedService.meeting_instructions && (
                  <p className="text-sm text-muted-foreground mt-1">{selectedService.meeting_instructions}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full max-w-lg">
      {business.coverUrl && (
        <div className="h-40 w-full rounded-t-lg overflow-hidden">
          <img src={business.coverUrl} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <Card className={business.coverUrl ? "rounded-t-none" : ""}>
        <CardHeader className="text-center">
          <div 
            className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg"
            style={{ backgroundColor: primaryColor }}
          >
            {business.logoUrl ? (
              <img src={business.logoUrl} alt={business.name} className="h-8 w-8 object-contain" />
            ) : (
              <CalendarDays className="h-6 w-6 text-white" />
            )}
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
          {business.showWeatherWarning && (
            <div className="mb-4 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <p>Agendamentos sujeitos a alteração por condições climáticas.</p>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 mb-6">
            {Array.from({ length: totalSteps }).map((_, s) => (
              <div
                key={s}
                className="h-2 w-8 rounded-full transition-colors"
                style={{ backgroundColor: s <= step ? primaryColor : 'hsl(var(--muted))' }}
              />
            ))}
          </div>

          {step === 0 && (
            <div className="space-y-4">
              <Label className="text-base font-semibold">Selecione o serviço</Label>
              <RadioGroup
                value={selectedService?.id || ""}
                onValueChange={(value) => {
                  const service = services.find((s) => s.id === value)
                  setSelectedService(service || null)
                  setSpots(1)
                }}
              >
                {services.map((service) => (
                  <div
                    key={service.id}
                    className={`flex items-center justify-between rounded-lg border p-4 cursor-pointer transition-colors ${
                      selectedService?.id === service.id ? "border-emerald-500 bg-emerald-50" : "hover:border-muted-foreground/50"
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
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(service.duration_minutes)}
                          </span>
                          {service.capacity > 1 && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {service.capacity} vagas
                            </span>
                          )}
                        </div>
                        {service.payment_type !== 'on_site' && business.paymentEnabled && (
                          <div className="mt-1">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                              {service.payment_type === 'deposit' ? `Sinal de ${service.deposit_percentage}%` : 'Pagamento online'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="font-semibold text-right">
                      {formatPrice(service.price_cents, service.price_type)}
                    </span>
                  </div>
                ))}
              </RadioGroup>
              <Button
                className="w-full"
                style={{ backgroundColor: primaryColor }}
                disabled={!selectedService}
                onClick={() => setStep(1)}
              >
                Continuar
              </Button>
            </div>
          )}

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
                          style={selectedTime === slot ? { backgroundColor: primaryColor } : {}}
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
                  style={{ backgroundColor: primaryColor }}
                  disabled={!selectedDate || !selectedTime}
                  onClick={() => setStep(2)}
                >
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={(e) => { e.preventDefault(); setStep(3); }} className="space-y-4">
              <div className="rounded-lg bg-muted p-4 space-y-1">
                <p className="font-medium">{selectedService?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedDate && format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                  {selectedTime && ` às ${selectedTime}`}
                </p>
              </div>

              {selectedService && selectedService.capacity > 1 && (
                <div className="space-y-2">
                  <Label htmlFor="spots">Número de pessoas</Label>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSpots(Math.max(1, spots - 1))}
                      disabled={spots <= 1}
                    >
                      -
                    </Button>
                    <span className="text-lg font-medium w-8 text-center">{spots}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSpots(Math.min(availableSpots, spots + 1))}
                      disabled={spots >= availableSpots}
                    >
                      +
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      ({availableSpots} disponíveis)
                    </span>
                  </div>
                </div>
              )}

              {selectedService?.meeting_point && (
                <div className="rounded-lg bg-muted p-3 space-y-1">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Local de encontro:
                  </p>
                  <p className="text-sm">{selectedService.meeting_point}</p>
                  {selectedService.meeting_instructions && (
                    <p className="text-sm text-muted-foreground">{selectedService.meeting_instructions}</p>
                  )}
                </div>
              )}

              {selectedService && selectedService.price_cents !== null && (
                <div className="rounded-lg p-3" style={{ backgroundColor: `${primaryColor}15`, borderColor: `${primaryColor}40`, borderWidth: 1 }}>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total:</span>
                    <span className="text-xl font-bold" style={{ color: primaryColor }}>
                      R$ {calculateTotalPrice()?.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                  {selectedService.price_type === 'per_person' && spots > 1 && (
                    <p className="text-sm text-muted-foreground text-right">
                      {spots} x R$ {(selectedService.price_cents / 100).toFixed(2).replace(".", ",")}
                    </p>
                  )}
                  {requiresPayment && selectedService.payment_type === 'deposit' && (
                    <p className="text-sm text-blue-600 mt-1">
                      {getPaymentLabel()}: R$ {calculatePaymentAmount()?.toFixed(2).replace(".", ",")}
                    </p>
                  )}
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
                <Label htmlFor="clientPhone">Telefone / WhatsApp *</Label>
                <Input
                  id="clientPhone"
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  required={requiresPayment}
                />
              </div>

              {requiresPayment && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="clientEmail">E-mail</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="seu@email.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clientCpfCnpj">CPF</Label>
                    <Input
                      id="clientCpfCnpj"
                      value={clientCpfCnpj}
                      onChange={(e) => setClientCpfCnpj(e.target.value)}
                      placeholder="000.000.000-00"
                    />
                    <p className="text-xs text-muted-foreground">Necessário para emissão de cobrança</p>
                  </div>
                </>
              )}

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
                <Button 
                  type="submit"
                  className="flex-1" 
                  disabled={!clientName || (requiresPayment && !clientPhone)}
                  style={{ backgroundColor: primaryColor }}
                >
                  {requiresPayment ? "Ir para pagamento" : "Confirmar agendamento"}
                </Button>
              </div>
            </form>
          )}

          {step === 3 && requiresPayment && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4 space-y-2">
                <p className="font-medium">{selectedService?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedDate && format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                  {selectedTime && ` às ${selectedTime}`}
                </p>
                <div className="pt-2 border-t mt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{getPaymentLabel()}:</span>
                    <span className="text-xl font-bold" style={{ color: primaryColor }}>
                      R$ {calculatePaymentAmount()?.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">Forma de pagamento</Label>
                
                <div
                  className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                    paymentMethod === 'pix' ? "border-emerald-500 bg-emerald-50" : "hover:border-muted-foreground/50"
                  }`}
                  onClick={() => setPaymentMethod('pix')}
                >
                  <RadioGroupItem value="pix" checked={paymentMethod === 'pix'} />
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100">
                    <QrCode className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <Label className="font-medium cursor-pointer">PIX</Label>
                    <p className="text-xs text-muted-foreground">Pagamento instantâneo</p>
                  </div>
                </div>

                <div
                  className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                    paymentMethod === 'credit_card' ? "border-blue-500 bg-blue-50" : "hover:border-muted-foreground/50"
                  }`}
                  onClick={() => setPaymentMethod('credit_card')}
                >
                  <RadioGroupItem value="credit_card" checked={paymentMethod === 'credit_card'} />
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <Label className="font-medium cursor-pointer">Cartão de Crédito</Label>
                    <p className="text-xs text-muted-foreground">Visa, Mastercard, Elo...</p>
                  </div>
                </div>

                <div
                  className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                    paymentMethod === 'boleto' ? "border-amber-500 bg-amber-50" : "hover:border-muted-foreground/50"
                  }`}
                  onClick={() => setPaymentMethod('boleto')}
                >
                  <RadioGroupItem value="boleto" checked={paymentMethod === 'boleto'} />
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
                    <Landmark className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <Label className="font-medium cursor-pointer">Boleto Bancário</Label>
                    <p className="text-xs text-muted-foreground">Compensação em até 3 dias úteis</p>
                  </div>
                </div>
              </div>

              {error && <p className="text-sm text-destructive text-center">{error}</p>}

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setStep(2)}>
                  Voltar
                </Button>
                <Button 
                  className="flex-1"
                  disabled={submitting}
                  style={{ backgroundColor: primaryColor }}
                  onClick={handlePayment}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    `Pagar R$ ${calculatePaymentAmount()?.toFixed(2).replace(".", ",")}`
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === 4 && paymentResult && (
            <div className="space-y-4">
              <div className="text-center">
                <div 
                  className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${primaryColor}20` }}
                >
                  <CheckCircle className="h-8 w-8" style={{ color: primaryColor }} />
                </div>
                <h2 className="text-xl font-bold">Pagamento gerado!</h2>
                <p className="text-muted-foreground">Finalize o pagamento para confirmar seu agendamento</p>
              </div>

              {paymentResult.billingType === 'PIX' && paymentResult.qrCode && (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="bg-white p-4 rounded-lg">
                      <img 
                        src={`data:image/png;base64,${paymentResult.qrCode.encodedImage}`} 
                        alt="QR Code PIX" 
                        className="w-48 h-48"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Código PIX copia e cola:</Label>
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-xs break-all font-mono">{paymentResult.qrCode.payload}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={copyPixCode}
                    >
                      {copiedPix ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copiar código
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {paymentResult.billingType === 'BOLETO' && (
                <div className="text-center space-y-3">
                  <p className="text-sm text-muted-foreground">Um boleto foi gerado para seu e-mail.</p>
                  {paymentResult.bankSlipUrl && (
                    <Button 
                      className="w-full"
                      style={{ backgroundColor: primaryColor }}
                      onClick={() => window.open(paymentResult.bankSlipUrl, '_blank')}
                    >
                      Abrir boleto
                    </Button>
                  )}
                </div>
              )}

              {paymentResult.billingType === 'CREDIT_CARD' && (
                <div className="text-center space-y-3">
                  <p className="text-sm text-muted-foreground">Você será redirecionado para a página de pagamento.</p>
                  {paymentResult.invoiceUrl && (
                    <Button 
                      className="w-full"
                      style={{ backgroundColor: primaryColor }}
                      onClick={() => window.open(paymentResult.invoiceUrl, '_blank')}
                    >
                      Pagar com cartão
                    </Button>
                  )}
                </div>
              )}

              <div className="rounded-lg bg-muted p-4 space-y-1 text-sm">
                <p className="font-medium">Resumo do agendamento:</p>
                <p>{selectedService?.name}</p>
                <p className="text-muted-foreground">
                  {selectedDate && format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                  {selectedTime && ` às ${selectedTime}`}
                </p>
                {spots > 1 && <p className="text-muted-foreground">{spots} pessoas</p>}
                <p className="font-semibold pt-2">Valor: R$ {paymentResult.value.toFixed(2).replace(".", ",")}</p>
              </div>

              {selectedService?.meeting_point && (
                <div className="rounded-lg bg-muted p-3 space-y-1">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Local de encontro:
                  </p>
                  <p className="text-sm">{selectedService.meeting_point}</p>
                </div>
              )}
            </div>
          )}

          {!requiresPayment && step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="rounded-lg bg-muted p-4 space-y-1">
                <p className="font-medium">{selectedService?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedDate && format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                  {selectedTime && ` às ${selectedTime}`}
                </p>
              </div>

              {selectedService && selectedService.capacity > 1 && (
                <div className="space-y-2">
                  <Label htmlFor="spots">Número de pessoas</Label>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSpots(Math.max(1, spots - 1))}
                      disabled={spots <= 1}
                    >
                      -
                    </Button>
                    <span className="text-lg font-medium w-8 text-center">{spots}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSpots(Math.min(availableSpots, spots + 1))}
                      disabled={spots >= availableSpots}
                    >
                      +
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      ({availableSpots} disponíveis)
                    </span>
                  </div>
                </div>
              )}

              {selectedService?.meeting_point && (
                <div className="rounded-lg bg-muted p-3 space-y-1">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Local de encontro:
                  </p>
                  <p className="text-sm">{selectedService.meeting_point}</p>
                  {selectedService.meeting_instructions && (
                    <p className="text-sm text-muted-foreground">{selectedService.meeting_instructions}</p>
                  )}
                </div>
              )}

              {error && <p className="text-sm text-destructive text-center">{error}</p>}

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

              {selectedService && selectedService.price_cents !== null && (
                <div className="rounded-lg p-3" style={{ backgroundColor: `${primaryColor}15`, borderColor: `${primaryColor}40`, borderWidth: 1 }}>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total:</span>
                    <span className="text-xl font-bold" style={{ color: primaryColor }}>
                      R$ {calculateTotalPrice()?.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                  {selectedService.price_type === 'per_person' && spots > 1 && (
                    <p className="text-sm text-muted-foreground text-right">
                      {spots} x R$ {(selectedService.price_cents / 100).toFixed(2).replace(".", ",")}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">Pagar no local</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  Voltar
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1" 
                  disabled={submitting || !clientName}
                  style={{ backgroundColor: primaryColor }}
                >
                  {submitting ? "Agendando..." : "Confirmar agendamento"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}