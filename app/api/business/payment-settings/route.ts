import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const businesses = await sql`
      SELECT id FROM businesses WHERE user_id = ${userId}
    `
    
    if (businesses.length === 0) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 })
    }

    const businessId = businesses[0].id
    const body = await request.json()
    const { payment_gateway, payment_access_token, payment_public_key } = body

    await sql`
      UPDATE businesses SET
        payment_gateway = ${payment_gateway || null},
        payment_access_token = ${payment_access_token || null},
        payment_public_key = ${payment_public_key || null}
      WHERE id = ${businessId}
    `

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Error saving payment settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}