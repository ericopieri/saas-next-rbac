import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '../../middlewares/auth'

export async function getOrganization(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organizations/:slug',
      {
        schema: {
          tags: ['organization'],
          summary: 'List all organizations I am associated with.',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
          }),
          response: {
            200: z.object({
              organization: z.object({
                id: z.string().uuid(),
                slug: z.string(),
                name: z.string(),
                avatarUrl: z.string().url().nullable(),
                shouldAttachUsersByDomain: z.boolean(),
                createdAt: z.date(),
                updatedAt: z.date(),
                domain: z.string().nullable(),
                ownerId: z.string().uuid(),
              }),
            }),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params

        const { organization } = await request.getUserMembership(slug)

        return reply.status(200).send({
          organization,
        })
      },
    )
}
