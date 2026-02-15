"use client"

import { useSignIn } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { AuthLayout } from "@/components/auth/auth-layout"
import Link from "next/link"
import { Loader2, Mail, Lock, ArrowLeft, Shield, Smartphone } from "lucide-react"

type Step = "sign-in" | "email-code" | "phone-code" | "totp"

export function SignInContent() {
  const { signIn, isLoaded, setActive } = useSignIn()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<Step>("sign-in")
  const [pendingStrategy, setPendingStrategy] = useState<string>("")

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return

    setLoading(true)
    setError("")

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      })

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId })
        router.push("/agenda")
        return
      }

      if (result.status === "needs_first_factor") {
        const firstFactors = result.supportedFirstFactors || []
        
        if (firstFactors.length === 0) {
          setError("Nenhum método de verificação disponível")
          setLoading(false)
          return
        }

        const emailCodeFactor = firstFactors.find(f => f.strategy === "email_code")
        const phoneCodeFactor = firstFactors.find(f => f.strategy === "phone_code")

        if (emailCodeFactor) {
          await signIn.prepareFirstFactor({
            strategy: "email_code",
            emailAddressId: result.identifier as string,
          })
          setStep("email-code")
          setPendingStrategy("email_code")
        } else if (phoneCodeFactor) {
          await signIn.prepareFirstFactor({
            strategy: "phone_code",
            phoneNumberId: phoneCodeFactor.phoneNumberId || "",
          })
          setStep("phone-code")
          setPendingStrategy("phone_code")
        } else {
          setError(`Método de verificação não suportado.`)
        }
      } else if (result.status === "needs_second_factor") {
        const secondFactors = result.supportedSecondFactors || []
        
        const totpFactor = secondFactors.find(f => f.strategy === "totp")
        const phoneFactor = secondFactors.find(f => f.strategy === "phone_code")

        if (totpFactor) {
          setStep("totp")
          setPendingStrategy("totp")
        } else if (phoneFactor) {
          await signIn.prepareSecondFactor({ strategy: "phone_code" })
          setStep("phone-code")
          setPendingStrategy("phone_code")
        } else {
          setError("2FA não suportado.")
        }
      } else {
        setError(`Estado de autenticação desconhecido: ${result.status}`)
      }
    } catch (err: unknown) {
      console.error("Sign in error:", err)
      const error = err as { errors?: Array<{ message: string }> }
      setError(error.errors?.[0]?.message || "Erro ao entrar. Verifique suas credenciais.")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyFirstFactor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded || !signIn) return

    setLoading(true)
    setError("")

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: pendingStrategy as "email_code" | "phone_code",
        code,
      })

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId })
        router.push("/agenda")
      } else if (result.status === "needs_second_factor") {
        const secondFactors = result.supportedSecondFactors || []
        const totpFactor = secondFactors.find(f => f.strategy === "totp")

        if (totpFactor) {
          setStep("totp")
          setCode("")
          setPendingStrategy("totp")
        } else {
          setError("Verificação adicional necessária.")
        }
      } else {
        setError(`Verificação retornou status: ${result.status}`)
      }
    } catch (err: unknown) {
      console.error("Verification error:", err)
      const error = err as { errors?: Array<{ message: string }> }
      setError(error.errors?.[0]?.message || "Código inválido. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifySecondFactor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded || !signIn) return

    setLoading(true)
    setError("")

    try {
      let result
      
      if (pendingStrategy === "totp") {
        result = await signIn.attemptSecondFactor({
          strategy: "totp",
          code,
        })
      } else if (pendingStrategy === "phone_code") {
        result = await signIn.attemptSecondFactor({
          strategy: "phone_code",
          code,
        })
      } else {
        throw new Error("Invalid second factor strategy")
      }

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId })
        router.push("/agenda")
      } else {
        setError(`Verificação retornou status: ${result.status}`)
      }
    } catch (err: unknown) {
      console.error("Second factor error:", err)
      const error = err as { errors?: Array<{ message: string }> }
      setError(error.errors?.[0]?.message || "Código inválido. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthSignIn = async (strategy: "oauth_google") => {
    if (!isLoaded) return
    
    setLoading(true)
    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/agenda",
      })
    } catch (err: unknown) {
      console.error("OAuth error:", err)
      setError("Erro ao conectar com Google")
      setLoading(false)
    }
  }

  const handleBack = () => {
    setStep("sign-in")
    setCode("")
    setError("")
    setPendingStrategy("")
  }

  if (step === "sign-in") {
    return (
      <AuthLayout>
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold">
              Bem-vindo de volta
            </h1>
            <p className="mt-2 text-muted-foreground">
              Entre na sua conta para continuar
            </p>
          </div>

          <div className="bg-card rounded-2xl border p-6 shadow-sm space-y-6">
            <form onSubmit={handleSignIn} className="space-y-4">
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <Link href="/forgot-password" className="text-sm text-primary hover:text-primary/80">
                    Esqueceu a senha?
                  </Link>
                </div>
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
                    Entrando...
                  </>
                ) : (
                  "Entrar"
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
              onClick={() => handleOAuthSignIn("oauth_google")}
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
            Não tem uma conta?{" "}
            <Link href="/sign-up" className="text-primary hover:text-primary/80 font-medium">
              Criar conta
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

  const getStepInfo = () => {
    switch (step) {
      case "email-code":
        return { title: "Verifique seu email", subtitle: "Enviamos um código para seu email", icon: Mail }
      case "phone-code":
        return { title: "Verifique seu telefone", subtitle: "Enviamos um código via SMS", icon: Smartphone }
      case "totp":
        return { title: "Autenticação em duas etapas", subtitle: "Digite o código do seu aplicativo autenticador", icon: Shield }
      default:
        return { title: "Verificação", subtitle: "Digite o código", icon: Shield }
    }
  }

  const stepInfo = getStepInfo()
  const StepIcon = stepInfo.icon
  const isSecondFactor = step === "totp"

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            {stepInfo.title}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {stepInfo.subtitle}
          </p>
        </div>

        <form
          onSubmit={isSecondFactor ? handleVerifySecondFactor : handleVerifyFirstFactor}
          className="bg-card rounded-2xl border p-6 shadow-sm space-y-4"
        >
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <StepIcon className="h-8 w-8 text-primary" />
            </div>
          </div>

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

          <Button type="submit" className="w-full h-12" disabled={loading || !isLoaded || code.length < 6}>
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
          onClick={handleBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>
    </AuthLayout>
  )
}
