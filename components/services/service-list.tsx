"use client"

import { useState } from "react"
import type { ServiceRow } from "@/lib/types"
import { toggleService, deleteService } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, MoreHorizontal, Pencil, Trash2, Clock, DollarSign, Users, MapPin, Sparkles, Power, PowerOff, Search, CreditCard, Image as ImageIcon } from "lucide-react"
import { ServiceForm } from "./service-form"
import { toast } from "sonner"

const SERVICE_COLORS = [
  "#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#14B8A6", "#F97316",
]

function formatPrice(cents: number | null, priceType: string): string {
  if (cents === null) return "Grátis"
  const value = `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`
  return priceType === 'per_person' ? `${value}/pessoa` : value
}

function formatPaymentType(type: string): string {
  switch (type) {
    case 'deposit': return 'Sinal 50%'
    case 'full': return 'Pagamento total'
    default: return 'No local'
  }
}

export function ServiceList({ services }: { services: ServiceRow[] }) {
  const [formOpen, setFormOpen] = useState(false)
  const [editingService, setEditingService] = useState<ServiceRow | null>(null)
  const [search, setSearch] = useState("")

  const filtered = services.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar serviço..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button 
          size="sm"
          onClick={() => { setEditingService(null); setFormOpen(true) }}
        >
          <Plus className="h-4 w-4 mr-1" /> Novo
        </Button>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-balance">Serviços</h1>
          <p className="text-muted-foreground">Configure os serviços que você oferece.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar serviço..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => { setEditingService(null); setFormOpen(true) }}>
            <Plus className="mr-1 h-4 w-4" /> Novo serviço
          </Button>
        </div>
      </div>

      {/* Mobile - Services */}
      <div className="md:hidden">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-center">
                {search ? "Nenhum serviço encontrado." : "Nenhum serviço cadastrado."}
              </p>
              {!search && (
                <Button
                  variant="link"
                  className="mt-2"
                  onClick={() => { setEditingService(null); setFormOpen(true) }}
                >
                  Adicionar seu primeiro serviço
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((service) => (
              <Card 
                key={service.id} 
                className={`overflow-hidden ${!service.is_active ? "opacity-60" : ""}`}
              >
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    {service.cover_image_url ? (
                      <div 
                        className="w-20 md:w-24 shrink-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${service.cover_image_url})` }}
                      />
                    ) : (
                      <div 
                        className="w-2 shrink-0"
                        style={{ backgroundColor: service.color }}
                      />
                    )}
                    <div className="flex-1 p-3 md:p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold truncate">{service.name}</h3>
                            {!service.is_active && (
                              <Badge variant="outline" className="text-xs shrink-0">Inativo</Badge>
                            )}
                          </div>
                          {service.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{service.description}</p>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Ações</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setEditingService(service); setFormOpen(true) }}>
                              <Pencil className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={async () => {
                                await toggleService(service.id)
                                toast.success(service.is_active ? "Serviço desativado" : "Serviço ativado")
                              }}
                            >
                              {service.is_active ? (
                                <><PowerOff className="mr-2 h-4 w-4" /> Desativar</>
                              ) : (
                                <><Power className="mr-2 h-4 w-4" /> Ativar</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={async () => {
                                await deleteService(service.id)
                                toast.success("Serviço removido")
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <Clock className="h-3 w-3" /> {service.duration_minutes} min
                        </Badge>
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <DollarSign className="h-3 w-3" /> {formatPrice(service.price_cents, service.price_type)}
                        </Badge>
                        {service.capacity > 1 && (
                          <Badge variant="secondary" className="gap-1 text-xs">
                            <Users className="h-3 w-3" /> {service.capacity} vagas
                          </Badge>
                        )}
                        {service.payment_type !== 'on_site' && (
                          <Badge variant="outline" className="gap-1 text-xs">
                            <CreditCard className="h-3 w-3" /> {formatPaymentType(service.payment_type)}
                          </Badge>
                        )}
                        {service.meeting_point && (
                          <Badge variant="outline" className="gap-1 text-xs">
                            <MapPin className="h-3 w-3" /> Local
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Grid */}
      <div className="hidden md:block">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">
                {search ? "Nenhum serviço encontrado." : "Nenhum serviço cadastrado."}
              </p>
              {!search && (
                <Button
                  variant="link"
                  className="mt-2"
                  onClick={() => { setEditingService(null); setFormOpen(true) }}
                >
                  Adicionar seu primeiro serviço
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((service) => (
              <Card key={service.id} className={`relative overflow-hidden ${!service.is_active ? "opacity-60" : ""}`}>
                <div className="absolute left-0 top-0 h-full w-1" style={{ backgroundColor: service.color }} />
                <CardContent className="flex flex-col gap-2 p-4 pl-5">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1">
                      <h3 className="font-semibold leading-tight">{service.name}</h3>
                      {service.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{service.description}</p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Ações</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditingService(service); setFormOpen(true) }}>
                          <Pencil className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={async () => {
                            await toggleService(service.id)
                            toast.success(service.is_active ? "Serviço desativado" : "Serviço ativado")
                          }}
                        >
                          {service.is_active ? "Desativar" : "Ativar"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={async () => {
                            await deleteService(service.id)
                            toast.success("Serviço removido")
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Badge variant="secondary" className="gap-1">
                      <Clock className="h-3 w-3" /> {service.duration_minutes} min
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                      <DollarSign className="h-3 w-3" /> {formatPrice(service.price_cents, service.price_type)}
                    </Badge>
                    {service.capacity > 1 && (
                      <Badge variant="secondary" className="gap-1">
                        <Users className="h-3 w-3" /> {service.capacity} vagas
                      </Badge>
                    )}
                    {service.meeting_point && (
                      <Badge variant="outline" className="gap-1">
                        <MapPin className="h-3 w-3" /> Local definido
                      </Badge>
                    )}
                    {!service.is_active && <Badge variant="outline">Inativo</Badge>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ServiceForm
        open={formOpen}
        onOpenChange={setFormOpen}
        service={editingService}
        colors={SERVICE_COLORS}
      />
    </div>
  )
}