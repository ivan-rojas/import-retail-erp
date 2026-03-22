import { TradeIn } from '@/lib/types/trade-ins'
import { TradeInItem } from '@/lib/types/inventory'

export const convertTradeInsToTradeInItems = (tradeIns: TradeIn[]) => {
  const mappedTradeIns: TradeInItem[] = tradeIns.map((t) => {
    return {
      id: t.id ?? t.item_id ?? '',
      product_id:
        t.item_id ?? t.product_items?.products?.id ?? t.product_items?.id ?? '',
      device_name: t.product_items?.name ?? '',
      model: t.product_items?.products?.model ?? '',
      cost: t.product_items?.cost ?? 0,
      color: t.product_items?.color ?? '',
      storage: t.product_items?.storage ?? undefined,
      imei: t.product_items?.imei ?? '',
      condition: t.product_items?.condition ?? 'used',
      battery_health: t.product_items?.battery_health ?? 0,
      issues: t.product_items?.issues ?? [],
      trade_in_value:
        t.product_items?.cost ??
        t.product_items?.products?.base_price ??
        t.product_items?.price ??
        0,
      notes: t.product_items?.notes ?? '',
    }
  })

  return mappedTradeIns
}

export const convertTradeInItemToTradeIn = (
  tradeInItem: TradeInItem
): TradeIn => {
  return {
    id: tradeInItem.id,
    item_id: tradeInItem.product_id,
    product_items: {
      id: tradeInItem.product_id,
      name: tradeInItem.device_name,
      imei: tradeInItem.imei,
      color: tradeInItem.color,
      storage: tradeInItem.storage || null,
      condition: tradeInItem.condition,
      battery_health: tradeInItem.battery_health || 0,
      issues: tradeInItem.issues,
      notes: tradeInItem.notes,
      products: tradeInItem.products,
      fixes: [],
      cost: tradeInItem.trade_in_value,
      price: tradeInItem.products?.base_price || 0,
      wholesale_price: tradeInItem.products?.wholesale_price || 0,
      status: 'available',
      is_on_sale: false,
    },
  }
}

export const convertTradeInItemsToTradeIns = (
  tradeInItems: TradeInItem[]
): TradeIn[] => {
  return tradeInItems.map(convertTradeInItemToTradeIn)
}
