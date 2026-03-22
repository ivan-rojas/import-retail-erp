import { createClient } from '../../utils/supabase/server'
import { PostgrestError } from '@supabase/supabase-js'

import {
  filterOutNonSoldTradeInItems,
  getInventoryItemById,
  getInventoryItemsQuery,
  updateAccessoryItem,
  updateProductItem,
} from './inventory'
import {
  createPayment,
  createPaymentForSale,
  deletePayments,
  getPaymentsForSale,
  updatePayment,
} from './payments'
import {
  createSaleItemForSale,
  createSaleItemForService,
  deleteSaleItem,
  getPreviousSaleItems,
  updateSaleItem,
} from './sale-items'
import {
  deleteTradeInsForSale,
  getTradeInsForSale,
  processTradeInsForSale,
  removeTradeIns,
} from './trade-ins'
import {
  handleDeliveryForSale,
  updateDeliveryForSale,
  createScheduledDelivery,
  updateDeliveryStatus,
} from './deliveries'
import { createReservation, updateReservation } from './reservations'

import { convertRawSaleDataToSaleDTO } from '../utils/sales'

import type { SaleItem, SaleLineType } from '@/lib/types/sale-item'
import type { SaleDTO, RawSaleData } from '@/lib/types/sales'
import { updateReservationStatus } from './reservations'
import { convertTradeInsToTradeInItems } from '../utils/trade-ins'
import { Delivery } from '../types/delivery'
import { PaymentDTO } from '../types/payment'
import { AccessoryItemRow, ProductItemRow } from '@/lib/types/inventory'
import { getMappedInventoryItems } from '../utils/inventory'

/** True if the error is likely due to missing DB columns (migration not run). */
function isMissingColumnError(error: unknown): boolean {
  const msg =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message: unknown }).message)
      : String(error)
  return (
    /column.*does not exist/i.test(msg) ||
    /sale_line_type|item_cost|linked_product_item_id/.test(msg)
  )
}

export const getSales = async (
  userId?: string
): Promise<{ data: SaleDTO[] | null; error: Error | null }> => {
  const supabase = await createClient()

  const runQuery = (queryStr: string) => {
    let q = supabase
      .from('sales')
      .select(queryStr)
      .order('created_at', { ascending: false })
    if (userId) {
      q = q.eq('seller_id', userId).neq('status', 'deleted')
    }
    return q
  }

  let { data, error } = await runQuery(getBaseQuerySales())

  if (error && isMissingColumnError(error)) {
    console.warn(
      '[getSales] Query failed (missing columns?). Run migration 20250224120000_add_sale_line_type_and_service_columns. Using fallback query.',
      { message: (error as { message?: string }).message }
    )
    const fallback = await runQuery(getBaseQuerySalesWithoutServiceColumns())
    data = fallback.data
    error = fallback.error
  }

  if (error) {
    console.error(
      '[getSales] Supabase error:',
      (error as { message?: string }).message,
      error
    )
    return { data: null, error: error as Error }
  }

  const transformedData = convertRawSaleDataToSaleDTO(
    (data ?? []) as unknown as RawSaleData[]
  )

  return { data: transformedData, error: null }
}

export const getSaleById = async (
  id: string
): Promise<{
  data: SaleDTO | null
  error: PostgrestError | null
}> => {
  const supabase = await createClient()

  let { data, error } = await supabase
    .from('sales')
    .select(getBaseQuerySales())
    .eq('id', id)
    .single()

  if (error && isMissingColumnError(error)) {
    console.warn(
      '[getSaleById] Query failed (missing columns?). Using fallback query.'
    )
    const fallback = await supabase
      .from('sales')
      .select(getBaseQuerySalesWithoutServiceColumns())
      .eq('id', id)
      .single()
    data = fallback.data
    error = fallback.error
  }

  if (error || !data) {
    if (error) {
      console.error(
        '[getSaleById] Supabase error:',
        (error as { message?: string }).message,
        error
      )
    }
    return { data: null, error }
  }

  const sale =
    convertRawSaleDataToSaleDTO([data as unknown as RawSaleData])[0] ?? null

  return { data: sale, error: null }
}

export const createSale = async (sale: Record<string, unknown>) => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sales')
    .insert(sale)
    .select()
    .single()

  return { data, error }
}

export const updateSaleStatus = async (
  id: string,
  status: 'sold' | 'reserved' | 'cancelled' | 'deleted'
) => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sales')
    .update({ status })
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export const completeSale = async (
  id: string,
  data: PaymentDTO | PaymentDTO[],
  sellerId: string,
  savePayments: boolean = true
) => {
  // Handle both single payment and array of payments
  const payments = Array.isArray(data) ? data : [data]

  // Get sale details to access sale items for inventory update
  const { data: saleData, error: fetchError } = await getSaleById(id)

  if (fetchError || !saleData) {
    return { data: null, error: fetchError }
  }

  if (savePayments) {
    // Create all payments with rollback on error
    const { error: paymentsError } = await createPaymentsForCompleteSale(
      id,
      payments,
      sellerId
    )

    if (paymentsError) {
      return { data: null, error: paymentsError }
    }
  }

  const { data: sale, error: saleError } = await updateSaleStatus(id, 'sold')

  if (saleError) {
    return { data: null, error: saleError }
  }

  // Update inventory status for all items in the sale
  for (const item of saleData.sale_items || []) {
    const targetId = item.product_item_id || item.accessory_item_id
    if (!targetId) continue

    const itemQuantity = Number(item.item_quantity ?? 1)
    const isDevice = Boolean(item.product_item_id)
    const itemType = isDevice ? 'product' : 'accessory'
    const hasImei = Boolean(item.product_items?.imei)

    // Update inventory to 'sold' status (isReservation = false)
    const { error: inventoryError } = await updateInventoryAfterSale(
      targetId,
      itemType,
      itemQuantity,
      hasImei,
      false // isReservation = false for sold items
    )

    if (inventoryError) {
      // Log error but don't fail the sale completion since sale status is already updated
      console.error('Inventory update error:', inventoryError)
    }
  }

  return { data: sale, error: null }
}

export const updateSale = async (id: string, updates: SaleDTO) => {
  const supabase = await createClient()

  try {
    // 1. Update the main sale record
    const saleUpdates: Record<string, unknown> = {
      customer_name: updates.customer_name,
      customer_ig: updates.customer_ig,
      customer_email: updates.customer_email,
      customer_phone: updates.customer_phone,
      customer_alias_cbu: updates.customer_alias_cbu,
      subtotal_price: updates.subtotal_price,
      sale_price: updates.sale_price,
      sale_date: updates.sale_date,
      notes: updates.notes,
      status: updates.status,
      client_id: updates.client_id,
    }

    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .update(saleUpdates)
      .eq('id', id)
      .select()
      .maybeSingle()

    if (saleError || !sale) {
      return { data: null, error: saleError }
    }

    // 2. Update payments if provided
    if (updates.payments) {
      for (const payment of updates.payments) {
        if (payment.id) {
          // Update existing payment
          await updatePayment(payment.id, {
            base_amount: payment.base_amount,
            amount: payment.amount,
            payment_method: payment.payment_method,
            currency: payment.currency,
            usd_exchange_rate: payment.usd_exchange_rate,
            payment_date: payment.payment_date,
            payment_notes: payment.payment_notes,
            surcharge_percentage: payment.surcharge_percentage,
            converted_amount: payment.converted_amount,
            amount_tendered: payment.amount_tendered,
            change_amount: payment.change_amount,
            sale_id: id,
            created_by: sale.seller_id,
            updated_by: sale.seller_id,
          })
        } else {
          // Create new payment
          await createPaymentForSale(
            id,
            payment.amount,
            payment.payment_method,
            sale.seller_id,
            {
              currency: payment.currency,
              exchange_rate: payment.usd_exchange_rate,
              payment_date: payment.payment_date,
              payment_notes: payment.payment_notes,
              surcharge_percentage: payment.surcharge_percentage,
              converted_amount: payment.converted_amount,
              amount_tendered: payment.amount_tendered,
              change_amount: payment.change_amount,
              sale_date: sale.sale_date,
              base_amount: payment.base_amount,
            }
          )
        }
      }
    }

    // 3. Update sale items if provided
    //    First, read current sale items to detect removals later
    let previousItems: SaleItem[] = []
    if (updates.sale_items) {
      const { data: currentItems } = await getPreviousSaleItems(id)
      previousItems = (currentItems as unknown as SaleItem[]) || []
    }

    if (updates.sale_items) {
      // Only update rows that already exist in DB; new lines (e.g. client-generated service ids) must be created
      const previousIds = new Set(
        (previousItems || []).map((p: SaleItem) => p.id)
      )

      for (const item of updates.sale_items) {
        const lineType: SaleLineType =
          item.sale_line_type ??
          (item.product_item_id
            ? 'device'
            : item.accessory_item_id
              ? 'accessory'
              : 'service')

        const isExisting = Boolean(item.id && previousIds.has(item.id))

        if (isExisting) {
          // Update existing sale item (including service: sale_line_type, item_cost, linked_product_item_id)
          await updateSaleItem(item.id!, {
            item_name: item.item_name,
            item_model: item.item_model,
            item_price: item.item_price,
            item_quantity: item.item_quantity,
            item_notes: item.item_notes,
            product_item_id:
              lineType === 'service' ? null : (item.product_item_id ?? null),
            accessory_item_id:
              lineType === 'service' ? null : (item.accessory_item_id ?? null),
            sale_line_type: lineType,
            item_cost: lineType === 'service' ? (item.item_cost ?? null) : null,
            linked_product_item_id:
              lineType === 'service'
                ? (item.linked_product_item_id ?? null)
                : null,
            sale_id: id,
            created_by: sale.seller_id,
            updated_by: sale.seller_id,
          })
        } else {
          // Create new sale item: service vs device/accessory
          if (lineType === 'service') {
            const itemCost = item.item_cost
            if (itemCost == null || !Number.isFinite(Number(itemCost))) {
              continue // Skip invalid service line without cost
            }
            await createSaleItemForService(id, sale.seller_id, {
              item_name: item.item_name,
              item_model: item.item_model,
              item_price: item.item_price,
              item_quantity: item.item_quantity ?? 1,
              item_cost: itemCost,
              item_notes: item.item_notes ?? null,
              linked_product_item_id: item.linked_product_item_id ?? null,
            })
          } else {
            const unifiedProductId =
              item.product_item_id ?? item.accessory_item_id
            if (!unifiedProductId) continue
            await createSaleItemForSale(id, sale.seller_id, {
              product_item_id: unifiedProductId,
              product_name: item.item_name,
              product_model: item.item_model,
              sale_price: item.item_price,
              type: lineType === 'device' ? 'product' : 'accessory',
              item_quantity: item.item_quantity ?? 1,
              imei: item.product_items?.imei,
              notes: item.item_notes ?? undefined,
            })
          }
        }
      }
      // After applying updates/inserts, reconcile inventory for items removed/added/changed
      await updateInventoryForReservationUpdate(
        previousItems,
        updates.sale_items,
        sale.status
      )
    }

    // 3. Update reservations if provided
    if (updates.reservations) {
      for (const reservation of updates.reservations) {
        const reservationData = {
          deposit: reservation.deposit,
          status: reservation.status,
          sale_id: id,
          created_by: sale.seller_id,
          updated_by: sale.seller_id,
        }
        await updateReservation(reservation.id, reservationData)
      }
    }

    // 4. Trade-ins: diff existing vs updates, remove dropped and add new (incl. reservations)
    if (updates.trade_ins) {
      const { data: existingTradeIns = [] } = await getTradeInsForSale(id)
      const existingIds = new Set(
        (existingTradeIns as { id: string; item_id: string }[]).map((t) => t.id)
      )
      const updateIds = new Set(
        updates.trade_ins.map((t) => t.id).filter(Boolean)
      )
      const toRemove = (
        existingTradeIns as { id: string; item_id: string }[]
      ).filter((t) => !updateIds.has(t.id))
      const toAdd = updates.trade_ins.filter((t) => !existingIds.has(t.id))

      if (toRemove.length > 0) {
        const { error: removeError } = await removeTradeIns(toRemove)
        if (removeError) {
          console.error('Failed to remove trade-ins:', removeError)
        }
      }
      if (toAdd.length > 0) {
        const tradeInItems = convertTradeInsToTradeInItems(toAdd)
        const { errors: tradeInErrors } = await processTradeInsForSale(
          tradeInItems,
          id,
          sale.seller_id
        )
        if (tradeInErrors?.length) {
          console.error('Trade-in processing errors:', tradeInErrors)
        }
      }
    }

    // 5. Delivery handling
    if (updates.deliveries) {
      for (const delivery of updates.deliveries) {
        const deliveryPayload: {
          delivery_date?: string
          delivery_notes?: string
        } = {
          delivery_notes: delivery.delivery_notes ?? undefined,
        }
        // Default delivery date represents sale creation—don't overwrite when editing
        if (!delivery.is_default) {
          deliveryPayload.delivery_date = delivery.delivery_date
        }
        await updateDeliveryForSale(delivery.id, deliveryPayload)
      }
    }

    return { data: sale, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export const deleteSale = async (id: string, hardDelete: boolean = false) => {
  try {
    // Get sale details first to handle inventory rollback if needed
    const { data: sale, error: saleError } = await getSaleById(id)

    if (saleError || !sale) {
      return { error: saleError }
    }

    // For sold items, we should consider inventory rollback
    if (sale.status === 'sold') {
      // Rollback inventory status for sold items
      for (const item of sale.sale_items || []) {
        if (item.product_item_id) {
          // Reset product item status to available
          await updateProductItem(item.product_item_id, { status: 'available' })
        }

        if (item.accessory_item_id) {
          // Add back accessory quantity
          const { data: accessoryItem } = await getInventoryItemById(
            item.accessory_item_id
          )

          if (accessoryItem) {
            await updateAccessoryItem(item.accessory_item_id, {
              quantity: accessoryItem.quantity + (item.item_quantity || 1),
            })
          }
        }
      }
    }

    // For reserved items, rollback to available
    if (sale.status === 'reserved') {
      for (const item of sale.sale_items || []) {
        if (item.product_item_id) {
          // Reset product item status to available
          await updateProductItem(item.product_item_id, { status: 'available' })
        }

        if (item.accessory_item_id) {
          // Add back accessory quantity
          const { data: accessoryItem } = await getInventoryItemById(
            item.accessory_item_id
          )

          if (accessoryItem) {
            await updateAccessoryItem(item.accessory_item_id, {
              quantity: accessoryItem.quantity + (item.item_quantity || 1),
            })
          }
        }
      }
    }

    // Delete trade-ins
    const { error: tradeInsError } = await deleteTradeInsForSale(id)
    if (tradeInsError) {
      return { error: tradeInsError }
    }

    const { error: deleteError } = hardDelete
      ? await hardDeleteSalesRecords(id)
      : await updateSaleStatus(id, 'deleted')

    await updateReservationStatus(sale.reservations?.[0]?.id, 'cancelled')

    await updateDeliveryStatus(
      sale.deliveries?.[0]?.id,
      'cancelled',
      sale.seller_id
    )

    return { error: deleteError }
  } catch (error) {
    return { error }
  }
}

export const hardDeleteSalesRecords = async (id: string) => {
  const supabase = await createClient()
  const { error } = await supabase.from('sales').delete().eq('id', id)
  return { error }
}

export const processSale = async (saleData: SaleDTO) => {
  const isReservation =
    saleData.status === 'reserved' || saleData.is_reservation

  // 1. Create the single sale record
  const saleInsert = {
    customer_name: saleData.customer_name,
    customer_ig: saleData.customer_ig ?? null,
    customer_email: saleData.customer_email ?? null,
    customer_phone: saleData.customer_phone ?? null,
    customer_alias_cbu: saleData.customer_alias_cbu ?? null,
    status: saleData.status,
    subtotal_price: saleData.subtotal_price,
    sale_price: saleData.sale_price,
    sale_date: saleData.sale_date,
    notes: saleData.notes ?? null,
    seller_id: saleData.seller_id,
    seller_name: saleData.seller_name,
    updated_by: saleData.seller_id,
    client_id: saleData.client_id ?? null,
  }

  const { data: sale, error: saleError } = await createSale(saleInsert)
  if (saleError || !sale) {
    return { data: null, error: saleError }
  }

  try {
    // 2. Create sale item records for ALL items (device, accessory, or service)
    for (const item of saleData.sale_items) {
      const lineType: SaleLineType =
        item.sale_line_type ??
        (item.product_item_id
          ? 'device'
          : item.accessory_item_id
            ? 'accessory'
            : 'service')

      if (lineType === 'service') {
        const itemCost = item.item_cost
        if (itemCost == null || !Number.isFinite(Number(itemCost))) {
          await hardDeleteSalesRecords(sale.id)
          return {
            data: null,
            error: new Error('Service line requires item_cost'),
          }
        }
        const { error: itemError } = await createSaleItemForService(
          sale.id,
          saleData.seller_id,
          {
            item_name: item.item_name,
            item_model: item.item_model,
            item_price: item.item_price,
            item_quantity: item.item_quantity ?? 1,
            item_cost: itemCost,
            item_notes: item.item_notes ?? null,
            linked_product_item_id: item.linked_product_item_id ?? null,
          }
        )
        if (itemError) {
          await hardDeleteSalesRecords(sale.id)
          return { data: null, error: itemError }
        }
      } else {
        const unifiedProductId = item.product_item_id ?? item.accessory_item_id
        if (!unifiedProductId) {
          await hardDeleteSalesRecords(sale.id)
          return {
            data: null,
            error: new Error(
              'Device/accessory line requires product_item_id or accessory_item_id'
            ),
          }
        }
        const { error: itemError } = await createSaleItemForSale(
          sale.id,
          saleData.seller_id,
          {
            product_item_id: unifiedProductId,
            product_name: item.item_name,
            product_model: item.item_model,
            imei: item.product_items?.imei,
            type: lineType === 'device' ? 'product' : 'accessory',
            item_quantity: item.item_quantity,
            sale_price: item.item_price,
            notes: item.item_notes ?? undefined,
          }
        )
        if (itemError) {
          await hardDeleteSalesRecords(sale.id)
          return { data: null, error: itemError }
        }
      }
    }

    if (isReservation) {
      const { error: reservationError } = await createReservation({
        sale_id: sale.id,
        deposit: saleData.reservations?.[0]?.deposit ?? 0,
        status: 'pending',
      })

      if (reservationError) {
        await hardDeleteSalesRecords(sale.id)
        return { data: null, error: reservationError }
      }
    }

    // 3. Create single payment record (derive from first payment if present)
    const primaryPayment = saleData.payments?.[0]
    const amountToCharge = isReservation
      ? (saleData.reservations?.[0]?.deposit ?? 0)
      : (primaryPayment?.amount ?? saleData.sale_price)

    // Create payments with transactional rollback on error
    const { error: paymentsError } = await createPaymentsWithRollback(
      sale.id,
      saleData.payments,
      saleData
    )

    if (paymentsError) {
      return { data: null, error: paymentsError }
    }

    // 4. Update inventory for device/accessory items only (service lines do not touch inventory)
    for (const item of saleData.sale_items) {
      if (!isInventoryLine(item)) continue
      const targetId = item.product_item_id || item.accessory_item_id || ''
      if (!targetId) continue
      const itemQuantity = Number(item.item_quantity ?? 1)
      const isDevice = Boolean(item.product_item_id)
      const itemType = isDevice ? 'product' : 'accessory'
      const hasImei = Boolean(item.product_items?.imei)

      const { error: inventoryError } = await updateInventoryAfterSale(
        targetId,
        itemType,
        itemQuantity,
        hasImei,
        isReservation
      )
      if (inventoryError) {
        // We already created the sale and item/payment rows;
        // return the sale but signal the inventory error
        return { data: sale, error: inventoryError }
      }
    }

    // 5. Process trade-ins if any
    if (saleData.trade_ins && saleData.trade_ins.length > 0) {
      const tradeInItems = convertTradeInsToTradeInItems(saleData.trade_ins)

      const { errors: tradeInErrors } = await processTradeInsForSale(
        tradeInItems,
        sale.id,
        saleData.seller_id
      )

      if (tradeInErrors && tradeInErrors.length > 0) {
        // Log trade-in errors but don't fail the sale
        console.error('Trade-in processing errors:', tradeInErrors)
      }
    }

    // 6. Process delivery if provided (use the first delivery input)
    const delivery = saleData.deliveries?.[0]
    if (delivery) {
      const { error: deliveryError } = await processDelivery(
        delivery,
        isReservation,
        sale,
        saleData,
        amountToCharge
      )
      if (deliveryError) {
        return { data: null, error: deliveryError }
      }
    }

    return { data: sale, error: null }
  } catch (error) {
    // Rollback on any unexpected error
    await deleteSale(sale.id, true)
    throw error
  }
}

export const getInventoryItemsForSale = async () => {
  const { productItemsWithUsedQuery, accessoryItemsQuery } =
    await getInventoryItemsQuery(true)

  const responses = await Promise.all([
    productItemsWithUsedQuery,
    accessoryItemsQuery,
  ])

  const productResp = responses[0] as {
    data: ProductItemRow[] | null
    error: unknown
  }
  const accessoryResp = responses[1] as {
    data: AccessoryItemRow[] | null
    error: unknown
  }
  // No separate used response; included in product items

  const productItems = productResp.data
  const productError = productResp.error
  const accessoryItems = accessoryResp.data
  const accessoryError = accessoryResp.error
  // embedded used details; keep variables for interface consistency if needed

  const error = productError || accessoryError || null

  const productItemsFiltered = filterOutNonSoldTradeInItems(productItems ?? [])

  const mapped = getMappedInventoryItems(
    productItemsFiltered,
    accessoryItems ?? []
  )
  return { data: mapped, error }
}

// HELPERS FUNCTIONS

/**
 * Creates payments for completeSale atomically.
 * First deletes existing payments for the sale, then creates all new payments
 * in a single batch operation to ensure atomicity.
 * Used when the sale already exists and we're just adding payments.
 */
const createPaymentsForCompleteSale = async (
  saleId: string,
  payments: PaymentDTO[],
  sellerId: string
): Promise<{ data: string[] | null; error: unknown }> => {
  try {
    // Get existing payments to delete them first
    const { data: existingPayments, error: existingPaymentsError } =
      await getPaymentsForSale(saleId)
    if (existingPaymentsError) {
      return { data: null, error: existingPaymentsError }
    }

    // Delete existing payments if any
    if (existingPayments && existingPayments.length > 0) {
      const { error: deleteError } = await deletePayments(
        existingPayments.map((payment) => payment.id)
      )
      if (deleteError) {
        return { data: null, error: deleteError }
      }
    }

    // Prepare all payment inserts with sale_id and user info
    const paymentInserts = payments.map((payment) => ({
      base_amount: payment.base_amount,
      amount: payment.amount,
      payment_method: payment.payment_method,
      currency: payment.currency,
      usd_exchange_rate: payment.usd_exchange_rate,
      payment_date: payment.payment_date,
      payment_notes: payment.payment_notes,
      surcharge_percentage: payment.surcharge_percentage,
      converted_amount: payment.converted_amount,
      amount_tendered: payment.amount_tendered,
      change_amount: payment.change_amount,
      reservation_id: null,
      sale_id: saleId,
      created_by: sellerId,
      updated_by: sellerId,
    }))

    // Create all payments atomically in a single batch operation
    const supabase = await createClient()
    const { data: createdPayments, error: paymentError } = await supabase
      .from('payments')
      .insert(paymentInserts)
      .select('id')

    if (paymentError) {
      return { data: null, error: paymentError }
    }

    // Extract payment IDs from created payments
    const createdPaymentIds =
      createdPayments?.map((payment) => payment.id) || []

    return { data: createdPaymentIds, error: null }
  } catch (error) {
    // Batch operation is atomic - if it fails, no payments are created
    return { data: null, error }
  }
}

/**
 * Creates payments for a sale atomically.
 * Uses batch insert to ensure all payments succeed or fail together.
 * If any payment fails, rolls back the entire sale.
 */
const createPaymentsWithRollback = async (
  saleId: string,
  payments: PaymentDTO[],
  saleData: SaleDTO
): Promise<{ data: string[] | null; error: unknown }> => {
  try {
    // Prepare all payment inserts
    const paymentInserts = payments.map((payment) => ({
      base_amount: payment?.base_amount ?? payment?.amount,
      amount: payment?.amount,
      payment_method: payment?.payment_method ?? 'cash',
      currency: payment?.currency ?? 'USD',
      usd_exchange_rate: payment?.usd_exchange_rate ?? 1,
      payment_date: payment?.payment_date ?? saleData.sale_date,
      payment_notes: payment?.payment_notes ?? saleData.notes ?? null,
      surcharge_percentage: payment?.surcharge_percentage,
      converted_amount: payment?.converted_amount,
      amount_tendered: payment?.amount_tendered,
      change_amount: payment?.change_amount,
      reservation_id: null,
      sale_id: saleId,
      created_by: saleData.seller_id,
      updated_by: saleData.seller_id,
    }))

    // Create all payments atomically in a single batch operation
    const supabase = await createClient()
    const { data: createdPayments, error: paymentError } = await supabase
      .from('payments')
      .insert(paymentInserts)
      .select('id')

    if (paymentError) {
      // Rollback: delete the sale since payments failed
      await rollbackPaymentsAndSale([], saleId)
      return { data: null, error: paymentError }
    }

    // Extract payment IDs from created payments
    const createdPaymentIds =
      createdPayments?.map((payment) => payment.id) || []

    return { data: createdPaymentIds, error: null }
  } catch (error) {
    // Rollback on unexpected error - batch operation is atomic so no partial payments exist
    await rollbackPaymentsAndSale([], saleId)
    return { data: null, error }
  }
}

/**
 * Deletes all payments and the sale record as a rollback operation.
 */
const rollbackPaymentsAndSale = async (
  paymentIds: string[],
  saleId: string
): Promise<void> => {
  const supabase = await createClient()

  // Delete all created payments
  if (paymentIds.length > 0) {
    await supabase.from('payments').delete().in('id', paymentIds)
  }

  // Hard delete the sale record
  await hardDeleteSalesRecords(saleId)
}

const processDelivery = async (
  delivery: Delivery,
  isReservation: boolean,
  sale: SaleDTO,
  saleData: SaleDTO,
  amountToCharge: number
): Promise<{ data: SaleDTO | null; error: PostgrestError | null }> => {
  if (isReservation) {
    // Ensure a reservation exists
    const reservationDeposit =
      saleData.reservations?.[0]?.deposit ?? amountToCharge
    const { data: reservation, error: reservationError } =
      await createReservation({
        sale_id: sale.id,
        deposit: reservationDeposit,
        status: 'pending',
        created_by: saleData.seller_id,
        updated_by: saleData.seller_id,
      })
    if (!reservationError && reservation) {
      const result = await createScheduledDelivery(
        sale.id,
        reservation.id,
        delivery.delivery_date,
        delivery.delivery_notes ?? undefined,
        saleData.seller_id
      )
      if (result.error) {
        console.error('Delivery processing error:', result.error)
      }
    } else {
      return { data: null, error: reservationError }
    }
  } else {
    const deliveryError = await handleDeliveryForSale(
      sale.id,
      {
        is_default_delivery: delivery.is_default,
        delivery_date: delivery.delivery_date,
        delivery_notes: delivery.delivery_notes ?? undefined,
      },
      saleData.seller_id
    )
    if (deliveryError) {
      // Log delivery error but don't fail the sale
      console.error('Delivery processing error:', deliveryError)
    }
  }
  return { data: null, error: null }
}

/** Query without service-line columns; use when migration has not been run yet. */
function getBaseQuerySalesWithoutServiceColumns() {
  return `
      *,
      payments:payments(
        id,
        base_amount,
        amount,
        payment_method,
        currency,
        usd_exchange_rate,
        payment_date,
        payment_notes,
        surcharge_percentage,
        converted_amount,
        amount_tendered,
        change_amount
      ),
      deliveries:deliveries(
        id,
        delivery_date,
        delivery_notes,
        delivery_status,
        delivery_user_id,
        is_default
      ),
      reservations:reservations(
        id,
        deposit,
        status,
        sale_reservation_items:sale_reservation_items(
          id,
          item_name,
          item_model,
          item_price,
          item_quantity,
          item_notes,
          product_item_id,
          accessory_item_id
        )
      ),
      sale_items:sale_reservation_items!sale_id(
        id,
        item_name,
        item_model,
        item_price,
        item_quantity,
        item_notes,
        product_item_id,
        accessory_item_id,
        product_items:product_items!sale_reservation_items_product_item_id_fkey(
          id,
          imei,
          color,
          storage,
          condition,
          products:products(
            id,
            name,
            type,
            category,
            model
          )
        ),
        accessory_items:accessory_items(
          id,
          color,
          quantity,
          products:products(
            id,
            name,
            type,
            category,
            model
          )
        )
      ),
      trade_ins:trade_ins(
        id,
        item_id,
        product_items:product_items(
          id,
          name,
          imei,
          color,
          storage,
          condition,
          cost,
          price,
          products:products(
            id,
            name,
            type,
            category,
            model
          )
        )
      )
    `
}

export const getBaseQuerySales = () => {
  return `
      *,
      payments:payments(
        id,
        base_amount,
        amount,
        payment_method,
        currency,
        usd_exchange_rate,
        payment_date,
        payment_notes,
        surcharge_percentage,
        converted_amount,
        amount_tendered,
        change_amount
      ),
      deliveries:deliveries(
        id,
        delivery_date,
        delivery_notes,
        delivery_status,
        delivery_user_id,
        is_default
      ),
      reservations:reservations(
        id,
        deposit,
        status,
        sale_reservation_items:sale_reservation_items(
          id,
          item_name,
          item_model,
          item_price,
          item_quantity,
          item_notes,
          product_item_id,
          accessory_item_id,
          sale_line_type,
          item_cost,
          linked_product_item_id
        )
      ),
      sale_items:sale_reservation_items!sale_id(
        id,
        item_name,
        item_model,
        item_price,
        item_quantity,
        item_notes,
        product_item_id,
        accessory_item_id,
        sale_line_type,
        item_cost,
        linked_product_item_id,
        product_items:product_items!sale_reservation_items_product_item_id_fkey(
          id,
          imei,
          color,
          storage,
          condition,
          products:products(
            id,
            name,
            type,
            category,
            model
          )
        ),
        accessory_items:accessory_items(
          id,
          color,
          quantity,
          products:products(
            id,
            name,
            type,
            category,
            model
          )
        )
      ),
      trade_ins:trade_ins(
        id,
        item_id,
        product_items:product_items(
          id,
          name,
          imei,
          color,
          storage,
          condition,
          cost,
          price,
          products:products(
            id,
            name,
            type,
            category,
            model
          )
        )
      )
    `
}

// Helper function to update inventory after sale
const updateInventoryAfterSale = async (
  productId: string,
  itemType: 'product' | 'accessory',
  itemQuantity: number,
  hasImei: boolean,
  isReservation: boolean
) => {
  const isDevice = itemType === 'product' || hasImei
  const isAccessory = itemType === 'accessory'
  const status = isReservation ? 'reserved' : 'sold'

  if (isDevice) {
    return updateProductItem(productId, { status })
  } else if (isAccessory) {
    const { data: accessoryItem, error: accSelectError } =
      await getInventoryItemById(productId)

    if (accSelectError || !accessoryItem) {
      return { data: null, error: accSelectError }
    }
    const nextQty = Math.max(0, (accessoryItem.quantity ?? 0) - itemQuantity)
    return updateAccessoryItem(accessoryItem.id, { quantity: nextQty })
  }

  return { data: null, error: null }
}

/** True if this line affects inventory (device or accessory); service lines do not. */
function isInventoryLine(item: SaleItem): boolean {
  const lineType =
    item.sale_line_type ??
    (item.product_item_id
      ? 'device'
      : item.accessory_item_id
        ? 'accessory'
        : null)
  if (lineType === 'service') return false
  return Boolean(item.product_item_id ?? item.accessory_item_id)
}

// Helper to reconcile inventory when updating a sale/reservation
// It handles:
// 1. Items removed: restores inventory to 'available'
// 2. Items added: sets inventory to 'reserved' or 'sold' based on sale status
// 3. Items changed: frees old product, reserves/sells new product
const updateInventoryForReservationUpdate = async (
  previousItems: SaleItem[],
  nextItems: SaleItem[],
  saleStatus: 'sold' | 'reserved' | 'cancelled' | 'deleted'
) => {
  const isReservation = saleStatus === 'reserved'
  const isCancelledOrDeleted =
    saleStatus === 'cancelled' || saleStatus === 'deleted'

  // Create maps for easier lookup
  const previousItemsMap = new Map<string, SaleItem>()
  for (const item of previousItems || []) {
    if (item.id) {
      previousItemsMap.set(item.id, item)
    }
  }

  const nextItemsMap = new Map<string, SaleItem>()
  for (const item of nextItems || []) {
    if (item.id) {
      nextItemsMap.set(item.id, item)
    }
  }

  // 1. Handle removals and changes: items present before but not after, or with changed product
  for (const prev of previousItems || []) {
    if (!prev.id) continue

    const next = nextItemsMap.get(prev.id)

    if (!next) {
      // Item was removed: restore inventory only for device/accessory lines
      if (isInventoryLine(prev)) {
        if (prev.product_item_id) {
          const { error: productError } = await updateProductItem(
            prev.product_item_id,
            { status: 'available' }
          )
          if (productError) {
            console.error('Failed to restore product item:', productError)
          }
        } else if (prev.accessory_item_id) {
          const { data: accessory } = await getInventoryItemById(
            prev.accessory_item_id
          )
          if (accessory) {
            const qtyToReturn = Number(prev.item_quantity ?? 1)
            const nextQty = Math.max(0, (accessory.quantity ?? 0) + qtyToReturn)
            const { error: accessoryError } = await updateAccessoryItem(
              prev.accessory_item_id,
              { quantity: nextQty }
            )
            if (accessoryError) {
              console.error(
                'Failed to restore accessory quantity:',
                accessoryError
              )
            }
          }
        }
      }
      const { error: deleteError } = await deleteSaleItem(prev.id)
      if (deleteError) {
        console.error('Failed to delete sale item:', deleteError)
      }
    } else {
      // Item exists in both - check if product changed
      const prevProductId = prev.product_item_id || prev.accessory_item_id
      const nextProductId = next.product_item_id || next.accessory_item_id

      if (prevProductId !== nextProductId) {
        // Product changed - free the old one, reserve/sell the new one
        // Free old product
        if (prev.product_item_id) {
          await updateProductItem(prev.product_item_id, { status: 'available' })
        } else if (prev.accessory_item_id) {
          const { data: accessory } = await getInventoryItemById(
            prev.accessory_item_id
          )
          if (accessory) {
            const qtyToReturn = Number(prev.item_quantity ?? 1)
            const nextQty = Math.max(0, (accessory.quantity ?? 0) + qtyToReturn)
            await updateAccessoryItem(prev.accessory_item_id, {
              quantity: nextQty,
            })
          }
        }

        // Reserve/sell new product (skip for cancelled/deleted sales and non-inventory lines)
        if (nextProductId && !isCancelledOrDeleted && isInventoryLine(next)) {
          const itemQuantity = Number(next.item_quantity ?? 1)
          const isDevice = Boolean(next.product_item_id)
          const itemType = isDevice ? 'product' : 'accessory'
          const hasImei = Boolean(next.product_items?.imei)

          await updateInventoryAfterSale(
            nextProductId,
            itemType,
            itemQuantity,
            hasImei,
            isReservation
          )
        }
      } else if (
        prev.accessory_item_id &&
        next.accessory_item_id &&
        prev.accessory_item_id === next.accessory_item_id &&
        prev.item_quantity !== next.item_quantity &&
        !isCancelledOrDeleted
      ) {
        // Same accessory but quantity changed - adjust inventory
        const qtyDiff =
          Number(next.item_quantity ?? 1) - Number(prev.item_quantity ?? 1)
        const { data: accessory } = await getInventoryItemById(
          prev.accessory_item_id
        )
        if (accessory) {
          const newQty = Math.max(0, (accessory.quantity ?? 0) - qtyDiff)
          const { error: accessoryError } = await updateAccessoryItem(
            prev.accessory_item_id,
            {
              quantity: newQty,
            }
          )
          if (accessoryError) {
            console.error(
              'Failed to update accessory quantity:',
              accessoryError
            )
          }
        }
      }
    }
  }

  // 2. Handle new items: items present after but not before (no ID)
  // Skip inventory updates for cancelled/deleted sales; service lines never touch inventory
  if (!isCancelledOrDeleted) {
    for (const next of nextItems || []) {
      if (!next.id && isInventoryLine(next)) {
        const targetId = next.product_item_id || next.accessory_item_id
        if (!targetId) continue

        const itemQuantity = Number(next.item_quantity ?? 1)
        const isDevice = Boolean(next.product_item_id)
        const itemType = isDevice ? 'product' : 'accessory'
        const hasImei = Boolean(next.product_items?.imei)

        await updateInventoryAfterSale(
          targetId,
          itemType,
          itemQuantity,
          hasImei,
          isReservation
        )
      }
    }
  }

  return { error: null }
}
