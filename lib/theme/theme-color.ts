export type ThemeMode = 'light' | 'dark'

const THEME_PRIMARY_LIGHT = 'app-theme-primary-light'
const THEME_PRIMARY_DARK = 'app-theme-primary-dark'
const THEME_BACKGROUND_LIGHT = 'app-theme-background-light'
const THEME_BACKGROUND_DARK = 'app-theme-background-dark'

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/

function getContrastForeground(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const l = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return l > 0.5 ? '#0a0a0a' : '#fafafa'
}

function applyPrimaryColor(hex: string | null) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (!hex) {
    root.style.removeProperty('--primary')
    root.style.removeProperty('--primary-foreground')
    root.style.removeProperty('--ring')
    root.style.removeProperty('--sidebar-primary')
    root.style.removeProperty('--sidebar-primary-foreground')
    root.style.removeProperty('--sidebar-accent')
    root.style.removeProperty('--sidebar-accent-foreground')
    root.style.removeProperty('--chart-1')
    return
  }
  root.style.setProperty('--primary', hex)
  root.style.setProperty('--ring', hex)
  root.style.setProperty('--sidebar-primary', hex)
  root.style.setProperty('--chart-1', hex)
  const fg = getContrastForeground(hex)
  root.style.setProperty('--primary-foreground', fg)
  root.style.setProperty('--sidebar-primary-foreground', fg)
  // Sidebar hover/active use accent — tie them to primary so they respect the theme
  root.style.setProperty('--sidebar-accent', hex)
  root.style.setProperty('--sidebar-accent-foreground', fg)
}

function applyBackgroundColor(hex: string | null) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (!hex) {
    root.style.removeProperty('--background')
    root.style.removeProperty('--foreground')
    root.style.removeProperty('--card')
    root.style.removeProperty('--card-foreground')
    root.style.removeProperty('--popover')
    root.style.removeProperty('--popover-foreground')
    root.style.removeProperty('--sidebar')
    root.style.removeProperty('--sidebar-foreground')
    root.style.removeProperty('--muted')
    root.style.removeProperty('--muted-foreground')
    root.style.removeProperty('--secondary')
    root.style.removeProperty('--secondary-foreground')
    root.style.removeProperty('--accent')
    root.style.removeProperty('--accent-foreground')
    root.style.removeProperty('--border')
    root.style.removeProperty('--input')
    return
  }
  const fg = getContrastForeground(hex)
  root.style.setProperty('--background', hex)
  root.style.setProperty('--foreground', fg)
  root.style.setProperty('--card', hex)
  root.style.setProperty('--card-foreground', fg)
  root.style.setProperty('--popover', hex)
  root.style.setProperty('--popover-foreground', fg)
  root.style.setProperty('--sidebar', hex)
  root.style.setProperty('--sidebar-foreground', fg)
  root.style.setProperty('--muted', hex)
  root.style.setProperty('--muted-foreground', fg)
  root.style.setProperty('--secondary', hex)
  root.style.setProperty('--secondary-foreground', fg)
  root.style.setProperty('--accent', hex)
  root.style.setProperty('--accent-foreground', fg)
  const isDark = getLuminance(hex) < 0.5
  root.style.setProperty('--border', isDark ? lighten(hex, 1.2) : darken(hex, 0.88))
  root.style.setProperty('--input', isDark ? lighten(hex, 1.15) : darken(hex, 0.96))
}

/** Apply stored primary and background for the given mode (light/dark). */
export function applyThemeColorsForMode(mode: ThemeMode) {
  if (typeof document === 'undefined') return
  const primary = getStoredPrimaryColor(mode)
  const background = getStoredBackgroundColor(mode)
  applyPrimaryColor(primary)
  applyBackgroundColor(background)
}

function getLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function darken(hex: string, factor: number): string {
  const r = Math.round(parseInt(hex.slice(1, 3), 16) * factor)
  const g = Math.round(parseInt(hex.slice(3, 5), 16) * factor)
  const b = Math.round(parseInt(hex.slice(5, 7), 16) * factor)
  return `#${[r, g, b].map((x) => Math.max(0, x).toString(16).padStart(2, '0')).join('')}`
}

function lighten(hex: string, factor: number): string {
  const r = Math.min(255, Math.round(parseInt(hex.slice(1, 3), 16) * factor))
  const g = Math.min(255, Math.round(parseInt(hex.slice(3, 5), 16) * factor))
  const b = Math.min(255, Math.round(parseInt(hex.slice(5, 7), 16) * factor))
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`
}

function storageKeyPrimary(mode: ThemeMode): string {
  return mode === 'light' ? THEME_PRIMARY_LIGHT : THEME_PRIMARY_DARK
}

function storageKeyBackground(mode: ThemeMode): string {
  return mode === 'light' ? THEME_BACKGROUND_LIGHT : THEME_BACKGROUND_DARK
}

export function getStoredPrimaryColor(mode: ThemeMode): string | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(storageKeyPrimary(mode))
  if (!stored || !HEX_REGEX.test(stored)) return null
  return stored
}

export function getStoredBackgroundColor(mode: ThemeMode): string | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(storageKeyBackground(mode))
  if (!stored || !HEX_REGEX.test(stored)) return null
  return stored
}

export function setStoredPrimaryColor(mode: ThemeMode, hex: string | null) {
  if (typeof window === 'undefined') return
  if (hex) localStorage.setItem(storageKeyPrimary(mode), hex)
  else localStorage.removeItem(storageKeyPrimary(mode))
}

export function setStoredBackgroundColor(mode: ThemeMode, hex: string | null) {
  if (typeof window === 'undefined') return
  if (hex) localStorage.setItem(storageKeyBackground(mode), hex)
  else localStorage.removeItem(storageKeyBackground(mode))
}
