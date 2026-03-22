'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/auth/auth-provider'
import {
  getUserProfile,
  canViewInventory,
  type UserProfile,
} from '@/lib/auth/auth'
import {
  useCreateProductCategory,
  useDeleteProductCategory,
  useProductCategories,
  useUpdateProductCategory,
} from '@/lib/hooks/use-product-categories'
import type { ProductCategory } from '@/lib/types/product-category'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog'
import {
  CATEGORY_ICON_OPTIONS,
  renderCategoryIcon,
} from '@/lib/utils/category-icons'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select'
import { FolderTree, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'

export default function ProductCategoriesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)

  const { data: categories = [], isLoading } = useProductCategories()
  const createCategory = useCreateProductCategory()
  const updateCategory = useUpdateProductCategory()
  const deleteCategory = useDeleteProductCategory()

  const [open, setOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selected, setSelected] = useState<ProductCategory | null>(null)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('package')

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        router.push('/login')
        return
      }
      const userProfile = await getUserProfile()
      setProfile(userProfile)
      if (!canViewInventory(userProfile)) {
        router.push('/dashboard')
      }
    }
    checkAccess()
  }, [user, router])

  if (!user || !profile || !canViewInventory(profile)) return null

  const resetForm = () => {
    setSelected(null)
    setName('')
    setIcon('package')
  }

  const openCreate = () => {
    resetForm()
    setOpen(true)
  }

  const openEdit = (category: ProductCategory) => {
    setSelected(category)
    setName(category.name)
    setIcon(category.icon)
    setOpen(true)
  }

  const handleSave = async () => {
    const payload = { name: name.trim(), icon }
    if (!payload.name) return

    if (selected) {
      await updateCategory.mutateAsync({ id: selected.id, data: payload })
    } else {
      await createCategory.mutateAsync(payload)
    }
    setOpen(false)
    resetForm()
  }

  const handleDelete = async () => {
    if (!selected) return
    await deleteCategory.mutateAsync(selected.id)
    setDeleteOpen(false)
    resetForm()
  }

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Product Categories</h1>
            <p className="text-muted-foreground">
              Gestiona las categorías usadas por productos y accesorios
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Crear Categoría
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderTree className="h-5 w-5" />
              Lista de Categorías
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">
                Cargando categorías...
              </div>
            ) : categories.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No hay categorías registradas.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Categoría</th>
                      <th className="text-left p-3 font-medium">Ícono</th>
                      <th className="text-left p-3 font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category) => (
                      <tr key={category.id} className="border-b hover:bg-background">
                        <td className="p-3 font-medium capitalize">{category.name}</td>
                        <td className="p-3 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-2">
                            {renderCategoryIcon(category.icon)}
                            {category.icon}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEdit(category)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelected(category)
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
            <DialogTitle>
              {selected ? 'Editar Categoría' : 'Crear Categoría'}
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre categoría</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Icono</label>
                <Select value={icon} onValueChange={setIcon}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un icono" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_ICON_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <span className="inline-flex items-center gap-2">
                          {renderCategoryIcon(option.value)}
                          {option.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              disabled={!name.trim() || createCategory.isPending || updateCategory.isPending}
            >
              {createCategory.isPending || updateCategory.isPending ? (
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
            <DialogTitle>Eliminar categoría</DialogTitle>
          </DialogHeader>
          <DialogBody>
            ¿Seguro que quieres eliminar <strong>{selected?.name}</strong>?
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
              disabled={deleteCategory.isPending}
            >
              {deleteCategory.isPending ? (
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

