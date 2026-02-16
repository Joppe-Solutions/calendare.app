"use client"

import { useActionState, useState, useRef } from "react"
import type { ServiceRow } from "@/lib/types"
import { createService, updateService } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Image as ImageIcon, X, Loader2, Upload } from "lucide-react"

interface ServiceFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  service: ServiceRow | null
  colors: string[]
}

export function ServiceForm({ open, onOpenChange, service, colors }: ServiceFormProps) {
  const [coverUrl, setCoverUrl] = useState(service?.cover_image_url || null)
  const [uploadingCover, setUploadingCover] = useState(false)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const [priceType, setPriceType] = useState(service?.price_type || "total")
  const [paymentType, setPaymentType] = useState(service?.payment_type || "on_site")
  const [depositPercentage, setDepositPercentage] = useState(service?.deposit_percentage || 0)

  const handleUploadCover = async (file: File) => {
    setUploadingCover(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", "cover")

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")

      setCoverUrl(data.url)
      toast.success("Imagem enviada!")
    } catch (error) {
      toast.error("Erro ao enviar imagem")
    } finally {
      setUploadingCover(false)
    }
  }

  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      formData.set("cover_image_url", coverUrl || "")
      formData.set("price_type", priceType)
      formData.set("payment_type", paymentType)
      formData.set("deposit_percentage", depositPercentage.toString())
      
      let result
      if (service) {
        formData.append("id", service.id)
        result = await updateService(formData)
      } else {
        result = await createService(formData)
      }
      if (result?.success) {
        toast.success(service ? "Serviço atualizado" : "Serviço criado")
        onOpenChange(false)
      }
      return result
    },
    null
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{service ? "Editar serviço" : "Novo serviço"}</DialogTitle>
          <DialogDescription>
            {service ? "Atualize as informações do serviço." : "Preencha as informações do novo serviço."}
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          {state?.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}

          {/* Cover Image */}
          <div className="flex flex-col gap-2">
            <Label>Imagem de capa</Label>
            {coverUrl ? (
              <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                <img src={coverUrl} alt="Capa" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setCoverUrl(null)}
                  className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="w-full h-32 rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                disabled={uploadingCover}
              >
                {uploadingCover ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <>
                    <Upload className="h-6 w-6 mb-1" />
                    <span className="text-sm">Adicionar imagem</span>
                  </>
                )}
              </button>
            )}
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleUploadCover(file)
              }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="service-name">Nome *</Label>
            <Input
              id="service-name"
              name="name"
              defaultValue={service?.name || ""}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="service-description">Descrição</Label>
            <Textarea
              id="service-description"
              name="description"
              defaultValue={service?.description || ""}
              placeholder="Descreva o serviço..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="service-duration">Duração (min)</Label>
              <Input
                id="service-duration"
                name="duration_minutes"
                type="number"
                min="5"
                step="5"
                defaultValue={service?.duration_minutes || 60}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="service-capacity">Capacidade (vagas)</Label>
              <Input
                id="service-capacity"
                name="capacity"
                type="number"
                min="1"
                defaultValue={service?.capacity || 1}
              />
            </div>
          </div>

          {/* Pricing Section */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h4 className="font-medium text-sm">Preço</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="service-price">Valor (R$)</Label>
                  <Input
                    id="service-price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={service?.price_cents ? (service.price_cents / 100).toFixed(2) : ""}
                    placeholder="0.00"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Tipo de preço</Label>
                  <Select value={priceType} onValueChange={(v) => setPriceType(v as 'total' | 'per_person')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="total">Valor total</SelectItem>
                      <SelectItem value="per_person">Por pessoa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Forma de pagamento</Label>
                <Select value={paymentType} onValueChange={(v) => {
                  setPaymentType(v as typeof paymentType)
                  if (v === 'deposit') {
                    setDepositPercentage(50)
                  } else {
                    setDepositPercentage(0)
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on_site">Pagar no local (fora do sistema)</SelectItem>
                    <SelectItem value="deposit">Sinal antecipado</SelectItem>
                    <SelectItem value="full">Pagamento total antecipado</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {paymentType === "on_site" && "O cliente paga diretamente com você no dia do serviço."}
                  {paymentType === "deposit" && "O cliente paga uma parte ao agendar e o resto no dia do serviço."}
                  {paymentType === "full" && "O cliente paga o valor total ao fazer o agendamento."}
                </p>
              </div>

              {paymentType === 'deposit' && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="deposit-percentage">Percentual do sinal (%)</Label>
                  <Select 
                    value={depositPercentage.toString()} 
                    onValueChange={(v) => setDepositPercentage(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30%</SelectItem>
                      <SelectItem value="40">40%</SelectItem>
                      <SelectItem value="50">50%</SelectItem>
                      <SelectItem value="60">60%</SelectItem>
                      <SelectItem value="70">70%</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    O cliente pagará {depositPercentage}% do valor ao agendar e o restante no local.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location Section */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="service-meeting-point">Local de encontro</Label>
            <Input
              id="service-meeting-point"
              name="meeting_point"
              defaultValue={service?.meeting_point || ""}
              placeholder="Ex: Trapiche do Porto, Rua X, 123"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="service-meeting-instructions">Instruções de como chegar</Label>
            <Textarea
              id="service-meeting-instructions"
              name="meeting_instructions"
              defaultValue={service?.meeting_instructions || ""}
              placeholder="Ex: Estacionamento gratuito ao lado, chegar 15 min antes..."
              rows={2}
            />
          </div>

          {/* Color */}
          <div className="flex flex-col gap-2">
            <Label>Cor do serviço</Label>
            <div className="flex gap-2 flex-wrap">
              {colors.map((color) => (
                <label key={color} className="cursor-pointer">
                  <input
                    type="radio"
                    name="color"
                    value={color}
                    defaultChecked={service?.color === color || (!service && color === colors[0])}
                    className="sr-only peer"
                  />
                  <div
                    className="h-7 w-7 rounded-full ring-2 ring-transparent peer-checked:ring-ring peer-checked:ring-offset-2 transition-all"
                    style={{ backgroundColor: color }}
                  />
                </label>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}