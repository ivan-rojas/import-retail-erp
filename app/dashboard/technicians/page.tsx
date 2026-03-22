'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/auth/auth-provider'
import { getUserProfile, isAdmin, type UserProfile } from '@/lib/auth/auth'
import {
  useCreateTechnician,
  useDeleteTechnician,
  useTechnicians,
  useUpdateTechnician,
} from '@/lib/hooks/use-technicians'
import type { Technician } from '@/lib/types/technician'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Textarea } from '@/ui/textarea'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog'
import { Loader2, Plus, Wrench, Pencil, Trash2 } from 'lucide-react'

export default function TechniciansPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)

  const { data: technicians = [], isLoading } = useTechnicians()
  const createTechnician = useCreateTechnician()
  const updateTechnician = useUpdateTechnician()
  const deleteTechnician = useDeleteTechnician()

  const [open, setOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selected, setSelected] = useState<Technician | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        router.push('/login')
        return
      }
      const userProfile = await getUserProfile()
      setProfile(userProfile)
      if (!isAdmin(userProfile)) {
        router.push('/dashboard')
      }
    }
    checkAccess()
  }, [user, router])

  if (!user || !profile || !isAdmin(profile)) return null

  const resetForm = () => {
    setSelected(null)
    setName('')
    setDescription('')
  }

  const openCreate = () => {
    resetForm()
    setOpen(true)
  }

  const openEdit = (technician: Technician) => {
    setSelected(technician)
    setName(technician.name)
    setDescription(technician.description ?? '')
    setOpen(true)
  }

  const handleSave = async () => {
    const payload = { name: name.trim(), description: description.trim() }
    if (!payload.name) return

    if (selected) {
      await updateTechnician.mutateAsync({ id: selected.id, data: payload })
    } else {
      await createTechnician.mutateAsync(payload)
    }
    setOpen(false)
    resetForm()
  }

  const handleDelete = async () => {
    if (!selected) return
    await deleteTechnician.mutateAsync(selected.id)
    setDeleteOpen(false)
    resetForm()
  }

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Técnicos</h1>
            <p className="text-muted-foreground">Gestiona los técnicos de reparación</p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Crear Técnico
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Lista de Técnicos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">
                Cargando técnicos...
              </div>
            ) : technicians.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No hay técnicos registrados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Nombre</th>
                      <th className="text-left p-3 font-medium">Descripción</th>
                      <th className="text-left p-3 font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {technicians.map((technician) => (
                      <tr key={technician.id} className="border-b hover:bg-background">
                        <td className="p-3 font-medium">{technician.name}</td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {technician.description || '-'}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEdit(technician)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelected(technician)
                                setDeleteOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected ? 'Editar Técnico' : 'Crear Técnico'}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Descripción</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false)
                resetForm()
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={
                !name.trim() ||
                createTechnician.isPending ||
                updateTechnician.isPending
              }
            >
              {createTechnician.isPending || updateTechnician.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              <span className="ml-2">Guardar</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar técnico</DialogTitle>
          </DialogHeader>
          <DialogBody>
            ¿Seguro que quieres eliminar a <strong>{selected?.name}</strong>?
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteTechnician.isPending}
            >
              {deleteTechnician.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              <span className="ml-2">Eliminar</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

