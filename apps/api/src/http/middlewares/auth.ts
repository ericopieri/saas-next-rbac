import type { FastifyInstance } from 'fastify'
import { fastifyPlugin } from 'fastify-plugin'

import { prisma } from '../../lib/prisma'
import { UnauthorizedError } from '../routes/_errors/unauthorized-error'

export const auth = fastifyPlugin(async (app: FastifyInstance) => {
  app.addHook('preHandler', async (request) => {
    request.getCurrentUserId = async () => {
      try {
        const { sub } = await request.jwtVerify<{ sub: string }>()

        return sub
      } catch {
        throw new UnauthorizedError('Invalid token')
      }
    }

    request.getUserMembership = async (slug) => {
      const userId = await request.getCurrentUserId()

      console.log(userId)

      const member = await prisma.member.findFirst({
        where: {
          userId,
          organization: {
            slug,
          },
        },
        include: { organization: true },
      })

      if (member === null)
        throw new UnauthorizedError("You aren't a member of this Organization.")

      const { organization, ...membership } = member

      return {
        organization,
        membership,
      }
    }
  })
})
