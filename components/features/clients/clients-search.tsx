'use client'

import { useMemo } from 'react'
import { Button } from '@/ui/button'
import { useClients } from '@/lib/hooks/use-clients'
import type { Client } from '@/lib/types/client'
import { UserCheck, X } from 'lucide-react'

interface ClientsSearchProps {
  value: string
  searchValue: string
  onValueChange: (value: string) => void
  onSearchChange: (search: string) => void
  onClientSelect: (client: Client) => void
  onClear?: () => void
  disabled?: boolean
  error?: { message?: string }
  placeholder?: string
}

export default function ClientsSearch({
  value,
  searchValue,
  onValueChange,
  onSearchChange,
  onClientSelect,
  onClear,
  disabled = false,
  error,
  placeholder = 'Buscar cliente por nombre, email, teléfono o Instagram...',
}: ClientsSearchProps) {
  const { data: clients = [] } = useClients()

  const filtered = useMemo(() => {
    if (!searchValue) return []
    const q = searchValue.toLowerCase()

    return clients
      .filter((client) => {
        const name = client.customer_name.toLowerCase()
        const email = (client.customer_email || '').toLowerCase()
        const phone = (client.customer_phone || '').toLowerCase()
        const ig = (client.customer_ig || '').toLowerCase()
        const alias = (client.customer_alias_cbu || '').toLowerCase()
        return (
          name.includes(q) ||
          email.includes(q) ||
          phone.includes(q) ||
          ig.includes(q) ||
          alias.includes(q)
        )
      })
      .slice(0, 20)
  }, [clients, searchValue])

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === value),
    [clients, value]
  )

  return (
    <div className="relative">
      <div className="relative">
        <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          className={`w-full border rounded p-2 pl-10 ${
            error ? 'border-destructive focus-visible:ring-destructive' : ''
          }`}
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          disabled={disabled || !!value}
        />
      </div>

      {searchValue && !value && filtered.length > 0 && (
        <div className="absolute z-10 mt-1 w-full border rounded max-h-56 overflow-auto bg-background shadow-lg">
          {filtered.map((client) => (
            <button
              key={client.id}
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-accent"
              onClick={() => onClientSelect(client)}
            >
              <div className="font-medium">{client.customer_name}</div>
              <div className="text-xs text-muted-foreground">
                {client.customer_email && (
                  <span className="mr-2">✉️ {client.customer_email}</span>
                )}
                {client.customer_phone && (
                  <span className="mr-2">📞 {client.customer_phone}</span>
                )}
                {client.customer_ig && (
                  <span className="mr-2">📸 @{client.customer_ig}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {searchValue && !value && filtered.length === 0 && (
        <div className="absolute z-10 mt-1 w-full border rounded bg-background shadow-lg p-3 text-sm text-muted-foreground">
          No se encontraron clientes
        </div>
      )}

      {value && selectedClient && (
        <div className="mt-2 p-3 border rounded bg-muted/50">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">
                {selectedClient.customer_name}
              </div>
              <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                {selectedClient.customer_email && (
                  <div>✉️ {selectedClient.customer_email}</div>
                )}
                {selectedClient.customer_phone && (
                  <div>📞 {selectedClient.customer_phone}</div>
                )}
                {selectedClient.customer_ig && (
                  <div>📸 @{selectedClient.customer_ig}</div>
                )}
                {selectedClient.customer_alias_cbu && (
                  <div>💳 {selectedClient.customer_alias_cbu}</div>
                )}
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              disabled={disabled}
              onClick={() => {
                onValueChange('')
                onSearchChange('')
                onClear?.()
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
