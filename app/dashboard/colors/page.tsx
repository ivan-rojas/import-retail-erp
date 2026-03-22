'use client'

import { useEffect, useState } from 'react'
import { useThemeColor } from '@/components/providers/theme-color/theme-color-provider'
import { Button } from '@/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
import { Label } from '@/ui/label'
import { Sun, Moon, Loader2, Save } from 'lucide-react'
import type { ThemeMode } from '@/lib/theme/theme-color'
import { toast } from 'sonner'

const DEFAULT_PRIMARY_LIGHT = '#22c55e'
const DEFAULT_PRIMARY_DARK = '#34d399'
const DEFAULT_BACKGROUND_LIGHT = '#fafafa'
const DEFAULT_BACKGROUND_DARK = '#1a1a1a'

function ThemeSection({
  mode,
  label,
  icon: Icon,
  primaryValue,
  backgroundValue,
  setPrimaryColor,
  setBackgroundColor,
  isActive,
}: {
  mode: ThemeMode
  label: string
  icon: React.ElementType
  primaryValue: string
  backgroundValue: string
  setPrimaryColor: (mode: ThemeMode, hex: string | null) => void
  setBackgroundColor: (mode: ThemeMode, hex: string | null) => void
  isActive: boolean
}) {
  const primaryHex = primaryValue
  const fg = (() => {
    const r = parseInt(primaryHex.slice(1, 3), 16) / 255
    const g = parseInt(primaryHex.slice(3, 5), 16) / 255
    const b = parseInt(primaryHex.slice(5, 7), 16) / 255
    const l = 0.2126 * r + 0.7152 * g + 0.0722 * b
    return l > 0.5 ? '#0a0a0a' : '#fafafa'
  })()

  return (
    <Card className={isActive ? 'ring-2 ring-primary' : ''}>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <Icon className="h-5 w-5" />
          {label}
          {isActive && (
            <span className="text-xs font-normal text-muted-foreground">
              (actual)
            </span>
          )}
        </CardTitle>
        <CardDescription>
          Colores para cuando el tema es {mode === 'light' ? 'claro' : 'oscuro'}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Color principal</Label>
          <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] gap-3 items-center">
            <input
              type="color"
              value={primaryValue}
              onChange={(e) => setPrimaryColor(mode, e.target.value)}
              className="h-10 w-20 cursor-pointer rounded border border-input bg-transparent p-1"
            />
            <span className="text-sm font-mono text-muted-foreground break-all">
              {primaryValue}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPrimaryColor(mode, null)}
              className="w-full sm:w-auto"
            >
              Restaurar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Vista previa:</p>
          <Button
            size="sm"
            style={{
              backgroundColor: primaryHex,
              color: fg,
            }}
            className="hover:opacity-90 transition-opacity"
          >
            Botón de ejemplo
          </Button>
        </div>
        <div className="space-y-2">
          <Label>Color de fondo</Label>
          <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] gap-3 items-center">
            <input
              type="color"
              value={backgroundValue}
              onChange={(e) => setBackgroundColor(mode, e.target.value)}
              className="h-10 w-20 cursor-pointer rounded border border-input bg-transparent p-1"
            />
            <span className="text-sm font-mono text-muted-foreground break-all">
              {backgroundValue}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBackgroundColor(mode, null)}
              className="w-full sm:w-auto"
            >
              Restaurar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ColoresPage() {
  const {
    primaryLight,
    primaryDark,
    backgroundLight,
    backgroundDark,
    setPrimaryColor,
    setBackgroundColor,
    resolvedTheme,
  } = useThemeColor()

  const [loadingConfig, setLoadingConfig] = useState(true)
  const [saving, setSaving] = useState(false)

  const isLightActive = resolvedTheme === 'light'
  const isDarkActive = resolvedTheme === 'dark'

  // Load config from DB on mount and apply to theme (and localStorage)
  useEffect(() => {
    let cancelled = false
    setLoadingConfig(true)
    fetch('/api/configuration')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return
        const main = data.main ?? {}
        const sec = data.secondary ?? {}
        if (main.light) setPrimaryColor('light', main.light)
        if (main.dark) setPrimaryColor('dark', main.dark)
        if (sec.light) setBackgroundColor('light', sec.light)
        if (sec.dark) setBackgroundColor('dark', sec.dark)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingConfig(false)
      })
    return () => {
      cancelled = true
    }
  }, [setPrimaryColor, setBackgroundColor])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/configuration', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          main: {
            light: primaryLight ?? '',
            dark: primaryDark ?? '',
          },
          secondary: {
            light: backgroundLight ?? '',
            dark: backgroundDark ?? '',
          },
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err?.error ?? 'Error al guardar')
        return
      }
      toast.success('Cambios guardados')
    } catch {
      toast.error('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (loadingConfig) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-4 px-3 sm:px-4 lg:px-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-center sm:text-left">
          Colores
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ThemeSection
          mode="light"
          label="Tema claro"
          icon={Sun}
          primaryValue={primaryLight ?? DEFAULT_PRIMARY_LIGHT}
          backgroundValue={backgroundLight ?? DEFAULT_BACKGROUND_LIGHT}
          setPrimaryColor={setPrimaryColor}
          setBackgroundColor={setBackgroundColor}
          isActive={isLightActive}
        />

        <ThemeSection
          mode="dark"
          label="Tema oscuro"
          icon={Moon}
          primaryValue={primaryDark ?? DEFAULT_PRIMARY_DARK}
          backgroundValue={backgroundDark ?? DEFAULT_BACKGROUND_DARK}
          setPrimaryColor={setPrimaryColor}
          setBackgroundColor={setBackgroundColor}
          isActive={isDarkActive}
        />
      </div>

      <div className="flex justify-center pt-2">
        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span className="ml-2">Guardar cambios</span>
        </Button>
      </div>
    </div>
  )
}
