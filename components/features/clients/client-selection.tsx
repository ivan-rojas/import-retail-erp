'use client'

import { useState } from 'react'
import type { Client } from '@/lib/types/client'
import { UserCheck } from 'lucide-react'
import ClientsSearch from './clients-search'

interface ClientSelectionProps {
  onSelect: (client: Client) => void
  label?: string
}

export default function ClientSelection({
  onSelect,
  label = 'Seleccionar cliente mayorista',
}: ClientSelectionProps) {
  const [searchValue, setSearchValue] = useState('')
  const [selectedId, setSelectedId] = useState('')

  return (
    <div className="p-3 rounded-lg border">
      <div className="flex items-center gap-2 mb-2 text-sm font-medium text-foreground">
        <UserCheck className="h-4 w-4" /> {label}
      </div>
      <ClientsSearch
        value={selectedId}
        searchValue={searchValue}
        onValueChange={(v) => {
          setSelectedId(v)
        }}
        onSearchChange={(v) => setSearchValue(v)}
        onClientSelect={(client) => {
          setSelectedId(client.id)
          onSelect(client)
        }}
        placeholder="Buscar cliente por nombre, email, teléfono..."
      />
    </div>
  )
}
