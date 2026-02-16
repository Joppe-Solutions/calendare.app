import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const slug = searchParams.get("slug")
  const date = searchParams.get("date")
  const serviceId = searchParams.get("service_id")

  if (!slug || !date || !serviceId) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 })
  }

  const businesses = await sql`
    SELECT id, timezone FROM businesses WHERE slug = ${slug}
  `
  if (businesses.length === 0) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 })
  }

  const business = businesses[0]

  const serviceRows = await sql`
    SELECT id, duration_minutes, capacity FROM services 
    WHERE id = ${serviceId} AND business_id = ${business.id} AND is_active = true
  `
  if (serviceRows.length === 0) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 })
  }

  const service = serviceRows[0]
  const durationMinutes = service.duration_minutes as number
  const capacity = (service.capacity as number) || 1

  const dayOfWeek = new Date(date + "T12:00:00").getDay()

  const workingHours = await sql`
    SELECT start_time, end_time, is_active 
    FROM working_hours 
    WHERE business_id = ${business.id} AND day_of_week = ${dayOfWeek}
  `

  if (workingHours.length === 0 || !workingHours[0].is_active) {
    return NextResponse.json({ slots: [] })
  }

  const wh = workingHours[0]
  const [startHour, startMin] = (wh.start_time as string).split(":").map(Number)
  const [endHour, endMin] = (wh.end_time as string).split(":").map(Number)

  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin

  const slots: string[] = []
  const slotDuration = 15

  const startOfDay = new Date(`${date}T00:00:00`)
  const endOfDay = new Date(`${date}T23:59:59`)

  const appointments = await sql`
    SELECT start_time, end_time, spots
    FROM appointments
    WHERE business_id = ${business.id}
      AND service_id = ${serviceId}
      AND status != 'cancelled'
      AND start_time >= ${startOfDay.toISOString()}::timestamptz
      AND end_time <= ${endOfDay.toISOString()}::timestamptz
  `

  const timeBlocks = await sql`
    SELECT start_time, end_time
    FROM time_blocks
    WHERE business_id = ${business.id}
      AND start_time >= ${startOfDay.toISOString()}::timestamptz
      AND end_time <= ${endOfDay.toISOString()}::timestamptz
  `

  function getBookedSpots(time: number): number {
    let total = 0
    for (const appt of appointments) {
      const apptStart = new Date(appt.start_time as string)
      const apptEnd = new Date(appt.end_time as string)
      
      const apptStartMin = apptStart.getHours() * 60 + apptStart.getMinutes()
      const apptEndMin = apptEnd.getHours() * 60 + apptEnd.getMinutes()
      
      const slotEnd = time + durationMinutes
      
      if (time < apptEndMin && slotEnd > apptStartMin) {
        total += (appt.spots as number) || 1
      }
    }
    return total
  }

  function isBlocked(time: number): boolean {
    for (const block of timeBlocks) {
      const blockStart = new Date(block.start_time as string)
      const blockEnd = new Date(block.end_time as string)
      
      const blockStartMin = blockStart.getHours() * 60 + blockStart.getMinutes()
      const blockEndMin = blockEnd.getHours() * 60 + blockEnd.getMinutes()
      
      const slotEnd = time + durationMinutes
      
      if (time < blockEndMin && slotEnd > blockStartMin) {
        return true
      }
    }
    return false
  }

  for (let time = startMinutes; time + durationMinutes <= endMinutes; time += slotDuration) {
    if (isBlocked(time)) continue
    
    const bookedSpots = getBookedSpots(time)
    
    if (bookedSpots < capacity) {
      const hours = Math.floor(time / 60)
      const mins = time % 60
      slots.push(`${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`)
    }
  }

  return NextResponse.json({ 
    slots,
    capacity,
    availableSpots: capacity - (appointments.length > 0 ? appointments.reduce((sum, a) => sum + ((a.spots as number) || 1), 0) : 0)
  })
}
