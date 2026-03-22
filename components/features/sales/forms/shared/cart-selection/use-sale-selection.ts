'use client'

import { useState, useCallback } from 'react'
import type { InventoryItem } from '@/lib/types/inventory'
import type { TradeInItem } from '@/lib/types/inventory'
import type { SaleItem } from '@/lib/types/sale-item'
import type { TradeIn } from '@/lib/types/trade-ins'
import { convertSaleItemToInventoryItem } from '@/lib/utils/sales'
import { useInventoryItemsForSale } from '@/lib/hooks/use-sales'

export type ProductSelectionMethod =
  | 'imei'
  | 'features'
  | 'accessory'
  | 'tradein'

/** Service line in cart (non-inventory): name, price, cost, optional linked IMEI. */
export interface CartServiceLine {
  id: string
  item_name: string
  item_model: string
  item_price: number
  item_quantity: number
  item_cost: number
  item_notes?: string | null
  linked_product_item_id?: string | null
}

export interface UseSaleSelectionState {
  selectedProducts: InventoryItem[]
  serviceLines: CartServiceLine[]
  tradeIns: TradeInItem[]
  subtotalPrice: string
  totalPrice: string
  netTotal: string
  totalSurcharge: string
  productSelectionMethod: ProductSelectionMethod
  selectedModel: string
  selectedColor: string
  selectedStorage: string
  customPrice: string
}

export interface UseSaleSelectionApi {
  data: InventoryItem[]
  state: UseSaleSelectionState
  setState: React.Dispatch<React.SetStateAction<UseSaleSelectionState>>
  addProductToSelection: (
    product: InventoryItem,
    customPrice?: number,
    customQuantity?: number
  ) => void
  removeProductFromSelection: (productId: string, price?: number) => void
  addServiceLine: (line: Omit<CartServiceLine, 'id'>) => void
  removeServiceLine: (id: string) => void
  updateTradeIns: (tradeIns: TradeInItem[]) => void
  updateTotalPriceWithSurcharges: (
    totalPrice: number,
    totalSurcharge: number
  ) => void
  setExistingSaleData: (saleItems: SaleItem[], tradeIns: TradeIn[]) => void
  reset: () => void
  getUniqueModels: () => string[]
  getUniqueColors: (model?: string) => string[]
  getUniqueStorages: (model?: string, color?: string) => string[]
  findProductByFeatures: () => InventoryItem | undefined
}

export function useSaleSelection(): UseSaleSelectionApi {
  const { data: inventory = [] as InventoryItem[] } = useInventoryItemsForSale()

  const [state, setState] = useState<UseSaleSelectionState>({
    selectedProducts: [],
    serviceLines: [],
    tradeIns: [],
    subtotalPrice: '',
    totalPrice: '',
    netTotal: '',
    totalSurcharge: '0',
    productSelectionMethod: 'imei',
    selectedModel: '',
    selectedColor: '',
    selectedStorage: '',
    customPrice: '',
  })

  const getUniqueModels = (): string[] => {
    return [
      ...new Set(
        inventory
          .map((item) => item.products?.model)
          .filter(Boolean) as string[]
      ),
    ]
  }
  const getUniqueColors = (model?: string): string[] => {
    const filtered = model
      ? inventory.filter((item) => item.products?.model === model)
      : inventory
    return [
      ...new Set(
        filtered.map((item) => item.color).filter(Boolean) as string[]
      ),
    ]
  }

  const getUniqueStorages = (model?: string, color?: string): string[] => {
    let filtered = inventory
    if (model)
      filtered = filtered.filter((item) => item.products?.model === model)
    if (color) filtered = filtered.filter((item) => item.color === color)
    return [
      ...new Set(
        filtered.map((item) => item.storage).filter(Boolean) as string[]
      ),
    ]
  }

  const findProductByFeatures = () => {
    return inventory.find(
      (item) =>
        item.products?.model === state.selectedModel &&
        item.color === state.selectedColor &&
        (!state.selectedStorage || item.storage === state.selectedStorage)
    )
  }

  const convertDeviceToInventoryItem = (
    device: InventoryItem,
    customPrice?: number
  ): InventoryItem => ({ ...device, price: customPrice ?? device.price })

  const convertTradeInToTradeInItem = (tradeIn: TradeIn): TradeInItem => {
    const productItem = tradeIn.product_items

    if (!productItem) {
      // Fallback if product_items is not available
      return {
        id: tradeIn.id,
        product_id: tradeIn.item_id,
        device_name: 'Unknown Device',
        model: 'Unknown Model',
        color: '',
        storage: '',
        imei: '',
        condition: 'used',
        battery_health: 0,
        issues: [],
        trade_in_value: 0,
        notes: '',
        products: undefined,
      }
    }

    return {
      id: tradeIn.id,
      product_id: productItem.id,
      device_name: productItem.products?.name || 'Unknown Device',
      model: productItem.products?.model || 'Unknown Model',
      color: productItem.color,
      storage: productItem.storage || '',
      imei: productItem.imei,
      condition: productItem.condition,
      battery_health: 0, // Not available in the TradeIn type
      issues: [],
      trade_in_value: productItem.cost || 0,
      notes: '',
      products: productItem.products,
    }
  }

  const calculateTotals = (
    products: InventoryItem[],
    serviceLines: CartServiceLine[],
    tradeIns: TradeInItem[]
  ) => {
    const productTotal = products.reduce(
      (sum, p) => sum + p.price * (p.quantity ?? 1),
      0
    )
    const serviceTotal = serviceLines.reduce(
      (sum, s) => sum + s.item_price * s.item_quantity,
      0
    )
    const combinedTotal = productTotal + serviceTotal
    const tradeInTotal = tradeIns.reduce((sum, t) => sum + t.trade_in_value, 0)
    const netTotal = combinedTotal - tradeInTotal

    return {
      subtotalPrice: combinedTotal.toString(),
      totalPrice: combinedTotal.toString(),
      netTotal: Math.max(0, netTotal).toString(),
    }
  }

  const addProductToSelection = (
    product: InventoryItem,
    customPrice?: number,
    customQuantity?: number
  ) => {
    const inventoryItem = convertDeviceToInventoryItem(product, customPrice)

    setState((prev) => {
      const existingItem = prev.selectedProducts.find(
        (p) => p.id === inventoryItem.id
      )

      // If item exists and is NOT an accessory, prevent duplicate (current behavior)
      if (existingItem && inventoryItem.table !== 'accessory_items') {
        return prev
      }

      // If item exists and IS an accessory, check if price is different
      if (existingItem && inventoryItem.table === 'accessory_items') {
        // Check all existing items with same id
        const existingItemsWithSameId = prev.selectedProducts.filter(
          (p) => p.id === inventoryItem.id
        )
        // If any existing item has the same price, prevent duplicate
        if (
          existingItemsWithSameId.some((p) => p.price === inventoryItem.price)
        ) {
          return prev
        }
        // If all existing items have different prices, allow it (fall through)
      }

      // Add the item (either new item or accessory with different price)
      const updated = [
        ...prev.selectedProducts,
        { ...inventoryItem, quantity: customQuantity ?? 1 },
      ]
      const totals = calculateTotals(updated, prev.serviceLines, prev.tradeIns)
      return {
        ...prev,
        selectedProducts: updated,
        ...totals,
      }
    })
  }

  const removeProductFromSelection = (productId: string, price?: number) => {
    setState((prev) => {
      const updated = prev.selectedProducts.filter((p) => {
        // If price is provided, remove only the item with matching id AND price
        // This is needed for accessories that can have the same id but different prices
        if (price !== undefined) {
          return !(p.id === productId && p.price === price)
        }
        // Otherwise, remove all items with matching id (backward compatibility)
        return p.id !== productId
      })
      const totals = calculateTotals(updated, prev.serviceLines, prev.tradeIns)
      return {
        ...prev,
        selectedProducts: updated,
        ...totals,
      }
    })
  }

  const addServiceLine = (line: Omit<CartServiceLine, 'id'>) => {
    const id = `service-${Date.now()}-${Math.random().toString(36).slice(2)}`
    setState((prev) => {
      const serviceLines = [...prev.serviceLines, { ...line, id }]
      const totals = calculateTotals(
        prev.selectedProducts,
        serviceLines,
        prev.tradeIns
      )
      return { ...prev, serviceLines, ...totals }
    })
  }

  const removeServiceLine = (id: string) => {
    setState((prev) => {
      const serviceLines = prev.serviceLines.filter((s) => s.id !== id)
      const totals = calculateTotals(
        prev.selectedProducts,
        serviceLines,
        prev.tradeIns
      )
      return { ...prev, serviceLines, ...totals }
    })
  }

  const updateTradeIns = (tradeIns: TradeInItem[]) => {
    setState((prev) => {
      const totals = calculateTotals(
        prev.selectedProducts,
        prev.serviceLines,
        tradeIns
      )
      return {
        ...prev,
        tradeIns,
        ...totals,
      }
    })
  }

  const updateTotalPriceWithSurcharges = useCallback(
    (totalPrice: number, totalSurcharge: number) => {
      setState((prev) => {
        const productTotal = prev.selectedProducts.reduce(
          (sum, product) => sum + product.price * (product.quantity ?? 1),
          0
        )
        const serviceTotal = prev.serviceLines.reduce(
          (sum, s) => sum + s.item_price * s.item_quantity,
          0
        )
        const combinedTotal = productTotal + serviceTotal
        const tradeInTotal = prev.tradeIns.reduce(
          (sum, tradeIn) => sum + tradeIn.trade_in_value,
          0
        )

        const surchargeValue = Number.isFinite(totalSurcharge)
          ? totalSurcharge
          : 0
        const netWithoutSurcharge = Math.max(
          0,
          combinedTotal - tradeInTotal
        )
        const finalNet = Math.max(0, netWithoutSurcharge + surchargeValue)
        const priceWithSurcharge = Number.isFinite(totalPrice)
          ? totalPrice
          : combinedTotal + surchargeValue

        return {
          ...prev,
          totalPrice: priceWithSurcharge.toFixed(2),
          totalSurcharge: surchargeValue.toFixed(2),
          netTotal: finalNet.toFixed(2),
        }
      })
    },
    []
  )

  const setExistingSaleData = (saleItems: SaleItem[], tradeIns: TradeIn[]) => {
    // Service lines: explicit type or inferred (no product/accessory FK = non-inventory line)
    const isServiceLine = (s: SaleItem) =>
      s.sale_line_type === 'service' ||
      (!s.product_item_id && !s.accessory_item_id)

    const inventoryItems = saleItems.filter(
      (s) => !isServiceLine(s) && (s.product_item_id || s.accessory_item_id)
    )
    const serviceLines: CartServiceLine[] = saleItems
      .filter(isServiceLine)
      .map((s) => ({
        id: s.id,
        item_name: s.item_name,
        item_model: s.item_model,
        item_price: Number(s.item_price),
        item_quantity: Number(s.item_quantity ?? 1),
        item_cost: Number(s.item_cost ?? 0),
        item_notes: s.item_notes ?? null,
        linked_product_item_id: s.linked_product_item_id ?? null,
      }))

    const selectedProducts = inventoryItems.map(convertSaleItemToInventoryItem)
    const convertedTradeIns = tradeIns.map(convertTradeInToTradeInItem)
    const totals = calculateTotals(
      selectedProducts,
      serviceLines,
      convertedTradeIns
    )

    setState({
      selectedProducts,
      serviceLines,
      tradeIns: convertedTradeIns,
      subtotalPrice: totals.subtotalPrice,
      totalPrice: totals.totalPrice,
      netTotal: totals.netTotal,
      totalSurcharge: '0',
      productSelectionMethod: 'imei',
      selectedModel: '',
      selectedColor: '',
      selectedStorage: '',
      customPrice: '',
    })
  }

  const reset = () => {
    setState({
      selectedProducts: [],
      serviceLines: [],
      tradeIns: [],
      subtotalPrice: '',
      totalPrice: '',
      netTotal: '',
      totalSurcharge: '0',
      productSelectionMethod: 'imei',
      selectedModel: '',
      selectedColor: '',
      selectedStorage: '',
      customPrice: '',
    })
  }

  return {
    data: inventory,
    state,
    setState,
    addProductToSelection,
    removeProductFromSelection,
    addServiceLine,
    removeServiceLine,
    updateTradeIns,
    updateTotalPriceWithSurcharges,
    setExistingSaleData,
    reset,
    getUniqueModels,
    getUniqueColors,
    getUniqueStorages,
    findProductByFeatures,
  }
}
