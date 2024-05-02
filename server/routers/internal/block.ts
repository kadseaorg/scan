import { isHexString } from '@ethersproject/bytes'
import { z } from 'zod'

import prisma, { getBlockHeight } from '../../prisma'
import { internalProcedure, router } from '../../trpc'

export const blockRouter = router({
	getBlockHeight: internalProcedure.query(async () => {
		return await getBlockHeight()
	}),
	getFinalizedBlockHeight: internalProcedure.query(async () => {
		const res = (await prisma.$queryRaw`
            SELECT number
            FROM blocks 
            WHERE blocks.l1_batch_number = (SELECT MAX(number) FROM l1_batches WHERE status IN ('verified', 'finalized'))
        `) as any[]
		return res[0]?.number || 0
	}),
	getAverageBlockTime: internalProcedure.query(async () => {
		const res = (await prisma.$queryRaw`
        SELECT * FROM mv_average_block_time
    `) as any[]
		return res[0].avg
	}),
	getBlocks: internalProcedure
		.input(
			z.object({
				batchNumber: z.number().optional(),
				take: z.number().int().max(50).default(20).optional(),
				cursor: z.number().nullish(),
				desc: z.boolean().default(true),
			}),
		)
		.query(async ({ input }) => {
			const { batchNumber, take, cursor, desc } = input

			let batchNumberFilter = ''
			if (batchNumber) {
				batchNumberFilter = `AND blocks.l1_batch_number = ${batchNumber}`
			}
			const sql = `
        SELECT blocks.*, l1_batches.status as l1_status FROM blocks
        LEFT JOIN l1_batches ON blocks.l1_batch_number = l1_batches.number
        WHERE 1 = 1
        ${cursor ? `AND blocks.number ${desc ? '<' : '>'} ${cursor}` : ''}
        ${batchNumberFilter}
        ORDER BY blocks.number ${desc ? 'DESC' : 'ASC'}
        LIMIT ${take}
      `

			let blocks = (await prisma.$queryRawUnsafe(sql)) as any[]
			let count
			if (batchNumber) {
				count = await prisma.blocks.count({
					where: {
						l1_batch_number: batchNumber,
					},
				})
			} else {
				// not used, and we can speed up the query
				// count = await getBlockHeight()
				count = 0
			}

			return {
				count,
				list: blocks,
				nextCursor:
					blocks.length > 0 && blocks.length === take
						? blocks[blocks.length - 1].number
						: null,
			}
		}),
	getBlocksByBatch: internalProcedure
		.input(
			z.object({
				batchNumber: z.number(),
				take: z.number().int().max(50).default(20).optional(),
				cursor: z.number().nullish(),
				desc: z.boolean().default(true),
			}),
		)
		.query(async ({ input }) => {
			const { batchNumber, take, cursor, desc } = input

			const sql = `
        SELECT * FROM blocks WHERE l1_batch_number = ${batchNumber}
        ${cursor ? `AND blocks.number ${desc ? '<' : '>'} ${cursor}` : ''}
        ORDER BY blocks.number ${desc ? 'DESC' : 'ASC'}
        LIMIT ${take}
        `
			const count = await prisma.blocks.count({
				where: {
					l1_batch_number: batchNumber,
				},
			})
			let blocks = (await prisma.$queryRawUnsafe(sql)) as any[]
			return {
				count,
				list: blocks,
				nextCursor:
					blocks.length > 0 && blocks.length === take
						? blocks[blocks.length - 1].number
						: null,
			}
		}),
	getBlockDetail: internalProcedure
		.input(
			z.object({
				identity: z.union([z.string(), z.number()]),
			}),
		)
		.query(async ({ input }) => {
			const whereFilter = isHexString(input.identity)
				? `WHERE blocks.hash = '${input.identity}'`
				: `WHERE blocks.number = ${input.identity}`
			const querySql = `
      SELECT 
      blocks.*, 
      l1_batches.status as l1_status, 
      l1_batches.commit_tx_hash as l1_commit_tx_hash,
      l1_batches.prove_tx_hash as l1_prove_tx_hash
      FROM blocks
      LEFT JOIN l1_batches ON blocks.l1_batch_number = l1_batches.number
      ${whereFilter}
    `
			const blocks = (await prisma.$queryRawUnsafe(querySql)) as any[]
			if (blocks.length === 0) {
				return null
			}
			return blocks[0]
		}),
})
