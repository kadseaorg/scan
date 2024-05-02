import prisma from '../../prisma'
import { internalProcedure, router } from '../../trpc'

export const summaryRouter = router({
	getAvgTps24h: internalProcedure.query(async () => {
		const tps =
			(await prisma.$queryRaw`SELECT avg_tps_24h FROM mv_avg_tps_gas_24h`) as any[]
		return tps[0].avg_tps_24h
	}),

	getAvgPrice5min: internalProcedure.query(async () => {
		const price = (await prisma.$queryRaw`SELECT
			ROUND(AVG(gas_price)) AS avg_gas_price_last_5min
		  FROM
			transactions
		  WHERE
			"timestamp" >= EXTRACT(EPOCH FROM NOW() - INTERVAL '5 minutes')::bigint;`) as any[]
		return price[0].avg_gas_price_last_5min
	}),
})
