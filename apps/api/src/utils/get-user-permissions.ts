import { defineAbilityFor, RoleType, userSchema } from '@saas/auth'

export function getUserPermissions(userId: string, role: RoleType) {
  const authUser = userSchema.parse({
    id: userId,
    role,
  })

  return defineAbilityFor(authUser)
}
