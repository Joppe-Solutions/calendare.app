"use client"

import { useActionState } from "react"
import { updateBusinessProfile } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

interface BusinessProfileFormProps {
  business: {
    name: string
    slug: string
    phone: string | null
    address: string | null
  }
}

export function BusinessProfileForm({ business }: BusinessProfileFormProps) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      const result = await updateBusinessProfile(formData)
      if (result?.success) {
        toast.success("Perfil atualizado")
      }
      return result
    },
    null
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil do negócio</CardTitle>
        <CardDescription>Informações exibidas na sua página pública de agendamento.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          {state?.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="biz-name">Nome do negócio *</Label>
            <Input
              id="biz-name"
              name="name"
              defaultValue={business.name}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="biz-slug">Link público *</Label>
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground whitespace-nowrap">calendare.app/</span>
              <Input
                id="biz-slug"
                name="slug"
                defaultValue={business.slug}
                required
                pattern="[a-z0-9-]+"
                title="Apenas letras minúsculas, números e hifens"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="biz-phone">Telefone</Label>
            <Input
              id="biz-phone"
              name="phone"
              type="tel"
              defaultValue={business.phone || ""}
              placeholder="(11) 99999-9999"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="biz-address">Endereço</Label>
            <Input
              id="biz-address"
              name="address"
              defaultValue={business.address || ""}
              placeholder="Rua, número, bairro"
            />
          </div>
          <Button type="submit" className="w-fit" disabled={isPending}>
            {isPending ? "Salvando..." : "Salvar alterações"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
