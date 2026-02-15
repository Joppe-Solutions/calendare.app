import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { addMinutes } from "date-fns"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { slug, serviceId, clientName, clientPhone, date, time, notes } = body

  if (!slug || !serviceId || !clientName || !date || !time) {
    return NextResponse.json({ error: "Preencha todos os campos obrigatórios." }, { status: 400 })
  }

  // Get business
  const businesses = await sql`SELECT id FROM businesses WHERE slug = ${slug}`
  if (businesses.length === 0) {
    return NextResponse.json({ error: "Negócio não encontrado." }, { status: 404 })
  }
  const businessId = businesses[0].id as string

  // Get service
  const services = await sql`
    SELECT id, duration_minutes FROM services
    WHERE id = ${serviceId} AND business_id = ${businessId} AND is_active = true
  `
  if (services.length === 0) {
    return NextResponse.json({ error: "Serviço não encontrado." }, { status: 404 })
  }
  const duration = services[0].duration_minutes as number

  const startTime = new Date(`${date}T${time}:00`)
  const endTime = addMinutes(startTime, duration)

  // Check for conflicts (race condition check)
  const conflicts = await sql`
    SELECT id FROM appointments
    WHERE business_id = ${businessId}
      AND status != 'cancelled'
      AND start_time < ${endTime.toISOString()}::timestamptz
      AND end_time > ${startTime.toISOString()}::timestamptz
  `
  if (conflicts.length > 0) {
    return NextResponse.json({ error: "Este horário já foi preenchido. Tente outro horário." }, { status: 409 })
  }

  // Find or create client
  let clientId = null
  if (clientPhone) {
    const existingClients = await sql`
      SELECT id FROM clients WHERE business_id = ${businessId} AND phone = ${clientPhone} LIMIT 1
    `
    if (existingClients.length > 0) {
      clientId = existingClients[0].id
    }
  }
  if (!clientId) {
    const newClient = await sql`
      INSERT INTO clients (business_id, name, phone) VALUES (${businessId}, ${clientName}, ${clientPhone || null})
      RETURNING id
    `
    clientId = newClient[0].id
  }

  // Create appointment
  await sql`
    INSERT INTO appointments (business_id, service_id, client_id, client_name, client_phone, start_time, end_time, notes, source)
    VALUES (${businessId}, ${serviceId}, ${clientId}, ${clientName}, ${clientPhone || null}, ${startTime.toISOString()}, ${endTime.toISOString()}, ${notes || null}, 'online')
  `

  return NextResponse.json({ success: true })
}
