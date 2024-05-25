import { z } from 'zod'

export const roleSchema = z.union([
  z.literal('ADMIN'),
  z.literal('MEMBER'),
  z.literal('BILLING'),
])

export type RoleType = z.infer<typeof roleSchema>
