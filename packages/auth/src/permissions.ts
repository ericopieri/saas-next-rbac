import { AbilityBuilder } from '@casl/ability'

import { AppAbility } from './index'
import { User } from './models/user'
import { RoleType } from './roles'

type PermissionByRole = (
  user: User,
  builder: AbilityBuilder<AppAbility>,
) => void

export const permissions: Record<RoleType, PermissionByRole> = {
  ADMIN(user, { can, cannot }) {
    can('manage', 'all')
    cannot(['transfer_ornership', 'update'], 'Organization')
    can(['transfer_ornership', 'update'], 'Organization', {
      ownerId: { $eq: user.id },
    })
  },
  MEMBER(user, { can }) {
    can('get', 'User')
    can(['create', 'get'], 'Project')
    can(['update', 'delete'], 'Project', {
      ownerId: {
        $eq: user.id,
      },
    })
  },
  BILLING(_, { can }) {
    can('manage', 'Billing')
  },
}
