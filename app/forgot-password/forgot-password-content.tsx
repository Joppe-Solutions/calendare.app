"use client"

import { useSignIn } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { Loader2, Mail, ArrowLeft, CheckCircle2, CalendarDays } from "lucide-react"

export function ForgotPasswordContent() {
  const { signIn, isLoaded } = useSignIn()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return

    setLoading(true)
    setError("")

    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      })
      setSent(true)
    } catch (err: unknown) {
      console.error("Reset password error:", err)
      const error = err as { errors?: Array<{ message: string }> }
      setError(error.errors?.[0]?.message || "Erro ao enviar email. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-muted p-4">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500">
              <CalendarDays className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold">Calendare</span>
          </div>
        </div>

        <div className="w-full max-w-md">
          <div className="bg-card rounded-2xl border p-6 shadow-sm text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-xl font-bold">
              Email enviado!
            </h1>
            <p className="text-muted-foreground">
              Enviamos instruções para redefinir sua senha para <strong>{email}</strong>
            </p>
            <Button
              onClick={() => router.push("/sign-in")}
              className="w-full h-12"
            >
              Voltar para login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted p-4">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500">
            <CalendarDays className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold">Calendare</span>
        </div>
        <h1 className="mt-6 text-2xl font-bold">
          Esqueceu a senha?
        </h1>
        <p className="mt-2 text-muted-foreground">
          Enviaremos um código para redefinir sua senha
        </p>
      </div>

      <div className="w-full max-w-md space-y-4">
        <form onSubmit={handleSubmit} className="bg-card rounded-2xl border p-6 shadow-sm space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 pl-10"
                required
                disabled={loading}
                autoFocus
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <Button type="submit" className="w-full h-12" disabled={loading || !isLoaded}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Enviando...
              </>
            ) : (
              "Enviar código de recuperação"
            )}
          </Button>
        </form>

        <Link href="/sign-in" className="block">
          <Button type="button" variant="ghost" className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para login
          </Button>
        </Link>
      </div>
    </div>
  )
}
