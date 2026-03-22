'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { useTheme } from 'next-themes'
import {
  applyThemeColorsForMode,
  getStoredPrimaryColor,
  getStoredBackgroundColor,
  setStoredPrimaryColor,
  setStoredBackgroundColor,
  type ThemeMode,
} from '@/lib/theme/theme-color'

type ThemeColorContextValue = {
  primaryLight: string | null
  primaryDark: string | null
  backgroundLight: string | null
  backgroundDark: string | null
  setPrimaryColor: (mode: ThemeMode, hex: string | null) => void
  setBackgroundColor: (mode: ThemeMode, hex: string | null) => void
  resolvedTheme: 'light' | 'dark' | undefined
  /** True once theme has been loaded from server (or fetch finished). Use to avoid flash on login. */
  themeReady: boolean
}

const ThemeColorContext = createContext<ThemeColorContextValue | null>(null)

export function ThemeColorProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme()
  const [primaryLight, setPrimaryLight] = useState<string | null>(null)
  const [primaryDark, setPrimaryDark] = useState<string | null>(null)
  const [backgroundLight, setBackgroundLight] = useState<string | null>(null)
  const [backgroundDark, setBackgroundDark] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [themeReady, setThemeReady] = useState(false)

  const mode: ThemeMode | null =
    resolvedTheme === 'light' || resolvedTheme === 'dark' ? resolvedTheme : null

  useEffect(() => {
    setPrimaryLight(getStoredPrimaryColor('light'))
    setPrimaryDark(getStoredPrimaryColor('dark'))
    setBackgroundLight(getStoredBackgroundColor('light'))
    setBackgroundDark(getStoredBackgroundColor('dark'))
    setMounted(true)
  }, [])

  // Load theme from server (login and first visit use this)
  useEffect(() => {
    if (!mounted) return
    let done = false
    const setReady = () => {
      if (!done) {
        done = true
        setThemeReady(true)
      }
    }
    const t = setTimeout(setReady, 3000)
    fetch('/api/configuration/theme')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.main && data?.secondary) {
          const apply = (mode: 'light' | 'dark') => {
            if (data.main[mode]) {
              setStoredPrimaryColor(mode, data.main[mode])
              if (mode === 'light') setPrimaryLight(data.main[mode])
              else setPrimaryDark(data.main[mode])
            }
            if (data.secondary[mode]) {
              setStoredBackgroundColor(mode, data.secondary[mode])
              if (mode === 'light') setBackgroundLight(data.secondary[mode])
              else setBackgroundDark(data.secondary[mode])
            }
          }
          apply('light')
          apply('dark')
          const mode: ThemeMode = resolvedTheme === 'light' || resolvedTheme === 'dark' ? resolvedTheme : 'light'
          applyThemeColorsForMode(mode)
        }
      })
      .catch(() => {})
      .finally(() => setReady())
    return () => {
      clearTimeout(t)
    }
  }, [mounted])

  useEffect(() => {
    if (!mounted || !mode) return
    applyThemeColorsForMode(mode)
  }, [mounted, mode])

  const setPrimaryColor = useCallback((m: ThemeMode, hex: string | null) => {
    setStoredPrimaryColor(m, hex)
    if (m === 'light') setPrimaryLight(hex)
    else setPrimaryDark(hex)
    if (mode === m) applyThemeColorsForMode(m)
  }, [mode])

  const setBackgroundColor = useCallback((m: ThemeMode, hex: string | null) => {
    setStoredBackgroundColor(m, hex)
    if (m === 'light') setBackgroundLight(hex)
    else setBackgroundDark(hex)
    if (mode === m) applyThemeColorsForMode(m)
  }, [mode])

  return (
    <ThemeColorContext.Provider
      value={{
        primaryLight: mounted ? primaryLight : null,
        primaryDark: mounted ? primaryDark : null,
        backgroundLight: mounted ? backgroundLight : null,
        backgroundDark: mounted ? backgroundDark : null,
        setPrimaryColor,
        setBackgroundColor,
        resolvedTheme: resolvedTheme ?? undefined,
        themeReady,
      }}
    >
      {children}
    </ThemeColorContext.Provider>
  )
}

export function useThemeColor() {
  const ctx = useContext(ThemeColorContext)
  if (!ctx) {
    throw new Error('useThemeColor must be used within ThemeColorProvider')
  }
  return ctx
}
