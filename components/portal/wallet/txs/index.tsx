import { useEffect, useMemo } from 'react'

import BigNumber from 'bignumber.js'
import dayjs from 'dayjs'
import {
	ArrowDownToLine,
	Loader2,
	Minus,
	Plus,
	SendHorizontal,
	View,
} from 'lucide-react'
import { formatUnits } from 'viem'

import NoDataSvg from '@/components/common/svg-icon/no-data'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ETH_SYMBOL } from '@/constants'
import useUsdExchangeRates from '@/hooks/common/use-usd-exchange-rates'
import usePortalContext from '@/hooks/portal/use-portal-context'
import { useWalletSendNetwork } from '@/hooks/portal/wallet/use-wallet-send'
import { cn } from '@/lib/utils'
import { EPortalNetwork, usePortalStore } from '@/stores/portal'
import { trpc } from '@/utils/trpc'
import { themeColor } from '@/theme/colors'
import { useRouter } from 'next/router'

export enum WalletTxType {
	SEND = 'Send',
	RECEIVE = 'Receive',
	DEPOSIT = 'Deposit',
	WITHDRAW = 'Withdraw',
}

type WalletTransaction = {
	type: WalletTxType
	hash: string
	from_address: string
	to_address: string
	value: string
	timestamp: number
	name?: string
	symbol?: string
	decimals?: number
}

const WalletTxnsTab: React.FC = () => {
	const { walletAddress } = usePortalContext()
	const { portalNetwork } = usePortalStore()
	const { convertToUsdPrice } = useUsdExchangeRates()
	const { correctNetwork } = useWalletSendNetwork()
	const router = useRouter()
	const queryParam = useMemo(
		() => ({
			network: portalNetwork as EPortalNetwork,
			address: walletAddress || '',
			take: 50,
		}),
		[portalNetwork, walletAddress],
	)
	const { data: sendTxList, isLoading, refetch: refetchSendTxList } =
		trpc.transaction.getAccountWalletTransactions.useQuery(queryParam, {
			enabled: !!walletAddress && undefined !== portalNetwork,
			getNextPageParam: (lastPage) => lastPage.nextCursor,
			refetchOnWindowFocus: true,
		})
	useEffect(() => {
		if(router.query?.tab === 'txns' && refetchSendTxList) {
			refetchSendTxList()
		}
	}, [refetchSendTxList, router.query?.tab])
	

	const bridgeQueryParam = useMemo(
		() => ({
			...queryParam,
			cursor: sendTxList?.list?.[sendTxList?.list?.length - 1]?.timestamp,
		}),
		[queryParam, sendTxList],
	)

	const { data: bridgeList } = trpc.bridge.getBridgeLogs.useQuery(queryParam, {
		getNextPageParam: (lastPage) => lastPage.nextCursor,
		refetchOnWindowFocus: false,
		enabled: !!walletAddress && undefined !== portalNetwork,
	})

	const transactionList: WalletTransaction[] = useMemo(() => {
		const _bridgeList: WalletTransaction[] = []
		bridgeList?.list?.forEach(
			({
				transaction_hash,
				from,
				to,
				amount,
				timestamp,
				method_name,
				token_symbol,
				token_decimals,
			}: any) => {
				const item: any = {
					hash: transaction_hash,
					from_address: from,
					to_address: to,
					value: amount,
					timestamp,
					symbol: token_symbol,
					decimals: token_decimals,
				}

				if (
					method_name?.toLowerCase()?.includes('deposit') ||
					['Mint', '0xd0e30db0', '0xcfe7af7c', '0x8ef1332e'].includes(
						method_name,
					)
				) {
					item.type = WalletTxType.DEPOSIT
				}

				if (
					method_name?.toLowerCase()?.includes('withdraw') ||
					[
						'0x6c07ea43',
						'0xc7cdea37',
						'0x2fc38488',
						'0xd8d3a3f4',
						'0xd9caed12',
						'0x51cff8d9',
					].includes(method_name)
				) {
					item.type = WalletTxType.WITHDRAW
				}

				if (!!item.type) {
					_bridgeList.push(item)
				}
			},
		)

		return [..._bridgeList, ...(sendTxList?.list || [])].sort((a, b) =>
			Number(BigInt(b.timestamp) - BigInt(a.timestamp)),
		)
	}, [bridgeList, sendTxList])

	return (
		<Card className="w-full max-w-[600px] mx-auto pt-4 pb-6 px-5 sm:p-3">
			<div className="text-2xl font-bold mb-4">Transactions List</div>

			{!!!walletAddress || isLoading || !!!transactionList?.length ? (
				<div className="flex justify-center items-center h-[300px]">
					{!!!walletAddress ? (
						'Please connect your wallet first.'
					) : isLoading ? (
						<Loader2 className="w-8 h-8 animate-spin" />
					) : (
						<NoDataSvg width="70px" height="140px" strokeColor={themeColor.dark.primary.main} />
					)}
				</div>
			) : (
				<ScrollArea
					className={cn(
						'w-full px-5 sm:px-3',
						(transactionList?.length ?? 0) > 7 && 'h-[580px]',
					)}
				>
					<div className="w-full space-y-4">
						{transactionList?.map(
							({ hash, type, symbol, value, timestamp, decimals }, index) => (
								<div
									key={index}
									className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-secondary cursor-pointer transition-all duration-300 gap-4 hover:opacity-80 sm:flex-col sm:justify-start"
									onClick={() => {
										!!hash &&
											window.open(
												`${correctNetwork?.blockExplorers.default.url}/tx/${hash}`,
												'_blank',
											)
									}}
								>
									<div className="flex items-center gap-4 shrink-0 sm:w-full sm:gap-2">
										<div className="w-[40px] h-[40px] rounded-full flex justify-center items-center bg-primary/60 text-white/50 sm:w-[16px] sm:h-[16px]">
											{type === WalletTxType.SEND && (
												<SendHorizontal className="w-[14px] h-[14px] sm:w-[8px] sm:h-[8px]" />
											)}
											{type === WalletTxType.RECEIVE && (
												<ArrowDownToLine className="w-[14px] h-[14px] sm:w-[8px] sm:h-[8px]" />
											)}
											{type === WalletTxType.DEPOSIT && (
												<Plus className="w-[14px] h-[14px] sm:w-[8px] sm:h-[8px]" />
											)}
											{type === WalletTxType.WITHDRAW && (
												<Minus className="w-[14px] h-[14px] sm:w-[8px] sm:h-[8px]" />
											)}
										</div>

										<div className="sm:flex sm:items-center sm:gap-2">
											<div className="capitalize">{type}</div>
											<div className="text-sm">
												{!!timestamp
													? dayjs(timestamp * 1000).format('MMM D YYYY, HH:mm')
													: '-'}
											</div>
										</div>
									</div>

									<div className="flex items-center gap-4 sm:justify-between sm:mt-2 sm:w-full">
										<div className="sm:flex-col sm:items-center sm:gap-2 sm:w-[calc(100%-20px)]">
											<div className="text-right sm:text-left sm:text-sm break-all">
												{formatUnits(
													BigInt(BigNumber(value ?? 0).toFixed(0)),
													Number(decimals ?? 18),
												)}{' '}
												{symbol || ETH_SYMBOL}
											</div>
											<div className="text-sm text-right sm:text-left break-all">
												{convertToUsdPrice(
													formatUnits(
														BigInt(BigNumber(value ?? 0).toFixed(0)),
														Number(decimals ?? 18),
													),
													{ symbol: symbol || ETH_SYMBOL },
												) || '-'}
											</div>
										</div>

										<View className="text-primary w-[22px] h-[22px] sm:w-[14px] sm:h-[14px] sm:shrink-0" />
									</div>
								</div>
							),
						)}
					</div>
				</ScrollArea>
			)}
		</Card>
	)
}

export default WalletTxnsTab
