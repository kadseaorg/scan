import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { STORAGE_KEY } from '@/constants'
import { ZksyncTxHistoryType } from '@/hooks/portal/bridge/zksync/use-zksync-tx-history'

export type PortalNetworkStore = {
	txList: ZksyncTxHistoryType[]
	setTxList: (txList: ZksyncTxHistoryType[]) => void
	addTx: (tx: ZksyncTxHistoryType) => void
}

export type useZksyncNewTxStore = {
	accountTxs: Record<string, ZksyncTxHistoryType[]>
	addNewTx: (tx: ZksyncTxHistoryType, account: string) => void
	removeTx: (tx: ZksyncTxHistoryType, account: string) => void
	updateNewTx: (tx: ZksyncTxHistoryType, account: string) => void
}

export type ZksyncClaimTxType = {
	l1_tx_hash: string
	l2_tx_hash: string
	timestamp?: number
	portalNetwork?: string
}

export type ZksyncWithdrawClaimTxStore = {
	accountTxs: Record<string, ZksyncClaimTxType[]>
	addClaimedTx: (tx: ZksyncClaimTxType, account: string) => void
	removeClaimedTx: (tx: ZksyncClaimTxType, account: string) => void
}

export const useZksyncTxStore = create<PortalNetworkStore>()((set, get) => ({
	txList: [],
	setTxList: (txList) => set({ txList }),
	addTx: (tx) => set({ txList: [tx, ...get().txList] }),
}))
export const useZksyncNewTxStore = create<useZksyncNewTxStore>()(
	persist(
		(set, get) => ({
			accountTxs: {},
			addNewTx: (tx, account) => {
				const accountTxs = get().accountTxs[account] || []
				set({
					accountTxs: {
						...get().accountTxs,
						[account]: [tx, ...accountTxs],
					},
				})
			},
			removeTx: (tx, account) => {
				const txs = get().accountTxs[account] || []
				set({
					accountTxs: {
						...get().accountTxs,
						[account]: txs.filter(({ l1, l2, isDeposit }) =>
							isDeposit
								? l1?.txHash !== tx.l1?.txHash
								: l2?.txHash !== tx.l2?.txHash,
						),
					},
				})
			},
			updateNewTx: (tx: ZksyncTxHistoryType, account: string) => {
				const txs = get().accountTxs[account] || []
				const index = txs.findIndex(({ l1, l2, isDeposit }) =>
					isDeposit
						? l1?.txHash === tx.l1?.txHash
						: l2?.txHash === tx.l2?.txHash,
				)
				const newTxs = [...txs]
				newTxs[index] = { ...tx }
				if (index > -1) {
					set({
						accountTxs: {
							...get().accountTxs,
							[account]: newTxs,
						},
					})
				}
			},
		}),
		{
			name: STORAGE_KEY.PORTAL_BRIDGE_ZKSYNC_NEW_TX,
		},
	),
)
export const useZksyncWithdrawClaimTxStore =
	create<ZksyncWithdrawClaimTxStore>()(
		persist(
			(set, get) => ({
				accountTxs: {},
				addClaimedTx: (tx, account) => {
					const accountTxs = get().accountTxs[account] || []
					set({
						accountTxs: {
							...get().accountTxs,
							[account]: [tx, ...accountTxs],
						},
					})
				},
				removeClaimedTx: (tx, account) => {
					const txs = get().accountTxs[account] || []
					set({
						accountTxs: {
							...get().accountTxs,
							[account]: txs.filter(
								({ l1_tx_hash, l2_tx_hash }) => tx.l2_tx_hash === l2_tx_hash,
							),
						},
					})
				},
			}),
			{
				name: STORAGE_KEY.PORTAL_BRIDGE_ZKSYNC_WITHDRAW_CLAIM_TX,
			},
		),
	)
