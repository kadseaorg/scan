import { z } from 'zod'
import { isAddress } from 'viem'

import { publicApiBasePath } from '@/constants/api'

import prisma from '../../prisma'
import { publicProcedure, router } from '../../trpc'

export const tokenRouter = router({
	getTokenHolders: publicProcedure
		.meta({
			openapi: {
				method: 'GET',
				path: `${publicApiBasePath}/token-holders`,
				tags: ['Beta | Token'],
				summary: 'Get token holders',
				protect: true,
			},
		})
		.input(
			z.object({
				address: z.string().refine(isAddress, { message: 'Invalid address' }),
				take: z.number().int().max(50).default(20).optional(),
				cursor: z.number().int().optional(),
				desc: z
					.string()
					.default('false')
					.transform((v) => v === 'true')
					.optional(),
			}),
		)
		.output(
			z.object({
				list: z.array(
					z.object({
						rank: z.bigint().transform(Number),
						address: z.string(),
						quantity: z.any().transform(Number),
						percentage: z.any().transform(Number),
					}),
				),
				nextCursor: z.number().optional(),
			}),
		)
		.query(async ({ input }) => {
			const address = input.address.toLowerCase()
			const { take, cursor, desc } = input
			const holders = await prisma.$queryRawUnsafe<
				{
					rank: bigint
					address: string
					quantity: number
					percentage: number
				}[]
			>(`
      SELECT
          rank,
          address,
          quantity,
          percentage
      FROM
          mv_token_balances_summary
      WHERE
          token_address = '${address}'
      AND quantity > 0
      ORDER BY rank ${desc ? 'DESC' : 'ASC'}
      LIMIT ${take} OFFSET ${cursor ? cursor : 0};
  `)

			return {
				list: holders,
				nextCursor:
					holders.length > 0 && holders.length === take
						? (cursor || 0) + (take || 0)
						: null,
			}
		}),
})
