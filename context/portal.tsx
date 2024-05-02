import { Context, PropsWithChildren, createContext, useMemo } from 'react'

import { usePrivy } from '@privy-io/react-auth'
import { usePrivyWagmi } from '@privy-io/wagmi-connector'
import { useNetwork } from 'wagmi'

export type PortalContextType = {
	walletAddress?: string
	currentChainId?: number
	isCorrectNetworkSet?: boolean
}

const defaultPortalContext = {}

export const PortalContext: Context<PortalContextType> =
	createContext(defaultPortalContext)

export const PortalProvider: React.FC<PropsWithChildren> = ({ children }) => {
	const { chain } = useNetwork()
	// const { address: wagmiAddress } = useAccount()
	const { login, logout, ready, authenticated } = usePrivy()

	const currentChainId = useMemo(() => chain?.id, [chain?.id])
	const { wallet: privyWagmiWallet } = usePrivyWagmi()
	const walletAddress = useMemo(() => {
		if (ready && authenticated && privyWagmiWallet?.address) {
			return privyWagmiWallet?.address
		}
	}, [ready, authenticated, privyWagmiWallet])
	return (
		<PortalContext.Provider
			value={{
				walletAddress,
				currentChainId,
			}}
		>
			{children}
		</PortalContext.Provider>
	)
}
