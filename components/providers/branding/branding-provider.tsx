'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type Branding = {
  name: string
  subtitle: string
  logoUrl: string | null
}

type BrandingContextValue = Branding & {
  loading: boolean
  refresh: () => Promise<void>
}

const BrandingContext = createContext<BrandingContextValue | null>(null)

const DEFAULT_BRANDING: Branding = {
  name: 'Import Retail',
  subtitle: 'Sistema de Gestión de Inventario',
  logoUrl: null,
}

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<Branding>(DEFAULT_BRANDING)
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    try {
      const res = await fetch('/api/configuration/branding', { cache: 'no-store' })
      if (!res.ok) return
      const data = (await res.json()) as {
        name?: string
        subtitle?: string
        logoUrl?: string | null
      }
      setBranding({
        name: (data.name ?? '').trim() || DEFAULT_BRANDING.name,
        subtitle: (data.subtitle ?? '').trim() || DEFAULT_BRANDING.subtitle,
        logoUrl: data.logoUrl ?? null,
      })
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    refresh()
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value = useMemo(
    () => ({
      ...branding,
      loading,
      refresh,
    }),
    [branding, loading]
  )

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>
}

export function useBranding() {
  const ctx = useContext(BrandingContext)
  if (!ctx) throw new Error('useBranding must be used within BrandingProvider')
  return ctx
}

