import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { Webhook } from "svix"

interface ClerkWebhookEvent {
  type: string
  data: {
    id: string
    email_addresses?: Array<{ email_address: string; id: string }>
    first_name?: string | null
    last_name?: string | null
    image_url?: string
  }
}

export async function POST(req: NextRequest) {
  const payload = await req.json()
  const headerPayload = req.headers

  const svixId = headerPayload.get("svix-id")
  const svixTimestamp = headerPayload.get("svix-timestamp")
  const svixSignature = headerPayload.get("svix-signature")

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 })
  }

  const secret = process.env.CLERK_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: "Missing webhook secret" }, { status: 500 })
  }

  const wh = new Webhook(secret)
  let evt: ClerkWebhookEvent

  try {
    evt = wh.verify(JSON.stringify(payload), {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkWebhookEvent
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const { type, data } = evt

  if (type === "user.created" || type === "user.updated") {
    const email = data.email_addresses?.[0]?.email_address
    const name = [data.first_name, data.last_name].filter(Boolean).join(" ") || "Usuário"

    if (!email) {
      return NextResponse.json({ error: "No email" }, { status: 400 })
    }

    await sql`
      INSERT INTO users (id, email, name, image_url)
      VALUES (${data.id}, ${email}, ${name}, ${data.image_url || null})
      ON CONFLICT (id) DO UPDATE SET
        email = ${email},
        name = ${name},
        image_url = ${data.image_url || null}
    `
  }

  if (type === "user.deleted") {
    await sql`DELETE FROM users WHERE id = ${data.id}`
  }

  return NextResponse.json({ success: true })
}
