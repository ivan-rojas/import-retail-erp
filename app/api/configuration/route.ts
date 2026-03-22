import { NextResponse } from 'next/server'
import { getCurrentUserServer } from '@/lib/auth/auth-server'
import {
  getPersonalizationConfig,
  updatePersonalizationConfig,
  type PersonalizationConfig,
} from '@/lib/database/configuration'

export async function GET() {
  try {
    const user = await getCurrentUserServer()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await getPersonalizationConfig()
    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to load configuration' },
        { status: 500 }
      )
    }

    return NextResponse.json(data ?? { main: { light: '', dark: '' }, secondary: { light: '', dark: '' } })
  } catch (e) {
    console.error('[GET /api/configuration]', e)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUserServer()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as PersonalizationConfig
    if (
      !body ||
      typeof body.main !== 'object' ||
      typeof body.secondary !== 'object'
    ) {
      return NextResponse.json(
        { error: 'Body must include main and secondary with light/dark hex' },
        { status: 400 }
      )
    }

    const config: PersonalizationConfig = {
      main: {
        light: typeof body.main?.light === 'string' ? body.main.light : '',
        dark: typeof body.main?.dark === 'string' ? body.main.dark : '',
      },
      secondary: {
        light: typeof body.secondary?.light === 'string' ? body.secondary.light : '',
        dark: typeof body.secondary?.dark === 'string' ? body.secondary.dark : '',
      },
    }

    const { error } = await updatePersonalizationConfig(config)
    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to save configuration' },
        { status: 500 }
      )
    }

    return NextResponse.json(config)
  } catch (e) {
    console.error('[PUT /api/configuration]', e)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
