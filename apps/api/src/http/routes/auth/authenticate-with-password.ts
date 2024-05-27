import { compare } from 'bcryptjs'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { prisma } from '../../../lib/prisma'
import { BadRequestError } from '../_errors/bad-request-error'

export async function authenticateWithPassword(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/sessions/password',
    {
      schema: {
        tags: ['auth'],
        summary: 'Authentication with E-mail & Password.',
        body: z.object({
          email: z.string().email(),
          password: z.string().min(6),
        }),
      },
    },
    async (request, reply) => {
      const { email, password } = request.body

      const user = await prisma.user.findUnique({
        where: { email },
      })

      if (user === null) throw new BadRequestError('Invalid credentials.')

      if (user.passwordHash === null)
        throw new BadRequestError(
          'User does not have a password set. Please log in using social media.',
        )

      const passwordMatch = await compare(password, user.passwordHash)

      if (passwordMatch === false)
        throw new BadRequestError('Invalid credentials.')

      const token = await reply.jwtSign(
        {
          sub: user.id,
        },
        { expiresIn: '7d' },
      )

      return reply.status(200).send({ token })
    },
  )
}
