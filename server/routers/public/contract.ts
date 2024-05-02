import { contracts } from '@/lib/generated/prisma/main'
import { isAddress } from 'viem'
import { z } from 'zod'

import { publicApiBasePath } from '@/constants/api'

import prisma from '../../prisma'
import { publicProcedure, router } from '../../trpc'

export const contractRouter = router({
	getContractsByCreator: publicProcedure
		.meta({
			openapi: {
				method: 'GET',
				path: `${publicApiBasePath}/contracts`,
				tags: ['Beta | Contracts'],
				summary: 'Get contracts by creator',
				protect: true,
			},
		})
		.input(
			z.object({
				creator: z.string().refine(isAddress, { message: 'Invalid address' }),
				limit: z.number().int().max(100).optional().default(20),
				cursor: z
					.string()
					.refine((v) => !isNaN(Number(v)), { message: 'Invalid cursor' })
					.optional(),
				include_rank: z
					.string()
					.default('false')
					.transform((v) => v === 'true')
					.optional(),
				sort: z.string().default('desc').optional(),
			}),
		)
		.output(
			z.object({
				items: z.array(
					z.object({
						address: z.string(),
						creator: z.string().nullable(),
						creation_tx_hash: z.string().nullable(),
						creation_timestamp: z.any().transform(Number).nullable(),
						rank: z.any().transform(Number).optional(),
					}),
				),
				nextCursor: z.string().nullable(),
			}),
		)
		.query(async ({ input }) => {
			const { creator, limit, cursor, include_rank, sort } = input
			const sortOrder =
				sort && (sort.toLowerCase() === 'asc' || sort.toLowerCase() === 'desc')
					? sort.toLowerCase()
					: 'desc'

			const sql = include_rank
				? `
        SELECT address, creator, creation_tx_hash, creation_timestamp, rank
        FROM (
          SELECT address, creator, creation_tx_hash, creation_timestamp,
                 ROW_NUMBER() OVER (ORDER BY creation_timestamp) AS rank
          FROM contracts
          ORDER BY creation_timestamp
        ) as contracts_ranked
        WHERE creator = '${creator.trim().toLowerCase()}'
        ${cursor ? `AND creation_timestamp < ${cursor}` : ''}
        ORDER BY creation_timestamp ${sortOrder}
        LIMIT ${limit}
      `
				: `
        SELECT address, creator, creation_tx_hash, creation_timestamp
        FROM contracts
        WHERE creator = '${creator.trim().toLowerCase()}'
        ${cursor ? `AND creation_timestamp < ${cursor}` : ''}
        ORDER BY creation_timestamp ${sortOrder}
        LIMIT ${limit}
      `

			const contracts = (await prisma.$queryRawUnsafe(sql)) as contracts[]

			return {
				items: contracts,
				nextCursor:
					contracts.length > 0 && contracts.length === limit
						? contracts[contracts.length - 1].creation_timestamp.toString()
						: null,
			}
		}),
	getContractByAddress: publicProcedure
		.meta({
			openapi: {
				method: 'GET',
				path: `${publicApiBasePath}/contracts/{address}`,
				tags: ['Beta | Contracts'],
				summary: 'Get contract by address',
				protect: true,
			},
		})
		.input(
			z.object({
				address: z
					.string()
					.refine(isAddress, { message: 'invalid address' })
					.transform((v) => v.trim().toLowerCase()),
			}),
		)
		.output(
			z.object({
				name: z.string().nullable(),
				address: z.string().nullable(),
				creator: z.string().nullable(),
				creation_tx_hash: z.string().nullable(),
				creation_bytecode: z.string().nullable(),
				deployed_bytecode: z.string().nullable(),
				abi: z.string().nullable(),
				constructor_arguments: z.string().nullable(),
				sourcecode: z.string().nullable(),
				compiler_version: z.string().nullable(),
				optimization: z.boolean().nullable(),
				optimization_runs: z.number().int().nullable(),
				evm_version: z.string().nullable(),
				is_verified: z.boolean().nullable(),
			}),
		)
		.query(async ({ input }) => {
			const { address } = input
			const contract = await prisma.contracts.findUnique({
				where: {
					address: address,
				},
			})

			return contract
		}),
})
