import { useCallback, useEffect, useState } from 'react'

import dayjs from 'dayjs'
import { produce } from 'immer'
import { sortBy, uniq, uniqBy } from 'lodash-es'

import { IsZkSync } from '@/constants'
import {
	getPortalBridgeContract,
	getZksyncBridgeContract,
} from '@/constants/bridge'
import { useEraProvider } from '@/hooks/portal/bridge/zksync/use-zksync-ethers'
import usePortalContext from '@/hooks/portal/use-portal-context'
import { usePortalStore } from '@/stores/portal'
import { useBridgeNetworkStore } from '@/stores/portal/bridge/network'
import {
	useZksyncNewTxStore,
	useZksyncTxStore,
	useZksyncWithdrawClaimTxStore,
} from '@/stores/portal/bridge/zksync/tx'
import { trpc } from '@/utils/trpc'

import useZksyncWithdrawFinalize from './use-zksync-withdraw-finalize'

type l2ZksyncTxHistoryType = {
	from: string
	to: string
	blockNumber: number
	transactionHash: string
	timestamp: string
	amount: string
	tokenAddress: string
	type: string
	tokenType: string
	fields: string
	isInternal: boolean
	token: {
		l2Address: string
		l1Address: string
		symbol: string
		name: string
		decimals: number
	}
}
export enum ZksyncTxHistoryStatusType {
	success = 'Success',
	pending = 'Pending',
	failed = 'Failed',
	claimable = 'Claimable',
	claimed = 'Claimed',
}
export type ZksyncTxHistoryType = {
	isDeposit: boolean
	amount: string
	tokenSymbol: string
	tokenDecimals: number
	l1?: {
		txHash?: string
		time?: string
	}
	l2?: {
		txHash?: string
		time?: string
	}
	portalNetwork?: string
	status?: ZksyncTxHistoryStatusType
}

export function formatZksyncHistoryTxTimestamp(timestamp?: number | string) {
	return !!timestamp ? dayjs(timestamp).format('MMM D YYYY, HH:mm') : '-'
}

let fetchZksyncTxHistoryLoading = false
export default function useZksyncTxHistory() {
	const { isMainnet, portalNetwork } = usePortalStore()
	const { txList, setTxList } = useZksyncTxStore()
	const { accountTxs, removeTx } = useZksyncNewTxStore()
	const { accountTxs: accountClaimedTxs, removeClaimedTx } =
		useZksyncWithdrawClaimTxStore()
	const { mutateAsync: fetchL1DepositTxHashes } =
		trpc.bridge.getZksyncL1TxHashesByL2TxHashes.useMutation()
	const { mutateAsync: fetchL1WithdrawTxHashes } =
		trpc.bridge.getZksyncL1TxHashesByL2TxHashes.useMutation()
	const { mutateAsync: fetchL2DepositTxHashes } =
		trpc.bridge.getZksyncDepositL2TxHashesByL1TxHashes.useMutation()
	const { getWithdrawalStatus, isWithdrawalManualFinalizationRequired } =
		useZksyncWithdrawFinalize()
	const [loading, setLoading] = useState(false)

	const updateZksyncTxWithdralStatus = useCallback(
		async (txList: ZksyncTxHistoryType[], walletAddress?: string) => {
			const withdrawFinalizeStatus = await Promise.all(
				txList
					.filter((item) => !item.isDeposit)
					.map((tx) => getWithdrawalStatus(tx.l2!.txHash!)),
			)
			console.log('withdrawFinalizeStatus: ', withdrawFinalizeStatus)
			const claimedTxs = walletAddress
				? (accountClaimedTxs[walletAddress] || []).filter(
						(item) => item.portalNetwork === portalNetwork,
				  )
				: []

			withdrawFinalizeStatus.forEach((item) => {
				const tx = txList.find((tx) => tx.l2?.txHash === item[0])
				const claimedTx = claimedTxs.find((tx) => tx.l2_tx_hash === item[0])
				if (tx) {
					if (tx.l1?.txHash) {
						tx.status = ZksyncTxHistoryStatusType.success
						if (walletAddress && claimedTx) {
							removeClaimedTx(claimedTx, walletAddress)
						}
					} else if (
						item[1] &&
						isWithdrawalManualFinalizationRequired(tx.tokenSymbol, tx.amount)
					) {
						// true means claimable
						tx.status = claimedTx
							? ZksyncTxHistoryStatusType.claimed
							: ZksyncTxHistoryStatusType.claimable
					} else if (
						isWithdrawalManualFinalizationRequired(tx.tokenSymbol, tx.amount)
					) {
						tx.status = ZksyncTxHistoryStatusType.pending
					}
				}
			})
			const _txList = txList.sort(
				(a, b) =>
					dayjs(b.isDeposit ? b.l1?.time : b.l2?.time).unix() -
					dayjs(a.isDeposit ? a.l1?.time : a.l2?.time).unix(),
			)
			return _txList
		},
		[
			accountClaimedTxs,
			getWithdrawalStatus,
			isWithdrawalManualFinalizationRequired,
			portalNetwork,
			removeClaimedTx,
		],
	)

	const fetchZksyncTxHistory = useCallback(
		async (walletAddress?: string) => {
			if (undefined === isMainnet || !IsZkSync || !!!walletAddress) return
			try {
				setLoading(true)
				fetchZksyncTxHistoryLoading = true

				let _txlist: ZksyncTxHistoryType[] = []
				// L2
				const l2TxHistoryRes = await fetch(
					`${
						getZksyncBridgeContract(isMainnet).ZKSYNC_API.l2ExplorerApi
					}/address/${walletAddress}/transfers?limit=100`,
				)
				const { items: l2HistoryData }: { items: l2ZksyncTxHistoryType[] } =
					await l2TxHistoryRes.json()
				const bridgeTxFromL2 = l2HistoryData
					.filter(
						(item) => item.type === 'deposit' || item.type === 'withdrawal',
					)
					.map((item) => ({
						isDeposit: item.type === 'deposit',
						amount: item.amount,
						tokenSymbol: item.token.symbol,
						tokenDecimals: item.token.decimals,
						l2: {
							txHash: item.transactionHash,
							time: formatZksyncHistoryTxTimestamp(item.timestamp),
						},
					}))
				if (!!l2HistoryData?.length) {
					const l2TxHashes = uniq(
						l2HistoryData.map((item) => item.transactionHash),
					)

					// L1
					const [l1DepositHistory, l1WithdrawHistory] = await Promise.all([
						!!l2TxHashes?.length
							? fetchL1DepositTxHashes({
									network: isMainnet ? 'mainnet' : 'testnet',
									type: 'deposit',
									l2Hashs: l2TxHashes,
							  })
							: Promise.resolve([]),
						!!l2TxHashes?.length
							? fetchL1WithdrawTxHashes({
									network: isMainnet ? 'mainnet' : 'testnet',
									type: 'withdraw',
									l2Hashs: l2TxHashes,
							  })
							: Promise.resolve([]),
					])

					for (const item of l1DepositHistory) {
						const l2HistoryItem = l2HistoryData.find(
							({ transactionHash }) => transactionHash === item.l2_tx_hash,
						)
						if (l2HistoryItem) {
							const decimals = l2HistoryItem?.token?.decimals ?? 18
							const data: ZksyncTxHistoryType = {
								isDeposit: true,
								amount:
									decimals > 9
										? String(Math.round(Number(l2HistoryItem.amount) / 10) * 10)
										: l2HistoryItem.amount, // for 99999999999999
								tokenSymbol: l2HistoryItem?.token?.symbol || 'ETH',
								tokenDecimals: decimals,
								l2: {
									txHash: l2HistoryItem.transactionHash,
									time: formatZksyncHistoryTxTimestamp(l2HistoryItem.timestamp),
								},
							}
							data.l1 = {
								txHash: item.l1_tx_hash,
								time: formatZksyncHistoryTxTimestamp(
									item.l1_tx_timestamp * 1000,
								),
							}
							_txlist.push(data)
						}
					}
					for (const item of l1WithdrawHistory) {
						const l2HistoryItem = l2HistoryData.find(
							({ transactionHash }) => transactionHash === item.l2_tx_hash,
						)
						if (l2HistoryItem) {
							const decimals = l2HistoryItem?.token?.decimals ?? 18
							const data: ZksyncTxHistoryType = {
								isDeposit: false,
								amount:
									decimals > 9
										? String(Math.round(Number(l2HistoryItem.amount) / 10) * 10)
										: l2HistoryItem.amount, // for 99999999999999
								tokenSymbol: l2HistoryItem?.token?.symbol || 'ETH',
								tokenDecimals: decimals,
								l2: {
									txHash: l2HistoryItem.transactionHash,
									time: formatZksyncHistoryTxTimestamp(l2HistoryItem.timestamp),
								},
							}
							data.l1 = {
								txHash: item.l1_tx_hash,
								time: formatZksyncHistoryTxTimestamp(
									item.l1_tx_timestamp * 1000,
								),
							}
							_txlist.push(data)
						}
					}
				}
				// add new tx that not synced,remove tx that synced
				const newSentTxs = (accountTxs[walletAddress] || []).filter(
					(item) => item.portalNetwork === portalNetwork,
				)
				const newUnsyncedTxs = []
				if (newSentTxs.length) {
					for (const tx of newSentTxs) {
						const index = _txlist.findIndex((item) =>
							item.isDeposit
								? item.l1?.txHash === tx.l1?.txHash
								: item.l2?.txHash === tx.l2?.txHash,
						)
						if (index > -1) {
							removeTx(tx, walletAddress)
						} else {
							newUnsyncedTxs.push(tx)
						}
					}
				}
				const filtered = uniqBy([...newUnsyncedTxs, ..._txlist], (item) =>
					item.isDeposit ? item.l1?.txHash : item.l2?.txHash,
				)
				for (const tx of bridgeTxFromL2) {
					const index = filtered.findIndex(
						(item) => item.l2?.txHash === tx.l2?.txHash,
					)
					if (index < 0) {
						filtered.unshift(tx)
					}
				}
				const _filtered = await updateZksyncTxWithdralStatus(
					filtered,
					walletAddress,
				)
				setTxList(_filtered)

				fetchZksyncTxHistoryLoading = false
				setLoading(false)
			} catch (error) {
				fetchZksyncTxHistoryLoading = false
				setLoading(false)
				console.error(error)
			}
		},
		[
			isMainnet,
			accountTxs,
			setTxList,
			fetchL1DepositTxHashes,
			fetchL1WithdrawTxHashes,
			portalNetwork,
			removeTx,
		],
	)

	const refreshZksyncTxHistory = useCallback(
		async (walletAddress?: string) => {
			if (undefined === isMainnet || !IsZkSync || fetchZksyncTxHistoryLoading)
				return

			try {
				// setLoading(true)
				fetchZksyncTxHistoryLoading = true

				const l1DepositTxHashes: string[] = []
				const l2WithdrawTxHashes: string[] = []
				txList.forEach((item) => {
					if (
						item.isDeposit &&
						!!item?.l1?.txHash &&
						(!!!item?.l2?.txHash || !!!item?.l2?.time || '-' === item?.l2?.time)
					) {
						l1DepositTxHashes.push(item.l1.txHash)
					}

					if (
						!item.isDeposit &&
						!!item?.l2?.txHash &&
						(!!!item?.l1?.txHash || !!!item?.l1?.time || '-' === item?.l1?.time)
					) {
						l2WithdrawTxHashes.push(item.l2.txHash)
					}
				})

				// L1
				const [l2DepositHistory, l1WithdrawHistory] = await Promise.all([
					!!l1DepositTxHashes?.length
						? fetchL2DepositTxHashes({
								network: isMainnet ? 'mainnet' : 'testnet',
								l1Hashs: l1DepositTxHashes,
						  })
						: Promise.resolve([]),
					!!l2WithdrawTxHashes?.length
						? fetchL1WithdrawTxHashes({
								network: isMainnet ? 'mainnet' : 'testnet',
								type: 'withdraw',
								l2Hashs: l2WithdrawTxHashes,
						  })
						: Promise.resolve([]),
				])

				const _txList = [...txList]
				l2DepositHistory.forEach(
					({ l2_tx_hash, l2_tx_timestamp, l1_tx_hash }) => {
						const index = _txList.findIndex(
							(item) => item?.l1?.txHash === l1_tx_hash,
						)
						if (-1 !== index)
							_txList[index].l2 = {
								txHash: l2_tx_hash,
								time: formatZksyncHistoryTxTimestamp(
									(l2_tx_timestamp ?? 0) * 1000,
								),
							}
					},
				)

				l1WithdrawHistory.forEach(
					({ l2_tx_hash, l1_tx_hash, l1_tx_timestamp }) => {
						const index = _txList.findIndex(
							(item) => item?.l2?.txHash === l2_tx_hash,
						)
						if (-1 !== index) {
							_txList[index].l1 = {
								txHash: l1_tx_hash,
								time: formatZksyncHistoryTxTimestamp(l1_tx_timestamp * 1000),
							}
						}
					},
				)

				await updateZksyncTxWithdralStatus(_txList, walletAddress)
				setTxList(_txList)

				fetchZksyncTxHistoryLoading = false
				// setLoading(false)
			} catch (error) {
				fetchZksyncTxHistoryLoading = false
				// setLoading(false)
				console.error(error)
			}
		},
		[
			fetchL1WithdrawTxHashes,
			fetchL2DepositTxHashes,
			isMainnet,
			setTxList,
			txList,
		],
	)

	return {
		loading,
		txList,
		setTxList,
		fetchZksyncTxHistory,
		refreshZksyncTxHistory,
	}
}
