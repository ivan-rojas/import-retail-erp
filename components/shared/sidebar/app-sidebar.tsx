'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/providers/auth/auth-provider'
import {
  Smartphone,
  ShoppingCart,
  Package,
  Users,
  Truck,
  ClipboardClock,
  LayoutDashboard,
  DollarSign,
  UserCheck,
  Wrench,
  FolderTree,
  Palette,
  BadgeCheck,
} from 'lucide-react'
import { hasRole, isAdmin } from '@/lib/auth/auth'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from '@/ui/sidebar'
import { Skeleton } from '@/ui/skeleton'
import { useBranding } from '@/components/providers/branding/branding-provider'

const navigation = [
  {
    name: 'Inicio',
    href: '/',
    icon: LayoutDashboard,
    profile: ['admin', 'seller', 'inventory'],
  },
  {
    name: 'Ventas',
    href: '/sales',
    icon: ShoppingCart,
    profile: ['seller', 'inventory'],
  },
  {
    name: 'Entregas',
    href: '/deliveries',
    icon: Truck,
    profile: ['seller', 'inventory'],
  },
  {
    name: 'Inventario',
    href: '/inventory',
    icon: Smartphone,
    profile: ['inventory'],
  },
  {
    name: 'Productos',
    href: '/products',
    icon: Package,
    profile: ['inventory'],
  },
  {
    name: 'Clientes',
    href: '/clients',
    icon: UserCheck,
    profile: ['seller', 'inventory'],
  },
  {
    name: 'Técnicos',
    href: '/technicians',
    icon: Wrench,
    profile: ['admin'],
  },
  {
    name: 'Categorías de Productos',
    href: '/product-categories',
    icon: FolderTree,
    profile: ['inventory', 'admin'],
  },
]

const adminNavigation = [
  {
    name: 'Ganancias',
    href: '/profits',
    icon: DollarSign,
  },
  {
    name: 'Usuarios',
    href: '/users',
    icon: Users,
  },
  {
    name: 'Auditoría',
    href: '/audit',
    icon: ClipboardClock,
  },
]

const preferencesNavigation = [
  {
    name: 'Colores',
    href: '/colors',
    icon: Palette,
  },
  {
    name: 'Marca',
    href: '/branding',
    icon: BadgeCheck,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user, profile, loading: authLoading } = useAuth()
  const { name, subtitle, logoUrl, loading: brandingLoading } = useBranding()

  // AuthProvider sets loading=false before profile finishes fetching.
  // To avoid menu "popping" (showing only Personalización first), keep skeleton
  // until profile is available when a user session exists.
  const menuLoading = authLoading || (!!user && !profile)

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/dashboard" className="no-underline">
          <div className="flex items-center gap-3">
            <div className="p-2">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt={name}
                  width={50}
                  height={50}
                  className="rounded-lg"
                />
              ) : (
                <div className="h-[50px] w-[50px] rounded-lg bg-muted" />
              )}
            </div>
            <div>
              {brandingLoading ? (
                <div className="space-y-2 pt-1">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ) : (
                <>
                  <h1 className="text-lg font-bold text-black dark:text-white">
                    {name}
                  </h1>
                  <p className="text-xs">{subtitle}</p>
                </>
              )}
            </div>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {menuLoading ? (
          <>
            <SidebarGroup>
              <SidebarGroupContent className="space-y-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SidebarMenuSkeleton key={`nav-skel-${i}`} showIcon />
                ))}
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupContent className="space-y-1">
                <Skeleton className="h-4 w-28 mx-2 my-2" />
                {Array.from({ length: 3 }).map((_, i) => (
                  <SidebarMenuSkeleton key={`admin-skel-${i}`} showIcon />
                ))}
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupContent className="space-y-1">
                <Skeleton className="h-4 w-28 mx-2 my-2" />
                {Array.from({ length: 2 }).map((_, i) => (
                  <SidebarMenuSkeleton key={`pref-skel-${i}`} showIcon />
                ))}
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        ) : (
          <>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigation.map((item) => {
                    const fullHref = `/dashboard${item.href}`
                    const isActive = pathname === fullHref
                    if (
                      item.profile &&
                      !hasRole(profile, item.profile) &&
                      !isAdmin(profile)
                    ) {
                      return null
                    }
                    return (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.name}
                        >
                          <Link href={fullHref}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.name}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            {/* Admin section */}
            {profile && isAdmin(profile) && (
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarGroupLabel>Administración</SidebarGroupLabel>
                  {adminNavigation.map((item) => {
                    const fullHref = `/dashboard${item.href}`
                    const isActive = pathname === fullHref
                    return (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.name}
                        >
                          <Link href={fullHref}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.name}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarGroupContent>
              </SidebarGroup>
            )}
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarGroupLabel>Personalización</SidebarGroupLabel>
                {preferencesNavigation.map((item) => {
                  const fullHref = `/dashboard${item.href}`
                  const isActive = pathname === fullHref
                  return (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.name}
                      >
                        <Link href={fullHref}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>
    </Sidebar>
  )
}
