"use client"

import { useState, useEffect, useCallback } from "react"
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, startOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { AppointmentRow, TimeBlockRow, ServiceOption, ClientOption, WorkingHoursRow } from "@/app/(app)/agenda/page"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Plus, Ban } from "lucide-react"
import { WeekView } from "./week-view"
import { NewAppointmentDialog } from "./new-appointment-dialog"
import { AppointmentDetailSheet } from "./appointment-detail-sheet"
import { TimeBlockDialog } from "./time-block-dialog"
import useSWR from "swr"

interface AgendaViewProps {
  businessId: string
  services: ServiceOption[]
  clients: ClientOption[]
  workingHours: WorkingHoursRow[]
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function AgendaView({ businessId, services, clients, workingHours }: AgendaViewProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [viewMode, setViewMode] = useState<"week" | "day">("week")
  const [newApptOpen, setNewApptOpen] = useState(false)
  const [newApptDefaults, setNewApptDefaults] = useState<{ date?: string; time?: string }>({})
  const [selectedAppt, setSelectedAppt] = useState<AppointmentRow | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [timeBlockOpen, setTimeBlockOpen] = useState(false)
  const [timeBlockDefaults, setTimeBlockDefaults] = useState<{ date?: string; time?: string }>({})

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekEnd = addDays(weekStart, 6)

  const { data, mutate } = useSWR(
    `/api/appointments?start=${weekStart.toISOString()}&end=${addDays(weekEnd, 1).toISOString()}`,
    fetcher,
    { refreshInterval: 30000 }
  )

  const appointments: AppointmentRow[] = data?.appointments || []
  const timeBlocks: TimeBlockRow[] = data?.timeBlocks || []

  const goToday = () => setCurrentDate(new Date())
  const goPrev = () => setCurrentDate((d) => viewMode === "week" ? subWeeks(d, 1) : addDays(d, -1))
  const goNext = () => setCurrentDate((d) => viewMode === "week" ? addWeeks(d, 1) : addDays(d, 1))

  const handleSlotClick = useCallback((date: string, time: string) => {
    setNewApptDefaults({ date, time })
    setNewApptOpen(true)
  }, [])

  const handleAppointmentClick = useCallback((appt: AppointmentRow) => {
    setSelectedAppt(appt)
    setDetailOpen(true)
  }, [])

  const handleSuccess = useCallback(() => {
    mutate()
  }, [mutate])

  // Get visible days based on view mode
  const visibleDays = viewMode === "week"
    ? Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
    : [startOfDay(currentDate)]

  const dateLabel = viewMode === "week"
    ? `${format(weekStart, "d MMM", { locale: ptBR })} - ${format(weekEnd, "d MMM yyyy", { locale: ptBR })}`
    : format(currentDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-balance">Agenda</h1>
          <p className="text-sm text-muted-foreground capitalize">{dateLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-md border">
            <Button variant="ghost" size="sm" onClick={goPrev} className="rounded-r-none">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={goToday} className="rounded-none border-x px-3 text-xs">
              Hoje
            </Button>
            <Button variant="ghost" size="sm" onClick={goNext} className="rounded-l-none">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center rounded-md border">
            <Button
              variant={viewMode === "day" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("day")}
              className="rounded-r-none text-xs"
            >
              Dia
            </Button>
            <Button
              variant={viewMode === "week" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("week")}
              className="rounded-l-none text-xs"
            >
              Semana
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setTimeBlockDefaults({})
              setTimeBlockOpen(true)
            }}
          >
            <Ban className="mr-1 h-4 w-4" /> Bloquear
          </Button>
          <Button size="sm" onClick={() => { setNewApptDefaults({}); setNewApptOpen(true) }}>
            <Plus className="mr-1 h-4 w-4" /> Agendar
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <WeekView
        days={visibleDays}
        appointments={appointments}
        timeBlocks={timeBlocks}
        workingHours={workingHours}
        onSlotClick={handleSlotClick}
        onAppointmentClick={handleAppointmentClick}
        viewMode={viewMode}
      />

      {/* Dialogs */}
      <NewAppointmentDialog
        open={newApptOpen}
        onOpenChange={setNewApptOpen}
        services={services}
        clients={clients}
        defaults={newApptDefaults}
        onSuccess={handleSuccess}
      />
      <AppointmentDetailSheet
        open={detailOpen}
        onOpenChange={setDetailOpen}
        appointment={selectedAppt}
        onSuccess={handleSuccess}
      />
      <TimeBlockDialog
        open={timeBlockOpen}
        onOpenChange={setTimeBlockOpen}
        defaults={timeBlockDefaults}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
