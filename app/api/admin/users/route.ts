import { NextResponse } from 'next/server'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'
import { requireAdmin } from '@/lib/auth/auth-server'
import { auditCreate, getAuditContext } from '@/lib/database/audit'

// Minimal profile row type for this endpoint
type ProfileRow = {
  id: string
  email: string
  full_name: string | null
  role: 'super admin' | 'admin' | 'seller' | 'inventory' | 'viewer'
  created_at: string
  updated_at: string
}

export async function GET() {
  try {
    await requireAdmin()

    const supabase_url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const service_role_key = process.env.SUPABASE_SECRET_KEY

    const supabaseClient = createSupabaseAdminClient(
      supabase_url!,
      service_role_key!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Access auth admin api
    const admin = supabaseClient.auth.admin
    const { data, error } = await admin.listUsers()

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to list users' },
        { status: 500 }
      )
    }

    let authUsers = data?.users ?? []

    // Filter out banned users
    authUsers = authUsers.filter((u) => {
      const user = u as any
      // Check banned_until (timestamp if user is banned until a specific date)
      const bannedUntil = user.banned_until

      return !bannedUntil || new Date(bannedUntil) < new Date()
    })

    const userIds = authUsers.map((u) => u.id)
    let profilesById: Record<string, ProfileRow> = {}

    if (userIds.length > 0) {
      const supabase = await createClient()
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(
          'id, email, full_name, role, must_reset_password, created_at, updated_at'
        )
        .in('id', userIds)

      if (profilesError) {
        return NextResponse.json({
          users: authUsers,
          profiles: {},
          warning: 'Failed to fetch some profiles',
        })
      }

      const profiles = (profilesData ?? []) as ProfileRow[]
      const superAdminIds = new Set(
        profiles.filter((p) => p.role === 'super admin').map((p) => p.id)
      )

      // Exclude super admin from auth users
      authUsers = authUsers.filter((u) => !superAdminIds.has(u.id))

      // Build profiles map excluding super admin
      profilesById = profiles
        .filter((p) => p.role !== 'super admin')
        .reduce((acc: Record<string, ProfileRow>, p: ProfileRow) => {
          acc[p.id] = p
          return acc
        }, {})
    }

    return NextResponse.json({
      users: authUsers,
      profiles: profilesById,
    })
  } catch (e: unknown) {
    const message =
      e instanceof Error && typeof e.message === 'string'
        ? e.message
        : 'Unauthorized'
    const status =
      message === 'Forbidden' ? 403 : message === 'Unauthorized' ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SECRET_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Supabase server credentials are not configured' },
        { status: 500 }
      )
    }

    const body = (await request.json().catch(() => ({}))) as {
      email?: string
      password?: string
      full_name?: string
      role?: 'admin' | 'seller' | 'inventory' | 'viewer'
    }

    const email = String(body.email || '')
      .trim()
      .toLowerCase()
    const password = String(body.password || '')
    const full_name =
      typeof body.full_name === 'string' ? body.full_name.trim() : ''
    const role = body.role

    if (!email || !password || !full_name || !role) {
      return NextResponse.json(
        { error: 'email, password, full_name and role are required' },
        { status: 400 }
      )
    }

    const supabaseClient = createSupabaseAdminClient(
      supabaseUrl!,
      serviceRoleKey!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Create the auth user with metadata
    const { data: created, error: createError } =
      await supabaseClient.auth.admin.createUser({
        email,
        password,
        user_metadata: { full_name, role },
        email_confirm: true,
      })

    if (createError || !created?.user) {
      return NextResponse.json(
        { error: createError?.message || 'Failed to create user' },
        { status: 500 }
      )
    }

    const userId = created.user.id

    const supabase = await createClient()

    // Trigger `on_auth_user_created` (handle_new_user) already inserts the profiles row.
    // Do not INSERT here (duplicate PK). Update to enforce email, full_name, role, must_reset_password.
    const { error: profileError, data: profile } = await supabase
      .from('profiles')
      .update({
        email,
        full_name,
        role,
        must_reset_password: true,
      })
      .eq('id', userId)
      .select()
      .single()

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    const auditContext = await getAuditContext()
    if (!auditContext) {
      return NextResponse.json(
        { error: 'Failed to get audit context' },
        { status: 500 }
      )
    }

    await auditCreate('profiles', userId, profile || {}, auditContext, {
      full_name,
      role,
    })

    return NextResponse.json({ user: created.user, profile })
  } catch (e: unknown) {
    console.error(e)
    const message = e instanceof Error ? e.message : 'Unauthorized'
    const status =
      message === 'Forbidden' ? 403 : message === 'Unauthorized' ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
