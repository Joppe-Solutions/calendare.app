"use client"

import { useActionState, useState, useEffect } from "react"
import { format } from "date-fns"
import { createTimeBlock } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"

interface TimeBlockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaults: { date?: string; time?: string }
  onSuccess: () => void
}

export function TimeBlockDialog({ open, onOpenChange, defaults, onSuccess }: TimeBlockDialogProps) {
  const [date, setDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [allDay, setAllDay] = useState(false)

  useEffect(() => {
    if (open) {
      setDate(defaults.date || format(new Date(), "yyyy-MM-dd"))
      setStartTime(defaults.time || "12:00")
      setEndTime(defaults.time ? `${parseInt(defaults.time.split(":")[0]) + 1}:${defaults.time.split(":")[1]}` : "13:00")
      setAllDay(false)
    }
  }, [open, defaults])

  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      const startDt = new Date(`${date}T${allDay ? "00:00" : startTime}:00`)
      const endDt = new Date(`${date}T${allDay ? "23:59" : endTime}:00`)

      formData.set("start_time", startDt.toISOString())
      formData.set("end_time", endDt.toISOString())

      const result = await createTimeBlock(formData)
      if (result?.success) {
        toast.success(allDay ? "Dia bloqueado" : "Horário bloqueado")
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
          <DialogTitle>Bloquear horário</DialogTitle>
          <DialogDescription>
            Bloqueie um período para não receber agendamentos.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          {state?.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="block-title">Motivo *</Label>
            <Input
              id="block-title"
              name="title"
              placeholder="Ex: Almoço, Compromisso pessoal"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Data *</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          
          <div className="flex items-center justify-between py-2">
            <Label htmlFor="all-day" className="cursor-pointer">Bloquear o dia todo</Label>
            <Switch
              id="all-day"
              checked={allDay}
              onCheckedChange={setAllDay}
            />
          </div>

          {!allDay && (
            <div className="flex gap-3">
              <div className="flex flex-1 flex-col gap-2">
                <Label>Início *</Label>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <Label>Fim *</Label>
                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Bloqueando..." : "Bloquear"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}