import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { sql } from "@/lib/db"
import { getBusinessForUser } from "@/lib/actions"

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const business = await getBusinessForUser(userId)
  if (!business) {
    return NextResponse.json({ error: "No business" }, { status: 404 })
  }

  const { searchParams } = req.nextUrl
  const start = searchParams.get("start")
  const end = searchParams.get("end")

  if (!start || !end) {
    return NextResponse.json({ error: "Missing start/end params" }, { status: 400 })
  }

  const [appointments, timeBlocks] = await Promise.all([
    sql`
      SELECT a.*, s.name as service_name, s.color as service_color, s.duration_minutes as service_duration
      FROM appointments a
      JOIN services s ON s.id = a.service_id
      WHERE a.business_id = ${business.id}
        AND a.start_time >= ${start}::timestamptz
        AND a.start_time < ${end}::timestamptz
      ORDER BY a.start_time
    `,
    sql`
      SELECT id, title, start_time, end_time
      FROM time_blocks
      WHERE business_id = ${business.id}
        AND start_time >= ${start}::timestamptz
        AND start_time < ${end}::timestamptz
      ORDER BY start_time
    `,
  ])

  return NextResponse.json({ appointments, timeBlocks })
}
