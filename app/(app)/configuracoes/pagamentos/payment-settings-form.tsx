"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { CreditCard, ExternalLink, Loader2, Check, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface PaymentSettingsFormProps {
  initialData: {
    payment_gateway: string | null
    payment_access_token: string | null
    payment_public_key: string | null
  }
}

export function PaymentSettingsForm({ initialData }: PaymentSettingsFormProps) {
  const [gateway, setGateway] = useState(initialData.payment_gateway || "")
  const [accessToken, setAccessToken] = useState(initialData.payment_access_token || "")
  const [publicKey, setPublicKey] = useState(initialData.payment_public_key || "")
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/business/payment-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_gateway: gateway || null,
          payment_access_token: accessToken || null,
          payment_public_key: publicKey || null,
        }),
      })

      if (!res.ok) throw new Error("Failed to save")

      setShowSuccess(true)
    } catch (error) {
      toast.error("Erro ao salvar configurações")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pagamentos</h1>
          <p className="text-muted-foreground">
            Configure seu gateway de pagamento para receber online.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Gateway de Pagamento
            </CardTitle>
            <CardDescription>
              Escolha qual gateway deseja integrar para receber pagamentos dos seus clientes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col gap-2">
              <Label>Gateway de pagamento</Label>
              <Select value={gateway} onValueChange={setGateway}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um gateway" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mercadopago">Mercado Pago</SelectItem>
                  <SelectItem value="pagarme">Pagar.me (Stark Bank)</SelectItem>
                </SelectContent>
              </Select>
              {gateway && (
                <p className="text-xs text-muted-foreground">
                  {gateway === "mercadopago" && (
                    <a 
                      href="https://www.mercadopago.com.br/developers/panel/app" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      Acessar painel do Mercado Pago <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {gateway === "pagarme" && (
                    <a 
                      href="https://dashboard.pagar.me/#/api-keys" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      Acessar painel do Pagar.me <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </p>
              )}
            </div>

            {gateway && (
              <>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="access-token">
                    {gateway === "mercadopago" ? "Access Token" : "Chave de API Secreta"}
                  </Label>
                  <Input
                    id="access-token"
                    type="password"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder={gateway === "mercadopago" ? "APP_USR-xxxx" : "sk_xxxx"}
                  />
                  <p className="text-xs text-muted-foreground">
                    {gateway === "mercadopago" 
                      ? "Encontre em: Credenciais > Access Token (produção ou teste)"
                      : "Encontre em: Configurações > Chaves de API"}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="public-key">
                    {gateway === "mercadopago" ? "Public Key" : "Chave Pública"}
                  </Label>
                  <Input
                    id="public-key"
                    type="password"
                    value={publicKey}
                    onChange={(e) => setPublicKey(e.target.value)}
                    placeholder={gateway === "mercadopago" ? "APP_USR-xxxx" : "pk_xxxx"}
                  />
                  <p className="text-xs text-muted-foreground">
                    Necessária para exibir formas de pagamento no checkout.
                  </p>
                </div>

                <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">Importante</p>
                      <p className="text-muted-foreground">
                        Mantenha suas chaves em segredo. Elas permitem acessar sua conta de pagamento.
                        Use chaves de produção para receber pagamentos reais.
                      </p>
                    </div>
                  </div>
                </div>

                <Button onClick={handleSave} disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Salvar configurações
                </Button>
              </>
            )}

            {!gateway && (
              <div className="text-center py-6 text-muted-foreground">
                <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>Selecione um gateway para configurar</p>
              </div>
            )}
          </CardContent>
        </Card>

        {gateway && accessToken && (
          <Card>
            <CardHeader>
              <CardTitle>Webhook</CardTitle>
              <CardDescription>
                Configure o webhook para receber notificações de pagamento.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-mono break-all">
                  {typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/payment
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Copie esta URL e configure no painel do seu gateway para receber atualizações de status de pagamento.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={showSuccess} onOpenChange={setShowSuccess}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              Configurações salvas!
            </AlertDialogTitle>
            <AlertDialogDescription>
              Suas credenciais de pagamento foram salvas com segurança. 
              Você já pode começar a receber pagamentos online nos seus serviços.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Entendi</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}