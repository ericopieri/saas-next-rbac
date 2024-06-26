import { hash } from 'bcryptjs'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { prisma } from '../../../lib/prisma'
import { BadRequestError } from '../_errors/bad-request-error'

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
        response: {
          201: z.object({
            message: z.string(),
          }),
          400: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { email, password, name } = request.body

      const userWithSameEmail = await prisma.user.findUnique({
        where: {
          email,
        },
      })

      if (userWithSameEmail)
        throw new BadRequestError('There is already a user with this email.')

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
