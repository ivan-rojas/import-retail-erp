import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { getClientBrandingWithClient } from '@/lib/database/configuration'

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const fallbackName = 'TL iPhones'

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SECRET_KEY
    if (!supabaseUrl || !serviceRoleKey) {
      return {
        name: fallbackName,
        short_name: fallbackName,
        start_url: '/',
        display: 'standalone',
        background_color: '#0a0a0a',
        theme_color: '#0a0a0a',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      }
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data } = await getClientBrandingWithClient(supabase)

    return {
      name: data.name || fallbackName,
      short_name: data.name || fallbackName,
      start_url: '/',
      display: 'standalone',
      background_color: '#0a0a0a',
      theme_color: '#0a0a0a',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
    }
  } catch {
    return {
      name: fallbackName,
      short_name: fallbackName,
      start_url: '/',
      display: 'standalone',
      background_color: '#0a0a0a',
      theme_color: '#0a0a0a',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
    }
  }
}

