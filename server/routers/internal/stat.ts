import { z } from 'zod'

import prisma from '../../prisma'
import { internalProcedure, router } from '../../trpc'

export const statRouter = router({
	getDailyTxCount: internalProcedure
		.input(
			z.object({
				timeStart: z.number(),
				timeEnd: z.number(),
			}),
		)
		.query(async ({ input }) => {
			const res = (await prisma.$queryRaw`
                          SELECT * FROM mv_daily_transaction_count
                          WHERE date >= TO_CHAR(to_timestamp(${input.timeStart}), 'YYYY-MM-DD')
                          AND date <= TO_CHAR(to_timestamp(${input.timeEnd}), 'YYYY-MM-DD')
                          ORDER BY date ASC
                      `) as { date: string; count: number }[]
			return res
		}),

	getDailyTokenTransferCount: internalProcedure
		.input(
			z.object({
				tokenType: z.string(),
				timeStart: z.number(),
				timeEnd: z.number(),
			}),
		)
		.query(async ({ input }) => {
			const res = (await prisma.$queryRaw`
                          SELECT * FROM mv_daily_token_transfer_counts
                          WHERE date >= TO_CHAR(to_timestamp(${input.timeStart}), 'YYYY-MM-DD')
                          AND date <= TO_CHAR(to_timestamp(${input.timeEnd}), 'YYYY-MM-DD')
                          AND token_type = ${input.tokenType}
                          ORDER BY date ASC
                      `) as { date: string; count: number }[]
			return res
		}),

	getUniqueAddressesCount: internalProcedure
		.input(
			z.object({
				timeStart: z.number(),
				timeEnd: z.number(),
			}),
		)
		.query(async ({ input }) => {
			const res = (await prisma.$queryRaw`
                          SELECT * FROM mv_daily_unique_address_count
                          WHERE date >= TO_CHAR(to_timestamp(${input.timeStart}), 'YYYY-MM-DD')
                          AND date <= TO_CHAR(to_timestamp(${input.timeEnd}), 'YYYY-MM-DD')
                          ORDER BY date ASC
                      `) as { date: string; count: number }[]
			return res
		}),

	getDailyGasUsed: internalProcedure
		.input(
			z.object({
				timeStart: z.number(),
				timeEnd: z.number(),
			}),
		)
		.query(async ({ input }) => {
			const res = (await prisma.$queryRaw`
                          SELECT date, total_gas_used
                          FROM mv_daily_gas_used
                          WHERE date >= TO_CHAR(to_timestamp(${input.timeStart}), 'YYYY-MM-DD')
                          AND date <= TO_CHAR(to_timestamp(${input.timeEnd}), 'YYYY-MM-DD')
                          ORDER BY date ASC
                      `) as { date: string; total_gas_used: number }[]
			return res.map((txDetail) => {
				return {
					date: txDetail.date,
					count: txDetail.total_gas_used,
				}
			})
		}),
	getDailyTxFee: internalProcedure
		.input(
			z.object({
				timeStart: z.number(),
				timeEnd: z.number(),
			}),
		)
		.query(async ({ input }) => {
			const res = (await prisma.$queryRaw`
                          SELECT date, total_fee
                          FROM mv_daily_tx_fee
                          WHERE date >= TO_CHAR(to_timestamp(${input.timeStart}), 'YYYY-MM-DD')
                          AND date <= TO_CHAR(to_timestamp(${input.timeEnd}), 'YYYY-MM-DD')
                          ORDER BY date ASC
                      `) as { date: string; total_fee: number }[]
			return res.map((txDetail) => {
				return {
					date: txDetail.date,
					count: txDetail.total_fee / 1e18,
				}
			})
		}),
	getAvgTxsFees: internalProcedure
		.input(
			z.object({
				timeStart: z.number(),
				timeEnd: z.number(),
			}),
		)
		.query(async ({ input }) => {
			const res = (await prisma.$queryRaw`
                          SELECT date, average_fee
                          FROM mv_average_txs_fees
                          WHERE date >= TO_CHAR(to_timestamp(${input.timeStart}), 'YYYY-MM-DD')
                          AND date <= TO_CHAR(to_timestamp(${input.timeEnd}), 'YYYY-MM-DD')
                          ORDER BY date ASC
                      `) as { date: string; average_fee: number }[]
			return res.map((data) => ({
				date: data.date,
				count: data.average_fee / 1e18,
			}))
		}),
	getDailyBatches: internalProcedure
		.input(
			z.object({
				timeStart: z.number(),
				timeEnd: z.number(),
			}),
		)
		.query(async ({ input }) => {
			const res = (await prisma.$queryRaw`
                          SELECT date, count
                          FROM mv_daily_batches
                          WHERE date >= TO_CHAR(to_timestamp(${input.timeStart}), 'YYYY-MM-DD')
                          AND date <= TO_CHAR(to_timestamp(${input.timeEnd}), 'YYYY-MM-DD')
                          ORDER BY date ASC
                      `) as { date: string; count: number }[]
			return res
		}),

	getHourlyTps: internalProcedure
		.input(
			z.object({
				timeStart: z.number(),
				timeEnd: z.number(),
			}),
		)
		.query(async ({ input }) => {
			const res = (await prisma.$queryRaw`
                          SELECT hour, tps
                          FROM mv_tps_per_hour
                          WHERE hour >= to_timestamp(${input.timeStart})
                          AND hour <= to_timestamp(${input.timeEnd})
                          ORDER BY hour ASC;
                          `) as { hour: string; tps: number }[]
			return res.map((item) => ({
				hour: item.hour,
				tps: parseFloat(Number(item.tps).toFixed(2)),
			}))
		}),

	collectBridgeStats: internalProcedure
		.input(
			z.object({
				type: z.enum(['deposit', 'withdraw']),
				network: z.string(),
				token_symbol: z.string(),
				token_address: z.string(),
				token_decimals: z.number(),
				transaction_hash: z.string(),
				transaction_status: z.string(),
				block_number: z.number(),
				value: z.number(),
			}),
		)
		.mutation(async ({ input }) => {
			const res = await prisma.bridge_stats.create({
				data: {
					type: input.type,
					network: input.network,
					token_symbol: input.token_symbol,
					token_address: input.token_address,
					token_decimals: input.token_decimals,
					transaction_hash: input.transaction_hash,
					transaction_status: input.transaction_status,
					block_number: input.block_number,
					value: input.value,
				},
			})
			return res
		}),
	fetchBridgeStats: internalProcedure.input(
		z.object({
			network: z.string(),
		}),
	),
})
