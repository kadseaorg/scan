import { transactions } from '@/lib/generated/prisma/main'
import { Decimal } from 'decimal.js'
import { isAddress, isHash } from 'viem'
import { z } from 'zod'

import { publicApiBasePath } from '@/constants/api'

import prisma from '../../prisma'
import { publicProcedure, router } from '../../trpc'

const decimal = () =>
	z
		.instanceof(Decimal)
		.or(z.string())
		.or(z.number())
		.refine((value) => {
			try {
				return new Decimal(value)
			} catch (error) {
				return false
			}
		})
		.transform((value) => new Decimal(value))

export const transactionRouter = router({
	publicGetTransactionsByAddress: publicProcedure
		.meta({
			openapi: {
				method: 'GET',
				path: `${publicApiBasePath}/transactions`,
				tags: ['Beta | Transactions'],
				summary: 'Get transactions by address',
				protect: true,
			},
		})
		.input(
			z.object({
				address: z
					.string()
					.refine(isAddress, { message: 'Invalid address' })
					.transform((v) => v.trim().toLowerCase()),
				limit: z.number().int().max(100).optional().default(20),
				cursor: z
					.string()
					.refine((v) => !isNaN(Number(v)), { message: 'Invalid cursor' })
					.optional(),
			}),
		)
		.output(
			z.object({
				items: z.array(
					z
						.object({
							hash: z.string(),
							block_hash: z.string(),
							block_number: z.bigint(),
							from_address: z.string().nullable(),
							to_address: z.string().nullable(),
							value: z.any().transform(Number).nullable(),
							fee: z.any().transform(Number).nullable(),
							gas_used: z.bigint().nullable(),
							gas_price: z.bigint().nullable(),
							gas_limit: z.bigint().nullable(),
							method_id: z.string().nullable(),
							input: z.string().nullable(),
							nonce: z.number().int().nullable(),
							status: z.number().int().nullable(),
							transaction_index: z.number().nullable(),
							transaction_type: z.string().nullable(),
							// // max_priority: z.bigint().transform(v => Number(v)).nullable(),.nullable(),
							// // max_fee: z.bigint().transform(v => Number(v)).nullable(),.nullable(),
							revert_reason: z.string().nullable(),
							timestamp: z.bigint().nullable(),
						})
						.transform((v) => {
							// if any of the value is bigint, transform it to number
							Object.keys(v).forEach((key) => {
								if (typeof (v as any)[key] === 'bigint') {
									;(v as any)[key] = Number((v as any)[key])
								}
							})
							return v
						}),
				),
				nextCursor: z.string().nullable(),
			}),
		)
		.query(async ({ input }) => {
			const { address, limit, cursor } = input
			const txs = (await prisma.$queryRawUnsafe(`
              SELECT *
              FROM transactions
              WHERE (from_address = '${address}' OR to_address = '${address}')
              ${cursor ? `AND timestamp < ${cursor}` : ''}
              ORDER BY timestamp DESC
              LIMIT ${limit}
          `)) as transactions[]

			return {
				items: txs,
				nextCursor:
					txs.length > 0 && txs.length === limit
						? txs[txs.length - 1].timestamp!.toString()
						: null,
			}
		}),
	publicGetTransactionByHash: publicProcedure
		.meta({
			openapi: {
				method: 'GET',
				path: `${publicApiBasePath}/transactions/{hash}`,
				tags: ['Beta | Transactions'],
				summary: 'Get transaction by hash',
				protect: true,
			},
		})
		.input(
			z.object({
				hash: z.string().refine(isHash, { message: 'invalid hash' }),
			}),
		)
		.output(
			z
				.object({
					hash: z.string(),
					block_hash: z.string(),
					block_number: z.bigint(),
					from_address: z.string().nullable(),
					to_address: z.string().nullable(),
					value: z.any().transform(Number).nullable(),
					fee: z.any().transform(Number).nullable(),
					gas_used: z.bigint().nullable(),
					gas_price: z.bigint().nullable(),
					gas_limit: z.bigint().nullable(),
					method_id: z.string().nullable(),
					input: z.string().nullable(),
					nonce: z.number().int().nullable(),
					status: z.number().int().nullable(),
					transaction_index: z.number().nullable(),
					transaction_type: z.string().nullable(),
					// max_priority: z.bigint().transform(v => Number(v)).nullable(),.nullable(),
					// max_fee: z.bigint().transform(v => Number(v)).nullable(),.nullable(),
					revert_reason: z.string().nullable(),
					timestamp: z.bigint().nullable(),
				})
				.transform((v) => {
					// if any of the value is bigint, transform it to number
					Object.keys(v).forEach((key) => {
						if (typeof (v as any)[key] === 'bigint') {
							;(v as any)[key] = Number((v as any)[key])
						}
					})
					return v
				}),
		)
		.query(async ({ input }) => {
			const { hash } = input
			const tx = await prisma.transactions.findUnique({
				where: {
					hash,
				},
			})
			return tx
		}),
})
