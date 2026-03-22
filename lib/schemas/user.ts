import { z } from 'zod'

// Admin Create User Schema
export const createUserSchema = z.object({
  full_name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(120, 'Máximo 120 caracteres'),
  email: z
    .email({ message: 'Email inválido' })
    .min(1, 'El email es requerido')
    .max(254, 'Email demasiado largo'),
  password: z
    .string()
    .min(8, 'Al menos 8 caracteres')
    .regex(/(?=.*[A-Z])/, 'Debe incluir una mayúscula')
    .regex(/(?=.*[a-z])/, 'Debe incluir una minúscula')
    .regex(/(?=.*\d)/, 'Debe incluir un número')
    .regex(/(?=.*[^A-Za-z0-9])/, 'Debe incluir un símbolo'),
  role: z.enum(['admin', 'seller', 'inventory', 'viewer']),
})

export type CreateUserSchema = z.infer<typeof createUserSchema>

export const updateUserSchema = z.object({
  full_name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(120, 'Máximo 120 caracteres'),
  role: z.enum(['admin', 'seller', 'inventory', 'viewer']),
})

export type UpdateUserSchema = z.infer<typeof updateUserSchema>
