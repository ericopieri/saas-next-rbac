import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { prisma } from '../../../lib/prisma'

export default function fetchProfile(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/profile',
    {
      schema: {
        tags: ['auth'],
        summary: 'Get authenticated user profile',
      },
    },
    async (request, reply) => {
      const { sub } = await request.jwtVerify<{ sub: string }>()

      const userData = await prisma.user.findUnique({
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
        where: {
          id: sub,
        },
      })

      if (userData === null) throw new Error('User data not found.')

      return reply.status(200).send({ userData })
    },
  )
}
