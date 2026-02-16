"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Upload, X, Image as ImageIcon } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface BrandingFormProps {
  business: {
    name: string
    logo_url: string | null
    cover_url: string | null
    primary_color: string
  }
}

export function BrandingForm({ business }: BrandingFormProps) {
  const router = useRouter()
  const logoInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const [logoUrl, setLogoUrl] = useState(business.logo_url)
  const [coverUrl, setCoverUrl] = useState(business.cover_url)
  const [primaryColor, setPrimaryColor] = useState(business.primary_color)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleUpload(file: File, type: "logo" | "cover") {
    if (type === "logo") setUploadingLogo(true)
    else setUploadingCover(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", type)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Upload failed")
      }

      if (type === "logo") {
        setLogoUrl(data.url)
      } else {
        setCoverUrl(data.url)
      }

      toast.success("Imagem enviada!")
    } catch (error) {
      toast.error("Erro ao enviar imagem")
    } finally {
      if (type === "logo") setUploadingLogo(false)
      else setUploadingCover(false)
    }
  }

  async function handleSave() {
    setSaving(true)

    try {
      const res = await fetch("/api/business/branding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logo_url: logoUrl,
          cover_url: coverUrl,
          primary_color: primaryColor,
        }),
      })

      if (!res.ok) throw new Error("Failed to save")

      toast.success("Configurações salvas!")
      router.refresh()
    } catch (error) {
      toast.error("Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Identidade Visual</CardTitle>
        <CardDescription>
          Personalize a aparência da sua página de agendamento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label>Logo</Label>
          <div className="flex items-start gap-4">
            <div className="relative">
              {logoUrl ? (
                <div className="relative w-24 h-24 rounded-lg border overflow-hidden bg-muted">
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setLogoUrl(null)}
                    className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="w-24 h-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  disabled={uploadingLogo}
                >
                  {uploadingLogo ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <>
                      <Upload className="h-6 w-6 mb-1" />
                      <span className="text-xs">Logo</span>
                    </>
                  )}
                </button>
              )}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleUpload(file, "logo")
                }}
              />
            </div>
            <div className="flex-1 text-sm text-muted-foreground">
              <p>Recomendado: imagem quadrada</p>
              <p>Formatos: JPG, PNG, WebP</p>
              <p>Tamanho máximo: 5MB</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Label>Imagem de Capa</Label>
          <div className="space-y-2">
            {coverUrl ? (
              <div className="relative w-full h-40 rounded-lg border overflow-hidden bg-muted">
                <img
                  src={coverUrl}
                  alt="Capa"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setCoverUrl(null)}
                  className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="w-full h-40 rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                disabled={uploadingCover}
              >
                {uploadingCover ? (
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : (
                  <>
                    <ImageIcon className="h-8 w-8 mb-2" />
                    <span>Adicionar imagem de capa</span>
                  </>
                )}
              </button>
            )}
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleUpload(file, "cover")
              }}
            />
            <p className="text-sm text-muted-foreground">
              Recomendado: 1200x400 pixels. Aparece no topo da página de agendamento.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="primaryColor">Cor Principal</Label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              id="primaryColor"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="h-10 w-14 rounded border cursor-pointer"
            />
            <Input
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              placeholder="#10B981"
              className="flex-1"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Usada nos botões e destaques da página de agendamento
          </p>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar alterações
        </Button>
      </CardContent>
    </Card>
  )
}
