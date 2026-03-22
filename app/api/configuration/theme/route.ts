import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getPersonalizationConfigWithClient } from '@/lib/database/configuration'

/** Public endpoint: returns theme colors (no auth). Used by login and initial load. */
export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SECRET_KEY
    if (!url || !serviceRoleKey) {
      return NextResponse.json(
        { main: { light: '', dark: '' }, secondary: { light: '', dark: '' } }
      )
    }

    const supabase = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data, error } = await getPersonalizationConfigWithClient(supabase)
    if (error) {
      return NextResponse.json(
        { main: { light: '', dark: '' }, secondary: { light: '', dark: '' } }
      )
    }
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { main: { light: '', dark: '' }, secondary: { light: '', dark: '' } }
    )
  }
}
