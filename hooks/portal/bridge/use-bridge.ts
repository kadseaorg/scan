import { useCallback } from 'react'

import { useBridgeNetworkStore } from '@/stores/portal/bridge/network'

export function useBridgeExplorerUrl() {
	const { l2Network } = useBridgeNetworkStore()

	const getExplorerUrl = useCallback(
		(isL1: boolean, hash: string) =>
			`${
				isL1
					? l2Network?.l1Network?.blockExplorers?.default.url
					: l2Network?.blockExplorerUrl
			}/tx/${hash}`,
		[
			l2Network?.blockExplorerUrl,
			l2Network?.l1Network?.blockExplorers?.default.url,
		],
	)

	return { getExplorerUrl }
}
