import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/auth/auth-server'
import { updateClientLogoPath } from '@/lib/database/configuration'

const MAX_BYTES = 2 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/webp', 'image/png', 'image/jpeg'])

export async function POST(request: Request) {
  try {
    await requireAdmin()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SECRET_KEY
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
    }

    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Only webp/png/jpg are allowed' },
        { status: 400 }
      )
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: 'Max file size is 2MB' },
        { status: 400 }
      )
    }

    const bucket = 'client-assets'
    const objectPath = 'logo.webp'
    const logoPath = `${bucket}/${objectPath}`

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const bytes = new Uint8Array(await file.arrayBuffer())
    const uploadRes = await supabase.storage.from(bucket).upload(objectPath, bytes, {
      upsert: true,
      contentType: file.type,
      cacheControl: '3600',
    })

    if (uploadRes.error) {
      return NextResponse.json(
        { error: uploadRes.error.message || 'Failed to upload logo' },
        { status: 500 }
      )
    }

    const { error } = await updateClientLogoPath(logoPath)
    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to save logo path' },
        { status: 500 }
      )
    }

    const logoUrl = `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${bucket}/${objectPath}`
    return NextResponse.json({ logoPath, logoUrl })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Forbidden'
    const status = msg === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: msg }, { status })
  }
}

