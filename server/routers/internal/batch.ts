import { z } from 'zod'

import prisma from '../../prisma'
import { internalProcedure, router } from '../../trpc'

export const batchRouter = router({
	getBatchCount: internalProcedure.query(async () => {
		return prisma.l1_batches.count()
	}),
	getBatchList: internalProcedure
		.input(
			z.object({
				take: z.number().int().max(50).default(20).optional(),
				cursor: z.number().nullish(),
				desc: z.boolean().default(true),
			}),
		)
		.query(async ({ input }) => {
			const { take, cursor, desc } = input
			const batchList = (await prisma.$queryRawUnsafe(`
                    SELECT *
                    FROM l1_batches
                    WHERE 1 = 1
                    ${cursor ? `AND number ${desc ? '<' : '>'} ${cursor}` : ''}
                    ORDER BY number ${desc ? 'DESC' : 'ASC'}
                    LIMIT ${take}
                    `)) as any[]
			const batchCount = await prisma.l1_batches.count()
			return {
				count: batchCount,
				list: batchList,
				nextCursor:
					batchList.length > 0 && batchList.length === take
						? batchList[batchList.length - 1].number
						: null,
			}
		}),
	getBatchDetail: internalProcedure
		.input(z.number())
		.query(async ({ input }) => {
			const batchs = (await prisma.$queryRaw`
            SELECT l1_batches.*, 
                  (SELECT COUNT(*) FROM blocks WHERE l1_batch_number = ${input}) AS l2_block_count, 
                  (SELECT SUM(blocks.transaction_count) FROM blocks WHERE l1_batch_number = ${input}) AS l2_tx_count
            FROM l1_batches
            WHERE l1_batches.number = ${input}
            `) as any[]
			if (batchs.length === 0) {
				return null
			}
			const batch = batchs[0]
			return batch
		}),
})
