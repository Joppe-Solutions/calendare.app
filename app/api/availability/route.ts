import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { addMinutes, format, parse, startOfDay, endOfDay } from "date-fns"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const slug = searchParams.get("slug")
  const date = searchParams.get("date") // yyyy-MM-dd
  const serviceId = searchParams.get("service_id")

  if (!slug || !date || !serviceId) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 })
  }

  // Get business
  const businesses = await sql`SELECT id FROM businesses WHERE slug = ${slug}`
  if (businesses.length === 0) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 })
  }
  const businessId = businesses[0].id as string

  // Get service duration
  const services = await sql`
    SELECT duration_minutes FROM services WHERE id = ${serviceId} AND business_id = ${businessId} AND is_active = true
  `
  if (services.length === 0) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 })
  }
  const duration = services[0].duration_minutes as number

  // Get working hours for the day
  const dayOfWeek = new Date(`${date}T12:00:00`).getDay()
  const workingHours = await sql`
    SELECT start_time, end_time, is_active FROM working_hours
    WHERE business_id = ${businessId} AND day_of_week = ${dayOfWeek}
  `

  if (workingHours.length === 0 || !workingHours[0].is_active) {
    return NextResponse.json({ slots: [] })
  }

  const whStart = workingHours[0].start_time as string
  const whEnd = workingHours[0].end_time as string

  // Get existing appointments for the day
  const dayStart = startOfDay(new Date(`${date}T12:00:00`)).toISOString()
  const dayEnd = endOfDay(new Date(`${date}T12:00:00`)).toISOString()

  const [appointments, timeBlocks] = await Promise.all([
    sql`
      SELECT start_time, end_time FROM appointments
      WHERE business_id = ${businessId} AND status != 'cancelled'
        AND start_time >= ${dayStart}::timestamptz AND start_time <= ${dayEnd}::timestamptz
    `,
    sql`
      SELECT start_time, end_time FROM time_blocks
      WHERE business_id = ${businessId}
        AND start_time >= ${dayStart}::timestamptz AND start_time <= ${dayEnd}::timestamptz
    `,
  ])

  // Generate available slots in 15-minute increments
  const slots: string[] = []
  const workStart = parse(`${date} ${whStart.substring(0, 5)}`, "yyyy-MM-dd HH:mm", new Date())
  const workEnd = parse(`${date} ${whEnd.substring(0, 5)}`, "yyyy-MM-dd HH:mm", new Date())

  let current = workStart
  while (addMinutes(current, duration) <= workEnd) {
    const slotEnd = addMinutes(current, duration)

    // Check for conflicts
    const hasConflict = [...appointments, ...timeBlocks].some((item) => {
      const itemStart = new Date(item.start_time as string)
      const itemEnd = new Date(item.end_time as string)
      return current < itemEnd && slotEnd > itemStart
    })

    // Only show future slots for today
    const now = new Date()
    const isPast = current < now

    if (!hasConflict && !isPast) {
      slots.push(format(current, "HH:mm"))
    }

    current = addMinutes(current, 15)
  }

  return NextResponse.json({ slots })
}
