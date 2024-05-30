import { env } from '@saas/env'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { prisma } from '../../../lib/prisma'
import { BadRequestError } from '../_errors/bad-request-error'

export async function authenticateWithGithub(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/sessions/github',
    {
      schema: {
        tags: ['auth'],
        summary: 'Authentication with Github.',
        body: z.object({
          code: z.string(),
        }),
      },
    },
    async (request, reply) => {
      const { code } = request.body

      const githubOAuthURL = new URL(
        'https://github.com/login/oauth/access_token',
      )

      githubOAuthURL.searchParams.set('client_id', env.GITHUB_OAUTH_CLIENT_ID)
      githubOAuthURL.searchParams.set(
        'client_secret',
        env.GITHUB_OAUTH_CLIENT_SECRET,
      )
      githubOAuthURL.searchParams.set(
        'redirect_uri',
        env.GITHUB_OAUTH_CLIENT_REDIRECT_URL,
      )
      githubOAuthURL.searchParams.set('code', code)

      const githubAccessTokenResp = await fetch(githubOAuthURL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
      })

      const githubAccessTokenData = await githubAccessTokenResp.json()

      const { access_token: accessToken } = z
        .object({
          access_token: z.string(),
          token_type: z.literal('bearer'),
          scope: z.string(),
        })
        .parse(githubAccessTokenData)

      const githubUserResp = await fetch('https://api.github.com/user', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + accessToken,
        },
      })

      const githubUserData = await githubUserResp.json()
      const {
        email,
        name,
        id: githubId,
        avatar_url: avatarUrl,
      } = z
        .object({
          id: z.number().int(),
          name: z.string().nullable(),
          email: z.string().nullable(),
          avatar_url: z.string().url(),
        })
        .parse(githubUserData)

      if (email === null)
        throw new BadRequestError(
          'A public E-mail on GitHub is required to create an account.',
        )

      let user = await prisma.user.findUnique({
        where: { email },
      })

      if (user === null) {
        user = await prisma.user.create({
          data: {
            email,
            name,
            avatarUrl,
          },
        })
      }

      let account = await prisma.account.findUnique({
        where: {
          provider_userId: {
            provider: 'GITHUB',
            userId: user.id,
          },
        },
      })

      if (account === null) {
        account = await prisma.account.create({
          data: {
            providerAccountId: githubId.toString(),
            provider: 'GITHUB',
            userId: user.id,
          },
        })
      }

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
