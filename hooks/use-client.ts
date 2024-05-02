import { useMemo } from 'react'

import { CURRENT_CHAIN_ITEM } from '@/constants'
import { getClient } from '@/utils/viem'

export function useClient() {
	const rpcUrl = CURRENT_CHAIN_ITEM.rpcUrl
	return useMemo(() => getClient({ rpcUrl: rpcUrl }), [rpcUrl])
}
