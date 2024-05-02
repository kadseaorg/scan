import { PropsWithChildren, useMemo } from 'react'

import {
	RainbowKitProvider,
	Theme,
	darkTheme,
	getDefaultWallets,
	lightTheme,
} from '@rainbow-me/rainbowkit'
import { configureChains } from '@wagmi/core'
import merge from 'lodash.merge'
import { WagmiConfig, createConfig } from 'wagmi'
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'
import { publicProvider } from 'wagmi/providers/public'

import { CHAIN_TYPE, DEFAULT_CHAIN_MAP, PORTAN_CHAIN_MAP } from '@/constants'
import useTheme from '@/hooks/common/useTheme'

export const configureChainsConfig = configureChains(
	PORTAN_CHAIN_MAP[CHAIN_TYPE],
	[
		publicProvider(),
		jsonRpcProvider({
			rpc: (chain) => ({ http: chain?.rpcUrls?.default?.http?.[0] }),
		}),
	],
)

export const defaultChain = DEFAULT_CHAIN_MAP[CHAIN_TYPE]
export const supportedChains = PORTAN_CHAIN_MAP[CHAIN_TYPE]

const { chains, publicClient } = configureChainsConfig

const { connectors } = getDefaultWallets({
	appName: 'L2scan Portal',
	projectId: '593dd5578989c71e84d3288670024a15',
	chains,
})

const config = createConfig({
	connectors,
	publicClient,
})

export const WagmiRainbowkitProvider: React.FC<PropsWithChildren> = ({
	children,
}) => {
	const { isLight } = useTheme()

	const rainbowkitTheme = useMemo(
		() =>
			merge(isLight ? lightTheme() : darkTheme(), {
				colors: {
					accentColor: 'hsl(var(--primary))',
				},
			} as Theme),
		[isLight],
	)

	return (
		<WagmiConfig config={config}>
			<RainbowKitProvider
				modalSize="compact"
				theme={rainbowkitTheme}
				chains={chains}
				locale="en"
			>
				{children}
			</RainbowKitProvider>
		</WagmiConfig>
	)
}
