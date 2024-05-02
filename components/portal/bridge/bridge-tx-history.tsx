import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import Countdown from 'react-countdown'

import dayjs from 'dayjs'
import { ethers } from 'ethers'
import { uniqBy } from 'lodash-es'
import { CheckCircle2, Info, Loader2, XCircle } from 'lucide-react'
import Image from 'next/image'
import { useInterval } from 'usehooks-ts'
import { useSwitchNetwork } from 'wagmi'

import L1ScrollMessenger from '@/abis/scroll-bridge/L1ScrollMessenger.json'
import SimpleTooltip from '@/components/common/simple-tooltip'
import NoDataSvg from '@/components/common/svg-icon/no-data'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { IsScroll, IsZkSync } from '@/constants'
import { getBlockNumbers } from '@/hooks/portal/bridge/scroll/use-block-numbers'
import useLastFinalizedBatchIndex from '@/hooks/portal/bridge/scroll/use-last-finalized-batch-index'
import { useScrollProviderAndSigners } from '@/hooks/portal/bridge/scroll/use-scroll-ethers'
import useScrollTxHistory from '@/hooks/portal/bridge/scroll/use-scroll-tx-history'
import useTxStore from '@/hooks/portal/bridge/scroll/use-tx-store'
import { useBridgeExplorerUrl } from '@/hooks/portal/bridge/use-bridge'
import useZksyncTxHistory, {
	ZksyncTxHistoryStatusType,
	ZksyncTxHistoryType,
} from '@/hooks/portal/bridge/zksync/use-zksync-tx-history'
import useZksyncWithdrawFinalize from '@/hooks/portal/bridge/zksync/use-zksync-withdraw-finalize'
import usePortalContext from '@/hooks/portal/use-portal-context'
import { t } from '@/server/trpc'
import { usePortalStore } from '@/stores/portal'
import {
	TxHistoryTabType,
	useBridgeConfigStore,
} from '@/stores/portal/bridge/config'
import { useBridgeNetworkStore } from '@/stores/portal/bridge/network'
import {
	Transaction,
	TxPosition,
	isValidOffsetTime,
} from '@/stores/portal/bridge/tx'
import {
	useZksyncNewTxStore,
	useZksyncWithdrawClaimTxStore,
} from '@/stores/portal/bridge/zksync/tx'
import {
	getImgSrc,
	getThemeImgSrc,
	shortAddress,
	transDisplayNum,
} from '@/utils'

export const enum ClaimStatus {
	// Batch not finalized
	NOT_READY = 1,
	CLAIMABLE = 2,
	CLAIMING = 3,
	CLAIMED = 4,
	FAILED = 5,
}

export enum TX_STATUS {
	success = 'Success',
	pending = 'Pending',
	failed = 'Failed',
	canceled = 'Canceled',
	empty = 'N/A',
}

const Emptylist: React.FC = () => (
	<div className="flex flex-col justify-center items-center my-auto h-72">
		<NoDataSvg {...(IsScroll ? {} : { strokeColor: '#007AF5' })} />
	</div>
)

const ScrollFailedBtn: React.FC<{ content?: ReactNode }> = ({ content }) => (
	<SimpleTooltip content={content}>
		<div>
			<Button variant="destructive" size="sm" disabled>
				Failed
				<XCircle className="ml-1 h-3 w-3" />
			</Button>
		</div>
	</SimpleTooltip>
)

const ScrollAssumedStatusBtn: React.FC<{ onClick: () => void }> = ({
	onClick,
}) => (
	<SimpleTooltip content="Click to view the details of the failed transaction.">
		<div>
			<Button
				className="bg-destructive/70"
				variant="destructive"
				size="sm"
				onClick={onClick}
			>
				Failed
				<XCircle className="ml-1 h-3 w-3" />
			</Button>
		</div>
	</SimpleTooltip>
)

const ScrollWaitingClaimBtn: React.FC = () => (
	<SimpleTooltip
		content={
			<>
				<p>
					Scroll provers are still finalizing your transaction, this can take up
					to 4 hours.
				</p>
				<p>{`Once done, you'll be able to claim it here for use on the target
            network.`}</p>
			</>
		}
	>
		<div>
			<Button size="sm" disabled>
				Claim
				<Info className="ml-1 h-3 w-3" />
			</Button>
		</div>
	</SimpleTooltip>
)

const ScrollClaimButton: React.FC<{
	tx: any
	lastFinalizedBatchIndex: number
}> = ({ tx, lastFinalizedBatchIndex }) => {
	const { switchNetwork } = useSwitchNetwork()
	const { currentChainId, walletAddress } = usePortalContext()
	const { l1Network } = useBridgeNetworkStore()
	const scrollProviderAndSigners = useScrollProviderAndSigners()
	const {
		estimatedTimeMap,
		updateTransaction,
		addEstimatedTimeMap,
		updateOrderedTxs,
		removeFrontTransactions,
	} = useTxStore()

	const [loading, setLoading] = useState(false)

	const l2TxStatus = useMemo(() => {
		const { assumedStatus, toBlockNumber, claimInfo } = tx

		if (assumedStatus) return ClaimStatus.FAILED

		if (toBlockNumber) return ClaimStatus.CLAIMED

		// The estimated claim time will not exceed 5 minutes.
		if (
			(estimatedTimeMap as any)[`claim_${tx.hash}`] + 1000 * 60 * 5 >
			Date.now()
		)
			return ClaimStatus.CLAIMING

		if (
			+claimInfo?.batch_index &&
			claimInfo?.batch_index <= lastFinalizedBatchIndex
		)
			return ClaimStatus.CLAIMABLE

		return ClaimStatus.NOT_READY
	}, [tx, estimatedTimeMap, lastFinalizedBatchIndex])

	const markTransactionAbnormal = useCallback(
		(tx: Transaction, assumedStatus: string) => {
			removeFrontTransactions(tx.hash)
			updateTransaction(tx.hash, { assumedStatus })
		},
		[removeFrontTransactions, updateTransaction],
	)

	const isCorrectClaimNetwork = useMemo(
		() => l1Network?.id === currentChainId,
		[currentChainId, l1Network?.id],
	)

	const handleClaim = useCallback(async () => {
		if (!!switchNetwork && !isCorrectClaimNetwork) {
			switchNetwork?.(l1Network?.id)
			return
		}

		if (!walletAddress || !l1Network) return

		const signer = scrollProviderAndSigners?.[l1Network?.id].signer
		const contracts = scrollProviderAndSigners?.[l1Network?.id].contracts
		if (!contracts) return

		const contract = new ethers.Contract(
			contracts.L1_SCROLL_MESSENGER,
			L1ScrollMessenger,
			scrollProviderAndSigners?.[l1Network?.id].signer,
		)
		const { from, to, value, nonce, message, proof, batch_index } = tx.claimInfo
		try {
			setLoading(true)
			addEstimatedTimeMap(`claim_${tx.hash}`, Date.now())
			const result = await contract.relayMessageWithProof(
				from,
				to,
				value,
				nonce,
				message,
				{
					batchIndex: batch_index,
					merkleProof: proof,
				},
			)
			result
				.wait()
				.then((receipt: any) => {
					if (receipt?.status === 1) {
						const blockNumbers = getBlockNumbers()
						const estimatedOffsetTime =
							(receipt.blockNumber - blockNumbers[0]) * 12 * 1000
						if (isValidOffsetTime(estimatedOffsetTime)) {
							addEstimatedTimeMap(
								`to_${receipt.blockHash}`,
								Date.now() + estimatedOffsetTime,
							)
							addEstimatedTimeMap(
								`claim_${tx.hash}`,
								Date.now() + estimatedOffsetTime,
							)
						} else {
							addEstimatedTimeMap(`to_${receipt.blockHash}`, 0)
							addEstimatedTimeMap(`claim_${tx.hash}`, 0)
						}
					} else {
						//Something failed in the EVM
						updateOrderedTxs(walletAddress, tx.hash, TxPosition.Abnormal)
						//EIP - 658
						markTransactionAbnormal(tx, TX_STATUS.failed)
						addEstimatedTimeMap(`claim_${tx.hash}`, 0)

						throw new Error(
							'due to any operation that can cause the transaction or top-level call to revert',
						)
					}
				})
				.catch((error: any) => {
					// TRANSACTION_REPLACED or TIMEOUT
					if (error?.code === 'TRANSACTION_REPLACED') {
						if (error.cancelled) {
							markTransactionAbnormal(tx, TX_STATUS.canceled)
							updateOrderedTxs(walletAddress, tx.hash, TxPosition.Abnormal)
							throw new Error('transaction was cancelled')
						} else {
							const blockNumbers = getBlockNumbers()
							const { blockNumber } = error.receipt
							const estimatedOffsetTime =
								(blockNumber - blockNumbers[0]) * 12 * 1000
							if (isValidOffsetTime(estimatedOffsetTime)) {
								addEstimatedTimeMap(
									`from_${tx.hash}`,
									Date.now() + estimatedOffsetTime,
								)
							} else {
								addEstimatedTimeMap(`claim_${tx.hash}`, 0)
							}
						}
					} else {
						// setSendError(error)
						// when the transaction execution failed (status is 0)
						updateOrderedTxs(walletAddress, tx.hash, TxPosition.Abnormal)
						markTransactionAbnormal(tx, TX_STATUS.failed)
						addEstimatedTimeMap(`claim_${tx.hash}`, 0)
						throw new Error(error.message)
					}
				})
				.finally(() => {
					setLoading(false)
				})
		} catch (error: any) {
			if (error?.code === 'ACTION_REJECTED') {
				addEstimatedTimeMap(`claim_${tx.hash}`, 0)
			}

			setLoading(false)
		}
	}, [
		addEstimatedTimeMap,
		isCorrectClaimNetwork,
		l1Network,
		markTransactionAbnormal,
		scrollProviderAndSigners,
		switchNetwork,
		tx,
		updateOrderedTxs,
		walletAddress,
	])

	if (l2TxStatus === ClaimStatus.FAILED)
		return <ScrollFailedBtn content={tx?.errMsg || tx?.assumedStatus} />

	if (l2TxStatus === ClaimStatus.CLAIMED)
		return <Button size="sm">Claimed</Button>

	if (l2TxStatus === ClaimStatus.CLAIMING || loading)
		return (
			<div>
				<Button size="sm" disabled>
					Claiming
					<Loader2 className="ml-2 h-4 w-4 animate-spin" />
				</Button>
			</div>
		)

	if (l2TxStatus === ClaimStatus.CLAIMABLE)
		return (
			<Button size="sm" onClick={handleClaim}>
				{isCorrectClaimNetwork ? 'Claim' : 'Switch'}
			</Button>
		)

	// ClaimStatus.NOT_READY
	return <ScrollWaitingClaimBtn />
}

const ScrollTxStatusBtn: React.FC<{
	toStatus: string
	tx: any
	fromStatus: string
	lastFinalizedBatchIndex: number
}> = ({ toStatus, tx, fromStatus, lastFinalizedBatchIndex }) => {
	const { getExplorerUrl } = useBridgeExplorerUrl()

	if (toStatus === TX_STATUS.success) {
		return null
	}

	if (tx.assumedStatus) {
		return (
			<ScrollAssumedStatusBtn
				onClick={() => window.open(getExplorerUrl(tx.isL1, tx?.hash), '_blank')}
			/>
		)
	}

	//withdraw step2
	if (!tx.isL1 && fromStatus === TX_STATUS.success) {
		// withdraw claimable
		if (
			+tx?.claimInfo?.batch_index &&
			tx?.claimInfo?.batch_index <= lastFinalizedBatchIndex
		)
			return (
				<ScrollClaimButton
					tx={tx}
					lastFinalizedBatchIndex={lastFinalizedBatchIndex}
				/>
			)

		// withdraw not claimable
		return <ScrollWaitingClaimBtn />
	}

	return null
	// return <Button size="sm">Pending</Button>
}

const ScrollTxHistory: React.FC = () => {
	useScrollTxHistory()
	const { getExplorerUrl } = useBridgeExplorerUrl()
	const { pageTransactions, estimatedTimeMap } = useTxStore()
	const { lastFinalizedBatchIndex } = useLastFinalizedBatchIndex()

	const txStatus = useCallback(
		({
			blockNumber,
			assumedStatus,
			isL1,
			to,
		}: {
			blockNumber?: number
			assumedStatus?: string
			isL1: boolean
			to: boolean
		}) => {
			if (assumedStatus && !to) return assumedStatus

			if (assumedStatus && to) return TX_STATUS.empty

			const blockNumbers = getBlockNumbers()

			if (blockNumber && blockNumbers) {
				if (isL1) {
					if (
						(!to && blockNumbers?.[0] >= blockNumber) ||
						(to && blockNumbers?.[1] >= blockNumber)
					)
						return TX_STATUS.success
				} else {
					if ((!to && blockNumbers[1] >= blockNumber) || to)
						return TX_STATUS.success
				}
			}

			return TX_STATUS.pending
		},
		[],
	)

	const fromStatus = useCallback(
		(tx: Transaction) =>
			txStatus({
				blockNumber: tx?.fromBlockNumber,
				assumedStatus: tx?.assumedStatus,
				isL1: tx.isL1,
				to: false,
			}),
		[txStatus],
	)

	const toStatus = useCallback(
		(tx: Transaction) =>
			txStatus({
				blockNumber: tx?.toBlockNumber,
				assumedStatus: tx?.assumedStatus,
				isL1: tx.isL1,
				to: true,
			}),
		[txStatus],
	)

	const clamingTransactions = useMemo(
		() =>
			pageTransactions?.filter(
				(tx: any) =>
					!tx.isL1 &&
					fromStatus(tx) === TX_STATUS.success &&
					TX_STATUS.pending === toStatus(tx),
			),
		[fromStatus, pageTransactions, toStatus],
	)

	const { txHistoryTabType, setTxHistoryTabType, tokensMap } =
		useBridgeConfigStore()

	const tableTransactions = useMemo(() => {
		const txs =
			TxHistoryTabType.RECENT === txHistoryTabType
				? pageTransactions
				: clamingTransactions
		if (tokensMap && Object.values(tokensMap).length > 0) {
			txs.forEach((tx) => {
				const token = Object.values(tokensMap)?.filter(
					({ l1Address, l2Address }) =>
						!!tx.l1Token &&
						!!tx.l2Token &&
						[l1Address, l2Address].includes(tx.isL1 ? tx.l1Token : tx.l2Token),
				)?.[0]
				if (token) {
					tx.tokenSymbol = token?.symbol
					tx.tokenDecimals = token?.decimals
				}
			})
		}
		return txs
	}, [clamingTransactions, pageTransactions, txHistoryTabType, tokensMap])

	const renderEstimatedWaitingTime = useCallback(
		(tx: Transaction, timestamp: number) => {
			if (fromStatus(tx) === TX_STATUS.success) return null

			if (timestamp === 0) return <span>Estimating...</span>

			if (timestamp)
				return (
					<Countdown
						date={timestamp}
						renderer={({ minutes, seconds, completed }) =>
							completed ? null : (
								<span>
									Ready in {minutes}m {seconds}s (estimate)
								</span>
							)
						}
					></Countdown>
				)

			return null
		},
		[fromStatus],
	)

	const renderToHashAddressDisplay = useCallback(
		(tx: Transaction) => {
			if (
				fromStatus(tx) === TX_STATUS.failed ||
				toStatus(tx) === TX_STATUS.failed
			)
				return null

			return tx.isL1 ||
				(!tx.isL1 &&
					(fromStatus(tx) !== TX_STATUS.success ||
						toStatus(tx) === TX_STATUS.success)) ? (
				<>
					<div className="h-8 flex-center">
						{!!tx?.toHash ? (
							<a
								href={getExplorerUrl(!tx.isL1, tx.toHash)}
								target="_blank"
								rel="noreferrer"
							>
								<Button className="text-base h-8 sm:text-sm" variant="link">
									{shortAddress(tx?.toHash) || '-'}
								</Button>
							</a>
						) : (
							<Loader2 className="ml-1 h-3 w-3 animate-spin" />
						)}
					</div>
					<div className="h-4 flex-center text-xs text-center dark:text-white/30 text-[#666]">
						{/* {tx.finalisedAt ? dayjs(tx.finalisedAt).format('MMM D YYYY, HH:mm') : '-'} */}
						{toStatus(tx) === TX_STATUS.success ? (
							<CheckCircle2 className="ml-1 h-3 w-3 stroke-green-600" />
						) : (
							renderEstimatedWaitingTime(
								tx,
								(estimatedTimeMap as any)[`from_${tx.hash}`],
							)
						)}
					</div>
				</>
			) : null
		},
		[
			estimatedTimeMap,
			fromStatus,
			getExplorerUrl,
			renderEstimatedWaitingTime,
			toStatus,
		],
	)

	return (
		<>
			<Tabs
				className="px-6"
				value={txHistoryTabType}
				onValueChange={(value) => {
					setTxHistoryTabType(value as TxHistoryTabType)
				}}
			>
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger className="sm:text-xs" value="recent">
						Recent Transaction
					</TabsTrigger>
					<TabsTrigger className="sm:text-xs" value="claim">
						Transaction Claiming
					</TabsTrigger>
				</TabsList>
			</Tabs>
			{!!tableTransactions?.length ? (
				<ScrollArea className="w-full h-[600px] px-6">
					{tableTransactions?.map((tx) => (
						<div
							key={tx.hash}
							className="w-full flex justify-between bg-white/70 dark:bg-[#2F2A2C] p-6 rounded-md my-6 relative space-x-2 sm:px-0"
						>
							<div className="absolute left-0 right-0 mx-auto top-[20px] w-fit flex-center flex-col">
								<SimpleTooltip
									content={transDisplayNum({
										num: tx.amount,
										decimals: tx?.tokenDecimals,
										suffix: tx?.tokenSymbol || undefined,
									})}
								>
									<div className="text-sm text-center max-w-[140px] ellipsis sm:text-xs">
										{transDisplayNum({
											num: tx.amount,
											decimals: tx?.tokenDecimals,
											suffix: tx?.tokenSymbol || undefined,
										})}
									</div>
								</SimpleTooltip>
								<Image
									width={80}
									height={11}
									src={getImgSrc('arrow')}
									alt="arrow"
								/>
							</div>

							<div className="w-1/2 flex items-center flex-col">
								<Image
									className="rounded-full mb-4"
									width={40}
									height={40}
									src={getImgSrc(tx.isL1 ? 'eth' : 'scroll')}
									alt="logo"
								/>
								<div className="h-8 flex-center">
									{!!tx?.hash ? (
										<a
											href={getExplorerUrl(tx.isL1, tx.hash)}
											target="_blank"
											rel="noreferrer"
										>
											<Button
												className="text-base h-8 sm:text-sm"
												variant="link"
											>
												{shortAddress(tx?.hash)}
											</Button>
										</a>
									) : (
										'-'
									)}
								</div>
								<div className="h-4 flex-center text-xs dark:text-white/30 text-[#666]">
									{tx.initiatedAt
										? dayjs(tx.initiatedAt).format('MMM D YYYY, HH:mm')
										: ''}
									{!!tx.initiatedAt && TX_STATUS.success === fromStatus(tx) ? (
										<CheckCircle2 className="ml-1 h-3 w-3 stroke-green-600" />
									) : TX_STATUS.failed === fromStatus(tx) ? (
										<XCircle className="ml-1 h-3 w-3 stroke-red-600" />
									) : (
										<Loader2 className="ml-1 h-3 w-3 animate-spin" />
									)}
								</div>
							</div>

							<div className="w-1/2 flex items-center flex-col">
								<Image
									className="rounded-full mb-4"
									width={40}
									height={40}
									src={getImgSrc(tx.isL1 ? 'scroll' : 'eth')}
									alt="scroll_logo"
								/>
								{renderToHashAddressDisplay(tx)}

								<div className="mt-2">
									<ScrollTxStatusBtn
										toStatus={toStatus(tx)}
										tx={tx}
										fromStatus={fromStatus(tx)}
										lastFinalizedBatchIndex={lastFinalizedBatchIndex}
									/>
								</div>
							</div>
						</div>
					))}
				</ScrollArea>
			) : (
				<Emptylist />
			)}
		</>
	)
}

const ZksyncWaitingClaimBtn: React.FC = () => (
	<SimpleTooltip
		content={
			<>
				<p>
					After a 24-hour delay, your funds will be available on Ethereum. You
					will need to claim your withdrawal by paying the Ethereum network fee.
				</p>
			</>
		}
	>
		<div>
			<Button size="sm" disabled>
				Claim
				<Info className="ml-1 h-3 w-3" />
			</Button>
		</div>
	</SimpleTooltip>
)

const ZksyncWithdrawClaimedBtn: React.FC = () => (
	<SimpleTooltip
		content={
			<>
				<p>
					Your claim transaction has been submitted. Your funds will be
					available on Ethereum after the transaction is confirmed.
				</p>
			</>
		}
	>
		<div>
			<Button size="sm" disabled>
				Claimed
				<Info className="ml-1 h-3 w-3" />
			</Button>
		</div>
	</SimpleTooltip>
)

const ZksyncTxStatusBtn: React.FC<{ tx: ZksyncTxHistoryType }> = ({ tx }) => {
	const { getExplorerUrl } = useBridgeExplorerUrl()
	const { switchNetwork } = useSwitchNetwork()
	const { currentChainId, walletAddress } = usePortalContext()
	const { l1Network } = useBridgeNetworkStore()
	const { txLoading, sendFinalzeTx } = useZksyncWithdrawFinalize()

	const isCorrectClaimNetwork = useMemo(
		() => l1Network?.id === currentChainId,
		[currentChainId, l1Network?.id],
	)

	const handleClaim = useCallback(async () => {
		if (!!switchNetwork && !isCorrectClaimNetwork) {
			switchNetwork?.(l1Network?.id)
			return
		}

		if (!walletAddress || !l1Network) return
		if (!tx.l2 || tx.isDeposit) return
		try {
			await sendFinalzeTx(tx.l2!.txHash!)
		} catch (e) {
			console.log(e)
		}
	}, [
		isCorrectClaimNetwork,
		l1Network,
		sendFinalzeTx,
		switchNetwork,
		tx.isDeposit,
		tx.l2,
		walletAddress,
	])

	if (!tx.isDeposit && tx.status === ZksyncTxHistoryStatusType.success) {
		return null
	}
	if (!tx.isDeposit && tx.status === ZksyncTxHistoryStatusType.pending) {
		return <ZksyncWaitingClaimBtn />
	}
	if (!tx.isDeposit && tx.status === ZksyncTxHistoryStatusType.claimed) {
		return <ZksyncWithdrawClaimedBtn />
	}
	if (
		!tx.isDeposit &&
		tx.status === ZksyncTxHistoryStatusType.claimable &&
		!txLoading
	) {
		return (
			<Button size="sm" onClick={handleClaim}>
				{isCorrectClaimNetwork ? 'Claim' : 'Switch'}
			</Button>
		)
	}
	if (txLoading)
		return (
			<div>
				<Button size="sm" disabled>
					Claiming
					<Loader2 className="ml-2 h-4 w-4 animate-spin" />
				</Button>
			</div>
		)
}

const ZksyncTxHistory: React.FC = () => {
	const { isMainnet, portalNetwork } = usePortalStore()
	const { walletAddress } = usePortalContext()
	const { getExplorerUrl } = useBridgeExplorerUrl()
	const {
		loading,
		txList,
		setTxList,
		fetchZksyncTxHistory,
		refreshZksyncTxHistory,
	} = useZksyncTxHistory()
	const { txHistoryTabType, setTxHistoryTabType } = useBridgeConfigStore()
	const { eraProvider, isWithdrawalManualFinalizationRequired } =
		useZksyncWithdrawFinalize()
	const { accountTxs } = useZksyncNewTxStore()
	const { accountTxs: accountClaimedTxs } = useZksyncWithdrawClaimTxStore()

	useEffect(() => {
		setTxList([])
		fetchZksyncTxHistory(walletAddress)
	}, [walletAddress, isMainnet, fetchZksyncTxHistory, setTxList])

	const clamingTransactions = useMemo(() => {
		return txList.filter(
			(tx: any) =>
				!tx.isDeposit &&
				!tx.l1?.txHash &&
				isWithdrawalManualFinalizationRequired(tx.tokenSymbol, tx.amount),
		)
	}, [txList, isWithdrawalManualFinalizationRequired])

	const transactions = useMemo(() => {
		return TxHistoryTabType.RECENT === txHistoryTabType
			? txList
			: clamingTransactions
	}, [txList, txHistoryTabType, clamingTransactions])

	useEffect(() => {
		if (walletAddress && accountClaimedTxs[walletAddress]?.length > 0) {
			refreshZksyncTxHistory(walletAddress)
		}
	}, [accountClaimedTxs, walletAddress])

	useInterval(() => refreshZksyncTxHistory(walletAddress), 5000)

	const renderItem = useCallback(
		({
			isL1,
			txHash,
			time,
			tx,
		}: {
			isL1: boolean
			txHash?: string
			time?: string
			tx: ZksyncTxHistoryType
		}) => (
			<div className="w-1/2 flex items-center flex-col">
				<Image
					className="rounded-full mb-4"
					width={40}
					height={40}
					src={isL1 ? getImgSrc('eth') : getThemeImgSrc('logo')}
					alt="logo"
				/>

				<div className="h-8 flex-center">
					{!!txHash ? (
						<a
							href={getExplorerUrl(isL1, txHash)}
							target="_blank"
							rel="noreferrer"
						>
							<Button className="text-base h-8 sm:text-sm" variant="link">
								{shortAddress(txHash)}
							</Button>
						</a>
					) : tx.status ? (
						<ZksyncTxStatusBtn tx={tx} />
					) : (
						<Loader2 className="ml-1 h-3 w-3 animate-spin" />
					)}
				</div>

				<div className="h-4 flex-center text-xs dark:text-white/30 text-[#666]">
					{time || '-'}
					{!!time && <CheckCircle2 className="ml-1 h-3 w-3 stroke-green-600" />}
				</div>
			</div>
		),
		[getExplorerUrl],
	)

	return (
		<>
			<Tabs
				className="px-6"
				value={txHistoryTabType}
				onValueChange={(value) => {
					setTxHistoryTabType(value as TxHistoryTabType)
				}}
			>
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger className="sm:text-xs" value="recent">
						Recent Transaction
					</TabsTrigger>
					<TabsTrigger className="sm:text-xs" value="claim">
						Transaction Claiming
					</TabsTrigger>
				</TabsList>
			</Tabs>
			<ScrollArea className="w-full flex flex-col gap-2 h-[600px] px-6">
				{!loading && !!transactions?.length ? (
					transactions.map((tx) => {
						const { isDeposit, amount, tokenSymbol, tokenDecimals, l1, l2 } = tx
						const l1Item = renderItem({
							isL1: true,
							txHash: l1?.txHash,
							time: l1?.time,
							tx,
						})
						const l2Item = renderItem({
							isL1: false,
							txHash: l2?.txHash,
							time: l2?.time,
							tx,
						})

						return (
							<div
								key={l2?.txHash || l1?.txHash}
								className="w-full flex justify-between bg-white/70 dark:bg-black/40 p-6 rounded-md my-6 relative space-x-2 sm:px-0"
							>
								<div className="absolute left-0 right-0 mx-auto top-[20px] w-fit flex-center flex-col">
									<SimpleTooltip
										content={transDisplayNum({
											num: amount,
											suffix: tokenSymbol,
										})}
									>
										<div className="text-sm text-center max-w-[140px] ellipsis">
											{transDisplayNum({
												num: amount,
												decimals: tokenDecimals,
												suffix: tokenSymbol,
											})}
										</div>
									</SimpleTooltip>
									<Image
										width={80}
										height={11}
										src={getImgSrc('arrow')}
										alt="arrow"
									/>
								</div>
								{isDeposit ? l1Item : l2Item}
								{isDeposit ? l2Item : l1Item}
							</div>
						)
					})
				) : loading ? (
					<div className="w-full flex-center h-[500px]">
						<Loader2 className="h-8 w-8 animate-spin" />
					</div>
				) : (
					<Emptylist />
				)}
			</ScrollArea>
		</>
	)
}

const BridgeTxHistory = () => {
	const { walletAddress } = usePortalContext()

	return (
		<Card className="overflow-hidden flex flex-col h-[650px] sm:items-center w-full max-w-[550px]">
			<CardHeader>
				<CardTitle>Recent Transactions</CardTitle>
			</CardHeader>
			{!!!walletAddress ? (
				<Emptylist />
			) : (
				<>
					{IsScroll && <ScrollTxHistory />}
					{IsZkSync && <ZksyncTxHistory />}
				</>
			)}
		</Card>
	)
}

export default BridgeTxHistory
