import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'

export const CONFIG_KEY_MAIN = 'General.Customization.Color.Main'
export const CONFIG_KEY_SECONDARY = 'General.Customization.Color.Secondary'
export const CONFIG_KEY_CLIENT_NAME = 'General.Customization.Client.Name'
export const CONFIG_KEY_CLIENT_LOGO = 'General.Customization.Client.Logo'
export const CONFIG_KEY_CLIENT_SUBTITLE = 'General.Customization.Client.Subtitle'

export type ClientBranding = {
  name: string
  logoPath: string
  subtitle: string
}

export type ThemeColorPayload = {
  light: string
  dark: string
}

export type PersonalizationConfig = {
  main: ThemeColorPayload
  secondary: ThemeColorPayload
}

function parseConfigValue(value: string | null): ThemeColorPayload {
  if (!value) return { light: '', dark: '' }
  try {
    const o = JSON.parse(value) as Record<string, string>
    return {
      light: (o.light && /^#[0-9A-Fa-f]{6}$/.test(o.light)) ? o.light : '',
      dark: (o.dark && /^#[0-9A-Fa-f]{6}$/.test(o.dark)) ? o.dark : '',
    }
  } catch {
    return { light: '', dark: '' }
  }
}

export async function getPersonalizationConfig(): Promise<{
  data: PersonalizationConfig | null
  error: Error | null
}> {
  const supabase = await createClient()
  const { data: rows, error } = await supabase
    .from('configuration')
    .select('config_key, config_value')
    .in('config_key', [CONFIG_KEY_MAIN, CONFIG_KEY_SECONDARY])
    .eq('status', 'active')

  if (error) {
    return { data: null, error: error as Error }
  }

  const mainRow = (rows ?? []).find((r) => r.config_key === CONFIG_KEY_MAIN)
  const secondaryRow = (rows ?? []).find(
    (r) => r.config_key === CONFIG_KEY_SECONDARY
  )

  const config: PersonalizationConfig = {
    main: parseConfigValue(mainRow?.config_value ?? null),
    secondary: parseConfigValue(secondaryRow?.config_value ?? null),
  }

  return { data: config, error: null }
}

/** Fetch theme config with any Supabase client (e.g. service role for public routes). */
export async function getPersonalizationConfigWithClient(
  supabase: SupabaseClient
): Promise<{ data: PersonalizationConfig; error: Error | null }> {
  const { data: rows, error } = await supabase
    .from('configuration')
    .select('config_key, config_value')
    .in('config_key', [CONFIG_KEY_MAIN, CONFIG_KEY_SECONDARY])
    .eq('status', 'active')

  if (error) {
    return {
      data: { main: { light: '', dark: '' }, secondary: { light: '', dark: '' } },
      error: error as Error,
    }
  }

  const mainRow = (rows ?? []).find((r) => r.config_key === CONFIG_KEY_MAIN)
  const secondaryRow = (rows ?? []).find(
    (r) => r.config_key === CONFIG_KEY_SECONDARY
  )
  const config: PersonalizationConfig = {
    main: parseConfigValue(mainRow?.config_value ?? null),
    secondary: parseConfigValue(secondaryRow?.config_value ?? null),
  }
  return { data: config, error: null }
}

export async function updatePersonalizationConfig(
  config: PersonalizationConfig
): Promise<{ error: Error | null }> {
  const supabase = await createClient()

  const mainValue = JSON.stringify(config.main)
  const secondaryValue = JSON.stringify(config.secondary)

  const [mainRes, secondaryRes] = await Promise.all([
    supabase
      .from('configuration')
      .update({ config_value: mainValue, updated_at: new Date().toISOString() })
      .eq('config_key', CONFIG_KEY_MAIN)
      .eq('status', 'active'),
    supabase
      .from('configuration')
      .update({
        config_value: secondaryValue,
        updated_at: new Date().toISOString(),
      })
      .eq('config_key', CONFIG_KEY_SECONDARY)
      .eq('status', 'active'),
  ])

  if (mainRes.error) return { error: mainRes.error as Error }
  if (secondaryRes.error) return { error: secondaryRes.error as Error }
  return { error: null }
}

function parseLogoPath(v: string | null): string {
  if (!v) return ''
  return v.trim()
}

export async function getClientBrandingWithClient(
  supabase: SupabaseClient
): Promise<{ data: ClientBranding; error: Error | null }> {
  const { data: rows, error } = await supabase
    .from('configuration')
    .select('config_key, config_value')
    .in('config_key', [
      CONFIG_KEY_CLIENT_NAME,
      CONFIG_KEY_CLIENT_LOGO,
      CONFIG_KEY_CLIENT_SUBTITLE,
    ])
    .eq('status', 'active')

  if (error) {
    return {
      data: { name: 'Import Retail', logoPath: '', subtitle: 'Sistema de Gestión de Inventario' },
      error: error as Error,
    }
  }

  const nameRow = (rows ?? []).find((r) => r.config_key === CONFIG_KEY_CLIENT_NAME)
  const logoRow = (rows ?? []).find((r) => r.config_key === CONFIG_KEY_CLIENT_LOGO)
  const subtitleRow = (rows ?? []).find(
    (r) => r.config_key === CONFIG_KEY_CLIENT_SUBTITLE
  )

  return {
    data: {
      name: (nameRow?.config_value ?? '').trim() || 'Import Retail',
      logoPath: parseLogoPath(logoRow?.config_value ?? null),
      subtitle: (subtitleRow?.config_value ?? '').trim() || 'Sistema de Gestión de Inventario',
    },
    error: null,
  }
}

export async function updateClientName(name: string): Promise<{ error: Error | null }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('configuration')
    .update({ config_value: name, updated_at: new Date().toISOString() })
    .eq('config_key', CONFIG_KEY_CLIENT_NAME)
    .eq('status', 'active')
  return { error: (error as Error) ?? null }
}

export async function updateClientLogoPath(logoPath: string): Promise<{ error: Error | null }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('configuration')
    .update({ config_value: logoPath, updated_at: new Date().toISOString() })
    .eq('config_key', CONFIG_KEY_CLIENT_LOGO)
    .eq('status', 'active')
  return { error: (error as Error) ?? null }
}

export async function updateClientSubtitle(subtitle: string): Promise<{ error: Error | null }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('configuration')
    .update({ config_value: subtitle, updated_at: new Date().toISOString() })
    .eq('config_key', CONFIG_KEY_CLIENT_SUBTITLE)
    .eq('status', 'active')
  return { error: (error as Error) ?? null }
}
