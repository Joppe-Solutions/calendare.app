import { auth } from "@clerk/nextjs/server"
import { sql } from "@/lib/db"
import { getBusinessForUser } from "@/lib/actions"
import { DashboardClient } from "./dashboard-client"

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) return null
  
  const business = await getBusinessForUser(userId)
  if (!business) return null

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const endOfToday = new Date(now)
  endOfToday.setHours(23, 59, 59, 999)

  const [
    monthlyRevenue,
    weeklyRevenue,
    todayAppointments,
    weeklyAppointments,
    statusCounts,
    topServices
  ] = await Promise.all([
    sql`
      SELECT COALESCE(SUM(
        CASE 
          WHEN s.price_type = 'per_person' THEN s.price_cents * a.spots
          ELSE s.price_cents
        END
      ), 0) as total
      FROM appointments a
      JOIN services s ON s.id = a.service_id
      WHERE a.business_id = ${business.id}
        AND a.status = 'completed'
        AND a.start_time >= ${startOfMonth.toISOString()}::timestamptz
    `,
    sql`
      SELECT 
        DATE(a.start_time) as date,
        COALESCE(SUM(
          CASE 
            WHEN s.price_type = 'per_person' THEN s.price_cents * a.spots
            ELSE s.price_cents
          END
        ), 0) as total
      FROM appointments a
      JOIN services s ON s.id = a.service_id
      WHERE a.business_id = ${business.id}
        AND a.status = 'completed'
        AND a.start_time >= ${startOfWeek.toISOString()}::timestamptz
      GROUP BY DATE(a.start_time)
      ORDER BY date
    `,
    sql`
      SELECT a.*, s.name as service_name, s.color as service_color, s.duration_minutes
      FROM appointments a
      JOIN services s ON s.id = a.service_id
      WHERE a.business_id = ${business.id}
        AND a.start_time >= ${startOfToday.toISOString()}::timestamptz
        AND a.start_time <= ${endOfToday.toISOString()}::timestamptz
      ORDER BY a.start_time
    `,
    sql`
      SELECT COUNT(*) as count
      FROM appointments
      WHERE business_id = ${business.id}
        AND start_time >= ${startOfWeek.toISOString()}::timestamptz
    `,
    sql`
      SELECT status, COUNT(*) as count
      FROM appointments
      WHERE business_id = ${business.id}
      GROUP BY status
    `,
    sql`
      SELECT s.name, COUNT(a.id) as count, COALESCE(SUM(
        CASE 
          WHEN s.price_type = 'per_person' THEN s.price_cents * a.spots
          ELSE s.price_cents
        END
      ), 0) as revenue
      FROM services s
      LEFT JOIN appointments a ON a.service_id = s.id AND a.status = 'completed'
      WHERE s.business_id = ${business.id}
      GROUP BY s.id, s.name
      ORDER BY count DESC
      LIMIT 5
    `
  ])

  const todayCount = todayAppointments.length
  const weeklyCount = weeklyAppointments[0]?.count || 0
  const monthRevenue = monthlyRevenue[0]?.total || 0
  const weekRevenue = weeklyRevenue.reduce((sum: number, r: any) => sum + (r.total || 0), 0)

  const statusMap = {
    scheduled: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    no_show: 0,
  }
  statusCounts.forEach((s: any) => {
    if (s.status in statusMap) {
      statusMap[s.status as keyof typeof statusMap] = s.count
    }
  })

  const weeklyChartData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek)
    date.setDate(date.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]
    const found = weeklyRevenue.find((r: any) => 
      new Date(r.date).toISOString().split('T')[0] === dateStr
    )
    return {
      day: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
      date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      valor: (found?.total || 0) / 100,
    }
  })

  return (
    <DashboardClient
      monthlyRevenue={monthRevenue as number}
      weeklyRevenue={weekRevenue as number}
      todayAppointmentsCount={todayCount}
      weeklyAppointmentsCount={weeklyCount as number}
      statusCounts={statusMap}
      weeklyChartData={weeklyChartData}
      todayAppointments={todayAppointments.map((a: any) => ({
        id: a.id,
        client_name: a.client_name,
        service_name: a.service_name,
        service_color: a.service_color,
        duration_minutes: a.duration_minutes,
        start_time: a.start_time,
        status: a.status,
        spots: a.spots,
      }))}
      topServices={topServices.map((s: any) => ({
        name: s.name,
        count: s.count,
        revenue: s.revenue,
      }))}
    />
  )
}
