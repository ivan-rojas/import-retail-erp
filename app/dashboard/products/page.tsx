'use client'

import { useEffect, useState, useMemo } from 'react'
import { Input } from '@/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select'
import { MultiSelect } from '@/ui/multi-select'
import { Search } from 'lucide-react'
import { useProducts } from '@/lib/hooks/use-products'
import type { Product } from '@/lib/types/product'
import ProductsStatsCard from '@/components/features/products/products-stats-cards'
import AddEditArticulo from '@/components/features/products/add-edit-product'
import ProductsGrid from '@/components/features/products/products-grid'
import {
  canViewInventory,
  getUserProfile,
  type UserProfile,
} from '@/lib/auth/auth'
import { useAuth } from '@/components/providers/auth/auth-provider'
import { useRouter } from 'next/navigation'

export default function ProductsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        router.push('/login')
        return
      }

      const userProfile = await getUserProfile()
      setProfile(userProfile)

      if (!canViewInventory(userProfile)) {
        router.push('/dashboard')
        return
      }
    }

    checkAccess()
  }, [user, router])

  const { data: products = [] } = useProducts()

  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'product' | 'accessory'>(
    'all'
  )
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'active' | 'inactive'
  >('all')
  const [orderBy, setOrderBy] = useState<string[]>([])
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const orderByOptions = [
    { label: 'Nombre', value: 'name' },
    { label: 'Modelo', value: 'model' },
    { label: 'Precio base', value: 'base_price' },
    { label: 'Categoría', value: 'category' },
    { label: 'Fecha de creación', value: 'created_at' },
    { label: 'Estado', value: 'status' },
  ]

  const filteredProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.model.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = filterType === 'all' || product.type === filterType
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && product.status === 'active') ||
        (filterStatus === 'inactive' && product.status === 'inactive')

      return matchesSearch && matchesType && matchesStatus
    })

    // Apply sorting
    if (orderBy.length > 0) {
      filtered.sort((a, b) => {
        for (const field of orderBy) {
          let aValue: string | number
          let bValue: string | number

          switch (field) {
            case 'name':
              aValue = a.name || ''
              bValue = b.name || ''
              break
            case 'model':
              aValue = a.model || ''
              bValue = b.model || ''
              break
            case 'base_price':
              aValue = a.base_price || 0
              bValue = b.base_price || 0
              break
            case 'category':
              aValue = a.category || ''
              bValue = b.category || ''
              break
            case 'created_at':
              aValue = new Date(a.created_at || 0).getTime()
              bValue = new Date(b.created_at || 0).getTime()
              break
            case 'status':
              aValue = a.status || ''
              bValue = b.status || ''
              break
            default:
              continue
          }

          // Handle string comparison
          if (typeof aValue === 'string' && typeof bValue === 'string') {
            const comparison = aValue.localeCompare(bValue)
            if (comparison !== 0)
              return sortDirection === 'asc' ? comparison : -comparison
          } else {
            // Handle numeric/date comparison
            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
          }
        }
        return 0
      })
    }

    return filtered
  }, [products, searchTerm, filterType, filterStatus, orderBy, sortDirection])

  const handleProductChange = () => {
    // Reset editing state after successful save
    setEditingProduct(null)
  }

  if (!user || !profile || !canViewInventory(profile)) {
    return null
  }

  return (
    <div className="calc-container">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="flex justify-between items-start mb-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold ">Productos</h1>
            <p className="text-muted-foreground">
              Gestión de productos y accesorios
            </p>
          </div>
          <AddEditArticulo
            editingProduct={editingProduct}
            onProductChange={handleProductChange}
          />
        </div>

        {/* Stats Cards */}
        <ProductsStatsCard />

        {/* Filters and Search */}
        <div className="rounded-lg border p-6 mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" />
              <Input
                placeholder="Buscar por nombre, modelo o SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={filterType}
              onValueChange={(value: 'all' | 'product' | 'accessory') =>
                setFilterType(value)
              }
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Tipos</SelectItem>
                <SelectItem value="product">Productos</SelectItem>
                <SelectItem value="accessory">Accesorios</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filterStatus}
              onValueChange={(value: 'all' | 'active' | 'inactive') =>
                setFilterStatus(value)
              }
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Estados</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div>
              <MultiSelect
                options={orderByOptions}
                selected={orderBy}
                onChange={setOrderBy}
                placeholder="Ordenar por..."
                hideLabels
                hideSearch
                isGroupOrOrder
              />
            </div>
            <div>
              <Select
                value={sortDirection}
                onValueChange={(value: 'asc' | 'desc') =>
                  setSortDirection(value)
                }
              >
                <SelectTrigger className="min-h-10">
                  <SelectValue placeholder="Dirección" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">ASC</SelectItem>
                  <SelectItem value="desc">DESC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          <ProductsGrid
            products={filteredProducts}
            allProducts={products}
            setEditingProduct={setEditingProduct}
          />
        </div>
      </div>
    </div>
  )
}
