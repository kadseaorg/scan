import { useMemo } from 'react'

import { usePortalStore } from '@/stores/portal'
import {
	useMainnetBridgeTxStore,
	useTestnetBridgeTxStore,
} from '@/stores/portal/bridge/tx'

export default function useTxStore() {
	const { isMainnet } = usePortalStore()
	const mainnetTxStore = useMainnetBridgeTxStore()
	const testTxStore = useTestnetBridgeTxStore()

	return useMemo(
		() => (isMainnet ? mainnetTxStore : testTxStore),
		[isMainnet, mainnetTxStore, testTxStore],
	)
}
