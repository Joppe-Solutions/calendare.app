"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  DollarSign, Calendar, Users, TrendingUp, TrendingDown,
  Clock, CheckCircle, ChevronRight, Sparkles, ArrowUpRight, Zap
} from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import { useState, useEffect } from "react"

interface DashboardClientProps {
  monthlyRevenue: number
  weeklyRevenue: number
  todayAppointmentsCount: number
  weeklyAppointmentsCount: number
  statusCounts: {
    scheduled: number
    confirmed: number
    completed: number
    cancelled: number
    no_show: number
  }
  weeklyChartData: Array<{
    day: string
    date: string
    valor: number
  }>
  todayAppointments: Array<{
    id: string
    client_name: string
    service_name: string
    service_color: string
    duration_minutes: number
    start_time: string
    status: string
    spots: number
  }>
  topServices: Array<{
    name: string
    count: number
    revenue: number
  }>
}

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

function formatTime(isoString: string) {
  return format(parseISO(isoString), "HH:mm")
}

export function DashboardClient({
  monthlyRevenue,
  weeklyRevenue,
  todayAppointmentsCount,
  weeklyAppointmentsCount,
  statusCounts,
  weeklyChartData,
  todayAppointments,
  topServices,
}: DashboardClientProps) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  const today = new Date()
  const greeting = today.getHours() < 12 ? "Bom dia" : today.getHours() < 18 ? "Boa tarde" : "Boa noite"
  const todayFormatted = format(today, "EEEE, d 'de' MMMM", { locale: ptBR })

  const pendingCount = statusCounts.scheduled + statusCounts.confirmed
  const totalAppointments = Object.values(statusCounts).reduce((a, b) => a + b, 0)
  const completionRate = statusCounts.completed + statusCounts.cancelled + statusCounts.no_show > 0
    ? Math.round((statusCounts.completed / (statusCounts.completed + statusCounts.cancelled + statusCounts.no_show)) * 100)
    : 0

  const nextAppointment = todayAppointments.find(a => 
    new Date(a.start_time) > new Date() && a.status !== 'cancelled'
  )

  const hasWeeklyData = weeklyChartData.some(d => d.valor > 0)
  const hasServicesData = topServices.some(s => s.count > 0)

  return (
    <div className="flex flex-col gap-6">
      {/* Mobile Greeting */}
      <div className="md:hidden">
        <p className="text-muted-foreground">{greeting}</p>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground capitalize">{todayFormatted}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-lg shadow-emerald-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <DollarSign className="h-5 w-5 opacity-80" />
              <TrendingUp className="h-4 w-4 opacity-60" />
            </div>
            <div className="text-2xl md:text-3xl font-bold mt-2">{formatCurrency(monthlyRevenue)}</div>
            <p className="text-sm opacity-80 mt-1">Faturamento mensal</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <Badge variant="secondary" className="text-xs">Hoje</Badge>
            </div>
            <div className="text-2xl md:text-3xl font-bold mt-2">{todayAppointmentsCount}</div>
            <p className="text-sm text-muted-foreground mt-1">Agendamentos</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <Badge variant="outline" className="text-xs">Aguardando</Badge>
            </div>
            <div className="text-2xl md:text-3xl font-bold mt-2">{pendingCount}</div>
            <p className="text-sm text-muted-foreground mt-1">Pendentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <CheckCircle className="h-5 w-5 text-muted-foreground" />
              <Badge variant="default" className="text-xs bg-emerald-500">{completionRate}%</Badge>
            </div>
            <div className="text-2xl md:text-3xl font-bold mt-2">{completionRate}%</div>
            <p className="text-sm text-muted-foreground mt-1">Taxa de conclusão</p>
          </CardContent>
        </Card>
      </div>

      {/* Next Appointment - Mobile Hero */}
      {nextAppointment && (
        <Card className="md:hidden border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Próximo atendimento</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: nextAppointment.service_color || '#10B981' }}
                >
                  {nextAppointment.client_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-lg">{nextAppointment.client_name}</p>
                  <p className="text-sm text-muted-foreground">{nextAppointment.service_name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">{formatTime(nextAppointment.start_time)}</p>
                {nextAppointment.spots > 1 && (
                  <p className="text-xs text-muted-foreground">{nextAppointment.spots} pessoas</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mobile Today's Schedule */}
      <Card className="md:hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Agendamentos de Hoje</CardTitle>
            <Link href="/agenda">
              <Button variant="ghost" size="sm" className="text-primary -mr-2">
                Ver todos <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {todayAppointments.length > 0 ? (
            <div className="space-y-2">
              {todayAppointments.map((appt) => (
                <Link 
                  key={appt.id}
                  href="/agenda"
                  className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="text-center w-14 shrink-0">
                    <p className="text-sm font-bold">{formatTime(appt.start_time)}</p>
                  </div>
                  <div 
                    className="w-1 h-8 rounded-full shrink-0"
                    style={{ backgroundColor: appt.service_color || '#10B981' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{appt.client_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{appt.service_name}</p>
                  </div>
                  <Badge 
                    variant={
                      appt.status === 'completed' ? 'default' :
                      appt.status === 'confirmed' ? 'secondary' :
                      appt.status === 'cancelled' ? 'destructive' : 'outline'
                    }
                    className="text-[10px] px-2"
                  >
                    {appt.status === 'scheduled' && 'Agendado'}
                    {appt.status === 'confirmed' && 'Confirmado'}
                    {appt.status === 'completed' && 'Concluído'}
                    {appt.status === 'cancelled' && 'Cancelado'}
                    {appt.status === 'no_show' && 'Falta'}
                  </Badge>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum agendamento hoje</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mobile Quick Actions */}
      <div className="grid grid-cols-2 gap-3 md:hidden">
        <Link href="/servicos">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Serviços</p>
                <p className="text-xs text-muted-foreground">{topServices.length} cadastrados</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/clientes">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Clientes</p>
                <p className="text-xs text-muted-foreground">Gerenciar</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Desktop Grid Layout */}
      <div className="hidden md:grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Faturamento da Semana
              {!hasWeeklyData && <Badge variant="outline" className="text-xs">Sem dados</Badge>}
            </CardTitle>
            <CardDescription>Valores de agendamentos concluídos</CardDescription>
          </CardHeader>
          <CardContent>
            {mounted && (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyChartData}>
                    <defs>
                      <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="day" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(v) => `R$${v}`} axisLine={{ stroke: 'hsl(var(--border))' }} />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value * 100), 'Faturamento']}
                      labelFormatter={(label, payload) => {
                        const data = payload?.[0]?.payload
                        return data ? `${label} - ${data.date}` : label
                      }}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))', 
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="valor" 
                      stroke="hsl(var(--primary))" 
                      fillOpacity={1} 
                      fill="url(#colorValor)" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Status dos Agendamentos</CardTitle>
            <CardDescription>Visão geral do período</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  <span className="text-sm">Agendados</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{statusCounts.scheduled}</span>
                  {totalAppointments > 0 && (
                    <span className="text-xs text-muted-foreground">
                      ({Math.round((statusCounts.scheduled / totalAppointments) * 100)}%)
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-amber-500" />
                  <span className="text-sm">Confirmados</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{statusCounts.confirmed}</span>
                  {totalAppointments > 0 && (
                    <span className="text-xs text-muted-foreground">
                      ({Math.round((statusCounts.confirmed / totalAppointments) * 100)}%)
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span className="text-sm">Concluídos</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{statusCounts.completed}</span>
                  {totalAppointments > 0 && (
                    <span className="text-xs text-muted-foreground">
                      ({Math.round((statusCounts.completed / totalAppointments) * 100)}%)
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <span className="text-sm">Cancelados</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{statusCounts.cancelled}</span>
                  {totalAppointments > 0 && (
                    <span className="text-xs text-muted-foreground">
                      ({Math.round((statusCounts.cancelled / totalAppointments) * 100)}%)
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-gray-400" />
                  <span className="text-sm">Não compareceu</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{statusCounts.no_show}</span>
                  {totalAppointments > 0 && (
                    <span className="text-xs text-muted-foreground">
                      ({Math.round((statusCounts.no_show / totalAppointments) * 100)}%)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Desktop: Today's Appointments & Services */}
      <div className="hidden md:grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Agendamentos de Hoje</CardTitle>
                <CardDescription>
                  {todayAppointments.length > 0 ? `${todayAppointments.length} agendamento(s)` : "Nenhum agendamento"}
                </CardDescription>
              </div>
              <Link href="/agenda">
                <Button variant="outline" size="sm">
                  Ver agenda <ArrowUpRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {todayAppointments.length > 0 ? (
              <div className="space-y-3">
                {todayAppointments.slice(0, 5).map((appt) => (
                  <div key={appt.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: appt.service_color }} />
                      <div>
                        <p className="font-medium">{appt.client_name}</p>
                        <p className="text-sm text-muted-foreground">{appt.service_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatTime(appt.start_time)}</p>
                      <Badge variant={appt.status === 'completed' ? 'default' : appt.status === 'confirmed' ? 'secondary' : appt.status === 'cancelled' ? 'destructive' : 'outline'} className="text-xs">
                        {appt.status === 'scheduled' && 'Agendado'}
                        {appt.status === 'confirmed' && 'Confirmado'}
                        {appt.status === 'completed' && 'Concluído'}
                        {appt.status === 'cancelled' && 'Cancelado'}
                        {appt.status === 'no_show' && 'Não compareceu'}
                      </Badge>
                    </div>
                  </div>
                ))}
                {todayAppointments.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center pt-2">
                    +{todayAppointments.length - 5} mais agendamentos
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>Nenhum agendamento para hoje</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Serviços Mais Populares
                  {!hasServicesData && <Badge variant="outline" className="text-xs">Sem dados</Badge>}
                </CardTitle>
                <CardDescription>Por número de atendimentos concluídos</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {mounted && topServices.length > 0 ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topServices} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        name === 'count' ? `${value} atendimentos` : formatCurrency(value), 
                        name === 'count' ? 'Quantidade' : 'Receita'
                      ]} 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))', 
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }} 
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                <Users className="h-10 w-10 mb-3 opacity-50" />
                <p>Cadastre serviços para ver estatísticas</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}