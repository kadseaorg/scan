import { useCallback, useState } from 'react'

import { ethers } from 'ethers'
import { useInterval } from 'usehooks-ts'

import ScrollChain from '@/abis/scroll-bridge/ScrollChain.json'
import { useScrollProviderAndSigners } from '@/hooks/portal/bridge/scroll/use-scroll-ethers'
import { useBridgeNetworkStore } from '@/stores/portal/bridge/network'

export default function useLastFinalizedBatchIndex() {
	const { l1Network } = useBridgeNetworkStore()
	const scrollProviderAndSigners = useScrollProviderAndSigners()

	const [lastFinalizedBatchIndex, setLastFinalizedBatchIndex] = useState(0)

	const fetchLastFinalizedBatchIndex = useCallback(async () => {
		if (!l1Network) return

		const provider = scrollProviderAndSigners?.[l1Network?.id]?.provider
		const contract = scrollProviderAndSigners?.[l1Network?.id]?.contracts

		try {
			if (!provider || !contract) return

			const scrollChain = new ethers.Contract(
				contract.SCROLL_CHAIN,
				ScrollChain,
				provider,
			)
			const data = await scrollChain.lastFinalizedBatchIndex()

			setLastFinalizedBatchIndex(data?.toNumber() ?? 0)
		} catch (error) {
			throw error
		}
	}, [l1Network, scrollProviderAndSigners])

	useInterval(fetchLastFinalizedBatchIndex, 3e3)

	return { lastFinalizedBatchIndex }
}
