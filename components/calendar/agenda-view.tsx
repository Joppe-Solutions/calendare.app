"use client"

import { useState, useEffect, useCallback } from "react"
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, startOfDay, isToday, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { AppointmentRow, TimeBlockRow, ServiceOption, ClientOption, WorkingHoursRow } from "@/app/(app)/agenda/page"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Ban, CalendarDays, Clock, Users, ChevronLeft, ChevronRight } from "lucide-react"
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

function formatTime(isoString: string) {
  return format(parseISO(isoString), "HH:mm")
}

export function AgendaView({ businessId, services, clients, workingHours }: AgendaViewProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [viewMode, setViewMode] = useState<"week" | "day">("day")
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

  const goPrev = () => setCurrentDate((d) => viewMode === "week" ? subWeeks(d, 1) : addDays(d, -1))
  const goNext = () => setCurrentDate((d) => viewMode === "week" ? addWeeks(d, 1) : addDays(d, 1))
  const goToday = () => setCurrentDate(new Date())

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

  const visibleDays = viewMode === "week"
    ? Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
    : [startOfDay(currentDate)]

  const dateLabel = format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR })

  const todayAppts = appointments.filter(a => 
    isSameDay(parseISO(a.start_time), currentDate) && a.status !== "cancelled"
  ).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <div className="flex flex-col gap-4">
      {/* Desktop Header */}
      <div className="hidden md:flex md:items-center md:justify-between">
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
            <Button variant={viewMode === "day" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("day")} className="rounded-r-none text-xs">Dia</Button>
            <Button variant={viewMode === "week" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("week")} className="rounded-l-none text-xs">Semana</Button>
          </div>
          <Button variant="outline" size="sm" onClick={() => { setTimeBlockDefaults({}); setTimeBlockOpen(true) }}>
            <Ban className="mr-1 h-4 w-4" /> Bloquear
          </Button>
          <Button size="sm" onClick={() => { setNewApptDefaults({}); setNewApptOpen(true) }}>
            <Plus className="mr-1 h-4 w-4" /> Agendar
          </Button>
        </div>
      </div>

      {/* Mobile Week Strip */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goPrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={goToday} className="text-xs">
              Hoje
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => { setTimeBlockDefaults({}); setTimeBlockOpen(true) }}>
              <Ban className="h-4 w-4" />
            </Button>
            <Button size="icon" className="h-8 w-8" onClick={() => { setNewApptDefaults({ date: format(currentDate, "yyyy-MM-dd") }); setNewApptOpen(true) }}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Week days selector */}
        <div className="grid grid-cols-7 gap-1 mb-3">
          {weekDays.map((day) => {
            const isSelected = isSameDay(day, currentDate)
            const isTodayDate = isToday(day)
            const dayAppts = appointments.filter(a => 
              isSameDay(parseISO(a.start_time), day) && a.status !== "cancelled"
            )
            
            return (
              <button
                key={day.toISOString()}
                onClick={() => setCurrentDate(day)}
                className={`flex flex-col items-center justify-center rounded-xl py-2 transition-colors ${
                  isSelected 
                    ? "bg-primary text-primary-foreground" 
                    : isTodayDate 
                      ? "bg-primary/10 text-primary font-medium" 
                      : "bg-muted hover:bg-muted/80"
                }`}
              >
                <span className="text-[10px] uppercase font-medium">
                  {format(day, "EEE", { locale: ptBR })}
                </span>
                <span className="text-base font-bold">
                  {format(day, "d")}
                </span>
                {dayAppts.length > 0 && (
                  <span className={`text-[10px] ${isSelected ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {dayAppts.length}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Current date label */}
        <p className="text-sm text-muted-foreground capitalize mb-3">{dateLabel}</p>
      </div>

      {/* Mobile Day View - Timeline */}
      <div className="md:hidden">
        {todayAppts.length > 0 ? (
          <div className="space-y-1">
            {todayAppts.map((appt) => (
              <Card 
                key={appt.id} 
                className="overflow-hidden cursor-pointer active:scale-[0.99] transition-transform border-l-4"
                style={{ borderLeftColor: appt.service_color }}
                onClick={() => handleAppointmentClick(appt)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="text-center w-14 shrink-0">
                      <p className="text-lg font-bold leading-none">{formatTime(appt.start_time)}</p>
                      <p className="text-xs text-muted-foreground">{formatTime(appt.end_time)}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{appt.client_name}</p>
                      <p className="text-sm text-muted-foreground truncate">{appt.service_name}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {appt.spots > 1 && (
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                          <Users className="h-3 w-3" />{appt.spots}
                        </span>
                      )}
                      <Badge 
                        variant={
                          appt.status === 'completed' ? 'default' :
                          appt.status === 'confirmed' ? 'secondary' :
                          appt.status === 'cancelled' ? 'destructive' : 'outline'
                        }
                        className="text-[10px] px-2"
                      >
                        {appt.status === 'scheduled' && 'Agendado'}
                        {appt.status === 'confirmed' && 'Confirmado'}
                        {appt.status === 'completed' && 'Concluído'}
                        {appt.status === 'cancelled' && 'Cancelado'}
                        {appt.status === 'no_show' && 'Falta'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CalendarDays className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground mb-1">Nenhum agendamento neste dia</p>
              <Button 
                variant="link" 
                className="mt-1"
                onClick={() => { 
                  setNewApptDefaults({ date: format(currentDate, "yyyy-MM-dd") }); 
                  setNewApptOpen(true); 
                }}
              >
                <Plus className="h-4 w-4 mr-1" /> Criar agendamento
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Desktop Calendar Grid */}
      <div className="hidden md:block">
        <WeekView
          days={visibleDays}
          appointments={appointments}
          timeBlocks={timeBlocks}
          workingHours={workingHours}
          onSlotClick={handleSlotClick}
          onAppointmentClick={handleAppointmentClick}
          viewMode={viewMode}
        />
      </div>

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