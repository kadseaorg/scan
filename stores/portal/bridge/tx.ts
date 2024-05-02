import dayjs from 'dayjs'
import { produce } from 'immer'
import { isNumber } from 'lodash'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { STORAGE_KEY } from '@/constants'
import { getScrollBridgeTxHashes } from '@/constants/bridge'
import { getBlockNumbers } from '@/hooks/portal/bridge/scroll/use-block-numbers'
import { EPortalNetwork } from '@/stores/portal'
import { useBridgeConfigStore } from '@/stores/portal/bridge/config'

export enum TX_STATUS {
	success = 'Success',
	pending = 'Pending',
	failed = 'Failed',
	canceled = 'Canceled',
	empty = 'N/A',
}

export interface OrderedTxDB {
	[key: string]: TimestampTx[]
}

export interface TxStore {
	page: number
	total: number
	loading: boolean
	estimatedTimeMap: object
	frontTransactions: Transaction[]
	abnormalTransactions: Transaction[]
	pageTransactions: Transaction[]
	orderedTxDB: OrderedTxDB
	addTransaction: (tx: Transaction) => void
	updateTransaction: (hash: string, tx: { [k: string]: any }) => void
	removeFrontTransactions: (hash: string) => void
	addEstimatedTimeMap: (key: string, value: number) => void
	generateTransactions: (
		walletAddress: string,
		transactions: Transaction[],
	) => void
	combineClaimableTransactions: (
		walletAddress: string,
		transactions: ClaimTransaction[],
	) => void
	comboPageTransactions: (
		walletAddress: string,
		page: number,
		rowsPerPage: number,
	) => Promise<any>
	updateOrderedTxs: (
		walletAddress: string,
		hash: string,
		param: any,
		direction?: ITxDirection,
	) => void
	addAbnormalTransactions: (walletAddress: string, tx: Transaction) => void
	clearTransactions: () => void
}

export enum ITxPosition {
	// desc: have not yet been synchronized to the backend,
	// status: pending
	Frontend = 1,
	// desc: abnormal transactions caught by the frontend, usually receipt.status !==1
	// status: failed | cancelled
	Abnormal = 2,
	// desc: backend data synchronized from the blockchain
	// status: successful
	Backend = 3,
}

export const TxPosition = {
	Frontend: ITxPosition.Frontend,
	Abnormal: ITxPosition.Abnormal,
	Backend: ITxPosition.Backend,
}

export enum ITxDirection {
	Deposit = 1,
	Withdraw = 2,
}

export const TxDirection = {
	Deposit: ITxDirection.Deposit,
	Withdraw: ITxDirection.Withdraw,
}

const MAX_LIMIT = 1000

export interface TimestampTx {
	hash: string
	timestamp: number
	// 1: front tx
	// 2: abnormal tx -> failed|canceled
	// 3: successful tx
	position: ITxPosition
	// 1: deposit
	// 2: withdraw
	direction?: ITxDirection
}

export interface Transaction {
	hash: string
	toHash?: string
	fromName: string
	toName: string
	fromExplore: string
	toExplore: string
	fromBlockNumber?: number
	toBlockNumber?: number
	amount: string
	isL1: boolean
	tokenSymbol?: string
	tokenDecimals?: number
	timestamp?: number
	isClaimed?: boolean
	claimInfo?: object
	assumedStatus?: string
	errMsg?: string
	initiatedAt?: string
	finalisedAt?: string
	l1Token?: string
	l2Token?: string
}

export interface ClaimTransaction {
	hash: string
	msgHash: string
	amount: string
	to: string
	isL1: boolean
	l1Token: string
	l2Token: string
	blockNumber: number
	blockTimestamp: string
	finalizeTx: {
		hash: string
		amount: string
		to: string
		isL1: boolean
		blockNumber: number
		blockTimestamp: string | null
	}
	claimInfo: {
		from: string
		to: string
		value: string
		nonce: string
		batch_hash: string
		message: string
		proof: string
		batch_index: string
	}
	createdTime: string
}

const MAX_OFFSET_TIME = 30 * 60 * 1000
export const isValidOffsetTime = (offsetTime: number) =>
	offsetTime < MAX_OFFSET_TIME

const formatBackTxList = (
	backList: Transaction[],
	estimatedTimeMap: object,
) => {
	const nextEstimatedTimeMap: any = { ...estimatedTimeMap }
	const blockNumbers = getBlockNumbers()
	if (!backList?.length) {
		return { txList: [], estimatedTimeMap: nextEstimatedTimeMap }
	}
	const txList = backList.map((tx: any) => {
		const amount = Math.round(tx.amount / 10) * 10 // for 99999999999
		const toHash = tx.finalizeTx?.hash
		const initiatedAt = tx.blockTimestamp || tx.createdTime
		const finalisedAt = tx.finalizeTx?.blockTimestamp

		// 1. have no time to compute fromEstimatedEndTime
		// 2. compute toEstimatedEndTime from backend data
		// 3. when tx is marked success then remove estimatedEndTime to slim storage data
		// 4. estimatedTime is greater than 30 mins then warn but save
		// 5. if the second deal succeeded, then the first should succeed too.
		if (tx.isL1) {
			if (
				tx.blockNumber > blockNumbers[0] &&
				blockNumbers[0] !== -1 &&
				!nextEstimatedTimeMap[`from_${tx.hash}`]
			) {
				const estimatedOffsetTime =
					(tx.blockNumber - blockNumbers[0]) * 12 * 1000
				if (isValidOffsetTime(estimatedOffsetTime)) {
					nextEstimatedTimeMap[`from_${tx.hash}`] =
						Date.now() + estimatedOffsetTime
				} else if (
					!tx.finalizeTx?.blockNumber ||
					tx.finalizeTx.blockNumber > blockNumbers[1]
				) {
					nextEstimatedTimeMap[`from_${tx.hash}`] = 0
				}
			} else if (
				tx.blockNumber <= blockNumbers[0] &&
				Object.keys(nextEstimatedTimeMap).includes(`from_${tx.hash}`)
			) {
				delete nextEstimatedTimeMap[`from_${tx.hash}`]
			}
		} else {
			if (
				tx.finalizeTx?.blockNumber &&
				blockNumbers[0] !== -1 &&
				tx.finalizeTx.blockNumber > blockNumbers[0] &&
				!nextEstimatedTimeMap[`to_${toHash}`]
			) {
				const estimatedOffsetTime =
					(tx.finalizeTx.blockNumber - blockNumbers[0]) * 12 * 1000
				if (isValidOffsetTime(estimatedOffsetTime)) {
					nextEstimatedTimeMap[`to_${toHash}`] =
						Date.now() + estimatedOffsetTime
				} else {
					nextEstimatedTimeMap[`to_${toHash}`] = 0
				}
			} else if (
				tx.finalizeTx?.blockNumber &&
				tx.finalizeTx.blockNumber <= blockNumbers[0] &&
				Object.keys(nextEstimatedTimeMap).includes(`to_${toHash}`)
			) {
				delete nextEstimatedTimeMap[`to_${toHash}`]
			}
		}
		const tokensMap = useBridgeConfigStore.getState()?.tokensMap || {}
		const token = Object.values(tokensMap)?.filter(({ l1Address, l2Address }) =>
			[l1Address, l2Address].includes(tx.isL1 ? tx.l1Token : tx.l2Token),
		)?.[0]

		return {
			hash: tx.hash,
			amount,
			fromName: tx?.fromName || '',
			fromExplore: tx.fromExplore,
			fromBlockNumber: tx.blockNumber,
			toHash,
			toName: tx?.toName || '',
			toExplore: tx.toExplore,
			toBlockNumber: tx.finalizeTx?.blockNumber,
			isL1: tx.isL1,
			tokenSymbol: token?.symbol,
			tokenDecimals: token?.decimals,
			claimInfo: tx.claimInfo,
			isClaimed: tx.finalizeTx?.hash,
			initiatedAt,
			finalisedAt,
			l1Token: tx.l1Token,
			l2Token: tx.l2Token,
		}
	})

	// delete nextEstimatedTimeMap.to_undefined
	return {
		txList,
		estimatedTimeMap: nextEstimatedTimeMap,
	}
}

// assume > 1h tx occurred an uncatchable error
const eliminateOvertimeTx = (frontList: Transaction[]) => {
	return produce(frontList, (draft) => {
		draft.forEach((item) => {
			if (
				!item.assumedStatus &&
				Date.now() - (item?.timestamp ?? 0) >= 3600000
			) {
				item.assumedStatus = TX_STATUS.failed
			}
		})
	}) as any
}

const detailOrderdTxs = async (
	isMainnet: boolean,
	pageOrderedTxs: TimestampTx[],
	frontTransactions: Transaction[],
	abnormalTransactions: Transaction[],
	estimatedTimeMap: object,
) => {
	const needFetchTxs = pageOrderedTxs.map((item) => item.hash)

	let historyList: Transaction[] = []
	let returnedEstimatedTimeMap = estimatedTimeMap
	if (needFetchTxs?.length) {
		const data = await getScrollBridgeTxHashes(needFetchTxs, isMainnet)

		const { txList, estimatedTimeMap: nextEstimatedTimeMap } = formatBackTxList(
			data,
			estimatedTimeMap,
		)
		historyList = txList
		returnedEstimatedTimeMap = nextEstimatedTimeMap
	}

	const allTransactions = [
		...historyList,
		...abnormalTransactions,
		...frontTransactions,
	]
	const pageTransactions: any = pageOrderedTxs
		?.map(({ hash }) => allTransactions.find((item) => item.hash === hash))
		?.filter((item) => !!item) // TODO: fot test
	return { pageTransactions, estimatedTimeMap: returnedEstimatedTimeMap }
}

const maxLengthAccount = (orderedTxDB: OrderedTxDB) => {
	const briefList = Object.entries(orderedTxDB).map(([key, value]) => [
		key,
		value.length,
	])
	let maxLength = 0
	let address
	for (let i = 0; i < briefList.length; i++) {
		if (Number(briefList[i][1]) > maxLength) {
			maxLength = briefList[i][1] as number
			address = briefList[i][0]
		}
	}
	return address
}

export const useMainnetBridgeTxStore = create<TxStore>()(
	persist(
		(set, get) => ({
			page: 1,
			total: 0,
			loading: false,
			// { hash: estimatedEndTime }
			estimatedTimeMap: {},
			frontTransactions: [],
			abnormalTransactions: [],
			pageTransactions: [],
			orderedTxDB: {},
			// when user send a transaction
			addTransaction: (newTx) =>
				set((state) => ({
					frontTransactions: [newTx, ...state.frontTransactions],
				})),
			// wait transaction success in from network
			updateTransaction: (txHash, updateOpts) =>
				set(
					produce((state) => {
						const frontTx = state.frontTransactions.find(
							(item: Transaction) => item.hash === txHash,
						)
						if (frontTx) {
							for (const key in updateOpts) {
								frontTx[key] = updateOpts[key]
							}
						}
						// for keep "bridge history" open
						const pageTx = state.pageTransactions.find(
							(item: Transaction) => item.hash === txHash,
						)
						if (pageTx) {
							for (const key in updateOpts) {
								pageTx[key] = updateOpts[key]
							}
						}
					}),
				),
			addEstimatedTimeMap: (key, value) => {
				const nextEstimatedTimeMap = { ...get().estimatedTimeMap, [key]: value }
				set({
					estimatedTimeMap: nextEstimatedTimeMap,
				})
			},
			// polling transactions
			// slim frontTransactions and keep the latest 3 backTransactions
			generateTransactions: (walletAddress, historyList) => {
				const {
					frontTransactions,
					estimatedTimeMap: preEstimatedTimeMap,
					orderedTxDB,
					pageTransactions,
				} = get()
				const realHistoryList = historyList?.filter((item) => item)

				const untimedFrontList = eliminateOvertimeTx(frontTransactions)

				if (realHistoryList?.length) {
					const { txList: formattedHistoryList, estimatedTimeMap } =
						formatBackTxList(realHistoryList, preEstimatedTimeMap)
					const formattedHistoryListHash = formattedHistoryList.map(
						(item) => item.hash,
					)
					const formattedHistoryListMap = Object.fromEntries(
						formattedHistoryList.map((item) => [item.hash, item]),
					)
					const pendingFrontList = untimedFrontList.filter(
						(item: Transaction) =>
							!formattedHistoryListHash.includes(item.hash),
					)

					const refreshPageTransaction = pageTransactions.map((item) => {
						if (formattedHistoryListMap[item.hash]) {
							return formattedHistoryListMap[item.hash]
						}
						return item
					})

					const failedFrontTransactionListHash = untimedFrontList
						.filter(
							(item: Transaction) => item.assumedStatus === TX_STATUS.failed,
						)
						.map((item: Transaction) => item.hash)
					const refreshOrderedDB = produce(orderedTxDB, (draft) => {
						draft[walletAddress].forEach((item) => {
							if (formattedHistoryListHash.includes(item.hash)) {
								item.position = TxPosition.Backend
							} else if (failedFrontTransactionListHash.includes(item.hash)) {
								item.position = TxPosition.Abnormal
							}
						})
					})

					set({
						frontTransactions: pendingFrontList,
						pageTransactions: refreshPageTransaction,
						estimatedTimeMap,
						orderedTxDB: refreshOrderedDB,
					})
				} else {
					set({
						frontTransactions: untimedFrontList,
					})
				}
			},
			// page transactions
			comboPageTransactions: async (address, page, rowsPerPage) => {
				const {
					orderedTxDB,
					frontTransactions,
					abnormalTransactions,
					estimatedTimeMap,
				} = get()
				const orderedTxs = orderedTxDB[address] ?? []
				set({ loading: true })
				const pageOrderedTxs = orderedTxs.slice(
					(page - 1) * rowsPerPage,
					page * rowsPerPage,
				)
				const { pageTransactions, estimatedTimeMap: nextEstimatedTimeMap } =
					await detailOrderdTxs(
						true,
						pageOrderedTxs,
						frontTransactions,
						abnormalTransactions,
						estimatedTimeMap,
					)
				set({
					pageTransactions,
					page,
					total: orderedTxs?.length ?? 0,
					loading: false,
					estimatedTimeMap: nextEstimatedTimeMap,
				})
			},
			// combine claimable transactions and sort
			combineClaimableTransactions: (walletAddress, claimableList) => {
				const { orderedTxDB } = get()
				const orderedTxs = orderedTxDB[walletAddress] ?? []
				const claimableTxs = claimableList.map((item) => ({
					hash: item.hash,
					timestamp: dayjs(item.createdTime).unix(),
					position: TxPosition.Backend,
					direction: TxDirection.Withdraw,
				}))
				const txList = [...orderedTxs, ...claimableTxs]
					.map((tx) => {
						// Ensure backward compatibility with old data, and add the direction attribute for transactions that haven't been claimed.
						if (
							claimableTxs.some((claimableTx) => claimableTx.hash === tx.hash)
						) {
							return {
								...tx,
								direction: TxDirection.Withdraw,
							}
						}
						return tx
					})
					.filter((v, i, a) => a.findIndex((t) => t.hash === v.hash) === i)
				txList.sort((a, b) => {
					return b.timestamp - a.timestamp
				})
				set({
					orderedTxDB: { ...orderedTxDB, [walletAddress]: txList },
					total: txList?.length ?? 0,
				})
			},
			// when connect and disconnect
			clearTransactions: () => {
				set({
					pageTransactions: [],
					page: 1,
					total: 0,
				})
			},
			removeFrontTransactions: (hash) =>
				set(
					produce((state) => {
						const frontTxIndex = state.frontTransactions.findIndex(
							(item: Transaction) => item.hash === hash,
						)
						state.frontTransactions.splice(frontTxIndex, 1)
					}),
				),
			addAbnormalTransactions: (walletAddress, tx) => {
				const { abnormalTransactions } = get()
				set({ abnormalTransactions: [tx, ...abnormalTransactions] })
			},
			updateOrderedTxs: (walletAddress, hash, param, direction?) =>
				set(
					produce((state) => {
						// position: 1|2|3
						if (isNumber(param)) {
							const current = state.orderedTxDB[walletAddress]?.find(
								(item: Transaction) => item.hash === hash,
							)
							if (current) {
								current.position = param
								current.direction = direction
							} else if (
								!state.orderedTxDB[walletAddress] ||
								state.orderedTxDB[walletAddress]?.length < MAX_LIMIT
							) {
								const newRecord = {
									hash,
									timestamp: Date.now(),
									position: param,
									direction,
								}
								if (state.orderedTxDB[walletAddress]) {
									state.orderedTxDB[walletAddress].unshift(newRecord)
								} else {
									state.orderedTxDB[walletAddress] = [newRecord]
								}
							} else {
								// remove the oldest 3 records
								const address = maxLengthAccount(state.orderedTxDB)
								if (address) {
									const abandonedTxHashs = state.orderedTxDB[address]
										.slice(state.orderedTxDB[address]?.length - 3)
										.map((item: Transaction) => item.hash)
									state.abnormalTransactions =
										state.abnormalTransactions.filter(
											(item: Transaction) =>
												!abandonedTxHashs.includes(item.hash),
										)
									state.orderedTxDB[address] = state.orderedTxDB[address].slice(
										0,
										state.orderedTxDB[address]?.length - 3,
									)

									const newRecord = {
										hash,
										timestamp: Date.now(),
										position: param,
										direction,
									}
									if (state.orderedTxDB[walletAddress]) {
										state.orderedTxDB[walletAddress].unshift(newRecord)
									} else {
										state.orderedTxDB[walletAddress] = [newRecord]
									}
								}
							}
						}
						// repriced tx
						else {
							state.orderedTxDB[walletAddress].find(
								(item: Transaction) => item.hash === hash,
							).hash = param
						}
					}),
				),
		}),
		{
			name: STORAGE_KEY.BRIDGE_TRANSACTIONS[EPortalNetwork.MAINNET],
		},
	),
)

export const useTestnetBridgeTxStore = create<TxStore>()(
	persist(
		(set, get) => ({
			page: 1,
			total: 0,
			loading: false,
			// { hash: estimatedEndTime }
			estimatedTimeMap: {},
			frontTransactions: [],
			abnormalTransactions: [],
			pageTransactions: [],
			orderedTxDB: {},
			// when user send a transaction
			addTransaction: (newTx) =>
				set((state) => ({
					frontTransactions: [newTx, ...state.frontTransactions],
				})),
			// wait transaction success in from network
			updateTransaction: (txHash, updateOpts) =>
				set(
					produce((state) => {
						const frontTx = state.frontTransactions.find(
							(item: Transaction) => item.hash === txHash,
						)
						if (frontTx) {
							for (const key in updateOpts) {
								frontTx[key] = updateOpts[key]
							}
						}
						// for keep "bridge history" open
						const pageTx = state.pageTransactions.find(
							(item: Transaction) => item.hash === txHash,
						)
						if (pageTx) {
							for (const key in updateOpts) {
								pageTx[key] = updateOpts[key]
							}
						}
					}),
				),
			addEstimatedTimeMap: (key, value) => {
				const nextEstimatedTimeMap = { ...get().estimatedTimeMap, [key]: value }
				set({
					estimatedTimeMap: nextEstimatedTimeMap,
				})
			},
			// polling transactions
			// slim frontTransactions and keep the latest 3 backTransactions
			generateTransactions: (walletAddress, historyList) => {
				const {
					frontTransactions,
					estimatedTimeMap: preEstimatedTimeMap,
					orderedTxDB,
					pageTransactions,
				} = get()
				const realHistoryList = historyList?.filter((item) => item)

				const untimedFrontList = eliminateOvertimeTx(frontTransactions)

				if (realHistoryList?.length) {
					const { txList: formattedHistoryList, estimatedTimeMap } =
						formatBackTxList(realHistoryList, preEstimatedTimeMap)
					const formattedHistoryListHash = formattedHistoryList.map(
						(item) => item.hash,
					)
					const formattedHistoryListMap = Object.fromEntries(
						formattedHistoryList.map((item) => [item.hash, item]),
					)
					const pendingFrontList = untimedFrontList.filter(
						(item: Transaction) =>
							!formattedHistoryListHash.includes(item.hash),
					)

					const refreshPageTransaction = pageTransactions.map((item) => {
						if (formattedHistoryListMap[item.hash]) {
							return formattedHistoryListMap[item.hash]
						}
						return item
					})

					const failedFrontTransactionListHash = untimedFrontList
						.filter(
							(item: Transaction) => item.assumedStatus === TX_STATUS.failed,
						)
						.map((item: Transaction) => item.hash)
					const refreshOrderedDB = produce(orderedTxDB, (draft) => {
						draft[walletAddress].forEach((item) => {
							if (formattedHistoryListHash.includes(item.hash)) {
								item.position = TxPosition.Backend
							} else if (failedFrontTransactionListHash.includes(item.hash)) {
								item.position = TxPosition.Abnormal
							}
						})
					})

					set({
						frontTransactions: pendingFrontList,
						pageTransactions: refreshPageTransaction,
						estimatedTimeMap,
						orderedTxDB: refreshOrderedDB,
					})
				} else {
					set({
						frontTransactions: untimedFrontList,
					})
				}
			},
			// page transactions
			comboPageTransactions: async (address, page, rowsPerPage) => {
				const {
					orderedTxDB,
					frontTransactions,
					abnormalTransactions,
					estimatedTimeMap,
				} = get()
				const orderedTxs = orderedTxDB[address] ?? []
				set({ loading: true })
				const pageOrderedTxs = orderedTxs.slice(
					(page - 1) * rowsPerPage,
					page * rowsPerPage,
				)
				const { pageTransactions, estimatedTimeMap: nextEstimatedTimeMap } =
					await detailOrderdTxs(
						false,
						pageOrderedTxs,
						frontTransactions,
						abnormalTransactions,
						estimatedTimeMap,
					)
				set({
					pageTransactions,
					page,
					total: orderedTxs?.length ?? 0,
					loading: false,
					estimatedTimeMap: nextEstimatedTimeMap,
				})
			},
			// combine claimable transactions and sort
			combineClaimableTransactions: (walletAddress, claimableList) => {
				const { orderedTxDB } = get()
				const orderedTxs = orderedTxDB[walletAddress] ?? []
				const claimableTxs = claimableList.map((item) => ({
					hash: item.hash,
					timestamp: dayjs(item.createdTime).unix(),
					position: TxPosition.Backend,
					direction: TxDirection.Withdraw,
				}))
				const txList = [...orderedTxs, ...claimableTxs]
					.map((tx) => {
						// Ensure backward compatibility with old data, and add the direction attribute for transactions that haven't been claimed.
						if (
							claimableTxs.some((claimableTx) => claimableTx.hash === tx.hash)
						) {
							return {
								...tx,
								direction: TxDirection.Withdraw,
							}
						}
						return tx
					})
					.filter((v, i, a) => a.findIndex((t) => t.hash === v.hash) === i)
				txList.sort((a, b) => {
					return b.timestamp - a.timestamp
				})
				set({
					orderedTxDB: { ...orderedTxDB, [walletAddress]: txList },
					total: txList?.length ?? 0,
				})
			},
			// when connect and disconnect
			clearTransactions: () => {
				set({
					pageTransactions: [],
					page: 1,
					total: 0,
				})
			},
			removeFrontTransactions: (hash) =>
				set(
					produce((state) => {
						const frontTxIndex = state.frontTransactions.findIndex(
							(item: Transaction) => item.hash === hash,
						)
						state.frontTransactions.splice(frontTxIndex, 1)
					}),
				),
			addAbnormalTransactions: (walletAddress, tx) => {
				const { abnormalTransactions } = get()
				set({ abnormalTransactions: [tx, ...abnormalTransactions] })
			},
			updateOrderedTxs: (walletAddress, hash, param, direction?) =>
				set(
					produce((state) => {
						// position: 1|2|3
						if (isNumber(param)) {
							const current = state.orderedTxDB[walletAddress]?.find(
								(item: Transaction) => item.hash === hash,
							)
							if (current) {
								current.position = param
								current.direction = direction
							} else if (
								!state.orderedTxDB[walletAddress] ||
								state.orderedTxDB[walletAddress]?.length < MAX_LIMIT
							) {
								const newRecord = {
									hash,
									timestamp: Date.now(),
									position: param,
									direction,
								}
								if (state.orderedTxDB[walletAddress]) {
									state.orderedTxDB[walletAddress].unshift(newRecord)
								} else {
									state.orderedTxDB[walletAddress] = [newRecord]
								}
							} else {
								// remove the oldest 3 records
								const address = maxLengthAccount(state.orderedTxDB)
								if (address) {
									const abandonedTxHashs = state.orderedTxDB[address]
										.slice(state.orderedTxDB[address]?.length - 3)
										.map((item: Transaction) => item.hash)
									state.abnormalTransactions =
										state.abnormalTransactions.filter(
											(item: Transaction) =>
												!abandonedTxHashs.includes(item.hash),
										)
									state.orderedTxDB[address] = state.orderedTxDB[address].slice(
										0,
										state.orderedTxDB[address]?.length - 3,
									)

									const newRecord = {
										hash,
										timestamp: Date.now(),
										position: param,
										direction,
									}
									if (state.orderedTxDB[walletAddress]) {
										state.orderedTxDB[walletAddress].unshift(newRecord)
									} else {
										state.orderedTxDB[walletAddress] = [newRecord]
									}
								}
							}
						}
						// repriced tx
						else {
							state.orderedTxDB[walletAddress].find(
								(item: Transaction) => item.hash === hash,
							).hash = param
						}
					}),
				),
		}),
		{
			name: STORAGE_KEY.BRIDGE_TRANSACTIONS[EPortalNetwork.TESTNET],
		},
	),
)
