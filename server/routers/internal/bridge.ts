import { Hex, isHash, pad } from 'viem'
import { z } from 'zod'

import { CHAIN_MAP, CHAIN_TYPE, Is_Mainnet } from '@/constants'
import {
	ScrollL2ERC20GatewayProxy,
	ScrollL2ETHGatewayProxy,
	ScrollL2FinalizeDepositERC20Topic,
	ScrollL2FinalizeDepositETHTopic,
	ScrollL2WETHGatewayProxy,
	ScrollL2WithdrawERC20Topic,
	ScrollL2WithdrawETHTopic,
	ZkSyncL2BridgeETHTransferTopic,
	ZkSyncL2ERC20BridgeProxy,
	ZkSyncL2ERC20FinalizeDepositTopic,
	ZkSyncL2ERC20WithdrawalInitiatedTopic,
	ZkSyncL2ETHGatewayProxy,
	ZkSyncL2ETHMintTopic,
	ZkSyncL2ETHWithdrawalTopic,
} from '@/constants/bridge'
import { EPortalNetwork } from '@/stores/portal'
import { EnumChainType } from '@/types/chain'

import externalPrisma from '../../external_prisma'
import prisma, {
	wrapAddressOnLogsForScroll,
	wrapAddressOnLogsForZkSync,
	wrapMethodNames,
	wrapMethodNamesLogs,
} from '../../prisma'
import { internalProcedure, router } from '../../trpc'

export const bridgeRouter = router({
	getBridgeOverview: internalProcedure.query(async () => {
		const bridgeContract = CHAIN_MAP[CHAIN_TYPE].bridgeContract
			?.map((contract) => contract.toLowerCase())
			?.reduce(
				(pre, current, index) => pre + (!!index ? ',' : '') + `'${current}'`,
				'',
			)
		const bridgeDepositMethodId =
			CHAIN_MAP[CHAIN_TYPE].bridgeDepositMethodId?.toLowerCase()
		const results = (await prisma.$queryRaw`
    SELECT
        COUNT(DISTINCT COALESCE(from_address, to_address)) AS user_count,
        COUNT(*) AS tx_count,
        COALESCE(SUM(value), 0) AS tvl,
        COUNT(CASE WHEN method_id = ${bridgeDepositMethodId} THEN 1 END) AS deposit_count
    FROM
      transactions
    WHERE
      from_address IN (${bridgeContract}) OR to_address IN (${bridgeContract})
  `) as any[]

		return {
			user_count: results[0].user_count,
			tx_count: results[0].tx_count,
			tvl: results[0].tvl,
			deposit_count: results[0].deposit_count,
		}
	}),
	getBridgeStats: internalProcedure.query(async () => {
		const bridgeContract = CHAIN_MAP[CHAIN_TYPE].bridgeContract
			?.map((contract) => contract.toLowerCase())
			?.reduce(
				(pre, current, index) => pre + (!!index ? ',' : '') + `'${current}'`,
				'',
			)
		const results = (await prisma.$queryRaw`
    SELECT date, unique_address_count, total_value
    FROM mv_daily_contract_stats
    WHERE contract_address IN (${bridgeContract})
    ORDER BY date
  `) as any[]

		return {
			unique_address_count: results.map((r) => r.unique_address_count),
			total_value: results.map((r) => r.total_value),
			date: results.map((r) => r.date),
		}
	}),
	getTopBridgeAccounts: internalProcedure.query(async () => {
		const bridgeContract = CHAIN_MAP[CHAIN_TYPE].bridgeContract
			?.map((contract) => contract.toLowerCase())
			?.reduce(
				(pre, current, index) => pre + (!!index ? ',' : '') + `'${current}'`,
				'',
			)
		const results = (await prisma.$queryRaw`
                                    SELECT from_address AS address, SUM(value) AS total_value, COUNT(*) AS txn_count
                                    FROM transactions
                                    WHERE to_address IN (${bridgeContract})
                                    GROUP BY from_address
                                    ORDER BY total_value DESC
                                    LIMIT 10
                                  `) as any[]
		return results
	}),
	getBridgeTxs: internalProcedure
		.input(
			z.object({
				address: z.string().optional(),
				take: z.number().int().max(50).default(20).optional(),
				cursor: z.number().nullish(),
				desc: z.boolean().default(true),
				network: z
					.enum([EPortalNetwork.MAINNET, EPortalNetwork.TESTNET])
					.optional(),
			}),
		)
		.query(async ({ input }) => {
			const address = input.address?.toLowerCase()
			const { network, take, cursor, desc } = input

			let prismaInstance: any = prisma
			if (undefined !== network) {
				if (network === EPortalNetwork.MAINNET) {
					prismaInstance = Is_Mainnet ? prisma : externalPrisma
				} else if (network === EPortalNetwork.TESTNET) {
					prismaInstance = Is_Mainnet ? externalPrisma : prisma
				} else {
					throw new Error('invalid network')
				}
			}

			const bridgeContract = CHAIN_MAP[CHAIN_TYPE].bridgeContract
				?.map((contract) => contract.toLowerCase())
				?.reduce(
					(pre, current, index) => pre + (!!index ? ',' : '') + `'${current}'`,
					'',
				)
			let txs = (await prismaInstance.$queryRawUnsafe(`
              SELECT transactions.*, l1_batches.status as l1_status
              FROM transactions
              LEFT JOIN l1_batches ON transactions.l1_batch_number = l1_batches.number
              WHERE (from_address IN (${bridgeContract}) OR to_address IN (${bridgeContract}))
              ${
								address
									? `AND (from_address = '${address}' OR to_address = '${address}')`
									: ''
							}
              ${
								cursor
									? `AND transactions.timestamp ${desc ? '<' : '>'} ${cursor}`
									: ''
							}
              ORDER BY transactions.timestamp ${desc ? 'DESC' : 'ASC'}
              LIMIT ${take}
          `)) as any[]

			const wrappedTxs = await wrapMethodNames(txs)

			return {
				list: wrappedTxs,
				nextCursor:
					txs.length > 0 && txs.length === take
						? txs[txs.length - 1].timestamp
						: null,
			}
		}),
	getBridgeLogs: internalProcedure
		.input(
			z.object({
				address: z.string().optional(),
				take: z.number().int().max(50).default(20).optional(),
				cursor: z.number().nullish(),
				desc: z.boolean().default(true),
				network: z
					.enum([EPortalNetwork.MAINNET, EPortalNetwork.TESTNET])
					.optional(),
			}),
		)
		.query(async ({ input }) => {
			const address = input.address?.toLowerCase() as Hex
			const addrTopic = address ? pad(address) : undefined
			const { network, take, cursor, desc } = input

			let prismaInstance: any = prisma
			if (undefined !== network) {
				if (network === EPortalNetwork.MAINNET) {
					prismaInstance = Is_Mainnet ? prisma : externalPrisma
				} else if (network === EPortalNetwork.TESTNET) {
					prismaInstance = Is_Mainnet ? externalPrisma : prisma
				} else {
					throw new Error('invalid network')
				}
			}

			let sql
			const isScroll =
				CHAIN_TYPE === EnumChainType.SCROLL ||
				CHAIN_TYPE === EnumChainType.SCROLL_SEPOLIA
			const IsZkSync =
				CHAIN_TYPE === EnumChainType.ZKSYNC ||
				CHAIN_TYPE === EnumChainType.ZKSYNC_TESTNET ||
				CHAIN_TYPE === EnumChainType.ZKSYNC_SEPOLIA
			if (isScroll) {
				sql = `
        SELECT transaction_logs.*, blocks.timestamp
        FROM transaction_logs
        INNER JOIN blocks ON transaction_logs.block_number = blocks.number
        WHERE transaction_logs.address IN ('${ScrollL2ETHGatewayProxy.toLowerCase()}', '${ScrollL2ERC20GatewayProxy.toLowerCase()}', '${ScrollL2WETHGatewayProxy.toLowerCase()}')
        AND transaction_logs.topic1 IN ('${ScrollL2FinalizeDepositETHTopic}', '${ScrollL2WithdrawETHTopic}', '${ScrollL2FinalizeDepositERC20Topic}', '${ScrollL2WithdrawERC20Topic}')
        ${
					addrTopic
						? `AND (transaction_logs.topic2 = '${addrTopic}' OR transaction_logs.topic3 = '${addrTopic}' OR transaction_logs.topic4 = '${addrTopic}')`
						: ''
				}
        ${
					cursor
						? `AND transaction_logs.block_number ${desc ? '<' : '>'} ${cursor}`
						: ''
				}
        ORDER BY transaction_logs.block_number ${desc ? 'DESC' : 'ASC'}
        LIMIT ${take}
      `
			} else if (IsZkSync) {
				sql = `
        SELECT transaction_logs.*, blocks.timestamp
        FROM transaction_logs
        INNER JOIN blocks ON transaction_logs.block_number = blocks.number
        WHERE transaction_logs.address IN ('${ZkSyncL2ETHGatewayProxy.toLowerCase()}', '${ZkSyncL2ERC20BridgeProxy.toLowerCase()}')
        AND transaction_logs.topic1 IN ('${ZkSyncL2ETHMintTopic}', '${ZkSyncL2ETHWithdrawalTopic}', '${ZkSyncL2ERC20FinalizeDepositTopic}', '${ZkSyncL2ERC20WithdrawalInitiatedTopic}')
        ${
					addrTopic
						? `AND (transaction_logs.topic2 = '${addrTopic}' OR transaction_logs.topic3 = '${addrTopic}')`
						: ''
				}
        ${
					cursor
						? `AND transaction_logs.block_number ${desc ? '<' : '>'} ${cursor}`
						: ''
				}
        ORDER BY transaction_logs.block_number ${desc ? 'DESC' : 'ASC'}
        LIMIT ${take}
      `
			} else {
				return {
					list: [],
					nextCursor: null,
				}
			}
			const logs = (await prisma.$queryRawUnsafe(sql)) as any[]
			const namedTxs = await wrapMethodNamesLogs(logs)
			const wrappedLogs = isScroll
				? await wrapAddressOnLogsForScroll(namedTxs)
				: IsZkSync
				  ? await wrapAddressOnLogsForZkSync(namedTxs)
				  : []

			return {
				list: wrappedLogs,
				nextCursor:
					wrappedLogs.length > 0
						? wrappedLogs[wrappedLogs.length - 1].block_number
						: null, // wrappedLogs is filtered and is less than take
			}
		}),
	getExternalBridges: internalProcedure.query(async () => {
		const dapps = (await prisma.$queryRaw`SELECT * FROM external_bridges`) as {
			name: string
			logo: string
			introduction: string
			tags: string
			external_link: string
			dappId: string
		}[]

		return dapps.map((d) => ({ ...d, ...{ tags: d.tags?.split(',') } })) || []
	}),
	getZksyncL1TxHashesByL2TxHashes: internalProcedure
		.input(
			z.object({
				network: z.enum(['mainnet', 'testnet']),
				type: z.enum(['deposit', 'withdraw']),
				l2Hashs: z.array(
					z.string().refine(isHash, {
						message: 'Invalid hash',
					}),
				),
			}),
		)
		.mutation(async ({ input }) => {
			const { network, type, l2Hashs } = input
			if (!!!l2Hashs?.length) return []

			let prismaInstance: any
			if (network === 'mainnet') {
				prismaInstance = prisma
			} else if (network === 'testnet') {
				prismaInstance = externalPrisma
			} else {
				throw new Error('invalid network')
			}

			switch (type) {
				case 'deposit':
					const depositStmt = `SELECT l1_tx_hash, l2_tx_hash, l1_tx_timestamp FROM zksync_bridge_deposit_history
                                WHERE l2_tx_hash IN (${l2Hashs
																	.map((h) => `'${h}'`)
																	.join(',')})`
					const depositRes = (await prismaInstance.$queryRawUnsafe(
						depositStmt,
					)) as {
						l1_tx_hash: string
						l2_tx_hash: string
						l1_tx_timestamp: number
					}[]

					return depositRes
				case 'withdraw':
					const stmt = `SELECT l1.l1_tx_hash, t.hash AS l2_tx_hash, l1.l1_tx_timestamp FROM zksync_bridge_withdraw_history AS l1
                        INNER JOIN transactions AS t ON l1.l1_batch_number = t.l1_batch_number AND l1.l1_batch_tx_index = t.l1_batch_tx_index
                        WHERE t.hash IN (${l2Hashs
													.map((h) => `'${h}'`)
													.join(',')})`
					const withdrawRes = (await prismaInstance.$queryRawUnsafe(stmt)) as {
						l1_tx_hash: string
						l2_tx_hash: string
						l1_tx_timestamp: number
					}[]
					return withdrawRes
				default:
					throw new Error('invalid type')
			}
		}),
	getZksyncDepositL2TxHashesByL1TxHashes: internalProcedure
		.input(
			z.object({
				network: z.enum(['mainnet', 'testnet']),
				l1Hashs: z.array(
					z.string().refine(isHash, {
						message: 'Invalid hash',
					}),
				),
			}),
		)
		.mutation(async ({ input }) => {
			const { network, l1Hashs } = input
			if (!!!l1Hashs?.length) return []

			let prismaInstance: any
			if (network === 'mainnet') {
				prismaInstance = prisma
			} else if (network === 'testnet') {
				prismaInstance = externalPrisma
			} else {
				throw new Error('invalid network')
			}

			const bridgeSql = `SELECT l1_tx_hash, l1_tx_timestamp, l2_tx_hash
                           FROM zksync_bridge_deposit_history
                           WHERE l1_tx_hash IN (${l1Hashs
															.map((h) => `'${h}'`)
															.join(
																',',
															)}) order by l1_tx_timestamp desc limit 30;`
			const bridgeRes = (await prismaInstance.$queryRawUnsafe(bridgeSql)) as {
				l1_tx_hash: string
				l1_tx_timestamp: number
				l2_tx_hash: string
			}[]
			if (!!!bridgeRes.length) return []
			const txSql = `SELECT hash AS l2_tx_hash, timestamp AS l2_tx_timestamp FROM transactions
                               WHERE hash IN (${bridgeRes
																	.map(({ l2_tx_hash }) => `'${l2_tx_hash}'`)
																	.join(
																		',',
																	)}) order by timestamp desc limit 30;`

			const txRes = (await prismaInstance.$queryRawUnsafe(txSql)) as {
				l2_tx_hash: string
				l2_tx_timestamp: number
			}[]

			const res: {
				l1_tx_hash: string
				l1_tx_timestamp: number
				l2_tx_hash: string
				l2_tx_timestamp?: number
			}[] = bridgeRes
				.map((data) => ({
					...data,
					l2_tx_timestamp: txRes.find(
						({ l2_tx_hash }) => l2_tx_hash === data.l2_tx_hash,
					)?.l2_tx_timestamp,
				}))
				.filter((data) => !!data.l2_tx_timestamp)

			return res
		}),
})
