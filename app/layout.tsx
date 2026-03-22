import type React from 'react'
import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { AuthProvider } from '@/components/providers/auth/auth-provider'
import { QueryProvider } from '@/components/providers/query/query-provider'
import { Toaster } from 'sonner'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { ThemeProvider } from '@/components/providers/theme/theme-provider'
import { ThemeColorProvider } from '@/components/providers/theme-color/theme-color-provider'
import { BrandingProvider } from '@/components/providers/branding/branding-provider'
import { getClientBrandingWithClient } from '@/lib/database/configuration'

export const viewport = {
  themeColor: '#0a0a0a',
}

function buildPublicLogoUrl(supabaseUrl: string, logoPath: string): string | null {
  const cleaned = (logoPath ?? '').trim().replace(/^\/+/, '')
  if (!cleaned) return null
  const parts = cleaned.split('/')
  if (parts.length < 2) return null
  const bucket = parts[0]
  const objectPath = parts.slice(1).join('/')
  const base = supabaseUrl.replace(/\/$/, '')
  return `${base}/storage/v1/object/public/${bucket}/${objectPath}`
}

/** Used to resolve relative OG images (e.g. /apple-touch-icon.png). Optional. */
function resolveMetadataBase(): URL | undefined {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (explicit) {
    try {
      return new URL(explicit.startsWith('http') ? explicit : `https://${explicit}`)
    } catch {
      /* ignore */
    }
  }
  const vercel = process.env.VERCEL_URL?.trim()
  if (vercel) {
    try {
      return new URL(vercel.startsWith('http') ? vercel : `https://${vercel}`)
    } catch {
      /* ignore */
    }
  }
  return undefined
}

/** Link previews (WhatsApp, etc.): prefer branding logo URL; else static icon if metadataBase is set. */
function linkPreviewMetadata(
  siteName: string,
  title: string,
  description: string,
  brandingLogoUrl: string | null,
  metadataBase: URL | undefined
): Pick<Metadata, 'metadataBase' | 'openGraph' | 'twitter'> {
  const shareImage =
    brandingLogoUrl ??
    (metadataBase ? new URL('/apple-touch-icon.png', metadataBase).href : null)

  const base = {
    ...(metadataBase ? { metadataBase } : {}),
    openGraph: {
      title,
      description,
      siteName,
      type: 'website' as const,
      ...(shareImage ? { images: [{ url: shareImage, alt: siteName }] } : {}),
    },
    twitter: {
      card: 'summary' as const,
      title,
      description,
      ...(shareImage ? { images: [shareImage] } : {}),
    },
  }
  return base
}

export async function generateMetadata(): Promise<Metadata> {
  const fallbackName = 'Import Retail'
  const description = 'Sistema de gestión de inventario'

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SECRET_KEY

    const metadataBase = resolveMetadataBase()

    if (!supabaseUrl || !serviceRoleKey) {
      return {
        title: `${fallbackName}`,
        description,
        manifest: '/manifest.webmanifest',
        appleWebApp: {
          capable: true,
          statusBarStyle: 'default',
          title: fallbackName,
        },
        ...linkPreviewMetadata(
          fallbackName,
          fallbackName,
          description,
          null,
          metadataBase
        ),
      }
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data } = await getClientBrandingWithClient(supabase)
    const name = data.name || fallbackName
    const subtitle = (data.subtitle ?? '').trim()
    const title = subtitle ? `${name}  -  ${subtitle}` : name
    const logoUrl = buildPublicLogoUrl(supabaseUrl, data.logoPath)

    return {
      title,
      description,
      manifest: '/manifest.webmanifest',
      appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title,
      },
      icons: logoUrl
        ? {
            icon: [{ url: logoUrl }],
            shortcut: [{ url: logoUrl }],
            apple: [{ url: logoUrl }],
          }
        : {
            icon: [{ url: '/apple-touch-icon.png' }],
            apple: '/apple-touch-icon.png',
          },
      ...linkPreviewMetadata(name, title, description, logoUrl, metadataBase),
    }
  } catch {
    const metadataBase = resolveMetadataBase()
    return {
      title: `${fallbackName}`,
      description,
      manifest: '/manifest.webmanifest',
      appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: fallbackName,
      },
      ...linkPreviewMetadata(
        fallbackName,
        fallbackName,
        description,
        null,
        metadataBase
      ),
    }
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <style>{`
          html {
            font-family: ${GeistSans.style.fontFamily};
            --font-sans: ${GeistSans.variable};
            --font-mono: ${GeistMono.variable};
          }
        `}</style>
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ThemeColorProvider>
            <BrandingProvider>
              <AuthProvider>
                <QueryProvider>
                {children}
                <Toaster position="top-right" />
                <SpeedInsights />
                <Analytics />
                </QueryProvider>
              </AuthProvider>
            </BrandingProvider>
          </ThemeColorProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
