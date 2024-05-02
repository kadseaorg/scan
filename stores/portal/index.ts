import { create } from 'zustand'

export enum EPortalNetwork {
	MAINNET = 'Mainnet',
	TESTNET = 'Testnet',
}

export type PortalStore = {
	portalNetwork?: EPortalNetwork
	isMainnet?: boolean
	setNetwork: (portalNetwork: PortalStore['portalNetwork']) => void
}

export const usePortalStore = create<PortalStore>()((set) => ({
	setNetwork: (portalNetwork) =>
		set({ portalNetwork, isMainnet: EPortalNetwork.MAINNET === portalNetwork }),
}))
