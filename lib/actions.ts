"use server"

import { revalidatePath } from "next/cache"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { sql } from "./db"

// ---- Helper to ensure user exists in local DB ----

async function ensureUserExists(userId: string) {
  const existing = await sql`SELECT id FROM users WHERE id = ${userId}`
  
  if (existing.length === 0) {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    
    const email = user.emailAddresses[0]?.emailAddress || ""
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || "Usuário"
    const imageUrl = user.imageUrl

    await sql`
      INSERT INTO users (id, email, name, image_url)
      VALUES (${userId}, ${email}, ${name}, ${imageUrl || null})
      ON CONFLICT (id) DO NOTHING
    `
  }
}

// ---- Onboarding Actions ----

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 50)
}

export async function completeOnboarding(formData: FormData) {
  const { userId } = await auth()
  if (!userId) return { error: "Não autenticado." }

  await ensureUserExists(userId)

  const businessName = (formData.get("businessName") as string)?.trim()
  const phone = (formData.get("phone") as string)?.trim() || null
  const address = (formData.get("address") as string)?.trim() || null

  if (!businessName) {
    return { error: "Informe o nome do seu negócio." }
  }

  let baseSlug = generateSlug(businessName)
  let slug = baseSlug
  let counter = 1
  while (true) {
    const existing = await sql`SELECT id FROM businesses WHERE slug = ${slug}`
    if (existing.length === 0) break
    slug = `${baseSlug}-${counter}`
    counter++
  }

  const businessRows = await sql`
    INSERT INTO businesses (user_id, name, slug, phone, address)
    VALUES (${userId}, ${businessName}, ${slug}, ${phone}, ${address})
    RETURNING id
  `
  const businessId = businessRows[0].id as string

  const daysOfWeek = [0, 1, 2, 3, 4, 5, 6]
  for (const day of daysOfWeek) {
    const isActive = formData.get(`day_${day}_active`) === "on"
    const startTime = formData.get(`day_${day}_start`) as string || "09:00"
    const endTime = formData.get(`day_${day}_end`) as string || "18:00"

    await sql`
      INSERT INTO working_hours (business_id, day_of_week, start_time, end_time, is_active)
      VALUES (${businessId}, ${day}, ${startTime}, ${endTime}, ${isActive})
    `
  }

  const serviceName = (formData.get("serviceName") as string)?.trim()
  if (serviceName) {
    const duration = parseInt(formData.get("serviceDuration") as string) || 60
    const priceCents = formData.get("servicePrice")
      ? Math.round(parseFloat(formData.get("servicePrice") as string) * 100)
      : null
    const capacity = parseInt(formData.get("serviceCapacity") as string) || 1

    await sql`
      INSERT INTO services (business_id, name, duration_minutes, price_cents, capacity)
      VALUES (${businessId}, ${serviceName}, ${duration}, ${priceCents}, ${capacity})
    `
  }

  return { success: true, redirectTo: "/agenda" }
}

// ---- Service Actions ----

export async function createService(formData: FormData) {
  const { userId } = await auth()
  if (!userId) return { error: "Não autenticado." }
  
  const business = await getBusinessForUser(userId)
  if (!business) return { error: "Negócio não encontrado." }

  const name = (formData.get("name") as string)?.trim()
  const description = (formData.get("description") as string)?.trim() || null
  const durationMinutes = parseInt(formData.get("duration_minutes") as string) || 60
  const priceCents = formData.get("price")
    ? Math.round(parseFloat(formData.get("price") as string) * 100)
    : null
  const priceType = (formData.get("price_type") as string) || "total"
  const capacity = parseInt(formData.get("capacity") as string) || 1
  const meetingPoint = (formData.get("meeting_point") as string)?.trim() || null
  const meetingInstructions = (formData.get("meeting_instructions") as string)?.trim() || null
  const color = (formData.get("color") as string) || "#10B981"

  if (!name) return { error: "Informe o nome do serviço." }

  await sql`
    INSERT INTO services (business_id, name, description, duration_minutes, price_cents, price_type, capacity, meeting_point, meeting_instructions, color)
    VALUES (${business.id}, ${name}, ${description}, ${durationMinutes}, ${priceCents}, ${priceType}, ${capacity}, ${meetingPoint}, ${meetingInstructions}, ${color})
  `

  revalidatePath("/servicos")
  return { success: true }
}

export async function updateService(formData: FormData) {
  const { userId } = await auth()
  if (!userId) return { error: "Não autenticado." }
  
  const business = await getBusinessForUser(userId)
  if (!business) return { error: "Negócio não encontrado." }

  const id = formData.get("id") as string
  const name = (formData.get("name") as string)?.trim()
  const description = (formData.get("description") as string)?.trim() || null
  const durationMinutes = parseInt(formData.get("duration_minutes") as string) || 60
  const priceCents = formData.get("price")
    ? Math.round(parseFloat(formData.get("price") as string) * 100)
    : null
  const priceType = (formData.get("price_type") as string) || "total"
  const capacity = parseInt(formData.get("capacity") as string) || 1
  const meetingPoint = (formData.get("meeting_point") as string)?.trim() || null
  const meetingInstructions = (formData.get("meeting_instructions") as string)?.trim() || null
  const color = (formData.get("color") as string) || "#10B981"

  if (!name) return { error: "Informe o nome do serviço." }

  await sql`
    UPDATE services SET 
      name = ${name}, 
      description = ${description},
      duration_minutes = ${durationMinutes}, 
      price_cents = ${priceCents}, 
      price_type = ${priceType},
      capacity = ${capacity},
      meeting_point = ${meetingPoint},
      meeting_instructions = ${meetingInstructions},
      color = ${color}
    WHERE id = ${id} AND business_id = ${business.id}
  `

  revalidatePath("/servicos")
  return { success: true }
}

export async function toggleService(id: string) {
  const { userId } = await auth()
  if (!userId) return { error: "Não autenticado." }
  
  const business = await getBusinessForUser(userId)
  if (!business) return { error: "Negócio não encontrado." }

  await sql`
    UPDATE services SET is_active = NOT is_active
    WHERE id = ${id} AND business_id = ${business.id}
  `
  revalidatePath("/servicos")
  return { success: true }
}

export async function deleteService(id: string) {
  const { userId } = await auth()
  if (!userId) return { error: "Não autenticado." }
  
  const business = await getBusinessForUser(userId)
  if (!business) return { error: "Negócio não encontrado." }

  await sql`
    DELETE FROM services WHERE id = ${id} AND business_id = ${business.id}
  `
  revalidatePath("/servicos")
  return { success: true }
}

// ---- Client Actions ----

export async function createClient(formData: FormData) {
  const { userId } = await auth()
  if (!userId) return { error: "Não autenticado." }
  
  const business = await getBusinessForUser(userId)
  if (!business) return { error: "Negócio não encontrado." }

  const name = (formData.get("name") as string)?.trim()
  const phone = (formData.get("phone") as string)?.trim() || null
  const email = (formData.get("email") as string)?.trim() || null
  const notes = (formData.get("notes") as string)?.trim() || null

  if (!name) return { error: "Informe o nome do cliente." }

  await sql`
    INSERT INTO clients (business_id, name, phone, email, notes)
    VALUES (${business.id}, ${name}, ${phone}, ${email}, ${notes})
  `

  revalidatePath("/clientes")
  return { success: true }
}

export async function updateClient(formData: FormData) {
  const { userId } = await auth()
  if (!userId) return { error: "Não autenticado." }
  
  const business = await getBusinessForUser(userId)
  if (!business) return { error: "Negócio não encontrado." }

  const id = formData.get("id") as string
  const name = (formData.get("name") as string)?.trim()
  const phone = (formData.get("phone") as string)?.trim() || null
  const email = (formData.get("email") as string)?.trim() || null
  const notes = (formData.get("notes") as string)?.trim() || null

  if (!name) return { error: "Informe o nome do cliente." }

  await sql`
    UPDATE clients SET name = ${name}, phone = ${phone}, email = ${email}, notes = ${notes}
    WHERE id = ${id} AND business_id = ${business.id}
  `

  revalidatePath("/clientes")
  return { success: true }
}

export async function deleteClient(id: string) {
  const { userId } = await auth()
  if (!userId) return { error: "Não autenticado." }
  
  const business = await getBusinessForUser(userId)
  if (!business) return { error: "Negócio não encontrado." }

  await sql`DELETE FROM clients WHERE id = ${id} AND business_id = ${business.id}`
  revalidatePath("/clientes")
  return { success: true }
}

// ---- Appointment Actions ----

export async function createAppointment(formData: FormData) {
  const { userId } = await auth()
  if (!userId) return { error: "Não autenticado." }
  
  const business = await getBusinessForUser(userId)
  if (!business) return { error: "Negócio não encontrado." }

  const serviceId = formData.get("service_id") as string
  const clientId = (formData.get("client_id") as string) || null
  const clientName = (formData.get("client_name") as string)?.trim()
  const clientPhone = (formData.get("client_phone") as string)?.trim() || null
  const startTime = formData.get("start_time") as string
  const endTime = formData.get("end_time") as string
  const notes = (formData.get("notes") as string)?.trim() || null
  const spots = parseInt(formData.get("spots") as string) || 1

  if (!serviceId || !clientName || !startTime || !endTime) {
    return { error: "Preencha todos os campos obrigatórios." }
  }

  const service = await sql`
    SELECT capacity FROM services WHERE id = ${serviceId} AND business_id = ${business.id}
  `
  
  if (service.length === 0) {
    return { error: "Serviço não encontrado." }
  }

  const capacity = service[0].capacity as number

  const existingBookings = await sql`
    SELECT COALESCE(SUM(spots), 0) as total_spots
    FROM appointments
    WHERE business_id = ${business.id}
      AND service_id = ${serviceId}
      AND status != 'cancelled'
      AND start_time < ${endTime}::timestamptz
      AND end_time > ${startTime}::timestamptz
  `

  const bookedSpots = existingBookings[0]?.total_spots as number || 0
  
  if (bookedSpots + spots > capacity) {
    const availableSpots = capacity - bookedSpots
    return { error: `Apenas ${availableSpots} vaga(s) disponível(is) neste horário.` }
  }

  let finalClientId = clientId
  if (!finalClientId && clientName) {
    if (clientPhone) {
      const existingClients = await sql`
        SELECT id FROM clients
        WHERE business_id = ${business.id} AND phone = ${clientPhone}
        LIMIT 1
      `
      if (existingClients.length > 0) {
        finalClientId = existingClients[0].id as string
      }
    }
    if (!finalClientId) {
      const newClient = await sql`
        INSERT INTO clients (business_id, name, phone)
        VALUES (${business.id}, ${clientName}, ${clientPhone})
        RETURNING id
      `
      finalClientId = newClient[0].id as string
    }
  }

  await sql`
    INSERT INTO appointments (business_id, service_id, client_id, client_name, client_phone, start_time, end_time, notes, spots, source)
    VALUES (${business.id}, ${serviceId}, ${finalClientId}, ${clientName}, ${clientPhone}, ${startTime}, ${endTime}, ${notes}, ${spots}, 'manual')
  `

  revalidatePath("/agenda")
  return { success: true }
}

export async function updateAppointmentStatus(id: string, status: string) {
  const { userId } = await auth()
  if (!userId) return { error: "Não autenticado." }
  
  const business = await getBusinessForUser(userId)
  if (!business) return { error: "Negócio não encontrado." }

  await sql`
    UPDATE appointments SET status = ${status}
    WHERE id = ${id} AND business_id = ${business.id}
  `
  revalidatePath("/agenda")
  return { success: true }
}

export async function deleteAppointment(id: string) {
  const { userId } = await auth()
  if (!userId) return { error: "Não autenticado." }
  
  const business = await getBusinessForUser(userId)
  if (!business) return { error: "Negócio não encontrado." }

  await sql`
    DELETE FROM appointments WHERE id = ${id} AND business_id = ${business.id}
  `
  revalidatePath("/agenda")
  return { success: true }
}

// ---- Time Block Actions ----

export async function createTimeBlock(formData: FormData) {
  const { userId } = await auth()
  if (!userId) return { error: "Não autenticado." }
  
  const business = await getBusinessForUser(userId)
  if (!business) return { error: "Negócio não encontrado." }

  const title = (formData.get("title") as string)?.trim()
  const startTime = formData.get("start_time") as string
  const endTime = formData.get("end_time") as string

  if (!title || !startTime || !endTime) {
    return { error: "Preencha todos os campos." }
  }

  await sql`
    INSERT INTO time_blocks (business_id, title, start_time, end_time)
    VALUES (${business.id}, ${title}, ${startTime}, ${endTime})
  `

  revalidatePath("/agenda")
  return { success: true }
}

export async function deleteTimeBlock(id: string) {
  const { userId } = await auth()
  if (!userId) return { error: "Não autenticado." }
  
  const business = await getBusinessForUser(userId)
  if (!business) return { error: "Negócio não encontrado." }

  await sql`
    DELETE FROM time_blocks WHERE id = ${id} AND business_id = ${business.id}
  `
  revalidatePath("/agenda")
  return { success: true }
}

// ---- Settings Actions ----

export async function updateBusinessProfile(formData: FormData) {
  const { userId } = await auth()
  if (!userId) return { error: "Não autenticado." }
  
  const business = await getBusinessForUser(userId)
  if (!business) return { error: "Negócio não encontrado." }

  const name = (formData.get("name") as string)?.trim()
  const phone = (formData.get("phone") as string)?.trim() || null
  const address = (formData.get("address") as string)?.trim() || null
  const slug = (formData.get("slug") as string)?.trim().toLowerCase()

  if (!name || !slug) return { error: "Nome e link são obrigatórios." }

  const existingSlug = await sql`
    SELECT id FROM businesses WHERE slug = ${slug} AND id != ${business.id}
  `
  if (existingSlug.length > 0) {
    return { error: "Este link já está em uso." }
  }

  await sql`
    UPDATE businesses SET name = ${name}, phone = ${phone}, address = ${address}, slug = ${slug}, updated_at = NOW()
    WHERE id = ${business.id}
  `

  revalidatePath("/configuracoes")
  return { success: true }
}

export async function updateWorkingHours(formData: FormData) {
  const { userId } = await auth()
  if (!userId) return { error: "Não autenticado." }
  
  const business = await getBusinessForUser(userId)
  if (!business) return { error: "Negócio não encontrado." }

  const daysOfWeek = [0, 1, 2, 3, 4, 5, 6]
  for (const day of daysOfWeek) {
    const isActive = formData.get(`day_${day}_active`) === "on"
    const startTime = formData.get(`day_${day}_start`) as string || "09:00"
    const endTime = formData.get(`day_${day}_end`) as string || "18:00"

    await sql`
      INSERT INTO working_hours (business_id, day_of_week, start_time, end_time, is_active)
      VALUES (${business.id}, ${day}, ${startTime}, ${endTime}, ${isActive})
      ON CONFLICT (business_id, day_of_week)
      DO UPDATE SET start_time = ${startTime}, end_time = ${endTime}, is_active = ${isActive}
    `
  }

  revalidatePath("/configuracoes")
  return { success: true }
}

// ---- Helper ----

export async function getBusinessForUser(userId: string) {
  const rows = await sql`SELECT * FROM businesses WHERE user_id = ${userId}`
  return rows.length > 0 ? rows[0] : null
}
