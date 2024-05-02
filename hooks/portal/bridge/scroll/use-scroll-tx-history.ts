import { useCallback, useEffect, useState } from 'react'

import { useInterval } from 'usehooks-ts'

import {
	getScrollBridgeClaimableTxHashes,
	getScrollBridgeTxHashes,
} from '@/constants/bridge'
import useTxStore from '@/hooks/portal/bridge/scroll/use-tx-store'
import usePortalContext from '@/hooks/portal/use-portal-context'
import { usePortalStore } from '@/stores/portal'
import { ClaimTransaction } from '@/stores/portal/bridge/tx'

export interface TxHistory {
	errorMessage: string
	refreshPageTransactions: (page: number) => void
	changeErrorMessage: (value: string) => void
}

export default function useScrollTxHistory() {
	const { walletAddress } = usePortalContext()
	const { isMainnet } = usePortalStore()
	const {
		pageTransactions,
		generateTransactions,
		comboPageTransactions,
		combineClaimableTransactions,
		orderedTxDB,
		clearTransactions,
	} = useTxStore()

	const [errorMessage, setErrorMessage] = useState('')
	const [claimableTx, setClaimableTx] = useState<ClaimTransaction[]>()

	const fetchTxList = useCallback(async () => {
		if (undefined === isMainnet) return

		const needToRefreshTransactions = pageTransactions?.filter(
			(item) => !item.toHash && !item.assumedStatus,
		)

		if (needToRefreshTransactions?.length && walletAddress) {
			const data = await getScrollBridgeTxHashes(
				needToRefreshTransactions
					.map((item) => item.hash)
					.filter((item, index, arr) => index === arr.indexOf(item)),
				isMainnet,
			)

			generateTransactions(walletAddress, data)
		}
	}, [pageTransactions, walletAddress, isMainnet, generateTransactions])

	useInterval(fetchTxList, 2000)

	useEffect(() => {
		clearTransactions()
	}, [])

	const fetchClaimableTxList = useCallback(async () => {
		if (undefined === isMainnet) return

		const data = await getScrollBridgeClaimableTxHashes(
			walletAddress,
			isMainnet,
		)
		setClaimableTx(data)
	}, [isMainnet, walletAddress])

	useEffect(() => {
		fetchClaimableTxList()
	}, [fetchClaimableTxList])

	const refreshPageTransactions = useCallback(
		(page: number) => {
			if (walletAddress) {
				comboPageTransactions(walletAddress, page, 10000).catch((e) => {
					setErrorMessage(e)
				})
			}
		},
		[walletAddress, comboPageTransactions],
	)

	useEffect(() => {
		refreshPageTransactions(1)
	}, [refreshPageTransactions, orderedTxDB])

	useEffect(() => {
		if (!!walletAddress && claimableTx) {
			combineClaimableTransactions(walletAddress, claimableTx)
		}
	}, [walletAddress, claimableTx, combineClaimableTransactions])

	return {
		errorMessage,
		refreshPageTransactions,
		changeErrorMessage: setErrorMessage,
	}
}
