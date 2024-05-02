import { Hex, isAddress, pad } from 'viem'
import { z } from 'zod'

import { CHAIN_MAP, CHAIN_TYPE } from '@/constants'
import {
	ScrollL2ERC20GatewayProxy,
	ScrollL2ETHGatewayProxy,
	ScrollL2FinalizeDepositERC20Topic,
	ScrollL2FinalizeDepositETHTopic,
	ScrollL2WETHGatewayProxy,
	ScrollL2WithdrawERC20Topic,
	ScrollL2WithdrawETHTopic,
	ZkSyncL2ERC20BridgeProxy,
	ZkSyncL2ERC20FinalizeDepositTopic,
	ZkSyncL2ERC20WithdrawalInitiatedTopic,
	ZkSyncL2ETHGatewayProxy,
	ZkSyncL2ETHMintTopic,
	ZkSyncL2ETHWithdrawalTopic,
} from '@/constants/bridge'
import {
	calculateBridgeVolumeScore,
	calculateDistinctMonthsScore,
	calculateTransactionsCountScore,
	calculateVolumeScore,
} from '@/lib/address-activity-rule'
import getExchangeRates from '@/lib/exchange-rates'
import { convertTokenToUsd, convertWeiToUsd } from '@/lib/utils'
import { EnumChainType } from '@/types/chain'

import prisma, {
	wrapAddressOnLogsForScroll,
	wrapAddressOnLogsForZkSync,
} from '../../prisma'
import { internalProcedure, router } from '../../trpc'

export const addressStatsRouter = router({
	getAddressActivityLevel: internalProcedure
		.input(z.string().refine(isAddress, { message: 'Invalid address' }))
		.query(async ({ input }) => {
			const address = input.toLowerCase()
			const bridgeContract = CHAIN_MAP[CHAIN_TYPE].bridgeContract
				?.map((contract) => `'${contract.toLowerCase()}'`)
				?.join(',')

			const sql = `
    SELECT
      COUNT(DISTINCT DATE_TRUNC('MONTH', TO_TIMESTAMP(timestamp))) AS distinct_months,
      COUNT(*) AS total_transactions,
      COALESCE(SUM(value), 0) AS total_volume_wei,
      (SELECT COALESCE(SUM(value), 0) FROM transactions WHERE (from_address = '${address}' OR to_address = '${address}') AND (from_address IN (${bridgeContract}) OR to_address IN (${bridgeContract}))) AS total_bridge_volume_wei
    FROM transactions WHERE from_address = '${address}' OR to_address = '${address}'
    `

			const res = (await prisma.$queryRawUnsafe(sql)) as any[]
			const row = res[0]
			const rates = await getExchangeRates()

			// Get transactions total volume to USD
			const totalVolumeUsd = convertWeiToUsd(row.total_volume_wei, rates?.ETH)
			const totalBridgeVolumeUsd = convertWeiToUsd(
				row.total_bridge_volume_wei,
				rates?.ETH,
			)

			let score = 0

			// Calculating score based on distinct months
			score += calculateDistinctMonthsScore(row.distinct_months)

			// Calculating score based on transaction count
			score += calculateTransactionsCountScore(row.total_transactions)

			// Calculating score based on transaction volume
			score += calculateVolumeScore(totalVolumeUsd)

			// Calculating score based on bridge transaction volume
			score += calculateBridgeVolumeScore(totalBridgeVolumeUsd)

			const level = Math.ceil(score / 3)

			return {
				score,
				level,
			}
		}),
	getAddressTransactionOverTime: internalProcedure
		.input(z.string().refine(isAddress, { message: 'Invalid address' }))
		.query(async ({ input }) => {
			const address = input.toLowerCase()
			const sql = `
    SELECT
    (SELECT MIN(timestamp) FROM transactions WHERE from_address = '${address}') AS initial_timestamp,
    (SELECT COUNT(DISTINCT DATE_TRUNC('MONTH', TO_TIMESTAMP(timestamp))) FROM transactions WHERE from_address = '${address}') AS distinct_months;
    `

			const res = (await prisma.$queryRawUnsafe(sql)) as any[]

			if (res.length === 0) {
				return {
					initialTimestamp: null,
					distinctMonths: null,
				}
			}

			return {
				initialTimestamp: res[0].initial_timestamp,
				distinctMonths: res[0].distinct_months,
			}
		}),
	getAddressTransactionStatistic: internalProcedure
		.input(z.string().refine(isAddress, { message: 'Invalid address' }))
		.query(async ({ input }) => {
			const address = input.toLowerCase()
			const sql = `
        SELECT
        COUNT(*) AS total_transactions,
        COALESCE(SUM(value), 0) AS total_volume_wei
        FROM
        (
        SELECT id, value
        FROM transactions
        WHERE from_address = '${address}' OR to_address = '${address}'
        ) AS all_transactions;
        `
			const res = (await prisma.$queryRawUnsafe(sql)) as any[]
			if (res.length === 0) {
				return {
					totalTransactions: null,
					totalVolumeWei: null,
					totalVolumeUsd: null,
				}
			}

			// fetch price from coninbase, we can cache this if needed
			const rates = await getExchangeRates()

			return {
				totalTransactions: res[0].total_transactions,
				totalVolumeWei: res[0].total_volume_wei,
				totalVolumeUsd: convertWeiToUsd(res[0].total_volume_wei, rates?.ETH),
			}
		}),
	getAddressBridgeStatistic: internalProcedure
		.input(z.string().refine(isAddress, { message: 'Invalid address' }))
		.query(async ({ input }) => {
			const address = input.toLowerCase() as Hex
			const addrTopic = address ? pad(address) : undefined
			const isScroll =
				CHAIN_TYPE === EnumChainType.SCROLL ||
				CHAIN_TYPE === EnumChainType.SCROLL_SEPOLIA
			const isZkSync =
				CHAIN_TYPE === EnumChainType.ZKSYNC ||
				CHAIN_TYPE === EnumChainType.ZKSYNC_TESTNET ||
				CHAIN_TYPE === EnumChainType.ZKSYNC_SEPOLIA

			const take = 10000 // define take number as you need

			let logs: any[], sql: string
			if (isScroll || isZkSync) {
				if (isScroll) {
					sql = `
                SELECT transaction_logs.*, blocks.timestamp
                FROM transaction_logs
                INNER JOIN blocks ON transaction_logs.block_number = blocks.number
                WHERE transaction_logs.address IN ('${ScrollL2ETHGatewayProxy.toLowerCase()}', '${ScrollL2ERC20GatewayProxy.toLowerCase()}', '${ScrollL2WETHGatewayProxy.toLowerCase()}')
                AND transaction_logs.topic1 IN ('${ScrollL2FinalizeDepositETHTopic}', '${ScrollL2WithdrawETHTopic}', '${ScrollL2FinalizeDepositERC20Topic}', '${ScrollL2WithdrawERC20Topic}')
                AND (transaction_logs.topic2 = '${addrTopic}' OR transaction_logs.topic3 = '${addrTopic}' OR transaction_logs.topic4 = '${addrTopic}')
                LIMIT ${take}
                `
				} else {
					// zkSync
					sql = `
                SELECT transaction_logs.*, blocks.timestamp
                FROM transaction_logs
                INNER JOIN blocks ON transaction_logs.block_number = blocks.number
                WHERE transaction_logs.address IN ('${ZkSyncL2ETHGatewayProxy.toLowerCase()}', '${ZkSyncL2ERC20BridgeProxy.toLowerCase()}')
                AND transaction_logs.topic1 IN ('${ZkSyncL2ETHMintTopic}', '${ZkSyncL2ETHWithdrawalTopic}', '${ZkSyncL2ERC20FinalizeDepositTopic}', '${ZkSyncL2ERC20WithdrawalInitiatedTopic}')
                AND (transaction_logs.topic2 = '${addrTopic}' OR transaction_logs.topic3 = '${addrTopic}')
                LIMIT ${take}
                `
				}

				logs = (await prisma.$queryRawUnsafe(sql)) as any[]
				const wrappedLogs = isScroll
					? await wrapAddressOnLogsForScroll(logs)
					: await wrapAddressOnLogsForZkSync(logs)

				const totalTransactions = wrappedLogs.length
				const totalVolumeWei = wrappedLogs.reduce(
					(prev, cur) => prev + BigInt(cur.amount || '0'),
					BigInt(0),
				)
				const rates = await getExchangeRates()

				return {
					totalTransactions,
					totalVolumeWei: totalVolumeWei.toString(),
					totalVolumeUsd: convertWeiToUsd(totalVolumeWei, rates.ETH),
				}
			} else {
				const bridgeContract = CHAIN_MAP[CHAIN_TYPE].bridgeContract
					?.map((contract) => `'${contract.toLowerCase()}'`)
					?.join(',')

				sql = `
            SELECT
            COUNT(*) AS total_transactions,
            COALESCE(SUM(value), 0) AS total_volume_wei
            FROM
            (
            SELECT id, value
            FROM transactions
            WHERE (from_address IN (${bridgeContract}) OR to_address IN (${bridgeContract}))
            AND (from_address = '${address}' OR to_address = '${address}')
            ) AS all_transactions;
            `

				const res = (await prisma.$queryRawUnsafe(sql)) as any[]

				if (res.length === 0) {
					return {
						totalTransactions: null,
						totalVolumeWei: null,
						totalVolumeUsd: null,
					}
				}

				const rates = await getExchangeRates()

				return {
					totalTransactions: res[0].total_transactions,
					totalVolumeWei: res[0].total_volume_wei,
					totalVolumeUsd: convertWeiToUsd(res[0].total_volume_wei, rates.ETH),
				}
			}
		}),

	getAddressDailyTxVolume: internalProcedure
		.input(z.string().refine(isAddress, { message: 'Invalid address' }))
		.query(async ({ input }) => {
			const address = input.toLowerCase()
			const sql = `
            SELECT
            DATE_TRUNC('day', TO_TIMESTAMP(timestamp)) AS date,
            COALESCE(SUM(value), 0) AS total_volume_wei
            FROM transactions
            WHERE (from_address = '${address}' OR to_address = '${address}')
            GROUP BY date
            ORDER BY date DESC;
        `
			const res = (await prisma.$queryRawUnsafe(sql)) as any[]
			if (res.length === 0) {
				return null
			}
			// fetch price from coninbase, we can cache this if needed
			const rates = await getExchangeRates()

			const dailyVolume = res.map((item) => {
				return {
					date: item.date,
					totalVolumeWei: item.total_volume_wei,
					totalVolumeUsd: convertWeiToUsd(item.total_volume_wei, rates.ETH),
				}
			})

			return dailyVolume
		}),
	getAddressStatisticChartData: internalProcedure
		.input(
			z.object({
				address: z.string().refine(isAddress, { message: 'Invalid address' }),
				timeRange: z.enum(['7d', '30d', 'all']).default('all').optional(),
				type: z.enum(['tx', 'bridge']),
			}),
		)
		.query(async ({ input }) => {
			try {
				const rates = await getExchangeRates()

				const address = input.address.toLowerCase() as Hex
				const { type, timeRange } = input
				const addrTopic = address ? pad(address) : undefined
				const isScroll =
					CHAIN_TYPE === EnumChainType.SCROLL ||
					CHAIN_TYPE === EnumChainType.SCROLL_SEPOLIA
				const isZkSync =
					CHAIN_TYPE === EnumChainType.ZKSYNC ||
					CHAIN_TYPE === EnumChainType.ZKSYNC_TESTNET ||
					CHAIN_TYPE === EnumChainType.ZKSYNC_SEPOLIA
				const take = 10000 // define take number as you need

				let dateFilter = ''
				if (timeRange === '7d')
					dateFilter = `AND blocks.timestamp >= EXTRACT(EPOCH FROM (NOW() - interval '7 day'))`
				if (timeRange === '30d')
					dateFilter = `AND blocks.timestamp >= EXTRACT(EPOCH FROM (NOW() - interval '30 day'))`

				if (type === 'bridge' && (isScroll || isZkSync)) {
					let sql: string
					if (isScroll) {
						sql = `
            SELECT transaction_logs.*, blocks.timestamp
            FROM transaction_logs
            INNER JOIN blocks ON transaction_logs.block_number = blocks.number
            WHERE transaction_logs.address IN ('${ScrollL2ETHGatewayProxy.toLowerCase()}', '${ScrollL2ERC20GatewayProxy.toLowerCase()}', '${ScrollL2WETHGatewayProxy.toLowerCase()}')
            AND transaction_logs.topic1 IN ('${ScrollL2FinalizeDepositETHTopic}', '${ScrollL2WithdrawETHTopic}', '${ScrollL2FinalizeDepositERC20Topic}', '${ScrollL2WithdrawERC20Topic}')
            AND (transaction_logs.topic2 = '${addrTopic}' OR transaction_logs.topic3 = '${addrTopic}' OR transaction_logs.topic4 = '${addrTopic}')
            ${dateFilter}
            LIMIT ${take}
            `
					} else {
						//zkSync
						sql = `
            SELECT transaction_logs.*, blocks.timestamp
            FROM transaction_logs
            INNER JOIN blocks ON transaction_logs.block_number = blocks.number
            WHERE transaction_logs.address IN ('${ZkSyncL2ETHGatewayProxy.toLowerCase()}', '${ZkSyncL2ERC20BridgeProxy.toLowerCase()}')
            AND transaction_logs.topic1 IN ('${ZkSyncL2ETHMintTopic}', '${ZkSyncL2ETHWithdrawalTopic}', '${ZkSyncL2ERC20FinalizeDepositTopic}', '${ZkSyncL2ERC20WithdrawalInitiatedTopic}')
            AND (transaction_logs.topic2 = '${addrTopic}' OR transaction_logs.topic3 = '${addrTopic}')
            ${dateFilter}
            LIMIT ${take}
            `
					}

					const logs = (await prisma.$queryRawUnsafe(sql)) as any[]
					const wrappedLogs = isScroll
						? await wrapAddressOnLogsForScroll(logs)
						: ((await wrapAddressOnLogsForZkSync(logs)) as any)

					let dailyVolume: any = {}

					// Map through each log to calculate the total volume
					for (const log of wrappedLogs) {
						const date = new Date(Number(log?.timestamp) * 1000)
							.toISOString()
							.split('T')[0]

						if (!dailyVolume[date]) {
							dailyVolume[date] = {
								totalTransactions: 0,
								totalVolumeToken: BigInt(0), // Change from Wei to token-specific unit
							}
						}

						dailyVolume[date].totalTransactions += 1
						dailyVolume[date].totalVolumeToken += BigInt(log.amount) // store in Wei (smallest possible unit)
					}

					// Convert token-specific amounts to USD for each day
					dailyVolume = Object.keys(dailyVolume)
						.map((date) => {
							const totalTransactions = dailyVolume[date].totalTransactions
							const totalVolumeTokenWei = dailyVolume[date].totalVolumeToken

							// assuming each log belongs to the same token, we can use the token's symbol from the last log
							const lastLog = wrappedLogs[wrappedLogs.length - 1]
							const tokenSpecificRate =
								rates[lastLog.token_symbol.toUpperCase()] // fetch token-specific rate using upper-cased symbol

							// Convert to base token unit (equivalent to Ether for ETH) using token_decimals
							const totalVolumeTokenBase =
								Number(BigInt(totalVolumeTokenWei)) /
								Math.pow(10, lastLog.token_decimals)

							// Convert to USD using tokenSpecificRate
							const totalVolumeUsd = convertTokenToUsd(
								totalVolumeTokenBase,
								tokenSpecificRate,
							)
							const dateString = new Date(date).toISOString()

							return {
								date: dateString,
								totalTransactions: totalTransactions,
								totalVolumeTokenWei: totalVolumeTokenWei.toString(),
								totalVolumeUsd: totalVolumeUsd,
							}
						})
						.sort(
							(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
						)

					return dailyVolume
				} else {
					const bridgeContract = CHAIN_MAP[CHAIN_TYPE].bridgeContract
						?.map((contract) => `'${contract.toLowerCase()}'`)
						?.join(',')

					let dateFilter = ''
					if (timeRange === '7d')
						dateFilter = `AND timestamp >= EXTRACT(EPOCH FROM (NOW() - interval '7 day'))`
					if (timeRange === '30d')
						dateFilter = `AND timestamp >= EXTRACT(EPOCH FROM (NOW() - interval '30 day'))`

					const sql = `
              SELECT
                COUNT(*) AS total_transactions,
                COALESCE(SUM(value), 0) AS total_volume_wei,
                DATE_TRUNC('day', TO_TIMESTAMP(timestamp)) AS date
              FROM transactions
              WHERE (from_address = '${address}' OR to_address = '${address}')
              ${
								type === 'bridge'
									? `AND (from_address IN (${bridgeContract}) OR to_address IN (${bridgeContract}))`
									: ''
							}
              ${dateFilter}
              GROUP BY date
              ORDER BY date DESC;
            `

					const res = (await prisma.$queryRawUnsafe(sql)) as any[]

					// Fetch price from coinbase, we can cache this if needed
					const rates = await getExchangeRates()

					const dailyVolume = res.map((item) => {
						return {
							date: item.date,
							totalTransactions: item.total_transactions,
							totalVolumeWei: item.total_volume_wei,
							totalVolumeUsd: convertWeiToUsd(item.total_volume_wei, rates.ETH),
						}
					})

					return dailyVolume
				}
			} catch (e) {
				console.log('getAddressStatisticChartData error', e)
				throw e
			}
		}),
})
