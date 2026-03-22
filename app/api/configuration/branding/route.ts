import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/auth/auth-server'
import {
  getClientBrandingWithClient,
  updateClientName,
  updateClientSubtitle,
} from '@/lib/database/configuration'

function buildPublicLogoUrl(
  supabaseUrl: string,
  bucket: string,
  objectPath: string
): string {
  const base = supabaseUrl.replace(/\/$/, '')
  return `${base}/storage/v1/object/public/${bucket}/${objectPath}`
}

function parseBucketAndObject(logoPath: string): { bucket: string; objectPath: string } | null {
  const cleaned = (logoPath ?? '').trim().replace(/^\/+/, '')
  if (!cleaned) return null
  const parts = cleaned.split('/')
  if (parts.length < 2) return null
  return { bucket: parts[0], objectPath: parts.slice(1).join('/') }
}

/** Public: client branding for login/sidebar (no auth). */
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SECRET_KEY
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({
        name: 'TL iPhones',
        logoPath: '',
        logoUrl: null,
      })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data } = await getClientBrandingWithClient(supabase)
    const parsed = parseBucketAndObject(data.logoPath)
    const logoUrl =
      parsed ? buildPublicLogoUrl(supabaseUrl, parsed.bucket, parsed.objectPath) : null

    return NextResponse.json({ ...data, logoUrl })
  } catch {
    return NextResponse.json({
      name: 'Import Retail',
      subtitle: 'Sistema de Gestión de Inventario',
      logoPath: '',
      logoUrl: null,
    })
  }
}

/** Admin: update client name/subtitle. */
export async function PUT(request: Request) {
  try {
    await requireAdmin()
    const body = (await request.json()) as { name?: string; subtitle?: string }
    const name = typeof body?.name === 'string' ? body.name.trim() : undefined
    const subtitle =
      typeof body?.subtitle === 'string' ? body.subtitle.trim() : undefined

    if (!name && !subtitle) {
      return NextResponse.json(
        { error: 'Name or subtitle is required' },
        { status: 400 }
      )
    }

    if (name) {
      const { error } = await updateClientName(name)
      if (error) {
        return NextResponse.json(
          { error: error.message || 'Failed to update name' },
          { status: 500 }
        )
      }
    }

    if (subtitle !== undefined) {
      const { error } = await updateClientSubtitle(subtitle)
      if (error) {
        return NextResponse.json(
          { error: error.message || 'Failed to update subtitle' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ name: name ?? null, subtitle: subtitle ?? null })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Forbidden'
    const status = msg === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: msg }, { status })
  }
}

