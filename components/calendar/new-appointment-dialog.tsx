"use client"

import { useActionState, useState, useEffect } from "react"
import { format, addMinutes, parse } from "date-fns"
import type { ServiceOption, ClientOption } from "@/app/(app)/agenda/page"
import { createAppointment } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"

interface NewAppointmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  services: ServiceOption[]
  clients: ClientOption[]
  defaults: { date?: string; time?: string }
  onSuccess: () => void
}

export function NewAppointmentDialog({
  open,
  onOpenChange,
  services,
  clients,
  defaults,
  onSuccess,
}: NewAppointmentDialogProps) {
  const [selectedService, setSelectedService] = useState<string>("")
  const [selectedClient, setSelectedClient] = useState<string>("new")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")

  useEffect(() => {
    if (open) {
      setDate(defaults.date || format(new Date(), "yyyy-MM-dd"))
      setTime(defaults.time || format(new Date(), "HH:mm"))
      setSelectedService(services[0]?.id || "")
      setSelectedClient("new")
    }
  }, [open, defaults, services])

  const service = services.find((s) => s.id === selectedService)
  const client = selectedClient !== "new" ? clients.find((c) => c.id === selectedClient) : null

  const endTime = service && date && time
    ? format(addMinutes(parse(`${date} ${time}`, "yyyy-MM-dd HH:mm", new Date()), service.duration_minutes), "HH:mm")
    : ""

  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      // Build proper datetime
      const startDt = new Date(`${date}T${time}:00`)
      const endDt = service ? addMinutes(startDt, service.duration_minutes) : startDt

      formData.set("service_id", selectedService)
      formData.set("start_time", startDt.toISOString())
      formData.set("end_time", endDt.toISOString())

      if (selectedClient !== "new") {
        formData.set("client_id", selectedClient)
        if (client) {
          formData.set("client_name", client.name)
          formData.set("client_phone", client.phone || "")
        }
      }

      const result = await createAppointment(formData)
      if (result?.success) {
        toast.success("Agendamento criado")
        onOpenChange(false)
        onSuccess()
      }
      return result
    },
    null
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo agendamento</DialogTitle>
          <DialogDescription>Preencha os dados para agendar um horário.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          {state?.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}

          {/* Service */}
          <div className="flex flex-col gap-2">
            <Label>Serviço *</Label>
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o serviço" />
              </SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: s.color }} />
                      {s.name} ({s.duration_minutes}min)
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date & Time */}
          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-2">
              <Label>Data *</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <Label>Horário *</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
            </div>
          </div>
          {endTime && (
            <p className="text-xs text-muted-foreground -mt-2">
              Término previsto: {endTime}
            </p>
          )}

          {/* Client */}
          <div className="flex flex-col gap-2">
            <Label>Cliente</Label>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione ou crie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">Novo cliente</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* New client fields */}
          {selectedClient === "new" && (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor="new-client-name">Nome do cliente *</Label>
                <Input id="new-client-name" name="client_name" placeholder="Nome" required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="new-client-phone">Telefone</Label>
                <Input id="new-client-phone" name="client_phone" type="tel" placeholder="(11) 99999-9999" />
              </div>
            </>
          )}

          {/* Notes */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="appt-notes">Observações</Label>
            <Textarea id="appt-notes" name="notes" placeholder="Observações (opcional)" rows={2} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Agendando..." : "Agendar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
