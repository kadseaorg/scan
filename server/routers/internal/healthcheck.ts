import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import {
	CHAIN_TYPE,
	CURRENT_CHAIN_ITEM,
	UnsupportedInternalTxnsNetworks,
} from '@/constants'

import prisma from '../../prisma'
import { internalProcedure, router } from '../../trpc'

export const healthcheckRouter = router({
	health: internalProcedure
		.meta({
			openapi: {
				method: 'GET',
				path: '/health',
				tags: ['Internal | health'],
				summary: 'Healthcheck',
			},
		})
		.input(
			z.object({
				lag: z.number().optional().default(30),
			}),
		)
		.output(
			z.object({
				latestBlockHeight: z.number(),
				latestBlockHeightFromDB: z.number(),
				latestInternalTxnsBlockHeightFromDB: z.number(),
			}),
		)
		.query(async ({ input }) => {
			const maxBlockHeightLag = input.lag
			const isUnsupportedNetwork =
				UnsupportedInternalTxnsNetworks.includes(CHAIN_TYPE)

			// Fetch the latest block height from the blockchain node
			const response = await fetch(CURRENT_CHAIN_ITEM.rpcUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					jsonrpc: '2.0',
					method: 'eth_blockNumber',
					params: [],
					id: 1,
				}),
			})
			const data = await response.json()
			const latestBlockHeight = parseInt(data.result, 16)

			// Fetch the latest block heights from the database using raw SQL
			const res = (await prisma.$queryRaw`
										SELECT
											(SELECT number FROM blocks ORDER BY number DESC LIMIT 1) AS latest_block_height,
											(SELECT block_number FROM internal_transactions ORDER BY timestamp DESC LIMIT 1) AS latest_internal_txn_height
										`) as any[]

			const latestBlockHeightFromDB = Number(res[0].latest_block_height)
			const latestInternalTxnsBlockHeightFromDB = Number(
				res[0].latest_internal_txn_height,
			)

			// Check if the latest block height from blocks table is lagging behind
			const blockLagBehind = latestBlockHeight - latestBlockHeightFromDB
			if (blockLagBehind > maxBlockHeightLag) {
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: `Database lagging behind ${blockLagBehind} blocks in blocks table`,
					cause: {
						latestBlockHeight,
						latestBlockHeightFromDB,
					},
				})
			}

			// Check if the latest block height from internal transactions table is lagging behind (only if network is supported)
			let internalTxnsLagBehind = 0
			if (!isUnsupportedNetwork) {
				internalTxnsLagBehind =
					latestBlockHeight - latestInternalTxnsBlockHeightFromDB
				if (internalTxnsLagBehind > maxBlockHeightLag) {
					throw new TRPCError({
						code: 'INTERNAL_SERVER_ERROR',
						message: `Database lagging behind ${internalTxnsLagBehind} blocks in internal_transactions table`,
						cause: {
							latestBlockHeight,
							latestInternalTxnsBlockHeightFromDB,
						},
					})
				}
			}

			return {
				latestBlockHeight,
				latestBlockHeightFromDB,
				latestInternalTxnsBlockHeightFromDB,
			}
		}),
})
