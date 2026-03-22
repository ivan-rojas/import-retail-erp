'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/auth/auth-provider'
import { Button } from '@/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
import { Label } from '@/ui/label'
import { toast } from 'sonner'
import { isAdmin } from '@/lib/auth/auth'
import { Loader2, Save, Image as ImageIcon, Type, Upload } from 'lucide-react'

export default function MarcaPage() {
  const { profile } = useAuth()
  const canEditBranding = isAdmin(profile)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [clientName, setClientName] = useState('')
  const [clientSubtitle, setClientSubtitle] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch('/api/configuration/branding')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return
        setClientName(data.name ?? '')
        setClientSubtitle(data.subtitle ?? '')
        setLogoUrl(data.logoUrl ?? null)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!logoFile) {
      setLogoPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(logoFile)
    setLogoPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [logoFile])

  const handleSave = async () => {
    if (!canEditBranding) return
    setSaving(true)
    try {
      const name = clientName.trim()
      const subtitle = clientSubtitle.trim()

      if (name || subtitle) {
        const res = await fetch('/api/configuration/branding', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...(name ? { name } : {}),
            subtitle,
          }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          toast.error(err?.error ?? 'Error al guardar')
          return
        }
      }

      if (logoFile) {
        const fd = new FormData()
        fd.append('file', logoFile)
        const res = await fetch('/api/configuration/branding/logo', {
          method: 'POST',
          body: fd,
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          toast.error(err?.error ?? 'Error al subir logo')
          return
        }
        const data = await res.json().catch(() => ({}))
        setLogoUrl(data.logoUrl ? `${data.logoUrl}?v=${Date.now()}` : null)
        setLogoFile(null)
      }

      toast.success('Cambios guardados')
      window.location.reload()
    } catch {
      toast.error('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Marca</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nombre y logo</CardTitle>
          <CardDescription>
            Cambiá el nombre y el logo. Solo admins pueden guardar cambios.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4 text-muted-foreground" />
              <input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Nombre de la app"
                disabled={!canEditBranding}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Subtítulo</Label>
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4 text-muted-foreground" />
              <input
                value={clientSubtitle}
                onChange={(e) => setClientSubtitle(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Sistema de Inventario"
                disabled={!canEditBranding}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Logo</Label>
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-lg border border-input bg-muted flex items-center justify-center overflow-hidden">
                {(logoPreviewUrl || logoUrl) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={(logoPreviewUrl || logoUrl) ?? undefined}
                    alt="Logo"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                )}
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex flex-col gap-2">
                  <input
                    id="client-logo-file"
                    type="file"
                    accept="image/webp,image/png,image/jpeg"
                    onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                    disabled={!canEditBranding}
                    className="sr-only"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <Button asChild variant="outline" size="sm" disabled={!canEditBranding}>
                      <label htmlFor="client-logo-file" className="cursor-pointer">
                        <Upload className="h-4 w-4" />
                        <span className="ml-2">Seleccionar logo</span>
                      </label>
                    </Button>
                    {logoFile ? (
                      <span className="text-xs text-muted-foreground truncate max-w-[260px]">
                        {logoFile.name}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Ningún archivo seleccionado
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Máx 2MB. Formatos: webp/png/jpg. Se reemplaza el logo actual.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <Button disabled={!canEditBranding || saving} onClick={handleSave}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span className="ml-2">Guardar cambios</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

