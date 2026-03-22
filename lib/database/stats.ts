import { getInventoryItems } from './inventory'
import { getSales } from './sales'
import { getProducts } from './products'
import type { Sale } from '@/lib/types/sales'
import { createClient } from '@/utils/supabase/server'
import type { ProfitItem, ProfitsStats } from '@/lib/types/stats'

// Analytics and Stats
export const getInventoryStats = async () => {
  const { data: items, error } = await getInventoryItems(true)

  if (error || !items) {
    return { data: null, error }
  }

  const { data: products, error: productsError } = await getProducts()

  if (productsError || !products) {
    return { data: null, error: productsError }
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalValue = items.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  )
  const totalCost = items.reduce(
    (sum, item) => sum + item.quantity * item.cost,
    0
  )

  // Group items by product to get real stock per product
  const itemsByProduct = items.reduce(
    (acc, item) => {
      const productId = item.products?.id
      if (!productId) return acc

      const product = products.find((product) => product.id === productId)

      if (!acc[productId]) {
        acc[productId] = {
          productId,
          productName: product?.name || item.name,
          productModel: product?.model,
          totalQuantity: 0,
          totalValue: 0,
          variants: [],
        }
      }

      acc[productId].totalQuantity += item.quantity
      acc[productId].totalValue += item.quantity * item.price
      acc[productId].variants.push({
        color: item.color,
        storage: item.storage,
        condition: 'condition' in item ? item.condition : undefined,
        quantity: item.quantity,
        price: item.price,
      })

      return acc
    },
    {} as Record<
      string,
      {
        productId: string
        productName: string
        productModel?: string
        totalQuantity: number
        totalValue: number
        variants: Array<{
          color: string
          storage: string | null
          condition?: string
          quantity: number
          price: number
        }>
      }
    >
  )

  const lowStockItems = Object.values(itemsByProduct).filter(
    (item) => item.totalQuantity < 10
  ).length

  // Find products that have no inventory items (out of stock)
  const productsWithStock = new Set(Object.keys(itemsByProduct))
  const outOfStockItems = products.filter(
    (product) => !productsWithStock.has(product.id)
  ).length

  return {
    data: {
      totalItems,
      totalValue,
      totalCost,
      lowStockItems,
      outOfStockItems,
      totalProducts: Object.keys(itemsByProduct).length,
      productsStock: Object.values(itemsByProduct),
    },
    error: null,
  }
}

export const getSalesStats = async (userId?: string) => {
  const { data: sales, error } = await getSales(userId)

  if (error || !sales) {
    return { data: null, error }
  }

  const now = new Date()
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1)
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 2)
  const fourMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 4, 3)
  const fiveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 4)
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 5)
  const sevenMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 7, 6)
  const eightMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 8, 7)
  const nineMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 9, 8)
  const tenMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 10, 9)
  const elevenMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 10)

  const filterSalesByPeriod = (startDate: Date, endDate?: Date) => {
    return sales.filter((sale) => {
      const saleDate = new Date(sale.sale_date)
      if (endDate) {
        return saleDate >= startDate && saleDate < endDate
      }
      // For monthly data, create end date as next month's start
      const monthEnd = new Date(
        startDate.getFullYear(),
        startDate.getMonth() + 1,
        1
      )
      return saleDate >= startDate && saleDate < monthEnd
    })
  }

  const calculatePeriodStats = (periodSales: Sale[]) => {
    const soldSales = periodSales.filter((sale) => sale.status === 'sold')
    const reservations = periodSales.filter(
      (sale) => sale.status === 'reserved'
    )

    return {
      sales: soldSales.length || 0,
      revenue: soldSales.reduce((sum, sale) => sum + sale.sale_price, 0) || 0,
      reservations: reservations.length || 0,
      transactions: periodSales.length || 0,
    }
  }

  const currentMonthSales = filterSalesByPeriod(currentMonth)
  const oneMonthAgoSales = filterSalesByPeriod(oneMonthAgo)
  const twoMonthsAgoSales = filterSalesByPeriod(twoMonthsAgo)
  const threeMonthsAgoSales = filterSalesByPeriod(threeMonthsAgo)
  const fourMonthsAgoSales = filterSalesByPeriod(fourMonthsAgo)
  const fiveMonthsAgoSales = filterSalesByPeriod(fiveMonthsAgo)
  const sixMonthsAgoSales = filterSalesByPeriod(sixMonthsAgo)
  const sevenMonthsAgoSales = filterSalesByPeriod(sevenMonthsAgo)
  const eightMonthsAgoSales = filterSalesByPeriod(eightMonthsAgo)
  const nineMonthsAgoSales = filterSalesByPeriod(nineMonthsAgo)
  const tenMonthsAgoSales = filterSalesByPeriod(tenMonthsAgo)
  const elevenMonthsAgoSales = filterSalesByPeriod(elevenMonthsAgo)

  // Create lastYear array with 12 months of data (most recent first)
  const lastYear = [
    calculatePeriodStats(currentMonthSales), // Current month (index 0)
    calculatePeriodStats(oneMonthAgoSales), // 1 month ago (index 1)
    calculatePeriodStats(twoMonthsAgoSales), // 2 months ago (index 2)
    calculatePeriodStats(threeMonthsAgoSales), // 3 months ago (index 3)
    calculatePeriodStats(fourMonthsAgoSales), // 4 months ago (index 4)
    calculatePeriodStats(fiveMonthsAgoSales), // 5 months ago (index 5)
    calculatePeriodStats(sixMonthsAgoSales), // 6 months ago (index 6)
    calculatePeriodStats(sevenMonthsAgoSales), // 7 months ago (index 7)
    calculatePeriodStats(eightMonthsAgoSales), // 8 months ago (index 8)
    calculatePeriodStats(nineMonthsAgoSales), // 9 months ago (index 9)
    calculatePeriodStats(tenMonthsAgoSales), // 10 months ago (index 10)
    calculatePeriodStats(elevenMonthsAgoSales), // 11 months ago (index 11)
  ]

  return {
    data: {
      currentMonth: calculatePeriodStats(currentMonthSales),
      lastYear,
      total: calculatePeriodStats(sales),
    },
    error: null,
  }
}

export const getProfitsStats = async (fromDate?: Date, toDate?: Date) => {
  const supabase = await createClient()

  // If date range is provided, first get the sale IDs that match the date range
  let saleIds: string[] | undefined
  if (fromDate && toDate) {
    // Format dates as YYYY-MM-DD strings since sale_date is a DATE column (no time component)
    const formatDateString = (date: Date): string => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const fromDateString = formatDateString(fromDate)
    const toDateString = formatDateString(toDate)

    const salesQuery = supabase
      .from('sales')
      .select('id')
      .gte('sale_date', fromDateString)
      .lte('sale_date', toDateString)

    const { data: salesData, error: salesError } = await salesQuery

    if (salesError) {
      console.error('Error fetching sales for date range:', salesError)
      return { data: null, error: salesError.message }
    }

    saleIds = salesData?.map((sale) => sale.id) || []
  }

  // Query to get all sale_reservation_items with their costs and sale information
  let query = supabase.from('sale_reservation_items').select(
    `
      id,
      item_name,
      item_model,
      item_price,
      item_quantity,
      sale_id,
      product_item_id,
      accessory_item_id,
      sale_line_type,
      item_cost,
      linked_product_item_id,
      sales:sale_id(
        sale_date,
        customer_name,
        seller_name,
        status,
        deliveries(delivery_date, is_default)
      ),
      product_items:product_items!sale_reservation_items_product_item_id_fkey(
        cost,
        used_product_items(fixes)
      ),
      accessory_items:accessory_item_id(cost)
    `
  )

  // Filter by sale_id if date range was provided
  if (saleIds && saleIds.length > 0) {
    query = query.in('sale_id', saleIds)
  } else if (saleIds && saleIds.length === 0) {
    // If date range was provided but no sales match, return empty result
    return {
      data: {
        items: [],
        totalProfit: 0,
        totalRevenue: 0,
        totalCost: 0,
        averageProfitMargin: 0,
      },
      error: null,
    }
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching profits stats:', error)
    return { data: null, error: error.message }
  }

  if (!data) {
    return { data: null, error: 'No data found' }
  }

  // Filter out items without valid sales data or not sold/reserved
  type SaleReservationItemWithRelations = { sales?: { status: string } }
  const validData = (
    data as unknown as SaleReservationItemWithRelations[]
  ).filter((item) => item.sales?.status === 'sold')

  // Process the data to calculate profits (device/accessory: cost from linked item; service: item_cost)
  const items: ProfitItem[] = validData
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((item: any) => {
      if (!item.sales) {
        throw new Error('Sale info missing for item ' + item.id)
      }

      const isService = item.sale_line_type === 'service'
      let cost: number

      if (isService && item.item_cost != null && Number.isFinite(Number(item.item_cost))) {
        cost = Number(item.item_cost)
      } else {
        const productCost = item.product_items?.cost ?? item.accessory_items?.cost
        if (productCost === undefined || productCost === null) {
          return null // Skip lines with no cost (invalid or legacy)
        }
        let fixCost = 0
        if (
          item.product_items?.used_product_items &&
          Array.isArray(item.product_items.used_product_items)
        ) {
          for (const usedProductItem of item.product_items.used_product_items) {
            if (usedProductItem?.fixes && Array.isArray(usedProductItem.fixes)) {
              fixCost += usedProductItem.fixes.reduce(
                (total: number, fixStr: string) => {
                  try {
                    const fix = JSON.parse(fixStr) as {
                      fix: string
                      cost: string
                    }
                    return total + (Number(fix.cost) || 0)
                  } catch {
                    return total
                  }
                },
                0
              )
            }
          }
        }
        cost = productCost + fixCost
      }

      const salePrice = Number(item.item_price)
      const quantity = item.item_quantity
      const totalRevenue = salePrice * quantity
      const totalCost = cost * quantity
      const profit = totalRevenue - totalCost
      const profitMargin = totalCost > 0 ? (profit / totalCost) * 100 : 0

      // Get delivery_date from the first delivery or default delivery
      const deliveries = item.sales.deliveries || []
      const defaultDelivery = deliveries.find((d: any) => d.is_default)
      const delivery = defaultDelivery || deliveries[0]
      const deliveryDate = delivery?.delivery_date
        ? new Date(delivery.delivery_date).toISOString().split('T')[0]
        : null

      const isUsed =
        item.product_item_id &&
        item.product_items?.used_product_items &&
        Array.isArray(item.product_items.used_product_items) &&
        item.product_items.used_product_items.length > 0

      const itemType =
        item.sale_line_type === 'service'
          ? 'service'
          : item.product_item_id
            ? 'product'
            : 'accessory'

      return {
        id: item.id,
        item_name: item.item_name,
        item_model: item.item_model,
        item_quantity: quantity,
        sale_price: salePrice,
        cost,
        profit,
        profit_margin: profitMargin,
        sale_id: item.sale_id,
        sale_date: item.sales.sale_date,
        customer_name: item.sales.customer_name,
        seller_name: item.sales.seller_name,
        item_type: itemType,
        delivery_date: deliveryDate || '',
        delivery_is_default: defaultDelivery?.is_default || false,
        product_item_id: item.product_item_id || null,
        accessory_item_id: item.accessory_item_id || null,
        linked_product_item_id: item.linked_product_item_id ?? null,
        condition: item.product_item_id ? (isUsed ? 'used' : 'new') : undefined,
      } as ProfitItem
    })
    .filter((item): item is ProfitItem => item != null && item.sale_date != null)
    .sort(
      (a, b) =>
        new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime()
    )

  // Aggregate linked services into their product line: one row per product with cost/price including linked services
  const mergedItems: ProfitItem[] = []

  for (const item of items) {
    if (item.item_type === 'service' && item.linked_product_item_id) {
      continue
    }
    if (item.item_type === 'service') {
      mergedItems.push(item)
      continue
    }
    if (item.item_type === 'accessory') {
      mergedItems.push(item)
      continue
    }
    const linkedServices = items.filter(
      (s) =>
        s.item_type === 'service' &&
        s.sale_id === item.sale_id &&
        s.linked_product_item_id === item.product_item_id
    )
    const totalCost =
      item.cost * item.item_quantity +
      linkedServices.reduce(
        (sum, s) => sum + s.cost * s.item_quantity,
        0
      )
    const totalRevenue =
      item.sale_price * item.item_quantity +
      linkedServices.reduce(
        (sum, s) => sum + s.sale_price * s.item_quantity,
        0
      )
    const costPerUnit = totalCost / item.item_quantity
    const pricePerUnit = totalRevenue / item.item_quantity
    const profit = totalRevenue - totalCost
    const profitMargin = totalCost > 0 ? (profit / totalCost) * 100 : 0

    mergedItems.push({
      ...item,
      cost: costPerUnit,
      sale_price: pricePerUnit,
      profit,
      profit_margin: profitMargin,
    })
  }

  const finalItems = mergedItems.sort(
    (a, b) =>
      new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime()
  )

  // Calculate totals from merged list
  const totalProfit = finalItems.reduce((sum, item) => sum + item.profit, 0)
  const totalRevenue = finalItems.reduce(
    (sum, item) => sum + item.sale_price * item.item_quantity,
    0
  )
  const totalCost = finalItems.reduce(
    (sum, item) => sum + item.cost * item.item_quantity,
    0
  )
  const margins = finalItems
    .map((item) => item.profit_margin)
    .filter((m) => m != null && Number.isFinite(m))
  const averageProfitMargin =
    margins.length > 0
      ? margins.reduce((a, b) => a + b, 0) / margins.length
      : 0

  const profitsStats: ProfitsStats = {
    items: finalItems,
    totalProfit,
    totalRevenue,
    totalCost,
    averageProfitMargin,
  }

  return {
    data: profitsStats,
    error: null,
  }
}
