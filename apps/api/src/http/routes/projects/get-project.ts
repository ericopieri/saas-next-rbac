import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { prisma } from '../../../lib/prisma'
import { getUserPermissions } from '../../../utils/get-user-permissions'
import { auth } from '../../middlewares/auth'
import { BadRequestError } from '../_errors/bad-request-error'

export async function getProject(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/organizations/:slug/projects/:projectId',
      {
        schema: {
          tags: ['project'],
          summary: 'Get a Project details.',
          security: [{ bearerAuth: [] }],
          params: z.object({
            projectId: z.string(),
            slug: z.string(),
          }),
          response: {
            200: z.object({
              description: z.string(),
              slug: z.string(),
              id: z.string(),
              name: z.string(),
              ownerId: z.string(),
              avatarUrl: z.string().nullable(),
              owner: z.object({
                id: z.string().uuid(),
                name: z.string().nullable(),
                avatarUrl: z.string().nullable(),
              }),
            }),
          },
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()
        const { projectId, slug } = request.params

        const { membership, organization } =
          await request.getUserMembership(slug)

        const { cannot } = getUserPermissions(userId, membership.role)

        if (cannot('get', 'Project')) {
          throw new BadRequestError(
            "You do not have permission to access this project's details.",
          )
        }

        const project = await prisma.project.findUnique({
          where: {
            id: projectId,
            organizationId: organization.id,
          },
          select: {
            id: true,
            name: true,
            description: true,
            slug: true,
            ownerId: true,
            avatarUrl: true,
            owner: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        })

        if (project === null) throw new BadRequestError('Project not found.')

        return reply.status(200).send(project)
      },
    )
}
