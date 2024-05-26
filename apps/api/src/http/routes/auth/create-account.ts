import { hash } from 'bcryptjs'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { prisma } from '../../../lib/prisma'

export async function createAccount(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/users',
    {
      schema: {
        tags: ['auth'],
        summary: 'Create a new Account.',
        body: z.object({
          name: z.string(),
          email: z.string(),
          password: z.string().min(6),
        }),
      },
    },
    async (request, reply) => {
      const { email, password, name } = request.body

      const userWithSameEmail = await prisma.user.findUnique({
        where: {
          email,
        },
      })

      if (userWithSameEmail) {
        return reply.status(400).send({
          message: 'There is already a user with this email.',
        })
      }

      const organizationWithSameDomain = await prisma.organization.findFirst({
        where: {
          domain: email.split('@')[1],
          shouldAttachUsersByDomain: true,
        },
      })

      const passwordHash = await hash(password, 6)

      await prisma.user.create({
        data: {
          email,
          passwordHash,
          name,
          member_on: organizationWithSameDomain
            ? {
                create: {
                  organizationId: organizationWithSameDomain.id,
                },
              }
            : undefined,
        },
      })

      return reply.status(201).send({
        message: 'Account created successfully.',
      })
    },
  )
}
