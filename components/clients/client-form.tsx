"use client"

import { useActionState } from "react"
import type { ClientRow } from "@/lib/types"
import { createClient, updateClient } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"

interface ClientFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: ClientRow | null
}

export function ClientForm({ open, onOpenChange, client }: ClientFormProps) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      let result
      if (client) {
        formData.append("id", client.id)
        result = await updateClient(formData)
      } else {
        result = await createClient(formData)
      }
      if (result?.success) {
        toast.success(client ? "Cliente atualizado" : "Cliente criado")
        onOpenChange(false)
      }
      return result
    },
    null
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{client ? "Editar cliente" : "Novo cliente"}</DialogTitle>
          <DialogDescription>
            {client ? "Atualize as informações do cliente." : "Preencha as informações do novo cliente."}
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          {state?.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="client-name">Nome *</Label>
            <Input
              id="client-name"
              name="name"
              defaultValue={client?.name || ""}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="client-phone">Telefone</Label>
            <Input
              id="client-phone"
              name="phone"
              type="tel"
              defaultValue={client?.phone || ""}
              placeholder="(11) 99999-9999"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="client-email">E-mail</Label>
            <Input
              id="client-email"
              name="email"
              type="email"
              defaultValue={client?.email || ""}
              placeholder="cliente@email.com"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="client-notes">Observações</Label>
            <Textarea
              id="client-notes"
              name="notes"
              defaultValue={client?.notes || ""}
              placeholder="Preferências, alergias, etc."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
