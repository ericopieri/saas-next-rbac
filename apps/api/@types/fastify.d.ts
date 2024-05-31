import 'fastify'

import type { Member, Organization } from '@prisma/client'

declare module 'fastify' {
  interface FastifyRequest {
    getCurrentUserId: () => Promise<string>
    getUserMembership: (
      slug: string,
    ) => Promise<{ organization: Organization; membership: Member }>
  }
}
