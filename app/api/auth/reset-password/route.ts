import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAuditLog, getAuditContext } from '@/lib/database/audit'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { current_password, new_password } = (await request
      .json()
      .catch(() => ({}))) as {
      current_password?: string
      new_password?: string
    }

    if (!new_password) {
      return NextResponse.json(
        { error: 'Nueva contraseña es requerida' },
        { status: 400 }
      )
    }

    const auditContext = await getAuditContext()
    if (!auditContext) {
      return NextResponse.json(
        { error: 'Failed to get audit context' },
        { status: 500 }
      )
    }

    // If current_password provided, verify it
    if (current_password) {
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: current_password,
      })
      if (verifyError) {
        try {
          await createAuditLog(
            {
              action: 'PASSWORD_RESET',
              table_name: 'profiles',
              business_context: { email: user.email!, success: false },
              notes: `Failed password reset attempt for ${user.email!}`,
            },
            auditContext
          )
        } catch (auditError) {
          console.error(
            'Failed to create audit log for password reset failure:',
            auditError
          )
        }
        return NextResponse.json(
          { error: 'Contraseña actual incorrecta' },
          { status: 400 }
        )
      }
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: new_password,
    })
    if (updateError) {
      if (updateError.code === 'same_password') {
        return NextResponse.json(
          { error: 'La nueva contraseña no puede ser la misma que la actual' },
          { status: 400 }
        )
      }
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    // Clear flag on profile
    const { error: flagError } = await supabase
      .from('profiles')
      .update({ must_reset_password: false })
      .eq('id', user.id)

    if (flagError) {
      console.error('Error clearing flag:', flagError)
      return NextResponse.json({ error: flagError.message }, { status: 500 })
    }

    try {
      await createAuditLog(
        {
          action: 'PASSWORD_RESET',
          table_name: 'profiles',
          business_context: { email: user.email!, success: true },
          notes: `Password reset successful for ${user.email!}`,
        },
        auditContext
      )
    } catch (auditError) {
      console.error(
        'Failed to create audit log for password reset success:',
        auditError
      )
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Error in POST /api/auth/reset-password:', e)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
