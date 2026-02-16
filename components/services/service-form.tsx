"use client"

import { useActionState } from "react"
import type { ServiceRow } from "@/lib/types"
import { createService, updateService } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"

interface ServiceFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  service: ServiceRow | null
  colors: string[]
}

export function ServiceForm({ open, onOpenChange, service, colors }: ServiceFormProps) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
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
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="service-price">Preço (R$)</Label>
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
              <Label htmlFor="service-price-type">Tipo de preço</Label>
              <select
                id="service-price-type"
                name="price_type"
                defaultValue={service?.price_type || "total"}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="total">Valor total</option>
                <option value="per_person">Por pessoa</option>
              </select>
            </div>
          </div>
          
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
          
          <div className="flex flex-col gap-2">
            <Label>Cor</Label>
            <div className="flex gap-2">
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
                    className="h-6 w-6 rounded-full ring-2 ring-transparent peer-checked:ring-ring peer-checked:ring-offset-2"
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
