'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/tabs'
// IMEI search handled by dedicated component now
import type {
  ProductSelectionMethod,
  UseSaleSelectionApi,
} from './cart-selection/use-sale-selection'
import { Cable, Smartphone, RefreshCw, Package } from 'lucide-react'
import ProductFeatureSelection from './cart-selection/product-feature-selection'
import ProductIMEISelection from './cart-selection/product-imei-selection'
import AccessorySelection from './cart-selection/accessory-selection'
import TradeInSelection from './cart-selection/trade-in-selection'
import { AddServiceDialog } from './cart-selection/selected-products'

interface ProductSelectionProps {
  selection: UseSaleSelectionApi
  isReservation?: boolean
  /** When editing a sale, pass its ID so IMEI lookup allows re-adding same-sale devices. */
  saleId?: string | null
}

export default function ProductsSelection({
  selection,
  isReservation = false,
  saleId,
}: ProductSelectionProps) {
  const { state, setState } = selection

  const handleTabChange = (value: string) => {
    setState((prev) => ({
      ...prev,
      productSelectionMethod: value as ProductSelectionMethod,
    }))
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-4 w-4" /> Selección de Producto *
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Agrega productos al carrito usando IMEI, características o accesorios
          </p>
        </div>
        <AddServiceDialog selection={selection} />
      </CardHeader>
      <CardContent>
        <Tabs
          value={state.productSelectionMethod}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
            <TabsTrigger value="imei" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              IMEI
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Características
            </TabsTrigger>
            <TabsTrigger value="accessory" className="flex items-center gap-2">
              <Cable className="h-4 w-4" />
              Accesorios
            </TabsTrigger>
            <TabsTrigger value="tradein" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Parte Pago
            </TabsTrigger>
          </TabsList>

          <TabsContent value="imei" className="mt-4">
            <ProductIMEISelection
              onAdd={(device, price) =>
                selection.addProductToSelection(device, price)
              }
              includeInRepair={isReservation}
              saleId={saleId}
            />
          </TabsContent>

          <TabsContent value="features" className="mt-4">
            <ProductFeatureSelection
              onAdd={(item, price) =>
                selection.addProductToSelection(item, price)
              }
              includeInRepair={isReservation}
              saleId={saleId}
            />
          </TabsContent>

          <TabsContent value="accessory" className="mt-4">
            <AccessorySelection
              selection={selection}
              includeInRepair={isReservation}
            />
          </TabsContent>

          <TabsContent value="tradein" className="mt-4">
            <TradeInSelection
              tradeIns={selection.state.tradeIns}
              onTradeInsChange={selection.updateTradeIns}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
