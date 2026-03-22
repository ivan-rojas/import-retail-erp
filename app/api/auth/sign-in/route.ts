import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAuditLog, getAuditContext } from '@/lib/database/audit'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) {
      return NextResponse.json(
        { error: 'email and password are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    const auditContext = await getAuditContext()

    if (error) {
      // Audit failed login
      if (auditContext) {
        try {
          await createAuditLog(
            {
              action: 'LOGIN',
              table_name: 'profiles',
              business_context: {
                email,
                success: false,
                error: error.message,
              },
              notes: `Failed login attempt for ${email}`,
            },
            { ...auditContext, user_email: email }
          )
        } catch (auditError) {
          console.error('Failed to create audit log:', auditError)
        }
      }

      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (auditContext) {
      try {
        await createAuditLog(
          {
            action: 'LOGIN',
            table_name: 'profiles',
            business_context: { email, success: true },
            notes: `Login successful for ${email}`,
          },
          { ...auditContext, user_email: email }
        )
      } catch (auditError) {
        console.error('Failed to create audit log:', auditError)
      }
    }

    return NextResponse.json({ data })
  } catch (e) {
    console.error('Error signing in:', e)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
