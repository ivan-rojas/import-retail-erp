export type Technician = {
  id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export type TechnicianInsert = {
  name: string
  description?: string | null
}

export type TechnicianUpdate = Partial<TechnicianInsert>

