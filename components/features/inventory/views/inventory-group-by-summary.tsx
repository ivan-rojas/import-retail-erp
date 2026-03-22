import { InventoryRow } from '@/lib/types/inventory'
import { ITEM_STATUSES, ItemStatus } from '@/lib/enums'
import InventoryConditionBadge from '../shared/inventory-condition-badge'
import InventoryStatusBadge from '../shared/inventory-status-badge'

function InventoryGroupBySummary({
  rows,
  groupKey,
}: {
  rows: InventoryRow[]
  groupKey: string
}) {
  const summarizeGroup = (rows: InventoryRow[]) => {
    const totalQty = rows.reduce(
      (acc, r) => acc + (typeof r.quantity === 'number' ? r.quantity : 1),
      0
    )
    const totalCost = rows.reduce(
      (acc, r) => {
        const qty = typeof r.quantity === 'number' ? r.quantity : 1
        const baseCost =
          typeof (r as { cost?: number }).cost === 'number'
            ? ((r as { cost?: number }).cost as number)
            : 0
        const fixesCost =
          typeof r.total_fix_cost === 'number' ? r.total_fix_cost : 0

        return acc + baseCost * qty + fixesCost
      },
      0
    )
    const byStatus = rows.reduce<Record<string, number>>((acc, r) => {
      const key = r.status || 'unknown'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})
    const byCondition = rows.reduce<Record<'new' | 'used', number>>(
      (acc, r) => {
        const c = (r.condition || 'new') as 'new' | 'used'
        acc[c] = (acc[c] || 0) + 1
        return acc
      },
      { new: 0, used: 0 }
    )
    return { totalQty, totalCost, byStatus, byCondition }
  }
  return (
    <>
      <h3 className="text-sm font-semibold text-muted-foreground">
        {groupKey}
      </h3>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3 text-sm">
        <div className="flex items-center gap-2">
          {Object.entries(summarizeGroup(rows).byStatus)
            .filter(([st]) =>
              Object.values(ITEM_STATUSES).includes(st as ItemStatus)
            )
            .map(([st, n]) => (
              <InventoryStatusBadge key={st} status={st as ItemStatus}>
                {n}
              </InventoryStatusBadge>
            ))}
        </div>
        <div className="flex items-center gap-2">
          <InventoryConditionBadge condition="new">
            Nuevo: {summarizeGroup(rows).byCondition.new}
          </InventoryConditionBadge>
          <InventoryConditionBadge condition="used">
            Usado: {summarizeGroup(rows).byCondition.used}
          </InventoryConditionBadge>
        </div>
        <div>
          Cant. Total:{' '}
          <span className="font-semibold">{summarizeGroup(rows).totalQty}</span>
        </div>
        <div>
          Costo Total:{' '}
          <span className="font-semibold">
            ${summarizeGroup(rows).totalCost}
          </span>
        </div>
      </div>
    </>
  )
}

export default InventoryGroupBySummary
