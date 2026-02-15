"use client"

import { useMemo } from "react"
import { format, isSameDay, isToday } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { AppointmentRow, TimeBlockRow, WorkingHoursRow } from "@/app/(app)/agenda/page"
import { ScrollArea } from "@/components/ui/scroll-area"

const HOUR_HEIGHT = 60 // pixels per hour
const START_HOUR = 6
const END_HOUR = 22
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i)

interface WeekViewProps {
  days: Date[]
  appointments: AppointmentRow[]
  timeBlocks: TimeBlockRow[]
  workingHours: WorkingHoursRow[]
  onSlotClick: (date: string, time: string) => void
  onAppointmentClick: (appt: AppointmentRow) => void
  viewMode: "week" | "day"
}

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number)
  return h * 60 + m
}

function getPosition(dateStr: string, startHour: number) {
  const date = new Date(dateStr)
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const totalMinutes = (hours - startHour) * 60 + minutes
  return (totalMinutes / 60) * HOUR_HEIGHT
}

function getHeight(startStr: string, endStr: string) {
  const start = new Date(startStr)
  const end = new Date(endStr)
  const diffMinutes = (end.getTime() - start.getTime()) / 60000
  return (diffMinutes / 60) * HOUR_HEIGHT
}

export function WeekView({
  days,
  appointments,
  timeBlocks,
  workingHours,
  onSlotClick,
  onAppointmentClick,
  viewMode,
}: WeekViewProps) {
  const totalHeight = HOURS.length * HOUR_HEIGHT

  // Build working hours map: day_of_week -> { start, end, active }
  const whMap = useMemo(() => {
    const map = new Map<number, WorkingHoursRow>()
    workingHours.forEach((wh) => map.set(wh.day_of_week, wh))
    return map
  }, [workingHours])

  return (
    <ScrollArea className="rounded-lg border bg-card" style={{ height: "calc(100svh - 230px)" }}>
      <div className="flex min-w-[600px]">
        {/* Time gutter */}
        <div className="sticky left-0 z-10 w-16 shrink-0 border-r bg-card">
          <div className="h-10 border-b" /> {/* Header spacer */}
          <div className="relative" style={{ height: totalHeight }}>
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute left-0 right-0 flex items-start justify-end pr-2"
                style={{ top: (hour - START_HOUR) * HOUR_HEIGHT }}
              >
                <span className="text-xs text-muted-foreground -translate-y-2">
                  {String(hour).padStart(2, "0")}:00
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Day columns */}
        <div className={`flex flex-1 ${viewMode === "day" ? "" : ""}`}>
          {days.map((day) => {
            const dayOfWeek = day.getDay()
            const wh = whMap.get(dayOfWeek)
            const isWorking = wh?.is_active ?? false
            const today = isToday(day)

            // Get appointments for this day
            const dayAppts = appointments.filter((a) =>
              isSameDay(new Date(a.start_time), day) && a.status !== "cancelled"
            )
            const dayBlocks = timeBlocks.filter((b) =>
              isSameDay(new Date(b.start_time), day)
            )

            // Calculate non-working hours overlays
            const workStart = wh ? timeToMinutes(wh.start_time) : 0
            const workEnd = wh ? timeToMinutes(wh.end_time) : 0

            return (
              <div
                key={day.toISOString()}
                className={`flex-1 border-r last:border-r-0 ${viewMode === "day" ? "min-w-0" : "min-w-[100px]"}`}
              >
                {/* Day header */}
                <div
                  className={`sticky top-0 z-10 flex h-10 flex-col items-center justify-center border-b bg-card ${
                    today ? "bg-primary/5" : ""
                  }`}
                >
                  <span className="text-xs text-muted-foreground capitalize">
                    {format(day, "EEE", { locale: ptBR })}
                  </span>
                  <span
                    className={`text-sm font-semibold leading-none ${
                      today ? "flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground" : ""
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                </div>

                {/* Time grid */}
                <div
                  className="relative cursor-pointer"
                  style={{ height: totalHeight }}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const y = e.clientY - rect.top
                    const totalMinutes = START_HOUR * 60 + (y / HOUR_HEIGHT) * 60
                    const hours = Math.floor(totalMinutes / 60)
                    const minutes = Math.round((totalMinutes % 60) / 15) * 15
                    const time = `${String(hours).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`
                    onSlotClick(format(day, "yyyy-MM-dd"), time)
                  }}
                >
                  {/* Hour lines */}
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="absolute left-0 right-0 border-t border-dashed border-border/50"
                      style={{ top: (hour - START_HOUR) * HOUR_HEIGHT }}
                    />
                  ))}

                  {/* Non-working overlay */}
                  {!isWorking && (
                    <div className="absolute inset-0 bg-muted/40" />
                  )}
                  {isWorking && (
                    <>
                      {/* Before work hours */}
                      {workStart > START_HOUR * 60 && (
                        <div
                          className="absolute left-0 right-0 bg-muted/30"
                          style={{
                            top: 0,
                            height: ((workStart - START_HOUR * 60) / 60) * HOUR_HEIGHT,
                          }}
                        />
                      )}
                      {/* After work hours */}
                      {workEnd < END_HOUR * 60 && (
                        <div
                          className="absolute left-0 right-0 bg-muted/30"
                          style={{
                            top: ((workEnd - START_HOUR * 60) / 60) * HOUR_HEIGHT,
                            bottom: 0,
                          }}
                        />
                      )}
                    </>
                  )}

                  {/* Time blocks */}
                  {dayBlocks.map((block) => (
                    <div
                      key={block.id}
                      className="absolute left-1 right-1 z-10 overflow-hidden rounded bg-muted/80 border border-border px-1.5 py-0.5"
                      style={{
                        top: getPosition(block.start_time, START_HOUR),
                        height: Math.max(getHeight(block.start_time, block.end_time), 20),
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-xs font-medium text-muted-foreground truncate block">
                        {block.title}
                      </span>
                    </div>
                  ))}

                  {/* Appointments */}
                  {dayAppts.map((appt) => (
                    <div
                      key={appt.id}
                      className="absolute left-1 right-1 z-20 cursor-pointer overflow-hidden rounded-md border px-2 py-1 shadow-sm transition-shadow hover:shadow-md"
                      style={{
                        top: getPosition(appt.start_time, START_HOUR),
                        height: Math.max(getHeight(appt.start_time, appt.end_time), 24),
                        backgroundColor: `${appt.service_color}18`,
                        borderColor: appt.service_color,
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        onAppointmentClick(appt)
                      }}
                    >
                      <div className="flex flex-col gap-0">
                        <span className="text-xs font-semibold truncate" style={{ color: appt.service_color }}>
                          {appt.client_name}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate">
                          {appt.service_name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </ScrollArea>
  )
}
