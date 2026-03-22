'use client'

import { useMemo, useState } from 'react'
import { Input } from '@/ui/input'
import { Button } from '@/ui/button'
import { useClients } from '@/lib/hooks/use-clients'
import { Loader2, Plus, Search } from 'lucide-react'
import AddEditClient from '@/components/features/clients/add-edit-client'
import ClientsTable from '@/components/features/clients/clients-table'
import type { Client } from '@/lib/types/client'

export default function ClientsPage() {
  const { data: clients = [], isLoading } = useClients()
  const [search, setSearch] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  const filtered = useMemo(() => {
    if (!search) return clients

    const needle = search.toLowerCase()
    return clients.filter((client) => {
      const haystack = `${client.customer_name} ${client.customer_email || ''} ${client.customer_phone || ''} ${client.customer_ig || ''} ${client.customer_alias_cbu || ''}`.toLowerCase()
      return haystack.includes(needle)
    })
  }, [clients, search])

  const handleAddClient = () => {
    setSelectedClient(null)
    setOpenDialog(true)
  }

  const handleEditClient = (client: Client) => {
    setSelectedClient(client)
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setSelectedClient(null)
  }

  return (
    <div className="calc-container">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-start mb-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold">Clientes Mayoristas</h1>
            <p className="text-muted-foreground">
              Gestión de clientes mayoristas
            </p>
          </div>
          <Button onClick={handleAddClient}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Cliente
          </Button>
        </div>

        <div className="rounded-lg border p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por nombre, email, teléfono, Instagram..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ClientsTable data={filtered} onEdit={handleEditClient} />
        )}

        <AddEditClient
          open={openDialog}
          onOpenChange={handleCloseDialog}
          client={selectedClient}
        />
      </div>
    </div>
  )
}

