"use client"

import { useState } from "react"
import type { ServiceRow } from "@/lib/types"
import { toggleService, deleteService } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, MoreHorizontal, Pencil, Trash2, Clock, DollarSign } from "lucide-react"
import { ServiceForm } from "./service-form"
import { toast } from "sonner"

const SERVICE_COLORS = [
  "#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#14B8A6", "#F97316",
]

function formatPrice(cents: number | null): string {
  if (cents === null) return "---"
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`
}

export function ServiceList({ services }: { services: ServiceRow[] }) {
  const [formOpen, setFormOpen] = useState(false)
  const [editingService, setEditingService] = useState<ServiceRow | null>(null)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => { setEditingService(null); setFormOpen(true) }}>
          <Plus className="mr-1 h-4 w-4" /> Novo serviço
        </Button>
      </div>

      {services.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Nenhum serviço cadastrado.</p>
            <Button
              variant="link"
              className="mt-2"
              onClick={() => { setEditingService(null); setFormOpen(true) }}
            >
              Adicionar seu primeiro serviço
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
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
                <div className="flex items-center gap-3 pt-1">
                  <Badge variant="secondary" className="gap-1">
                    <Clock className="h-3 w-3" /> {service.duration_minutes} min
                  </Badge>
                  <Badge variant="secondary" className="gap-1">
                    <DollarSign className="h-3 w-3" /> {formatPrice(service.price_cents)}
                  </Badge>
                  {!service.is_active && <Badge variant="outline">Inativo</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ServiceForm
        open={formOpen}
        onOpenChange={setFormOpen}
        service={editingService}
        colors={SERVICE_COLORS}
      />
    </div>
  )
}
