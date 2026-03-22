import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { Package, Smartphone, Cable, CircleCheck } from 'lucide-react'
import { useProducts } from '@/lib/hooks/use-products'
import React from 'react'

export default function ProductsStatsCard() {
  const { data: products = [] } = useProducts()
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Artículos</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{products.length}</div>
          <p className="text-xs text-muted-foreground">
            En el catálogo de artículos
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Productos</CardTitle>
          <Smartphone className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {products.filter((p) => p.type === 'product').length}
          </div>
          <p className="text-xs text-muted-foreground">Modelos de productos</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Accesorios</CardTitle>
          <Cable className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {products.filter((p) => p.type === 'accessory').length}
          </div>
          <p className="text-xs text-muted-foreground">Tipos de accesorios</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Activos</CardTitle>
          <CircleCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {products.filter((p) => p.status === 'active').length}
          </div>
          <p className="text-xs text-muted-foreground">Artículos disponibles</p>
        </CardContent>
      </Card>
    </div>
  )
}
