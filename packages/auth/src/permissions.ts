import { AbilityBuilder } from '@casl/ability'

import { AppAbility } from './index'
import { User } from './models/user'
import { RoleType } from './roles'

type PermissionByRole = (
  user: User,
  builder: AbilityBuilder<AppAbility>,
) => void

export const permissions: Record<RoleType, PermissionByRole> = {
  ADMIN() {},
  MEMBER() {},
  BILLING() {},
}
