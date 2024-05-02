import { create } from 'zustand'

import { IsScroll } from '@/constants'
import { EraNetworks, ScrollNetworks } from '@/constants/chain'
import { usePortalStore } from '@/stores/portal'
import { L1Network, L2Network } from '@/types/bridge'

export type BridgeNetworkStore = {
	l1Network?: L1Network
	l2Network?: L2Network
	fromNetwork?: L2Network | L1Network
	toNetwork?: L2Network | L1Network
	isCorrectNetworkSet?: boolean

	setNetwork: (isDeposit: boolean, currentChainId?: number) => void
}

export const useBridgeNetworkStore = create<BridgeNetworkStore>()(
	(set, get) => ({
		setNetwork: (isDeposit, currentChainId) => {
			const portalNetwork = usePortalStore.getState().portalNetwork
			if (!portalNetwork) return

			const l2Network = IsScroll
				? ScrollNetworks[portalNetwork]
				: EraNetworks[portalNetwork]
			const l1Network = l2Network.l1Network

			const fromNetwork = isDeposit ? l1Network : l2Network
			const toNetwork = isDeposit ? l2Network : l1Network

			const isCorrectNetworkSet =
				(isDeposit && l1Network?.id === currentChainId) ||
				(!isDeposit && l2Network?.id === currentChainId)

			set({
				l1Network,
				l2Network,
				fromNetwork,
				toNetwork,
				isCorrectNetworkSet,
			})
		},
	}),
)
