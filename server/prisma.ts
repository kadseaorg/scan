import {
	Prisma,
	PrismaClient,
	transaction_logs,
	transactions,
} from '@/lib/generated/prisma/main'
import { Hex, decodeAbiParameters, slice } from 'viem'

import {
	ScrollL2ETHEventDataABIParameters,
	ScrollL2FinalizeDepositERC20Topic,
	ScrollL2WithdrawERC20Topic,
	ZkSyncL2BridgeETHTransferTopic,
	ZkSyncL2ETHEventDataABIParameters,
} from '@/constants/bridge'
import { Lang } from '@/server/verify'
import { CallTrace } from '@/types'
import { ContractStats, DappStats } from '@/types/dapp'
import { VerifyJobType } from '@/worker'

import { ScrollL2ERC20BridgeEventDataABIParameters } from './../constants/bridge'
import { IsZkSync } from '@/constants'

declare global {
	var prisma:
		| PrismaClient<
				Prisma.PrismaClientOptions,
				'query' | 'info' | 'warn' | 'error'
		  >
		| undefined
}

const prisma =
	global.prisma ||
	new PrismaClient({
		log: [
			{
				emit: 'event',
				level: 'query',
			},
			{
				emit: 'stdout',
				level: 'error',
			},
			{
				emit: 'stdout',
				level: 'info',
			},
			{
				emit: 'stdout',
				level: 'warn',
			},
		],
	})

if (process.env.NODE_ENV === 'development') global.prisma = prisma

export default prisma

// prisma.$on('query', e => {
//   const color = e.duration > 5000 ? '\x1b[31m%s\x1b[0m' : '%s'
//   console.log(color, 'Query: ' + e.query)
//   console.log(color, 'Params: ' + e.params)
//   console.log(color, 'Duration: ' + e.duration + 'ms')
// })

export const getBlockHeight = async (): Promise<number> => {
	const height = await prisma.blocks.aggregate({
		_max: {
			number: true,
		},
	})

	return Number(height._max.number)
}

export const getEstimatedTransactionCount = async (): Promise<number> => {
	const res = (await prisma.$queryRaw`
    SELECT reltuples::bigint AS estimate
    FROM pg_class
    WHERE relname = 'transactions';
  `) as { estimate: string }[]

	return Number(res[0].estimate) < 0 ? 0 : Number(res[0].estimate)
}

export const getEstimatedInternalTransactionCount =
	async (): Promise<number> => {
		const res = (await prisma.$queryRaw`
    SELECT reltuples::bigint AS estimate
    FROM pg_class
    WHERE relname = 'internal_transactions';
  `) as { estimate: string }[]
		return Number(res[0].estimate) < 0 ? 0 : Number(res[0].estimate)
	}

export const insertVerifyStatus = async (
	uid: string,
	status: number,
	contractAddress: string,
): Promise<void> => {
	await prisma.contract_verify_job.create({
		data: {
			uid,
			contract_address: contractAddress.toLowerCase(),
			status,
		},
	})
}

export const updateVerifyStatus = async (
	uid: string,
	status: number,
	failedReason = '',
): Promise<void> => {
	await prisma.contract_verify_job.update({
		where: {
			uid,
		},
		data: {
			status,
			failed_reason: failedReason,
		},
	})
}

export const updateContract = async (
	verifyType: VerifyJobType,
	lang: Lang,
	address: string,
	source: any,
	input: string,
): Promise<any> => {
	if (verifyType === VerifyJobType.VerifyStandardJson) {
		return await updateContractByStandardJson(lang, address, source, input)
	}
	if (verifyType === VerifyJobType.VerifyMultiPart) {
		return await updateContractByMultiPart(lang, address, source)
	}

	return null
}

export const updateContractByStandardJson = async (
	lang: Lang,
	address: string,
	source: any,
	input: string,
): Promise<any> => {
	let optimizationEnabled = false
	let optimizationRuns = 0
	if (lang === Lang.Solidity) {
		const compilerSettings = JSON.parse(source.compilerSettings)
		optimizationEnabled = compilerSettings.optimizer.enabled
		optimizationRuns = compilerSettings.optimizer.runs
	}

	return await prisma.contracts.update({
		where: {
			address: address.toLowerCase(),
		},
		data: {
			is_verified: true,
			name: source.contractName,
			abi: source.abi,
			sourcecode: input,
			compiler_version: source.compilerVersion,
			// license: 'No license (None)',
			optimization: optimizationEnabled,
			optimization_runs: optimizationRuns,
			evm_version: 'default(compiler defaults)',
		},
	})
}

export const updateContractByMultiPart = async (
	lang: Lang,
	address: string,
	source: any,
): Promise<any> => {
	let optimizationEnabled = false
	let optimizationRuns = 0
	if (lang === Lang.Solidity) {
		const compilerSettings = JSON.parse(source.compilerSettings)
		optimizationEnabled = compilerSettings.optimizer.enabled
		optimizationRuns = compilerSettings.optimizer.runs
	}
	const input = JSON.stringify({
		language: lang.charAt(0).toUpperCase() + lang.slice(1),
		sources: Object.keys(source.sourceFiles).reduce(
			(obj: Record<string, any>, fileName: string) => {
				obj[fileName] = {
					content: source.sourceFiles[fileName],
				}
				return obj
			},
			{},
		),
		settings: source.compilerSettings,
	})

	return await prisma.contracts.update({
		where: {
			address: address.toLowerCase(),
		},
		data: {
			is_verified: true,
			name: source.contractName,
			abi: source.abi,
			sourcecode: input,
			compiler_version: source.compilerVersion,
			// license: 'No license (None)',
			optimization: optimizationEnabled,
			optimization_runs: optimizationRuns,
			evm_version: 'default(compiler defaults)',
		},
	})
}

export const getByteCode = async (contractAddress: string): Promise<string> => {
	const code = await prisma.contracts.findFirst({
		where: {
			address: contractAddress.toLowerCase(),
		},
		select: {
			creation_bytecode: true,
		},
	})

	return code?.creation_bytecode ?? ''
}

async function wrapMethodNamesOnHash<T extends { method_name?: string }>(
	hashExtractor: (item: T) => string,
	source: T[],
): Promise<T[]> {
	const sighashs = source
		.map(hashExtractor)
		.filter((value, index, self) => self.indexOf(value) === index)

	const sigs = await prisma.signatures.findMany({
		where: {
			hash: {
				in: sighashs,
			},
		},
	})

	return source.map((item) => {
		const hash = hashExtractor(item)
		const sig = sigs.find((sig) => sig.hash === hash)
		if (sig) {
			item.method_name = sig.name.split('(')[0]
		} else {
			item.method_name = hash ?? '-'
		}
		return item
	})
}

export const wrapAddressOnLogsForScroll = async (
	logs: transaction_logs[],
): Promise<transaction_logs[]> => {
	const ethTokenInfo = {
		address: '0x0000000000000000000000000000000000000000',
		symbol: 'ETH',
		decimals: 18,
	} // default info for ETH
	const tokenAddressesToQuery = [
		...new Set(
			logs
				.filter((log) => log.topic3)
				.map((log) => slice(log.topic3 as Hex, 12)),
		),
	] // convert it into a formatted address

	const dbTokenInfos = await prisma.tokens.findMany({
		where: {
			address: {
				in: tokenAddressesToQuery,
			},
		},
	})

	const tokenInfoDictionary = Object.fromEntries(
		dbTokenInfos.map((tokenInfo) => [tokenInfo.address, tokenInfo]),
	)

	const updatedLogs = logs.map((log) => {
		const isERC20BridgeEvent =
			log.topic1 === ScrollL2FinalizeDepositERC20Topic ||
			log.topic1 === ScrollL2WithdrawERC20Topic
		const tokenAddress = slice(log.topic3 as Hex, 12)

		const tokenInfo = isERC20BridgeEvent
			? tokenInfoDictionary[tokenAddress]
			: ethTokenInfo // choose tokenInfo based on event type

		const params = isERC20BridgeEvent
			? ScrollL2ERC20BridgeEventDataABIParameters
			: ScrollL2ETHEventDataABIParameters
		const values = decodeAbiParameters(params, log.data as Hex)
		const mappedParams = Object.fromEntries(
			params.map((p, i) => [p.name, values[i]]),
		)

		return {
			...log,
			...mappedParams,
			token_address: tokenInfo?.address,
			token_symbol: tokenInfo?.symbol,
			token_decimals: tokenInfo?.decimals,
		}
	})

	return updatedLogs
}

export const wrapAddressOnLogsForZkSync = async (
	logs: transaction_logs[],
): Promise<transaction_logs[]> => {
	const ethTokenInfo = {
		address: '0x000000000000000000000000000000000000800A',
		symbol: 'ETH',
		decimals: 18,
	} // default info for ETH
	const addressesToQuery = [
		...new Set(
			logs
				.filter((log) => log.topic4) // get logs where topic4 is not null
				.map((log) => slice(log.topic4 as Hex, 12)),
		),
	] // convert it into formatted address

	const dbTokenInfos = await prisma.tokens.findMany({
		where: {
			address: {
				in: addressesToQuery,
			},
		},
	})

	const tokenInfoDictionary = Object.fromEntries(
		dbTokenInfos.map((tokenInfo) => [tokenInfo.address, tokenInfo]),
	)

	const updatedLogs = logs.map((log) => {
		const address = slice(log.topic2 as Hex, 12)
		const tokenAddress = log.topic4 ? slice(log.topic4 as Hex, 12) : null
		const tokenInfo = tokenAddress
			? tokenInfoDictionary[tokenAddress]
			: ethTokenInfo
		const values = decodeAbiParameters(
			ZkSyncL2ETHEventDataABIParameters,
			log.data as Hex,
		)
		const amount = values[0]
		return {
			...log,
			address,
			amount,
			token_address: tokenInfo?.address,
			token_symbol: tokenInfo?.symbol,
			token_decimals: tokenInfo?.decimals,
		}
	})

	// Initialize an empty object to store the groups
	const groupedLogs: any = {}

	updatedLogs.forEach((log) => {
		if (!groupedLogs[log.transaction_hash]) {
			groupedLogs[log.transaction_hash] = [] // Initialize if not already initialized
		}
		groupedLogs[log.transaction_hash].push(log)
	})

	const sortedAndFilteredLogs = Object.values(groupedLogs).map((group: any) => {
		// Sort each group and return the log with the smallest log_index
		// return group.sort((a: any, b: any) => a.log_index - b.log_index)[0]
		const sorted = group.sort((a: any, b: any) => a.log_index - b.log_index)
		const item =
			sorted.length > 2
				? sorted.find(
						(log: any) => log.topic1 !== ZkSyncL2BridgeETHTransferTopic,
				  )
				: sorted[0]
		return item ?? sorted[0]
	})

	return sortedAndFilteredLogs
}

type wrapTransaction = transactions & { method_name: string }
export const wrapMethodNames = (
	txs: wrapTransaction[],
): Promise<wrapTransaction[]> =>
	wrapMethodNamesOnHash(
		(tx) => tx.input?.slice(0, 10) || tx.method_id || '',
		txs,
	)

type wrapTransactionLogs = transaction_logs & { method_name: string }
export const wrapMethodNamesLogs = (
	logs: wrapTransactionLogs[],
): Promise<wrapTransactionLogs[]> =>
	wrapMethodNamesOnHash((log) => log.topic1?.slice(0, 10) ?? '', logs)

export const wrapCallTracesMethodName = async (
	callTraces: CallTrace,
): Promise<CallTrace> => {
	// Extract all 4-byte input hashes from all call traces (including nested calls)
	const inputHashes: string[] = []

	const extractInputHashes = (callTrace: CallTrace) => {
		const input = callTrace.input
		if (input && input.length >= 10) {
			const inputHash = input.slice(0, 10)
			inputHashes.push(inputHash)
		}
		if (callTrace.calls) {
			callTrace.calls.forEach(extractInputHashes)
		}
	}

	extractInputHashes(callTraces)

	// Query signatures from the database for all input hashes
	const signatures = await prisma.signatures.findMany({
		where: {
			hash: {
				in: inputHashes,
			},
		},
	})

	// Create a map of input hashes to signature names
	const signatureMap = new Map<string, string>()
	signatures.forEach((signature) => {
		signatureMap.set(signature.hash, signature.name.split('(')[0])
	})

	// Update method names for all call traces
	const updateMethodNames = (callTrace: CallTrace) => {
		const input = callTrace.input
		if (input && input.length >= 10) {
			const inputHash = input.slice(0, 10)
			const methodName = signatureMap.get(inputHash) ?? '-'
			callTrace.method = methodName
		}
		if (callTrace.calls) {
			callTrace.calls = callTrace.calls.map(updateMethodNames) as CallTrace[]
		}
		return callTrace
	}

	return updateMethodNames(callTraces)
}

export const getSignatureData = async (
	hash: string,
): Promise<{ id: number; hash: string; name: string }> => {
	const data = (await prisma.$queryRaw`
          SELECT *
          FROM signatures
          WHERE hash = ${hash.trim().toLowerCase()}
          LIMIT 1
          `) as { id: number; hash: string; name: string }[]

	return data?.[0]
}

export const getContractAddress = async (hash: string): Promise<string> => {
	const data = (await prisma.$queryRaw`
          SELECT address
          FROM contracts
          WHERE creation_bytecode = ${hash.trim().toLowerCase()}
          LIMIT 1
          `) as { address: string }[]

	return data?.[0]?.address
}

// getDappUAWStats returns the daily unique active addresses stats for a dapp
export const getDappUAWStats = async (dappId: number): Promise<DappStats> => {
	const defaultStats = {
		count: 0,
		prev_day_count: 0,
		growth_percentage: 0,
		total_count: 0,
	}
	if (!dappId) {
		return defaultStats
	}
	const data = !IsZkSync
		? ((await prisma.$queryRaw`
    SELECT * FROM (
        SELECT
            count,
            date,
            LAG(count, 1, 0) OVER (ORDER BY date ASC) AS prev_day_count,
            CASE
              WHEN LAG(count, 1, 0) OVER (ORDER BY date ASC) = 0 THEN 100.0
              ELSE ROUND(((count::decimal - LAG(count, 1, 0) OVER (ORDER BY date ASC)::decimal) / LAG(count, 1, 0) OVER (ORDER BY date ASC)::decimal) * 100.0, 2)::numeric
            END AS growth_percentage
            -- SUM(count) OVER () AS total_count
        FROM
            mv_dapp_daily_unique_active_addresses
        WHERE
            dapp_id = ${dappId}
        ORDER BY date ASC
    ) sub
    WHERE date = CURRENT_DATE - INTERVAL '1 day'
    LIMIT 1;
  `) as DappStats[])
		: []

	const totalData = !IsZkSync
		? ((await prisma.$queryRaw`
    SELECT SUM(count) AS total_count
    FROM mv_dapp_daily_unique_active_addresses
    WHERE dapp_id = ${dappId}
  `) as any[])
		: []

	const mergeData = {
		...data[0],
		total_count:
			totalData.length > 0 && totalData[0]?.total_count
				? totalData[0].total_count
				: 0,
	}

	return mergeData
}

export const getContractTxnStats = async (
	contractAddress: string,
): Promise<ContractStats> => {
	const defaultStats = {
		count: 0,
		prev_day_count: 0,
		growth_percentage: 0,
		total_count: 0,
	}
	if (!contractAddress) {
		return defaultStats
	}
	const data = (await prisma.$queryRaw`
    SELECT * FROM (
        SELECT
            count,
            date,
            LAG(count, 1, 0) OVER (ORDER BY date ASC) AS prev_day_count,
            CASE
                WHEN LAG(count, 1, 0) OVER (ORDER BY date ASC) = 0 THEN 100.0
                ELSE ROUND(((count::decimal - LAG(count, 1, 0) OVER (ORDER BY date ASC)::decimal) / LAG(count, 1, 0) OVER (ORDER BY date ASC)::decimal) * 100.0, 2)::numeric
            END AS growth_percentage,
            SUM(count) OVER() AS total_count
        FROM
            mv_daily_contract_transactions
        WHERE
            contract_address = ${contractAddress.toLowerCase()}
        ORDER BY date ASC
    ) sub
    WHERE date = CURRENT_DATE - INTERVAL '1 day'
    LIMIT 1;
  `) as ContractStats[]
	return data.length > 0 ? data[0] : defaultStats
}

export const getDappTxnStats = async (dappId: number): Promise<DappStats> => {
	const defaultStats = {
		count: 0,
		prev_day_count: 0,
		growth_percentage: 0,
		total_count: 0,
	}
	if (!dappId) {
		return defaultStats
	}
	const data = (await prisma.$queryRaw`
    SELECT * FROM (
        SELECT
            count,
            date,
            LAG(count, 1, 0) OVER (ORDER BY date ASC) AS prev_day_count,
            CASE
                WHEN LAG(count, 1, 0) OVER (ORDER BY date ASC) = 0 THEN 100.0
                ELSE ROUND(((count::decimal - LAG(count, 1, 0) OVER (ORDER BY date ASC)::decimal) / LAG(count, 1, 0) OVER (ORDER BY date ASC)::decimal) * 100.0, 2)::numeric
            END AS growth_percentage
            -- SUM(count) OVER() AS total_count
        FROM
            mv_dapp_daily_transactions
        WHERE
            dapp_id = ${dappId}
        ORDER BY date ASC
    ) sub
    WHERE date = CURRENT_DATE - INTERVAL '1 day'
    LIMIT 1;
  `) as DappStats[]
	// select total count
	const totalData = (await prisma.$queryRaw`
    SELECT SUM(count) AS total_count
    FROM mv_dapp_daily_transactions
    WHERE dapp_id = ${dappId}
  `) as any[]

	const mergeData = {
		...data[0],
		total_count:
			totalData.length > 0 && totalData[0]?.total_count
				? totalData[0].total_count
				: 0,
	}

	return mergeData
}
