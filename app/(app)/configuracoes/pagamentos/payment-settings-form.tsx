"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
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
import { CreditCard, ExternalLink, Loader2, Check, AlertCircle, QrCode, Landmark } from "lucide-react"
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
  const [pixEnabled, setPixEnabled] = useState(true)
  const [creditCardEnabled, setCreditCardEnabled] = useState(true)
  const [boletoEnabled, setBoletoEnabled] = useState(false)
  const [sandboxMode, setSandboxMode] = useState(true)

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
            Configure seu gateway de pagamento para receber pagamentos online dos seus clientes.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Gateway de Pagamento
            </CardTitle>
            <CardDescription>
              Escolha o gateway de pagamento que deseja utilizar. Recomendamos o Asaas para o mercado brasileiro.
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
                  <SelectItem value="asaas">Asaas (Recomendado)</SelectItem>
                  <SelectItem value="mercadopago">Mercado Pago</SelectItem>
                  <SelectItem value="pagarme">Pagar.me (Stark Bank)</SelectItem>
                </SelectContent>
              </Select>
              {gateway && (
                <p className="text-xs text-muted-foreground">
                  {gateway === "asaas" && (
                    <a 
                      href="https://www.asaas.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      Acessar painel do Asaas <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
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
                {gateway === "asaas" && (
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="sandbox-mode">Modo Sandbox</Label>
                      <p className="text-xs text-muted-foreground">
                        Use o modo sandbox para testar pagamentos sem cobranças reais
                      </p>
                    </div>
                    <Switch
                      id="sandbox-mode"
                      checked={sandboxMode}
                      onCheckedChange={setSandboxMode}
                    />
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <Label htmlFor="access-token">
                    {gateway === "asaas" ? "API Key" : gateway === "mercadopago" ? "Access Token" : "Chave de API Secreta"}
                  </Label>
                  <Input
                    id="access-token"
                    type="password"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder={
                      gateway === "asaas" 
                        ? (sandboxMode ? "$aact_xxxx (Sandbox)" : "$aact_prod_xxxx (Produção)")
                        : gateway === "mercadopago" 
                          ? "APP_USR-xxxx" 
                          : "sk_xxxx"
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    {gateway === "asaas" && (
                      <>Encontre em: Minha Conta {"→"} Integrações {"→"} API Key. Use a chave de {sandboxMode ? "Sandbox" : "Produção"}.</>
                    )}
                    {gateway === "mercadopago" && (
                      <>Encontre em: Credenciais {"→"} Access Token (produção ou teste)</>
                    )}
                    {gateway === "pagarme" && (
                      <>Encontre em: Configurações {"→"} Chaves de API</>
                    )}
                  </p>
                </div>

                {gateway === "asaas" && (
                  <>
                    <div className="space-y-4">
                      <Label className="text-base">Formas de pagamento</Label>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between rounded-lg border p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100">
                              <QrCode className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                              <Label htmlFor="pix-enabled" className="font-medium">PIX</Label>
                              <p className="text-xs text-muted-foreground">Pagamento instantâneo 24/7</p>
                            </div>
                          </div>
                          <Switch
                            id="pix-enabled"
                            checked={pixEnabled}
                            onCheckedChange={setPixEnabled}
                          />
                        </div>

                        <div className="flex items-center justify-between rounded-lg border p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                              <CreditCard className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <Label htmlFor="credit-card-enabled" className="font-medium">Cartão de Crédito</Label>
                              <p className="text-xs text-muted-foreground">Visa, Mastercard, Elo e mais</p>
                            </div>
                          </div>
                          <Switch
                            id="credit-card-enabled"
                            checked={creditCardEnabled}
                            onCheckedChange={setCreditCardEnabled}
                          />
                        </div>

                        <div className="flex items-center justify-between rounded-lg border p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
                              <Landmark className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                              <Label htmlFor="boleto-enabled" className="font-medium">Boleto Bancário</Label>
                              <p className="text-xs text-muted-foreground">Compensação em até 3 dias úteis</p>
                            </div>
                          </div>
                          <Switch
                            id="boleto-enabled"
                            checked={boletoEnabled}
                            onCheckedChange={setBoletoEnabled}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">Importante</p>
                      <p className="text-muted-foreground">
                        Mantenha suas chaves em segredo. Elas permitem acessar sua conta de pagamento.
                        {gateway === "asaas" && !sandboxMode && (
                          <span className="block mt-1 text-amber-600">
                            Você está no modo PRODUÇÃO. Pagamentos serão cobrados de verdade!
                          </span>
                        )}
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
