import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { slug, serviceId, clientName, clientPhone, date, time, notes, spots = 1 } = body

    if (!slug || !serviceId || !clientName || !date || !time) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const businesses = await sql`
      SELECT id FROM businesses WHERE slug = ${slug}
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

    const [hours, mins] = time.split(":").map(Number)
    const startTime = new Date(`${date}T${time}:00`)
    const endTime = new Date(startTime.getTime() + durationMinutes * 60000)

    const existingBookings = await sql`
      SELECT COALESCE(SUM(spots), 0) as total_spots
      FROM appointments
      WHERE business_id = ${business.id}
        AND service_id = ${serviceId}
        AND status != 'cancelled'
        AND start_time < ${endTime.toISOString()}::timestamptz
        AND end_time > ${startTime.toISOString()}::timestamptz
    `

    const bookedSpots = existingBookings[0]?.total_spots as number || 0
    
    if (bookedSpots + spots > capacity) {
      const availableSpots = capacity - bookedSpots
      return NextResponse.json({ 
        error: `Apenas ${availableSpots} vaga(s) disponível(is).` 
      }, { status: 400 })
    }

    let clientId = null
    if (clientPhone) {
      const existingClients = await sql`
        SELECT id FROM clients
        WHERE business_id = ${business.id} AND phone = ${clientPhone}
        LIMIT 1
      `
      if (existingClients.length > 0) {
        clientId = existingClients[0].id
      }
    }

    if (!clientId) {
      const newClient = await sql`
        INSERT INTO clients (business_id, name, phone)
        VALUES (${business.id}, ${clientName}, ${clientPhone || null})
        RETURNING id
      `
      clientId = newClient[0].id
    }

    await sql`
      INSERT INTO appointments (
        business_id, service_id, client_id, client_name, client_phone,
        start_time, end_time, notes, spots, source
      )
      VALUES (
        ${business.id}, ${serviceId}, ${clientId}, ${clientName}, ${clientPhone || null},
        ${startTime.toISOString()}::timestamptz, ${endTime.toISOString()}::timestamptz, 
        ${notes || null}, ${spots}, 'public'
      )
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Book error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
