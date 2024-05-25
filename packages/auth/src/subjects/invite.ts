import { z } from 'zod'

export const inviteSubject = z.tuple([
  z.union([
    z.literal('manage'),
    z.literal('delete'),
    z.literal('get'),
    z.literal('create'),
  ]),
  z.literal('Invite'),
])

export type InviteSubjectsType = z.infer<typeof inviteSubject>
