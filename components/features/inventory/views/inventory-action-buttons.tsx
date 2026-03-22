'use client'

import { useCallback, useMemo, useState } from 'react'
import { Button } from '@/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select'
import {
  Edit,
  Trash2,
  Wrench,
  MoreHorizontal,
  CheckCircle,
  AlertCircle,
  Box,
} from 'lucide-react'
import AddDeviceItemForm from '@/components/features/inventory/forms/device-item-form'
import AddAccessoryItemForm from '@/components/features/inventory/forms/accessory-item-form'
import {
  useSoftDeleteInventoryItem,
  useUpdateInventoryItem,
  useInventoryItem,
  useChangeStatusInventoryItem,
} from '@/lib/hooks/use-inventory'
import { useTechnicians } from '@/lib/hooks/use-technicians'
import { InventoryRow } from '@/lib/types/inventory'

interface InventoryActionButtonsProps {
  row: InventoryRow
  disabled?: boolean
}

export default function InventoryActionButtons({
  row,
  disabled = false,
}: InventoryActionButtonsProps) {
  const [confirmOpen, setConfirmOpen] = useState<
    'lost' | 'delete' | 'free' | 'spare' | null
  >(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editType, setEditType] = useState<'device' | 'accessory' | null>(null)
  const [initialValues, setInitialValues] = useState<Record<string, unknown>>(
    {}
  )
  const [technicianDialogOpen, setTechnicianDialogOpen] = useState(false)
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>('')
  const updateItem = useUpdateInventoryItem()
  const softDelete = useSoftDeleteInventoryItem()
  const changeStatus = useChangeStatusInventoryItem()
  const { refetch } = useInventoryItem(row.id, { enabled: false })
  const { data: technicians = [] } = useTechnicians()

  type ProductItem = {
    id: string
    product_id: string
    batch_id?: string | null
    name: string
    color: string
    storage?: string | null
    cost: number
    price: number
    wholesale_price?: number
    imei?: string
    notes?: string
    is_on_sale?: boolean
    products?: { name?: string }
    used_product_items?: Array<UsedItem>
  }
  type AccessoryItem = {
    id: string
    product_id: string
    batch_id?: string | null
    name: string
    color: string
    cost: number
    price: number
    wholesale_price?: number
    quantity: number
    notes?: string
    is_on_sale?: boolean
    products?: { name?: string }
  }
  type UsedItem = {
    id: string
    battery_health?: number
    issues?: string[]
    fixes?: string[]
  }

  const updateInitialValuesFromData = useCallback(
    (raw: unknown) => {
      if (!raw) return

      if (row.table === 'accessory_items') {
        const acc = raw as AccessoryItem
        setInitialValues({
          product_id: acc.product_id,
          batch_id: acc.batch_id ?? '',
          name: acc.name,
          color: acc.color,
          storage: '',
          cost: Number(acc.cost || 0),
          price: Number(acc.price || 0),
          wholesale_price: Number(acc.wholesale_price || 0),
          quantity: Number(acc.quantity || 1),
          notes: acc.notes ?? '',
          is_on_sale: acc.is_on_sale ?? false,
          search: acc.products?.name ?? '',
          batchSearch: '',
        })
      } else if (row.table === 'product_items') {
        const pi = raw as ProductItem
        setInitialValues({
          product_id: pi.product_id || '',
          batch_id: pi.batch_id ?? '',
          name: pi.name,
          color: pi.color,
          storage: pi.storage || '',
          cost: Number(pi.cost || 0),
          price: Number(pi.price || 0),
          wholesale_price: Number(pi.wholesale_price || 0),
          imei: pi.imei || '',
          condition: 'new',
          notes: pi.notes ?? '',
          is_on_sale: pi.is_on_sale ?? false,
          search: pi.products?.name ?? '',
          batchSearch: '',
        })
      } else {
        // used_product_items
        const pi = raw as ProductItem
        const used = pi.used_product_items?.[0]
        setInitialValues({
          product_id: pi.product_id || '',
          batch_id: pi.batch_id ?? '',
          name: pi.name,
          color: pi.color,
          storage: pi.storage || '',
          cost: Number(pi.cost || 0),
          price: Number(pi.price || 0),
          wholesale_price: Number(pi.wholesale_price || 0),
          imei: pi.imei || '',
          condition: 'used',
          used_battery_health: used?.battery_health,
          used_issues: Array.isArray(used?.issues)
            ? used?.issues.join(', ')
            : '',
          used_fixes: Array.isArray(used?.fixes)
            ? JSON.stringify(
                used.fixes.map((fix: unknown) => {
                  if (typeof fix === 'string') {
                    return JSON.parse(fix)
                  }
                  return fix
                })
              )
            : '',
          notes: pi.notes ?? '',
          is_on_sale: pi.is_on_sale ?? false,
          search: pi?.products?.name ?? '',
          batchSearch: '',
        })
      }
    },
    [row.table]
  )

  const openEdit = useCallback(async () => {
    try {
      const { data: raw } = await refetch()
      if (!raw) throw new Error('No se pudo cargar el ítem')

      if (row.table === 'accessory_items') {
        setEditType('accessory')
      } else {
        setEditType('device')
      }

      updateInitialValuesFromData(raw)
      setEditOpen(true)
    } catch (e) {
      console.error(e)
    }
  }, [row, refetch, updateInitialValuesFromData])

  const handleSubmitEdit = useCallback(
    (payload: Record<string, unknown>) => {
      let updates: Record<string, unknown> = {}
      const table: 'product_items' | 'accessory_items' | 'used_product_items' =
        row.table
      const imeiValue =
        (Array.isArray(payload.imeis) && payload.imeis[0]) ||
        (typeof payload.imei === 'string' ? payload.imei : row.imei)
      if (row.table === 'accessory_items') {
        updates = {
          name: payload.name,
          batch_id: payload.batch_id ?? null,
          product_id: payload.product_id || '',
          color: payload.color,
          cost: payload.cost,
          price: payload.price,
          wholesale_price: payload.wholesale_price,
          quantity: payload.quantity,
          notes: payload.notes ?? '',
          is_on_sale: payload.is_on_sale ?? false,
        }
      } else if (row.table === 'product_items') {
        updates = {
          name: payload.name,
          batch_id: payload.batch_id ?? null,
          product_id: payload.product_id || '',
          color: payload.color,
          storage: payload.storage ?? null,
          imei: imeiValue,
          cost: payload.cost,
          price: payload.price,
          wholesale_price: payload.wholesale_price,
          notes: payload.notes ?? '',
          is_on_sale: payload.is_on_sale ?? false,
        }
      } else {
        updates = {
          product_items: {
            name: payload.name,
            batch_id: payload.batch_id ?? null,
            product_id: payload.product_id || '',
            color: payload.color,
            storage: payload.storage ?? null,
            imei: imeiValue,
            cost: payload.cost,
            price: payload.price,
            wholesale_price: payload.wholesale_price,
            notes: payload.notes ?? '',
            is_on_sale: payload.is_on_sale ?? false,
          },
          used_product_items: payload.usedDetails,
        }
      }
      updateItem.mutate(
        { id: row.id, data: { table, updates } },
        {
          onSuccess: async () => {
            // Refetch the item data to update the initialValues for next edit
            const { data: updatedData } = await refetch()
            if (updatedData) {
              // Update initialValues with the fresh data
              await updateInitialValuesFromData(updatedData)
            }
            setEditOpen(false)
          },
        }
      )
    },
    [row, updateItem, refetch, updateInitialValuesFromData]
  )

  const FormComponent = useMemo(() => {
    if (!editType) return null
    if (editType === 'accessory') {
      return (
        <AddAccessoryItemForm
          showTrigger={false}
          open={editOpen}
          onOpenChange={setEditOpen}
          initialValues={initialValues}
          mode="edit"
          onSubmit={(payload) =>
            handleSubmitEdit(payload as unknown as Record<string, unknown>)
          }
        />
      )
    }
    return (
      <AddDeviceItemForm
        showTrigger={false}
        open={editOpen}
        onOpenChange={setEditOpen}
        initialValues={initialValues}
        mode="edit"
        onSubmit={(payload) =>
          handleSubmitEdit(payload as unknown as Record<string, unknown>)
        }
      />
    )
  }, [editType, editOpen, initialValues, handleSubmitEdit])

  const handleDelete = useCallback(async () => {
    softDelete.mutate({ id: row.id, table: row.table })
  }, [row, softDelete])

  const handleChangeStatus = useCallback(
    async (status: 'available' | 'sold' | 'reserved' | 'lost' | 'spare') => {
      changeStatus.mutate({ id: row.id, table: row.table, status })
    },
    [row, changeStatus]
  )

  const handleTechnicianAssignment = useCallback(async () => {
    if (!selectedTechnicianId || row.table !== 'used_product_items') return

    updateItem.mutate(
      {
        id: row.id,
        data: {
          table: 'used_product_items',
          updates: {
            product_items: {
              status: 'in-repair',
            },
            used_product_items: {
              technician_id: selectedTechnicianId,
            },
          },
        },
      },
      {
        onSuccess: () => {
          setTechnicianDialogOpen(false)
          setSelectedTechnicianId('')
        },
      }
    )
  }, [selectedTechnicianId, row, updateItem])

  const handleFreeDevice = useCallback(async () => {
    if (row.table !== 'used_product_items') return

    updateItem.mutate(
      {
        id: row.id,
        data: {
          table: 'used_product_items',
          updates: {
            product_items: {
              status: 'available',
            },
            used_product_items: {
              technician_id: row.technician_id ?? null,
            },
          },
        },
      },
      {
        onSuccess: () => {
          setConfirmOpen('free')
        },
        onError: (error) => {
          console.error(error)
          setConfirmOpen(null)
        },
      }
    )
  }, [row, updateItem])

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={disabled}
          >
            <span className="sr-only">Abrir menú</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {row.table === 'used_product_items' &&
            row.status !== 'in-repair' &&
            row.status === 'available' && (
              <DropdownMenuItem onClick={() => setTechnicianDialogOpen(true)}>
                <Wrench className="mr-2 h-4 w-4" />
                Enviar a técnico
              </DropdownMenuItem>
            )}
          {row.status === 'in-repair' && (
            <DropdownMenuItem onClick={() => setConfirmOpen('free')}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Liberar dispositivo
            </DropdownMenuItem>
          )}
          {(row.status === 'available' || row.status === 'in-repair') && (
            <DropdownMenuItem onClick={() => setConfirmOpen('lost')}>
              <AlertCircle className="mr-2 h-4 w-4" />
              Marcar como perdido
            </DropdownMenuItem>
          )}
          {(row.status === 'available' || row.status === 'in-repair') && (
            <DropdownMenuItem onClick={() => setConfirmOpen('spare')}>
              <Box className="mr-2 h-4 w-4" />
              Marcar como despiece
            </DropdownMenuItem>
          )}
          {(row.status === 'lost' || row.status === 'spare') && (
            <DropdownMenuItem onClick={() => handleChangeStatus('available')}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Marcar como disponible
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={openEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          {row.status !== 'sold' && row.status !== 'reserved' && (
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setConfirmOpen('delete')}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Technician Dialog */}
      {row.table === 'used_product_items' && row.status !== 'in-repair' && (
        <Dialog
          open={technicianDialogOpen}
          onOpenChange={setTechnicianDialogOpen}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Enviar a técnico</DialogTitle>
              <DialogDescription>
                Selecciona el técnico al que quieres enviar este dispositivo
                para reparación.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-3 sm:gap-4">
                <label htmlFor="technician" className="text-left sm:text-right">
                  Técnico
                </label>
                <Select
                  value={selectedTechnicianId}
                  onValueChange={setSelectedTechnicianId}
                >
                  <SelectTrigger className="sm:col-span-3 w-full">
                    <SelectValue placeholder="Selecciona un técnico" />
                  </SelectTrigger>
                  <SelectContent>
                    {technicians.map((technician) => (
                      <SelectItem key={technician.id} value={technician.id}>
                        {technician.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setTechnicianDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleTechnicianAssignment}
                disabled={!selectedTechnicianId}
              >
                Enviar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Mark as lost or spare item Confirmation Dialog */}
      <AlertDialog
        open={confirmOpen === 'lost' || confirmOpen === 'spare'}
        onOpenChange={(open) => !open && setConfirmOpen(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmOpen === 'lost'
                ? 'Marcar como perdido'
                : 'Marcar como despiece'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmOpen === 'lost'
                ? '¿Seguro que quieres marcar este ítem como perdido?'
                : '¿Seguro que quieres marcar este ítem como despiece?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={async () => {
                await handleChangeStatus(
                  confirmOpen === 'lost' ? 'lost' : 'spare'
                )
                setConfirmOpen(null)
              }}
            >
              {confirmOpen === 'lost'
                ? 'Marcar como perdido'
                : 'Marcar como despiece'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={confirmOpen === 'delete'}
        onOpenChange={(open) => setConfirmOpen(open ? 'delete' : null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar ítem</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Seguro que quieres eliminar este ítem?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={async () => {
                await handleDelete()
                setConfirmOpen(null)
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Free Device Confirmation Dialog */}
      {row.status === 'in-repair' && (
        <AlertDialog
          open={confirmOpen === 'free'}
          onOpenChange={(open) => setConfirmOpen(open ? 'free' : null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Liberar dispositivo</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Confirma que el dispositivo ha sido reparado y está listo para
                la venta? Esto cambiará el estado del dispositivo de &quot;en
                reparación&quot; a &quot;disponible&quot;.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-green-600 text-white hover:bg-green-700"
                onClick={async () => {
                  await handleFreeDevice()
                  setConfirmOpen(null)
                }}
              >
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Edit Form */}
      {FormComponent}
    </>
  )
}
