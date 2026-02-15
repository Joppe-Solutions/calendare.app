"use client"

import { useSignUp } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { AuthLayout } from "@/components/auth/auth-layout"
import Link from "next/link"
import { Loader2, Mail, Lock, User, ArrowLeft } from "lucide-react"

export function SignUpContent() {
  const { signUp, isLoaded, setActive } = useSignUp()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [code, setCode] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return

    setLoading(true)
    setError("")

    try {
      const result = await signUp.create({
        emailAddress: email,
        password,
        firstName: name.split(" ")[0],
        lastName: name.split(" ").slice(1).join(" ") || undefined,
      })

      if (result.status === "missing_requirements") {
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" })
        setVerifying(true)
      } else if (result.status === "complete") {
        await setActive({ session: result.createdSessionId })
        router.push("/onboarding")
      }
    } catch (err: unknown) {
      const error = err as { errors?: Array<{ message: string }> }
      setError(error.errors?.[0]?.message || "Erro ao criar conta. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return

    setLoading(true)
    setError("")

    try {
      const result = await signUp.attemptEmailAddressVerification({ code })

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId })
        router.push("/onboarding")
      }
    } catch (err: unknown) {
      const error = err as { errors?: Array<{ message: string }> }
      setError(error.errors?.[0]?.message || "Código inválido. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthSignUp = async (strategy: "oauth_google") => {
    if (!isLoaded) return
    
    setLoading(true)
    try {
      await signUp.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/onboarding",
      })
    } catch (err: unknown) {
      setError("Erro ao conectar com Google")
      setLoading(false)
    }
  }

  if (verifying) {
    return (
      <AuthLayout>
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold">
              Verifique seu email
            </h1>
            <p className="mt-2 text-muted-foreground">
              Enviamos um código para {email}
            </p>
          </div>

          <form onSubmit={handleVerifyCode} className="bg-card rounded-2xl border p-6 shadow-sm space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código de verificação</Label>
              <Input
                id="code"
                type="text"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="h-12 text-center text-lg tracking-widest"
                maxLength={6}
                required
                disabled={loading}
                autoFocus
              />
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <Button type="submit" className="w-full h-12" disabled={loading || !isLoaded}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Verificar"
              )}
            </Button>
          </form>

          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => setVerifying(false)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            Criar conta
          </h1>
          <p className="mt-2 text-muted-foreground">
            Comece a gerenciar seus agendamentos hoje
          </p>
        </div>

        <div className="bg-card rounded-2xl border p-6 shadow-sm space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>

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
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
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

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <Button type="submit" className="w-full h-12" disabled={loading || !isLoaded}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar conta"
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                ou continue com
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-12"
            onClick={() => handleOAuthSignUp("oauth_google")}
            disabled={loading || !isLoaded}
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Já tem uma conta?{" "}
          <Link href="/sign-in" className="text-primary hover:text-primary/80 font-medium">
            Entrar
          </Link>
        </p>

        <Link href="/" className="block">
          <Button type="button" variant="ghost" className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para home
          </Button>
        </Link>
      </div>
    </AuthLayout>
  )
}
