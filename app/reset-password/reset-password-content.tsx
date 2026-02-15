"use client"

import { useSignIn } from "@clerk/nextjs"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { Loader2, Lock, CheckCircle2, CalendarDays } from "lucide-react"

function ResetPasswordForm() {
  const { signIn, isLoaded } = useSignIn()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const codeParam = searchParams.get("code")
    if (codeParam) {
      setCode(codeParam)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return

    if (password !== confirmPassword) {
      setError("As senhas não coincidem")
      return
    }

    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres")
      return
    }

    setLoading(true)
    setError("")

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password,
      })

      if (result.status === "complete") {
        setSuccess(true)
        setTimeout(() => {
          router.push("/sign-in")
        }, 2000)
      }
    } catch (err: unknown) {
      console.error("Reset password error:", err)
      const error = err as { errors?: Array<{ message: string }> }
      setError(error.errors?.[0]?.message || "Erro ao redefinir senha. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-card rounded-2xl border p-6 shadow-sm text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-xl font-bold">
          Senha redefinida!
        </h1>
        <p className="text-muted-foreground">
          Sua senha foi alterada com sucesso. Redirecionando...
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card rounded-2xl border p-6 shadow-sm space-y-4">
      <div className="space-y-2">
        <Label htmlFor="code">Código de verificação</Label>
        <Input
          id="code"
          type="text"
          placeholder="000000"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="h-12 text-center text-lg tracking-widest"
          maxLength={6}
          required
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Nova senha</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 pl-10"
            required
            disabled={loading}
            minLength={8}
          />
        </div>
        <p className="text-xs text-muted-foreground">Mínimo de 8 caracteres</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar senha</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="h-12 pl-10"
            required
            disabled={loading}
            minLength={8}
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
            Redefinindo...
          </>
        ) : (
          "Redefinir senha"
        )}
      </Button>
    </form>
  )
}

export function ResetPasswordContent() {
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
          Redefinir senha
        </h1>
        <p className="mt-2 text-muted-foreground">
          Crie uma nova senha para sua conta
        </p>
      </div>

      <div className="w-full max-w-md space-y-4">
        <Suspense fallback={<div className="bg-card rounded-2xl border p-6 shadow-sm">Carregando...</div>}>
          <ResetPasswordForm />
        </Suspense>

        <Link href="/sign-in" className="block">
          <Button type="button" variant="ghost" className="w-full">
            Voltar para login
          </Button>
        </Link>
      </div>
    </div>
  )
}
