"use client"

import { useActionState, useState } from "react"
import { updateWorkingHours } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

interface WorkingHoursFormProps {
  workingHours: { day_of_week: number; start_time: string; end_time: string; is_active: boolean }[]
}

export function WorkingHoursForm({ workingHours }: WorkingHoursFormProps) {
  const [hours, setHours] = useState(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const wh = workingHours.find((w) => w.day_of_week === i)
      return {
        active: wh?.is_active ?? false,
        start: wh?.start_time?.substring(0, 5) ?? "09:00",
        end: wh?.end_time?.substring(0, 5) ?? "18:00",
      }
    })
  })

  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      hours.forEach((h, i) => {
        if (h.active) formData.append(`day_${i}_active`, "on")
        formData.append(`day_${i}_start`, h.start)
        formData.append(`day_${i}_end`, h.end)
      })
      const result = await updateWorkingHours(formData)
      if (result?.success) {
        toast.success("Horários atualizados")
      }
      return result
    },
    null
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Horário de funcionamento</CardTitle>
        <CardDescription>Defina os dias e horários em que você atende.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          {state?.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}
          <div className="flex flex-col gap-3">
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
          </div>
          <Button type="submit" className="w-full sm:w-fit" disabled={isPending}>
            {isPending ? "Salvando..." : "Salvar horários"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}