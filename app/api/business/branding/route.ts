import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { sql } from "@/lib/db"
import { getBusinessForUser } from "@/lib/actions"

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const business = await getBusinessForUser(userId)
  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 })
  }

  try {
    const body = await req.json()
    const { logo_url, cover_url, primary_color } = body

    await sql`
      UPDATE businesses 
      SET logo_url = ${logo_url || null}, 
          cover_url = ${cover_url || null}, 
          primary_color = ${primary_color || '#10B981'},
          updated_at = NOW()
      WHERE id = ${business.id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Save branding error:", error)
    return NextResponse.json({ error: "Failed to save" }, { status: 500 })
  }
}
