import { useContext } from 'react'

import { BridgeContext, BridgeContextType } from '@/context/bridge'

export default function useBridgeContext(): BridgeContextType {
	return useContext(BridgeContext)
}
