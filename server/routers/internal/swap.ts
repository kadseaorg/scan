import prisma from '../../prisma'
import { internalProcedure, router } from '../../trpc'

export const swapRouter = router({
	getExternalSwaps: internalProcedure.query(async () => {
		const swaps = (await prisma.$queryRaw`SELECT * FROM external_swaps`) as {
			name: string
			logo: string
			introduction: string
			tags: string
			external_link: string
		}[]

		return swaps.map((d) => ({ ...d, ...{ tags: d.tags?.split(',') } })) || []
	}),
})
