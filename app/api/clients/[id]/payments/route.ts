import { NextRequest, NextResponse } from 'next/server'
import { createBatchPaymentsForSale } from '@/lib/database/payments'
import { getCurrentUserServer } from '@/lib/auth/auth-server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserServer()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { saleId, payments, saleDate } = body

    // Validate inputs
    if (!saleId || typeof saleId !== 'string') {
      return NextResponse.json(
        { error: 'ID de venta inválido' },
        { status: 400 }
      )
    }

    if (!Array.isArray(payments) || payments.length === 0) {
      return NextResponse.json(
        { error: 'No se proporcionaron pagos' },
        { status: 400 }
      )
    }

    if (!saleDate) {
      return NextResponse.json(
        { error: 'Fecha de venta requerida' },
        { status: 400 }
      )
    }

    // Validate each payment
    for (let i = 0; i < payments.length; i++) {
      const payment = payments[i]
      if (typeof payment.amount !== 'number' || payment.amount <= 0) {
        return NextResponse.json(
          { error: `Monto inválido en el pago ${i + 1}` },
          { status: 400 }
        )
      }
      if (payment.exchange_rate !== undefined && payment.exchange_rate <= 0) {
        return NextResponse.json(
          { error: `Tipo de cambio inválido en el pago ${i + 1}` },
          { status: 400 }
        )
      }
    }

    // Create all payments atomically
    const { data, error } = await createBatchPaymentsForSale(
      saleId,
      payments,
      saleDate,
      user.id
    )

    if (error) {
      console.error('Error creating batch payments:', error)
      const errorMessage =
        typeof error === 'string'
          ? error
          : error?.message || 'Error al crear los pagos'
      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }

    return NextResponse.json({ data, success: true })
  } catch (error) {
    console.error('Error in POST /api/clients/:id/payments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
