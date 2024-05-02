import { z } from 'zod'

import { IsScroll } from '@/constants'
import { isSameAddress } from '@/constants/address'
import { SCROLL_BRIDGE_CONTRACT } from '@/constants/bridge'

import { publicClient } from '@/utils/viem-client'
import { TRPCError } from '@trpc/server'
import { Hex, isAddress } from 'viem'
import prisma, { wrapMethodNames } from '../../prisma'
import sharePrisma, { wrapTxAddressOnPublicTag } from '../../share_prisma'
import { internalProcedure, router } from '../../trpc'

export const addressRouter = router({
	getAddressBalance: internalProcedure
		.input(
			z.string().refine((v) => isAddress(v), { message: 'Invalid address' }),
		)
		.query(async ({ input }) => {
			try {
				const address = input.toLowerCase()
				return (await publicClient.getBalance({
					address: address as Hex,
				})) as unknown as number
			} catch (e: any) {
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: e.message,
				})
			}
		}),
	getAddressSummary: internalProcedure
		.input(z.string())
		.query(async ({ input }) => {
			const address = input.trim().toLowerCase()
			const summary = (await prisma.$queryRaw`
        SELECT
            COALESCE((SELECT balance FROM address_balances WHERE address = ${address}), '0') AS balance,
            (SELECT COUNT(*) FROM (
                SELECT transaction_hash FROM token_transfers WHERE from_address = ${address}
                UNION ALL
                SELECT transaction_hash FROM token_transfers WHERE to_address = ${address}
            ) AS subquery) AS token_transfer_count,
            (SELECT SUM(gas_used) FROM transactions WHERE from_address = ${address}) AS gas_used,
            (SELECT updated_block_number FROM address_balances WHERE address = ${address}) AS last_balance_update
        `) as any[]

			if (summary.length === 0) {
				return null
			}

			return summary[0]
		}),
	getAddressTxsCount: internalProcedure
		.input(z.string())
		.query(async ({ input }) => {
			const address = input.toLowerCase()
			const txsCountRes = (await prisma.$queryRaw`
        SELECT COUNT(*) FROM (
        SELECT block_number FROM transactions WHERE from_address = ${address}
        UNION ALL
        SELECT block_number FROM transactions WHERE to_address = ${address}
) AS transaction_count;
        `) as any[]
			return txsCountRes[0].count
		}),
	getAddressTokenBalance: internalProcedure
		.input(
			z.object({
				address: z.string(),
				tokenType: z.string().default('erc20'),
			}),
		)
		.query(async ({ input }) => {
			const address = input.address.toLowerCase()
			const balances = (await prisma.$queryRaw`
        SELECT tokens.name, tokens.address, tokens.symbol, tokens.decimals, tokens.total_supply, tokens.token_type, token_balances.*
        FROM tokens
            INNER JOIN token_balances
            ON token_balances.token_address = tokens.address
        WHERE
            token_balances.address = ${address}
            AND token_balances.balance > 0
            AND tokens.token_type = ${input.tokenType}
        `) as any[]

			// ! handle duplicate token balances until our indexer is fixed to not insert duplicates
			// Filter balances to include only the max updated_block_number for each address-token pair
			const balanceMap = new Map()
			balances.forEach((balance) => {
				const key = `${balance.address}-${balance.token_address}-${balance.token_type}`
				const existingBalance = balanceMap.get(key)
				if (
					!existingBalance ||
					existingBalance.updated_block_number < balance.updated_block_number
				) {
					balanceMap.set(key, balance)
				}
			})

			const tokenBalances = Array.from(balanceMap.values())

			return tokenBalances
		}),
	getAddressTxs: internalProcedure
		.input(
			z.object({
				address: z.string(),
				take: z.number().int().max(20).default(20).optional(),
				cursor: z.number().nullish(),
				desc: z.boolean().default(true),

				hash: z.string().optional(),
				block_number: z
					.union([z.number().optional(), z.nan().optional()])
					.optional(),
				method_id: z.string().optional(),
				value: z
					.object({ min: z.number().optional(), max: z.number().optional() })
					.optional(),
				timespan: z
					.object({ from: z.number().optional(), to: z.number().optional() })
					.optional(),
				status: z.string().optional(),
				from_addresses: z
					.array(z.object({ address: z.string(), include: z.boolean() }))
					.optional(),
				to_addresses: z
					.array(z.object({ address: z.string(), include: z.boolean() }))
					.optional(),
			}),
		)
		.query(async ({ input }) => {
			const address = input.address.toLowerCase()
			const {
				take,
				cursor,
				desc,
				hash,
				block_number,
				method_id,
				value,
				timespan,
				status,
				from_addresses,
				to_addresses,
			} = input
			let whereClause = '1 = 1'

			if (hash !== undefined) {
				whereClause += ` AND transactions.hash = '${hash}'`
			}

			if (block_number !== undefined && !Number.isNaN(block_number)) {
				whereClause += ` AND transactions.block_number = ${block_number}`
			}

			if (method_id !== undefined) {
				whereClause += ` AND transactions.method_id = '${method_id}'`
			}
			if (from_addresses !== undefined && from_addresses.length > 0) {
				for (const item of from_addresses) {
					item.include === true
						? (whereClause += ` AND transactions.from_address = '${item.address}'`)
						: (whereClause += ` AND transactions.from_address != '${item.address}'`)
				}
			}
			if (to_addresses !== undefined && to_addresses.length > 0) {
				for (const item of to_addresses) {
					item.include === true
						? (whereClause += ` AND transactions.from_address = '${item.address}'`)
						: (whereClause += ` AND transactions.from_address != '${item.address}'`)
				}
			}
			if (status !== undefined) {
				if (status === 'completed') {
					whereClause += ` AND transactions.status = 1`
				} else if (status === 'failed') {
					whereClause += ` AND transactions.status = 0`
				} else if (status === 'outgoing') {
					whereClause += ` AND transactions.from_address = '${address}'`
				} else if (status === 'incoming') {
					whereClause += ` AND transactions.to_address = '${address}'`
				} else if (status === 'creation') {
					return {
						list: [],
						nextCursor: null,
					}
				}
			}

			if (value) {
				if (value.min !== undefined) {
					whereClause += ` AND transactions.value >= ${value.min}`
				}
				if (value.max !== undefined) {
					whereClause += ` AND transactions.value <= ${value.max}`
				}
			}

			if (timespan) {
				if (timespan.from !== undefined) {
					whereClause += ` AND transactions.timestamp >= ${timespan.from}`
				}
				if (timespan.to !== undefined) {
					whereClause += ` AND transactions.timestamp <= ${timespan.to}`
				}
			}

			const txs = (await prisma.$queryRawUnsafe(`
              SELECT transactions.*, l1_batches.status as l1_status
              FROM transactions
              LEFT JOIN l1_batches ON transactions.l1_batch_number = l1_batches.number
              WHERE (from_address = '${address}' OR to_address = '${address}')
              AND ${whereClause}
              ${
								cursor
									? `AND transactions.timestamp ${desc ? '<' : '>'} ${cursor}`
									: ''
							}
              ORDER BY transactions.timestamp ${desc ? 'DESC' : 'ASC'}
              LIMIT ${take}
          `)) as any[]

			const wrappedTxs = await wrapMethodNames(txs)
			let wrappedPublicTagTxs: any[] = wrappedTxs
			try {
				wrappedPublicTagTxs = await wrapTxAddressOnPublicTag(wrappedTxs)
			} catch (e) {
				console.log(e)
			}

			for (const tx of wrappedPublicTagTxs) {
				if (
					isSameAddress(tx.from_address, address) &&
					isSameAddress(tx.to_address, address)
				) {
					tx.direction = 'SELF'
				} else if (isSameAddress(tx.from_address, address)) {
					tx.direction = 'OUT'
				} else if (isSameAddress(tx.to_address, address)) {
					tx.direction = 'IN'
				}
			}

			return {
				list: wrappedPublicTagTxs,
				nextCursor:
					txs.length > 0 && txs.length === take
						? txs[txs.length - 1].timestamp
						: null,
			}
		}),
	getAddressTokenTxList: internalProcedure
		.input(
			z.object({
				address: z.string(),
				tokenType: z.string().default('erc20'),
				take: z.number().int().max(50).default(20).optional(),
				cursor: z.number().nullish(),
				desc: z.boolean().default(true),
			}),
		)
		.query(async ({ input }) => {
			const address = input.address.toLowerCase()
			const { take, cursor, desc, tokenType } = input
			const transferCount = (await prisma.$queryRawUnsafe(`
                    SELECT COUNT(*)
                    FROM token_transfers
                    WHERE (token_transfers.from_address = '${address}' OR token_transfers.to_address = '${address}')
                    AND token_transfers.token_type = '${tokenType}'
                    `)) as any[]
			const transfers = (await prisma.$queryRawUnsafe(`
                    SELECT token_transfers.*, tokens.name, tokens.symbol, tokens.decimals
                    FROM token_transfers
                    JOIN tokens
                    ON token_transfers.token_address = tokens.address
                    WHERE (token_transfers.from_address = '${address}' OR token_transfers.to_address = '${address}')
                    AND token_transfers.token_type = '${tokenType}'
                    ${
											cursor
												? `AND token_transfers.timestamp ${
														desc ? '<' : '>'
												  } ${cursor}`
												: ''
										}
                    ORDER BY token_transfers.timestamp ${desc ? 'DESC' : 'ASC'}
                    LIMIT ${take}
                    `)) as any[]
			const wrappedTxs = await wrapMethodNames(transfers)
			wrappedTxs.forEach((item) => {
				if (!item.method_name) {
					item.method_name = 'Transfer'
				}
			})
			return {
				count: transferCount[0].count,
				list: wrappedTxs,
				nextCursor:
					transfers.length > 0 && transfers.length === take
						? transfers[transfers.length - 1].timestamp
						: null,
			}
		}),
	getAddressInternalTxs: internalProcedure
		.input(
			z.object({
				address: z.string(),
				take: z.number().int().max(50).default(20).optional(),
				cursor: z.number().nullish(),
				desc: z.boolean().default(true),
			}),
		)
		.query(async ({ input }) => {
			const address = input.address.trim().toLowerCase()
			const { take, cursor, desc } = input

			const txs = (await prisma.$queryRawUnsafe(`
                        SELECT *
                        FROM internal_transactions
                        WHERE (internal_transactions.to_address = '${address}')
                        ${
													cursor
														? `AND internal_transactions.timestamp ${
																desc ? '<' : '>'
														  } ${cursor}`
														: ''
												}
                        ORDER BY internal_transactions.timestamp ${
													desc ? 'DESC' : 'ASC'
												}
                        LIMIT ${take}
                        `)) as any[]
			let wrappedPublicTagTxs: any[] = txs
			try {
				wrappedPublicTagTxs = await wrapTxAddressOnPublicTag(txs)
			} catch (e) {
				console.log(e)
			}
			return {
				list: wrappedPublicTagTxs,
				nextCursor:
					txs.length > 0 && txs.length === take
						? txs[txs.length - 1].timestamp
						: null,
			}
		}),
	getUniqueWalletCount: internalProcedure.query(async () => {
		const res = (await prisma.$queryRaw`
          SELECT count FROM mv_unique_address_count
      `) as any[]
		return res[0].count
	}),
	getAccountStats: internalProcedure
		.input(
			z.object({
				take: z.number().int().max(100).default(20).optional(),
			}),
		)
		.query(async ({ input }) => {
			const { take } = input
			const sql = IsScroll
				? `
          SELECT *
          FROM  mv_account_stats_scroll
          ORDER BY balance DESC
          LIMIT ${take}
      `
				: `
          SELECT *
          FROM  mv_account_stats
          ORDER BY balance DESC
          LIMIT ${take}
        `
			const res = (await prisma.$queryRawUnsafe(sql)) as any[]
			if (IsScroll) {
				if (
					res &&
					[
						SCROLL_BRIDGE_CONTRACT['MAINNET'].L2_SCROLL_MESSENGER.toLowerCase(),
						SCROLL_BRIDGE_CONTRACT['TESTNET'].L2_SCROLL_MESSENGER.toLowerCase(),
					].includes(res[0].address.toLowerCase())
				) {
					res.shift()
				}
			}
			return {
				list: res,
			}
		}),
	getAddressPublicTags: internalProcedure
		.input(z.string())
		.query(async ({ input }) => {
			const address = input.toLowerCase()
			const res = (await sharePrisma.$queryRawUnsafe(`
        SELECT tags
        FROM public.public_tags
        WHERE address = '${address}' and chain_name = '${process.env.NEXT_PUBLIC_CHAIN}'
    `)) as any[]
			try {
				if (res[0]) {
					return JSON.parse(res[0].tags)
				}
				return []
			} catch (e) {
				console.error(e)
				return []
			}
		}),
})
