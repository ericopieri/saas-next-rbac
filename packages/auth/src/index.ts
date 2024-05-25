import {
  AbilityBuilder,
  CreateAbility,
  createMongoAbility,
  MongoAbility,
} from '@casl/ability'
import { z } from 'zod'

import { User } from './models/user'
import { permissions } from './permissions'
import { billingSubject } from './subjects/billing'
import { inviteSubject } from './subjects/invite'
import { organizationSubject } from './subjects/organization'
import { projectSubject } from './subjects/project'
import { userSubject } from './subjects/user'

const appAbilitiesSchema = z.union([
  userSubject,
  organizationSubject,
  projectSubject,
  inviteSubject,
  billingSubject,
  z.tuple([z.literal('manage'), z.literal('all')]),
])

type AppAbilitiesType = z.infer<typeof appAbilitiesSchema>

export type AppAbility = MongoAbility<AppAbilitiesType>
export const createAppAbility = createMongoAbility as CreateAbility<AppAbility>

export function defineAbilityFor(user: User) {
  const builder = new AbilityBuilder(createAppAbility)

  if (typeof permissions[user.role] !== 'function')
    throw new Error(`Permission for role ${user.role} not found.`)

  permissions[user.role](user, builder)

  const ability = builder.build({
    detectSubjectType({ __typename }) {
      return __typename
    },
  })

  return ability
}
