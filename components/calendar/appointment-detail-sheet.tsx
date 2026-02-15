"use client"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { AppointmentRow } from "@/app/(app)/agenda/page"
import { updateAppointmentStatus, deleteAppointment } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Clock, User, Phone, FileText, CheckCircle, XCircle, AlertCircle, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface AppointmentDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment: AppointmentRow | null
  onSuccess: () => void
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  confirmed: { label: "Confirmado", variant: "default" },
  completed: { label: "Concluído", variant: "secondary" },
  cancelled: { label: "Cancelado", variant: "destructive" },
  no_show: { label: "Não compareceu", variant: "outline" },
}

export function AppointmentDetailSheet({ open, onOpenChange, appointment, onSuccess }: AppointmentDetailSheetProps) {
  if (!appointment) return null

  const status = STATUS_MAP[appointment.status] || STATUS_MAP.confirmed

  async function handleStatusChange(newStatus: string) {
    await updateAppointmentStatus(appointment!.id, newStatus)
    toast.success(`Status alterado para: ${STATUS_MAP[newStatus]?.label || newStatus}`)
    onSuccess()
    onOpenChange(false)
  }

  async function handleDelete() {
    await deleteAppointment(appointment!.id)
    toast.success("Agendamento removido")
    onSuccess()
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Detalhes do agendamento</SheetTitle>
          <SheetDescription>
            {format(new Date(appointment.start_time), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 py-4">
          {/* Status */}
          <Badge variant={status.variant} className="w-fit">
            {status.label}
          </Badge>

          {/* Service */}
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 rounded-full" style={{ backgroundColor: appointment.service_color }} />
            <div>
              <p className="font-semibold">{appointment.service_name}</p>
              <p className="text-sm text-muted-foreground">{appointment.service_duration} minutos</p>
            </div>
          </div>

          <Separator />

          {/* Time */}
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>
              {format(new Date(appointment.start_time), "HH:mm")} - {format(new Date(appointment.end_time), "HH:mm")}
            </span>
          </div>

          {/* Client */}
          <div className="flex items-center gap-3">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{appointment.client_name}</span>
          </div>

          {appointment.client_phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{appointment.client_phone}</span>
            </div>
          )}

          {appointment.notes && (
            <div className="flex items-start gap-3">
              <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{appointment.notes}</span>
            </div>
          )}

          {appointment.source === "online" && (
            <Badge variant="outline" className="w-fit">Agendamento online</Badge>
          )}

          <Separator />

          {/* Actions */}
          {appointment.status === "confirmed" && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-muted-foreground">Alterar status:</p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => handleStatusChange("completed")}>
                  <CheckCircle className="mr-1 h-4 w-4" /> Concluído
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleStatusChange("no_show")}>
                  <AlertCircle className="mr-1 h-4 w-4" /> Não compareceu
                </Button>
                <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleStatusChange("cancelled")}>
                  <XCircle className="mr-1 h-4 w-4" /> Cancelar
                </Button>
              </div>
            </div>
          )}

          <Button variant="destructive" size="sm" className="w-fit" onClick={handleDelete}>
            <Trash2 className="mr-1 h-4 w-4" /> Excluir agendamento
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
