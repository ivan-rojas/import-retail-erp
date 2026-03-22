import { RawSaleData, SaleDTO } from '@/lib/types/sales'
import { SaleFormValues, PaymentFormValues } from '@/lib/schemas/sales'
import { CustomerInfoData } from '@/components/features/sales/forms/shared/customer-info'
import { DepositDetailsData } from '@/components/features/sales/forms/shared/deposit-details'
import { DeliveryData } from '@/components/features/sales/forms/shared/delivery-details'
import { UseSaleSelectionApi } from '@/components/features/sales/forms/shared/cart-selection/use-sale-selection'
import { InventoryItem } from '@/lib/types/inventory'
import { convertTradeInItemsToTradeIns } from './trade-ins'
import { format } from 'date-fns'
import type { SaleItem, SaleLineType } from '@/lib/types/sale-item'

export interface SaleDetailsData {
  subtotalPrice: string
  totalPrice: string
  payments: PaymentFormValues[]
}

export interface SalesFormData {
  customerInfo: CustomerInfoData
  saleDetails: SaleDetailsData
  deposit: DepositDetailsData
  delivery: DeliveryData
}

export const getSalesFormData = (
  sale?: SaleDTO,
  values?: SaleFormValues
): SalesFormData => {
  const customerInfo = getCustomerInfoData(sale, values)
  const deposit = getDepositData(sale, values)
  const saleDetails = getSaleDetailsData(sale, values)
  const delivery = getDeliveryData(sale, values)
  return {
    customerInfo,
    saleDetails,
    deposit,
    delivery,
  }
}

const getCustomerInfoData = (
  sale?: SaleDTO,
  values?: SaleFormValues
): CustomerInfoData => {
  return {
    customerName: sale?.customer_name || values?.customerName || '',
    customerIG: sale?.customer_ig || values?.customerIG || '',
    customerPhone: sale?.customer_phone || values?.customerPhone || '',
    customerEmail: sale?.customer_email || values?.customerEmail || '',
    customerAliasCbu:
      sale?.customer_alias_cbu || values?.customerAliasCbu || '',
    clientId: sale?.client_id || values?.clientId || '',
  }
}

const getDepositData = (
  sale?: SaleDTO,
  values?: SaleFormValues
): DepositDetailsData => {
  return {
    deposit: sale?.reservations[0]?.deposit.toString() || values?.deposit || '',
  }
}

const getSaleDetailsData = (
  sale?: SaleDTO,
  values?: SaleFormValues
): SaleDetailsData => {
  // Convert existing payments to payment form values
  const payments = sale?.payments.length
    ? sale.payments.map((payment) => ({
        baseAmount: payment.base_amount.toString(),
        amount: payment.amount.toString(),
        paymentMethod: payment.payment_method as 'cash' | 'transfer' | 'crypto',
        currency: payment.currency as 'USD' | 'ARS',
        exchangeRate: payment.usd_exchange_rate.toString(),
        paymentDate: payment.payment_date,
        notes: payment.payment_notes || '',
        surchargePercentage: payment.surcharge_percentage?.toString() || '',
        convertedAmount: payment.converted_amount?.toString() || '',
        amountTendered: payment.amount_tendered?.toString() || '',
        changeAmount: payment.change_amount?.toString() || '',
      }))
    : values?.payments || [
        {
          baseAmount: '',
          amount: '',
          paymentMethod: 'cash' as 'cash' | 'transfer' | 'crypto',
          currency: 'USD' as 'USD' | 'ARS',
          exchangeRate: '',
          paymentDate: new Date().toISOString().slice(0, 10),
          notes: '',
          surchargePercentage: '',
          convertedAmount: '',
          amountTendered: '',
          changeAmount: '',
        },
      ]

  return {
    subtotalPrice:
      sale?.subtotal_price.toString() || values?.subtotalPrice || '',
    totalPrice: sale?.sale_price.toString() || values?.totalPrice || '',
    payments,
  }
}

const getDeliveryData = (
  sale?: SaleDTO,
  values?: SaleFormValues
): DeliveryData => {
  const primaryDelivery = sale?.deliveries.find(
    (delivery) => delivery.delivery_status !== 'cancelled'
  )
  return {
    isDefaultDelivery:
      primaryDelivery?.is_default ?? values?.isDefaultDelivery ?? true,
    deliveryDate:
      primaryDelivery?.delivery_date ||
      values?.deliveryDate ||
      new Date().toISOString().slice(0, 10),
    deliveryTime:
      (primaryDelivery?.delivery_date
        ? format(new Date(primaryDelivery.delivery_date), 'HH:mm:ss')
        : '') ||
      values?.deliveryTime ||
      '',
    deliveryNotes:
      primaryDelivery?.delivery_notes || values?.deliveryNotes || '',
  }
}

// Helper functions for building SaleDTO components
const buildSaleItems = (products: InventoryItem[]) =>
  products.map((product) => {
    const isDevice = ['product_items', 'used_product_items'].includes(
      product.table
    )
    const isAccessory = product.table === 'accessory_items'
    return {
      id: product.sale_item_id || '',
      item_name: product.name,
      item_model: `${product.products?.model || ''} ${product.storage || ''} ${
        product.color
      }`.trim(),
      item_price: product.price,
      item_quantity: product.quantity,
      item_notes: null,
      product_item_id: isDevice ? product.id : null,
      accessory_item_id: isAccessory ? product.id : null,
      sale_line_type: (isDevice ? 'device' : 'accessory') as SaleLineType,
      product_items: product.imei
        ? {
          id: product.products?.id || '',
          imei: product.imei,
          color: product.color,
          storage: product.storage,
          condition:
            (product.condition as 'new' | 'used' | 'refurbished') || 'new',
          products: product.products,
          cost: product.cost || 0,
          price: product.price || 0,
          wholesale_price: product.wholesale_price || 0,
          status: product.status,
          name: product.name,
          is_on_sale: product.is_on_sale || false,
        }
        : null,
      accessory_items:
        product.table === 'accessory_items'
          ? {
              id: product.products?.id || '',
              color: product.color,
              quantity: product.quantity,
              products: product.products,
              is_on_sale: product.is_on_sale || false,
            }
          : null,
    }
  })

const buildPayments = (values: SaleFormValues, editSale?: SaleDTO) =>
  values.payments.map((payment, index) => ({
    id: editSale?.payments[index]?.id || '',
    base_amount: payment.baseAmount ? parseFloat(payment.baseAmount) : 0,
    amount: payment.amount ? parseFloat(payment.amount) : 0,
    payment_method: payment.paymentMethod,
    currency: payment.currency,
    usd_exchange_rate: payment.exchangeRate
      ? parseFloat(payment.exchangeRate)
      : 1,
    payment_date: payment.paymentDate,
    payment_notes: payment.notes || null,
    surcharge_percentage: payment.surchargePercentage
      ? parseFloat(payment.surchargePercentage)
      : undefined,
    converted_amount: payment.convertedAmount
      ? parseFloat(payment.convertedAmount)
      : undefined,
    amount_tendered: payment.amountTendered
      ? parseFloat(payment.amountTendered)
      : undefined,
    change_amount: payment.changeAmount
      ? parseFloat(payment.changeAmount)
      : undefined,
  }))

const buildDeliveries = (values: SaleFormValues, editSale?: SaleDTO) =>
  editSale?.deliveries.length
    ? editSale.deliveries.map((delivery, i) =>
        i === 0
          ? {
              ...delivery,
              delivery_date:
                values.deliveryDate + ' ' + values.deliveryTime ||
                delivery.delivery_date,
              delivery_notes: values.deliveryNotes || delivery.delivery_notes,
              is_default: values.isDefaultDelivery,
            }
          : delivery
      )
    : [
        {
          id: '',
          delivery_date:
            values.deliveryDate + ' ' + values.deliveryTime ||
            new Date().toISOString().slice(0, 10),
          delivery_notes: values.deliveryNotes || null,
          delivery_status: 'pending' as const,
          delivery_user_id: '',
          is_default: values.isDefaultDelivery,
        },
      ]

const buildReservations = (values: SaleFormValues, editSale?: SaleDTO) =>
  values.saleStatus !== 'reserved'
    ? []
    : editSale?.reservations.length
    ? editSale.reservations.map((res, i) =>
        i === 0
          ? {
              ...res,
              deposit: parseFloat(values.deposit || '0'),
              status: 'pending' as const,
            }
          : res
      )
    : [
        {
          id: '',
          deposit: parseFloat(values.deposit || '0'),
          status: 'pending' as const,
          sale_reservation_items: [],
        },
      ]

/** Build sale item shape for a service line (no inventory FKs). */
function buildServiceSaleItems(
  serviceLines: { id: string; item_name: string; item_model: string; item_price: number; item_quantity: number; item_cost: number; item_notes?: string | null; linked_product_item_id?: string | null }[]
): SaleItem[] {
  return serviceLines.map((s) => ({
    id: s.id,
    item_name: s.item_name,
    item_model: s.item_model,
    item_price: s.item_price,
    item_quantity: s.item_quantity,
    item_notes: s.item_notes ?? null,
    product_item_id: null,
    accessory_item_id: null,
    sale_line_type: 'service' as const,
    item_cost: s.item_cost,
    linked_product_item_id: s.linked_product_item_id ?? null,
    product_items: null,
    accessory_items: null,
  }))
}

export const convertSaleFormValuesToSaleDTO = (
  values: SaleFormValues,
  selection: UseSaleSelectionApi,
  editSale?: SaleDTO
): SaleDTO => {
  const subtotalPrice = parseFloat(values.subtotalPrice) || 0
  const totalPrice = parseFloat(values.totalPrice)
  const saleItems = [
    ...buildSaleItems(selection.state.selectedProducts),
    ...buildServiceSaleItems(selection.state.serviceLines),
  ]
  const isReservation = values.saleStatus === 'reserved'

  const baseFields = {
    customer_name: values.customerName,
    customer_ig: values.customerIG || null,
    customer_email: values.customerEmail || null,
    customer_phone: values.customerPhone || null,
    customer_alias_cbu: values.customerAliasCbu || null,
    status: values.saleStatus,
    subtotal_price: subtotalPrice,
    sale_price: totalPrice,
    sale_date: values.saleDate || new Date().toISOString().slice(0, 10),
    notes: values.payments[0]?.notes || null,
    client_id: values.clientId || null,
  }

  const payments = buildPayments(values, editSale)
  const primaryPayment =
    payments.length === 2
      ? payments[1]
      : payments.length === 1
      ? payments[0]
      : null

  const computedFields = {
    payments,
    deliveries: buildDeliveries(values, editSale),
    reservations: buildReservations(values, editSale),
    sale_items: saleItems,
    trade_ins: selection.state.tradeIns,
    primary_payment: primaryPayment,
    is_reservation: isReservation,
    payment_method: primaryPayment?.payment_method || null,
    product_model: saleItems[0]?.item_model || '',
    product_name: saleItems[0]?.item_name || '',
    imei: saleItems[0]?.product_items?.imei || null,
    has_trade_ins: selection.state.tradeIns.length > 0,
    delivery_status: editSale?.delivery_status || 'pending',
    delivery_date: values.deliveryDate
      ? values.deliveryTime
        ? values.deliveryDate + ' ' + values.deliveryTime
        : values.deliveryDate
      : editSale?.delivery_date || new Date().toISOString().slice(0, 10),
    total_products: saleItems.length,
    total_quantity: saleItems.reduce(
      (sum, item) => sum + item.item_quantity,
      0
    ),
    subtotal_price: subtotalPrice,
    total_price: totalPrice,
  }

  return editSale
    ? {
        ...editSale,
        ...baseFields,
        updated_at: new Date().toISOString(),
        ...computedFields,
        trade_ins: convertTradeInItemsToTradeIns(selection.state.tradeIns),
      }
    : {
        id: '',
        ...baseFields,
        seller_id: '',
        seller_name: '',
        created_at: '',
        updated_at: '',
        created_by: '',
        updated_by: null,
        ...computedFields,
        trade_ins: convertTradeInItemsToTradeIns(selection.state.tradeIns),
      }
}

export const convertRawSaleDataToSaleDTO = (
  rawSaleData: RawSaleData[]
): SaleDTO[] => {
  // Transform the data for easier frontend consumption
  const transformedData: SaleDTO[] =
    (rawSaleData as unknown as RawSaleData[] | null)?.map((sale) => {
      const saleItems = sale.sale_items || []
      const payments = sale.payments || []
      const deliveries = sale.deliveries || []
      const reservations = sale.reservations || []
      const tradeIns = sale.trade_ins || []

      // Calculate totals
      const totalProducts = saleItems.length
      const totalQuantity = saleItems.reduce(
        (sum: number, item) => sum + (item.item_quantity || 0),
        0
      )

      // Get primary product info (first item or most expensive)
      const primaryItem =
        saleItems.length > 0
          ? saleItems.reduce((prev, current) =>
              current.item_price > prev.item_price ? current : prev
            )
          : null

      // Get payment summary
      // If there is only one payment, the first one is the main one
      // If there are two payments, the second is the main one

      const primaryPayment =
        payments.length === 2
          ? payments[1]
          : payments.length === 1
          ? payments[0]
          : null

      const mapped = {
        ...sale,
        // Ensure arrays are properly typed
        payments,
        deliveries,
        reservations,
        sale_items: saleItems,
        trade_ins: tradeIns,

        // Computed fields for easier frontend use
        primary_payment: primaryPayment,
        payment_method: primaryPayment?.payment_method || null,
        product_model: primaryItem?.item_model || '',
        product_name: primaryItem?.item_name || '',
        imei: primaryItem?.product_items?.imei || null,
        has_trade_ins: tradeIns.length > 0,
        delivery_status: deliveries[0]?.delivery_status || null,
        delivery_date: deliveries[0]?.delivery_date || null,
        total_products: totalProducts,
        total_quantity: totalQuantity,
      } as const

      return mapped as unknown as SaleDTO
    }) || []

  return transformedData
}

// Helper function to get formatted sale details for display
export const getSaleDetailsForDisplay = (sale: SaleDTO) => {
  return {
    // Customer info
    customer: {
      name: sale.customer_name,
      phone: sale.customer_phone,
      email: sale.customer_email,
      instagram: sale.customer_ig,
      aliasCbu: sale.customer_alias_cbu,
    },

    // Products summary
    products: {
      items: sale.sale_items.map((item) => ({
        name: item.item_name,
        model: item.item_model,
        quantity: item.item_quantity,
        price: item.item_price,
        imei: item.product_items?.imei || null,
        color: item.product_items?.color || item.accessory_items?.color || null,
        storage: item.product_items?.storage || null,
        condition: item.product_items?.condition || null,
      })),
      totalProducts: sale.total_products,
      totalQuantity: sale.total_quantity,
    },

    // Payment info
    payments: {
      methods: sale.payments.map((payment) => ({
        method: payment.payment_method,
        base_amount: payment.base_amount,
        amount: payment.amount,
        currency: payment.currency,
        date: payment.payment_date,
        notes: payment.payment_notes,
        surcharge_percentage: payment.surcharge_percentage,
        converted_amount: payment.converted_amount,
        amount_tendered: payment.amount_tendered,
        change_amount: payment.change_amount,
      })),
      totalPaid: sale.payments.reduce(
        (sum, payment) => sum + payment.amount,
        0
      ),
      primaryMethod: sale.payment_method,
    },

    // Trade-ins
    tradeIns: {
      hasTradeIns: sale.has_trade_ins,
      items: sale.trade_ins.map((tradeIn) => ({
        name: tradeIn.product_items?.products?.name || '',
        imei: tradeIn.product_items?.imei || '',
        color: tradeIn.product_items?.color || '',
        storage: tradeIn.product_items?.storage || null,
        condition: tradeIn.product_items?.condition || '',
        price: tradeIn.product_items?.products?.base_price || 0,
      })),
    },

    // Delivery info
    delivery: {
      status: sale.delivery_status,
      date: sale.delivery_date,
      notes: sale.deliveries[0]?.delivery_notes || null,
    },

    // Sale metadata
    sale: {
      id: sale.id,
      status: sale.status,
      date: sale.sale_date,
      notes: sale.notes,
      seller: sale.seller_name,
      totalPrice: sale.sale_price,
    },
  }
}

export const convertSaleItemToInventoryItem = (
  saleItem: SaleItem
): InventoryItem => {
  // Validate that we have either product_item_id or accessory_item_id
  const inventoryId = saleItem.product_item_id ?? saleItem.accessory_item_id

  // Fail fast if inventoryId is missing to prevent duplicate key issues
  if (!inventoryId) {
    const errorMessage = `[convertSaleItemToInventoryItem] Missing inventory ID for sale item ${saleItem.id}. Neither product_item_id nor accessory_item_id exists. Cannot create inventory record without a valid inventory ID.`
    if (process.env.NODE_ENV === 'development') {
      console.error(errorMessage, {
        saleItemId: saleItem.id,
        item_name: saleItem.item_name,
        has_product_items: !!saleItem.product_items,
        has_accessory_items: !!saleItem.accessory_items,
      })
    }
    throw new Error(errorMessage)
  }

  // Get the source item (product_items or accessory_items) for metadata
  const sourceItem = saleItem.product_items ?? saleItem.accessory_items

  // Prefer metadata from source item, using nullish coalescing to distinguish undefined vs 0
  // For cost: use nullish coalescing to distinguish undefined from 0
  // Both product_items and accessory_items have cost in the database, but TypeScript types may not reflect this
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sourceItemAny = sourceItem as any
  let cost: number
  if (sourceItemAny?.cost !== undefined && sourceItemAny?.cost !== null) {
    // Explicitly check for undefined/null to distinguish from 0
    cost = sourceItemAny.cost
  } else if (sourceItem) {
    // Source item exists but cost is missing/undefined - this indicates a data issue
    cost = 0
    console.warn(
      `[convertSaleItemToInventoryItem] Missing cost field for sale item ${
        saleItem.id
      } from ${
        saleItem.product_items ? 'product_items' : 'accessory_items'
      }. Defaulting to 0.`
    )
  } else {
    // No source item available
    cost = 0
    console.warn(
      `[convertSaleItemToInventoryItem] No source item (product_items/accessory_items) available for sale item ${saleItem.id}. Cost defaulting to 0.`
    )
  }

  // Prefer timestamps from source item if available
  // Note: TypeScript types may not include these fields, but they exist in the database
  const created_at = sourceItemAny?.created_at ?? new Date().toISOString()
  const updated_at = sourceItemAny?.updated_at ?? new Date().toISOString()
  const created_by = sourceItemAny?.created_by ?? ''

  // Log warnings for missing critical audit fields
  if (!sourceItemAny?.created_at || !sourceItemAny?.created_by) {
    const missingFields = [
      !sourceItemAny?.created_at && 'created_at',
      !sourceItemAny?.created_by && 'created_by',
    ].filter(Boolean)

    if (missingFields.length > 0) {
      console.warn(
        `[convertSaleItemToInventoryItem] Missing audit fields for sale item ${
          saleItem.id
        }: ${missingFields.join(', ')}. Using fallback values.`
      )
    }
  }

  // Create a base InventoryItem from the SaleItem data
  const inventoryItem: InventoryItem = {
    id: inventoryId,
    name: saleItem.item_name,
    color:
      saleItem.product_items?.color ?? saleItem.accessory_items?.color ?? '',
    storage: saleItem.product_items?.storage ?? null,
    imei: saleItem.product_items?.imei ?? null,
    quantity: saleItem.item_quantity,
    status: 'sold' as const,
    price: saleItem.item_price,
    cost,
    created_at,
    updated_at,
    created_by,
    table: saleItem.product_item_id ? 'product_items' : 'accessory_items',
    condition: saleItem.product_items?.condition ?? 'new',
    sale_item_id: saleItem.id ?? null,
  }

  // Add product information if available
  if (saleItem.product_items || saleItem.accessory_items) {
    const product =
      saleItem.product_items?.products ?? saleItem.accessory_items?.products
    inventoryItem.products = {
      id: product?.id ?? '',
      name: saleItem.item_name,
      model: product?.model ?? '',
      type: saleItem.product_item_id ? 'product' : 'accessory',
      category: product?.category ?? '',
      available_colors: [inventoryItem.color],
      available_storage: inventoryItem.storage
        ? [inventoryItem.storage]
        : undefined,
      base_price: saleItem.item_price,
      wholesale_price: product?.wholesale_price ?? 0,
      description: product?.description ?? '',
      specifications: product?.specifications ?? {},
      status: product?.status ?? 'active',
      created_at: product?.created_at ?? new Date().toISOString(),
      updated_at: product?.updated_at ?? new Date().toISOString(),
      created_by: product?.created_by ?? '',
    }
  }

  return inventoryItem
}
