import { organizationSchema } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { prisma } from '../../../lib/prisma'
import { getUserPermissions } from '../../../utils/get-user-permissions'
import { auth } from '../../middlewares/auth'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function transferOrganizationOwnership(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .patch(
      '/organizations/:slug/owner',
      {
        schema: {
          tags: ['organization'],
          summary: 'Transfer a Organization ownership.',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
          }),
          body: z.object({
            targetUserId: z.string().uuid(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params
        const userId = await request.getCurrentUserId()

        const { organization, membership } =
          await request.getUserMembership(slug)

        const authOrganization = organizationSchema.parse(organization)

        const { cannot } = getUserPermissions(userId, membership.role)

        if (cannot('transfer_ornership', authOrganization)) {
          throw new UnauthorizedError(
            'You do not have permission to transfer ownership of this organization.',
          )
        }

        const { targetUserId } = request.body

        const isTargetUserMemberOfOrganization =
          (await prisma.member.count({
            where: {
              organizationId: organization.id,
              userId: targetUserId,
            },
          })) > 0

        if (isTargetUserMemberOfOrganization === false)
          throw new UnauthorizedError(
            'Target user is not a member of this Organization.',
          )

        await prisma.$transaction([
          prisma.member.update({
            where: {
              organizationId_userId: {
                userId: targetUserId,
                organizationId: organization.id,
              },
            },
            data: {
              role: 'ADMIN',
            },
          }),
          prisma.organization.update({
            where: {
              id: organization.id,
            },
            data: {
              ownerId: targetUserId,
            },
          }),
        ])

        return reply.status(204).send()
      },
    )
}
