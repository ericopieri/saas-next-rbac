import {
  AbilityBuilder,
  CreateAbility,
  createMongoAbility,
  MongoAbility,
} from '@casl/ability'

import { User } from '../models/user'
import { ProjectSubjects } from '../subjects/project'
import { UserSubjects } from '../subjects/user'
import { permissions } from './permissions'

type AppAbilities = UserSubjects | ProjectSubjects | ['manage', 'all']

export type AppAbility = MongoAbility<AppAbilities>
export const createAppAbility = createMongoAbility as CreateAbility<AppAbility>

export function defineAbilityFor(user: User) {
  const builder = new AbilityBuilder(createAppAbility)

  if (typeof permissions[user.role] !== 'function')
    throw new Error(`Permission for role ${user.role} not found.`)

  permissions[user.role](user, builder)

  const ability = builder.build()

  return ability
}
