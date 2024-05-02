import { useCallback } from 'react'

import { getPublicClient } from '@wagmi/core'
import { useBlockNumber } from 'wagmi'

import { IsScroll, STORAGE_KEY } from '@/constants'
import usePortalContext from '@/hooks/portal/use-portal-context'
import { useBridgeNetworkStore } from '@/stores/portal/bridge/network'

export default function useFetchBlockNumbers() {
	const { walletAddress } = usePortalContext()
	const { l1Network, l2Network, isCorrectNetworkSet } = useBridgeNetworkStore()

	const fetchBlockNumber = useCallback(async () => {
		try {
			if (
				!!!walletAddress ||
				!!!l1Network?.id ||
				!!!l2Network?.id ||
				!isCorrectNetworkSet
			)
				return

			const fetchL1BlockNumber = getPublicClient({
				chainId: l1Network?.id,
			}).getBlock({
				// blockTag: 'safe'
				blockTag: 'latest',
			})
			const fetchL2BlockNumber = getPublicClient({
				chainId: l2Network?.id,
			}).getBlock({ blockTag: 'latest' })

			const blockNumbers = (
				await Promise.allSettled([fetchL1BlockNumber, fetchL2BlockNumber])
			).map((item) =>
				item.status === 'fulfilled' ? Number(item.value.number) : item.reason,
			)
			localStorage[STORAGE_KEY.BLOCK_NUMBERS] = JSON.stringify([
				typeof blockNumbers[0] === 'number' ? blockNumbers[0] : blockNumbers[0],
				typeof blockNumbers[1] === 'number' ? blockNumbers[1] : blockNumbers[1],
			])
		} catch (error: any) {
			throw error
		}
	}, [isCorrectNetworkSet, l1Network?.id, l2Network?.id, walletAddress])

	useBlockNumber({
		watch: true,
		enabled: IsScroll && !!walletAddress && !!l1Network?.id && !!l2Network?.id,
		onBlock: fetchBlockNumber,
	})
}

export const getBlockNumbers = () =>
	JSON.parse(localStorage[STORAGE_KEY.BLOCK_NUMBERS] || '[-1, -1]')
