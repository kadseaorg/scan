import { isAddress } from 'viem'
import { z } from 'zod'

import { WalletTxType } from '@/components/portal/wallet/txs'
import {
	CHAIN_MAP,
	IsArbitrum,
	IsBsquaredTestnet,
	IsKadsea,
	IsScroll,
	Is_Mainnet,
} from '@/constants'
import { EPortalNetwork } from '@/stores/portal'
import { CallTrace, TraceTransactionSchema } from '@/types'
import { publicClient } from '@/utils/viem-client'

import { camelCase, mapKeys, uniqBy } from 'lodash-es'
import externalPrisma from '../../external_prisma'
import prisma, {
	getEstimatedInternalTransactionCount,
	getEstimatedTransactionCount,
	wrapCallTracesMethodName,
	wrapMethodNames,
} from '../../prisma'
import { wrapTxAddressOnPublicTag } from '../../share_prisma'
import { internalProcedure, router } from '../../trpc'

export const transactionRouter = router({
	getTransactionCount: internalProcedure.query(async () => {
		return await getEstimatedTransactionCount()
	}),
	getTransactions: internalProcedure
		.input(
			z.object({
				take: z.number().int().max(50).default(20).optional(),
				cursor: z.number().nullish(),
				desc: z.boolean().default(true),

				hash: z.string().optional(),
				block_number: z
					.union([z.number().optional(), z.nan().optional()])
					.optional(),
				method_id: z.string().optional(),
				from_addresses: z
					.array(z.object({ address: z.string(), include: z.boolean() }))
					.optional(),
				to_addresses: z
					.array(z.object({ address: z.string(), include: z.boolean() }))
					.optional(),
				value: z
					.object({ min: z.number().optional(), max: z.number().optional() })
					.optional(),
				timespan: z
					.object({ from: z.number().optional(), to: z.number().optional() })
					.optional(),
				showPublicTag: z.boolean().default(true),
			}),
		)
		.query(async ({ input }) => {
			const {
				take,
				cursor,
				desc,
				hash,
				block_number,
				method_id,
				from_addresses,
				to_addresses,
				value,
				timespan,
				showPublicTag,
			} = input

			if (block_number !== undefined && isNaN(block_number)) {
				// if have blockNumber, but is nan
				return {
					count: 0,
					list: [],
					nextCursor: null,
				}
			}

			let whereClause = `1 = 1`

			if (hash !== undefined) {
				whereClause += ` AND transactions.hash = '${hash}'`
			}

			if (block_number !== undefined && !isNaN(block_number)) {
				whereClause += ` AND transactions.block_number = ${block_number}`
			}

			if (method_id !== undefined) {
				whereClause += ` AND transactions.method_id = '${method_id}'`
			}

			if (from_addresses && from_addresses.length > 0) {
				const from_includes = from_addresses
					.filter((addr) => addr.include)
					.map((addr) => `'${addr.address.toLowerCase()}'`)
					.join(',')
				const from_excludes = from_addresses
					.filter((addr) => !addr.include)
					.map((addr) => `'${addr.address.toLowerCase()}'`)
					.join(',')

				if (from_includes.length > 0) {
					whereClause += ` AND transactions.from_address IN (${from_includes})`
				}

				if (from_excludes.length > 0) {
					whereClause += ` AND transactions.from_address NOT IN (${from_excludes})`
				}
			}

			if (to_addresses && to_addresses.length > 0) {
				const to_includes = to_addresses
					.filter((addr) => addr.include)
					.map((addr) => `'${addr.address.toLowerCase()}'`)
					.join(',')
				const to_excludes = to_addresses
					.filter((addr) => !addr.include)
					.map((addr) => `'${addr.address.toLowerCase()}'`)
					.join(',')

				if (to_includes.length > 0) {
					whereClause += ` AND transactions.to_address IN (${to_includes})`
				}

				if (to_excludes.length > 0) {
					whereClause += ` AND transactions.to_address NOT IN (${to_excludes})`
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

			const sql = `
            SELECT transactions.*, l1_batches.status as l1_status
            FROM transactions
            LEFT JOIN l1_batches ON transactions.l1_batch_number = l1_batches.number
            WHERE ${whereClause}
            ${
							cursor
								? `AND transactions.timestamp ${desc ? '<' : '>'} ${cursor}`
								: ''
						}
            ORDER BY transactions.timestamp ${
							desc ? 'DESC' : 'ASC'
						}, transactions.block_number ${desc ? 'DESC' : 'ASC'}
            LIMIT ${take}
        `

			const resPromise = prisma.$queryRawUnsafe(sql)

			let txsCountPrimise: Promise<any>
			if (block_number !== undefined) {
				txsCountPrimise = prisma.transactions.count({
					where: { block_number: block_number },
				})
			} else {
				txsCountPrimise = getEstimatedTransactionCount()
			}
			const [txCount, rawRes] = await Promise.all([txsCountPrimise, resPromise])
			const txs = rawRes as any[]

			const wrappedTxs = await wrapMethodNames(txs)
			const wrapAddressPublicTagTxs = showPublicTag
				? await wrapTxAddressOnPublicTag(wrappedTxs)
				: wrappedTxs
			return {
				count: txCount,
				list: wrapAddressPublicTagTxs,
				nextCursor:
					txs.length > 0 && txs.length === take
						? txs[txs.length - 1].timestamp
						: null,
			}
		}),
	getPendingTransactionList: internalProcedure
		.input(
			z.object({
				// # order by blockNumber
				// # 0: asc by blockNumber
				// # 1: desc by blockNumber (default)
				offset: z.number().optional().default(0),
				limit: z.number().optional().default(20),
			}),
		)
		.query(async ({ input }) => {
			// TODO: support pending txs
			return {
				count: 0,
				list: [],
			}
		}),
	getTxDetail: internalProcedure.input(z.string()).query(async ({ input }) => {
		const txs = (await prisma.$queryRaw`
            SELECT
            transactions.*,
            l1_batches.status as l1_status,
            l1_batches.commit_tx_hash as l1_commit_tx_hash,
            l1_batches.prove_tx_hash as l1_prove_tx_hash,
            l1_batches.execute_tx_hash as l1_execute_tx_hash
            FROM transactions
            LEFT JOIN l1_batches ON transactions.l1_batch_number = l1_batches.number
            WHERE transactions.hash = ${input}
        `) as any[]

		const transfers = (await prisma.$queryRaw`
          SELECT token_transfers.*, tokens.name, tokens.address, tokens.symbol, tokens.decimals, tokens.total_supply
          FROM
            token_transfers
          LEFT OUTER JOIN tokens ON token_transfers.token_address = tokens.address
          WHERE
            token_transfers.transaction_hash = ${input} AND token_transfers.token_address = tokens.address
        `) as any[]

		if (txs.length === 0) {
			return null
		}

		const tx = txs[0]

		tx.token_transfers = transfers
		if (tx.to_address) {
			const toContractData = await prisma.contracts.findUnique({
				where: { address: tx.to_address },
				select: { address: true, name: true, is_verified: true },
			})

			tx.to_contract = !!toContractData?.address
			tx.to_contract_verified = 1 === Number(toContractData?.is_verified ?? 0)
			tx.to_contract_name = toContractData?.name || toContractData?.name || ''
		}

		// TODO: figure out how to get cross transfer
		// if (tx.crossType > 0) {
		//   const crossTx = (await prisma.$queryRaw`
		//           SELECT
		//             "crossTransaction".type,
		//             "crossTransaction"."l1TransactionHash",
		//             "crossTransaction"."l1Token",
		//             "crossTransaction"."l2Token",
		//             "crossTransaction".from,
		//             "crossTransaction".to,
		//             "crossTransaction".amount,
		//             contract.name,
		//             contract.symbol,
		//             contract.decimals,
		//             "tokenListMaintain".logo_path
		//         FROM "crossTransaction"
		//         LEFT OUTER JOIN contract
		//             ON "crossTransaction"."l2Token" = contract."contractAddress"
		//         LEFT OUTER JOIN "tokenListMaintain"
		//             ON "crossTransaction"."l2Token" = "tokenListMaintain".contract_address
		//         WHERE "crossTransaction"."l2TransactionHash" = ${input}
		//     `) as any[]
		//   tx.crossTransfer = crossTx.map(item => {
		//     if (item.l1Token === '') {
		//       item.name = 'Ethereum'
		//       item.symbol = 'ETH'
		//       item.decimals = 18
		//     }
		//     return item
		//   })
		// }
		return tx
	}),
	getInternalTransactionDetail: internalProcedure
		.input(z.string())
		.query(async ({ input }) => {
			if (IsKadsea) {
				const txs = uniqBy(
					(
						(await prisma.$queryRaw`
            SELECT *
            FROM internal_transactions
            WHERE parent_transaction_hash = ${input}
            ORDER BY ID ASC
        `) as Record<string, any>[]
					).map((tx) =>
						mapKeys(tx, (_, k) =>
							k === 'from_address'
								? 'from'
								: k === 'to_address'
								  ? 'to'
								  : camelCase(k),
						),
					),
					(it) => it.type + it.from + it.to + it.value,
				) as CallTrace[]

				return txs
			}

			const response = await publicClient.request<TraceTransactionSchema>({
				method: 'debug_traceTransaction',
				params: [input as `0x${string}`, { tracer: 'callTracer' }],
			})

			return await wrapCallTracesMethodName(response)
		}),
	getInternalTrace: internalProcedure
		.input(
			z.object({
				parent_transaction_hash: z.string(),
			}),
		)
		.query(async ({ input }) => {
			const { parent_transaction_hash } = input
			const txs = (await prisma.$queryRaw`
            SELECT *
            FROM internal_transactions
            WHERE parent_transaction_hash = ${parent_transaction_hash} AND value > 0 AND type != 'DELEGATECALL'
        `) as any[]
			let wrappedPublicTagTxs: any[] = txs
			try {
				wrappedPublicTagTxs = await wrapTxAddressOnPublicTag(txs)
			} catch (e) {
				console.log(e)
			}
			return {
				list: wrappedPublicTagTxs,
			}
		}),
	getTxLogs: internalProcedure.input(z.string()).query(async ({ input }) => {
		const logs = (await prisma.$queryRaw`
          SELECT * FROM transaction_logs
          WHERE transaction_logs.transaction_hash = ${input.trim()}
          ORDER BY transaction_logs.log_index ASC
      `) as any[]

		const data = logs.map((log) => {
			const {
				log_index,
				address,
				topic1,
				topic2,
				topic3,
				topic4,
				data,
				block_number,
				transaction_hash,
			} = log
			return {
				logIndex: log_index,
				address,
				topics: [topic1, topic2, topic3, topic4].filter((topic) => !!topic),
				data,
				blockNumber: block_number,
				transactionHash: transaction_hash,
			}
		})

		return data
	}),
	getInternalTxs: internalProcedure
		.input(
			z.object({
				blockNumber: z.union([z.number().optional(), z.nan().optional()]),
				take: z.number().int().max(50).default(20).optional(),
				cursor: z.number().nullish(),
				desc: z.boolean().default(true),
			}),
		)
		.query(async ({ input }) => {
			const { blockNumber, take, cursor, desc } = input

			let count: number
			if (blockNumber) {
				const countRes = (await prisma.$queryRawUnsafe(
					`SELECT COUNT(*) FROM internal_transactions WHERE block_number = '${blockNumber}'`,
				)) as any[]
				count = countRes[0].count
			} else {
				count = await getEstimatedInternalTransactionCount()
			}

			const internalTxsSql = `
        SELECT *
        FROM internal_transactions
        WHERE 1 = 1
        ${
					blockNumber
						? `AND internal_transactions.block_number = '${blockNumber}'`
						: ''
				}
        ${
					cursor
						? `AND internal_transactions.timestamp ${
								desc ? '<' : '>'
						  } ${cursor}`
						: ''
				}
        ORDER BY internal_transactions.timestamp ${desc ? 'DESC' : 'ASC'}
        LIMIT ${take}
      `
			const internalTxs = (await prisma.$queryRawUnsafe(
				internalTxsSql,
			)) as any[]
			const wrapAddressOnPublicTagTxs =
				await wrapTxAddressOnPublicTag(internalTxs)
			return {
				count: count,
				list: wrapAddressOnPublicTagTxs,
				nextCursor:
					internalTxs.length > 0 && internalTxs.length === take
						? internalTxs[internalTxs.length - 1].timestamp
						: null,
			}
		}),
	getAccountWalletTransactions: internalProcedure
		.input(
			z.object({
				address: z.string().refine(isAddress, { message: 'Invalid address' }),
				network: z.enum([EPortalNetwork.MAINNET, EPortalNetwork.TESTNET]),
				take: z.number().int().max(50).default(20).optional(),
				cursor: z.number().nullish(),
				desc: z.boolean().default(true).optional(),
			}),
		)
		.query(async ({ input }) => {
			const address = input.address.toLowerCase()
			const { network, take, cursor, desc } = input

			let prismaInstance: any
			if (network === EPortalNetwork.MAINNET) {
				prismaInstance = Is_Mainnet ? prisma : externalPrisma
			} else if (network === EPortalNetwork.TESTNET) {
				prismaInstance = Is_Mainnet ? externalPrisma : prisma
			} else {
				throw new Error('invalid network')
			}

			let ethTxs: {
				hash: string
				from_address: string
				to_address: string
				value: string
				timestamp: number
			}[] = []

			// zksync erc20 transactions contains eth
			if (IsScroll || IsBsquaredTestnet || IsKadsea || IsArbitrum) {
				ethTxs = await prismaInstance.$queryRawUnsafe(`
                    SELECT hash, from_address, to_address, value, timestamp
                    FROM transactions
                    WHERE (from_address = '${address}' OR to_address = '${address}') AND method_id = '0x' AND input = '0x'
                    ${
											cursor
												? `AND transactions.timestamp ${
														desc ? '<' : '>'
												  } ${cursor}`
												: ''
										}
                    ORDER BY transactions.timestamp ${desc ? 'DESC' : 'ASC'}
                    LIMIT ${take}
                    `)
			}

			const bridgeContract = [
				'0x0000000000000000000000000000000000008001',
				...(CHAIN_MAP.scroll.bridgeContract || []),
				...(CHAIN_MAP['scroll-sepolia'].bridgeContract || []),
				...(CHAIN_MAP['zksync-era'].bridgeContract || []),
				...(CHAIN_MAP['zksync-era-testnet'].bridgeContract || []),
				...(CHAIN_MAP['zksync-era-sepolia'].bridgeContract || []),
				...(CHAIN_MAP['bsquared-testnet'].bridgeContract || []),
				...(CHAIN_MAP['kadsea'].bridgeContract || []),
				...(CHAIN_MAP['arb-one'].bridgeContract || []),
			]
				?.map((contract) => `'${contract.toLowerCase()}'`)
				?.join(',')

			const erc20Txs: {
				hash: string
				from_address: string
				to_address: string
				value: string
				timestamp: number
				name: string
				symbol: string
				decimals: number
			}[] = await prismaInstance.$queryRawUnsafe(
				`SELECT
          token_transfers.transaction_hash AS hash,
          token_transfers.from_address,
          token_transfers.to_address,
          token_transfers.value,
          token_transfers.timestamp,
          tokens.name,
          tokens.symbol,
          tokens.decimals
        FROM
          token_transfers
          JOIN tokens ON token_transfers.token_address = tokens.address
        WHERE
          (
            (token_transfers.from_address = '${address}' OR token_transfers.to_address = '${address}')
            AND token_transfers.from_address NOT IN (${bridgeContract})
            AND token_transfers.to_address NOT IN (${bridgeContract})
          )`,
			)

			const getType = (fromAddress: string) =>
				fromAddress.toLowerCase() === address.toLowerCase()
					? WalletTxType.SEND
					: WalletTxType.RECEIVE
			const txs = [
				...ethTxs.map((tx) => ({ type: getType(tx.from_address), ...tx })),
				...erc20Txs.map((tx) => ({ type: getType(tx.from_address), ...tx })),
			].sort((a, b) => {
				const _a = BigInt(a.timestamp)
				const _b = BigInt(b.timestamp)
				return desc ? Number(_b - _a) : Number(_a - _b)
			})

			return {
				list: txs,
				nextCursor:
					txs.length > 0 && txs.length === take
						? txs[txs.length - 1].timestamp
						: null,
			}
		}),
})
