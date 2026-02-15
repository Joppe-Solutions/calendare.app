"use client"

import { useState } from "react"
import type { ClientRow } from "@/lib/types"
import { deleteClient } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, MoreHorizontal, Pencil, Trash2, Search, Phone, Mail } from "lucide-react"
import { ClientForm } from "./client-form"
import { toast } from "sonner"

interface ClientRowWithCount extends ClientRow {
  appointment_count?: number
}

export function ClientList({ clients }: { clients: ClientRowWithCount[] }) {
  const [formOpen, setFormOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<ClientRow | null>(null)
  const [search, setSearch] = useState("")

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => { setEditingClient(null); setFormOpen(true) }}>
          <Plus className="mr-1 h-4 w-4" /> Novo cliente
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">
              {search ? "Nenhum cliente encontrado." : "Nenhum cliente cadastrado."}
            </p>
            {!search && (
              <Button
                variant="link"
                className="mt-2"
                onClick={() => { setEditingClient(null); setFormOpen(true) }}
              >
                Adicionar seu primeiro cliente
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden sm:table-cell">Telefone</TableHead>
                <TableHead className="hidden md:table-cell">E-mail</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{client.name}</span>
                      <div className="flex gap-2 sm:hidden">
                        {client.phone && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" /> {client.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {client.phone && (
                      <span className="flex items-center gap-1 text-sm">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" /> {client.phone}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {client.email && (
                      <span className="flex items-center gap-1 text-sm">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" /> {client.email}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Ações</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditingClient(client); setFormOpen(true) }}>
                          <Pencil className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={async () => {
                            await deleteClient(client.id)
                            toast.success("Cliente removido")
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <ClientForm
        open={formOpen}
        onOpenChange={setFormOpen}
        client={editingClient}
      />
    </div>
  )
}
