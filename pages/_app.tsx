import { useEffect, useState } from 'react'

import { PrivyProvider } from '@privy-io/react-auth'
import { PrivyWagmiConnector } from '@privy-io/wagmi-connector'
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'
import { Session, SessionContextProvider } from '@supabase/auth-helpers-react'
import PlausibleProvider from 'next-plausible'
import type { AppProps } from 'next/app'
import { Toaster } from 'sonner'

import { TailwindIndicator } from '@/components/portal/bridge/tailwind-indicator'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { ThemeWrapper } from '@/components/theme/theme-wrapper'
import { TooltipProvider } from '@/components/ui/tooltip'
import { CHAIN_TYPE, CURRENT_CHAIN_ITEM } from '@/constants'
import { AccountProvider } from '@/context/account'
import PrivyConfigContext, {
	PrivyConfigContextType,
	defaultDashboardConfig,
	defaultIndexConfig,
} from '@/context/privy-config'
import {
	configureChainsConfig,
	defaultChain,
	supportedChains,
} from '@/context/rainbowkit'
import '@/theme/global.css'
import MUIThemeProvider from '@/theme/mui-theme'
import '@/theme/themes.css'
import { trpc } from '@/utils/trpc'

import '@rainbow-me/rainbowkit/styles.css'

const App = ({
	Component,
	pageProps,
	router,
}: AppProps<{
	initialSession: Session
}>) => {
	// Create a new supabase browser client on every first render.
	// const [supabaseClient] = useState(() => createPagesBrowserClient())
	const [config, setConfig] = useState<PrivyConfigContextType['config']>(() => {
		const defaultConfig = router?.route?.includes('account')
			? defaultDashboardConfig
			: defaultIndexConfig
		return {
			...defaultConfig,
		}
	})
	const [mounted, setMounted] = useState(false)

	useEffect(() => setMounted(true), [])

	if (!mounted) {
		return null
	}

	// strip https://
	const domain = CURRENT_CHAIN_ITEM.blockExplorerUrl.replace(
		/(^\w+:|^)\/\//,
		'',
	)

	if (!mounted) {
		return null
	}
	return (
		<PlausibleProvider domain={domain} trackOutboundLinks trackLocalhost>
			<ThemeProvider
				attribute="class"
				defaultTheme="dark"
				enableSystem
				disableTransitionOnChange
			>
				<ThemeWrapper defaultTheme={CHAIN_TYPE}>
					<TooltipProvider delayDuration={0} skipDelayDuration={0}>
						<MUIThemeProvider>
							{/* <SessionContextProvider supabaseClient={supabaseClient} initialSession={pageProps.initialSession}> */}
							<PrivyConfigContext.Provider value={{ config, setConfig }}>
								<PrivyProvider
									appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
									config={{
										embeddedWallets: {
											createOnLogin: 'users-without-wallets',
										},
										defaultChain,
										supportedChains,
										...config,
									}}
								>
									<PrivyWagmiConnector
										wagmiChainsConfig={configureChainsConfig}
									>
										<AccountProvider>
											<div>
												<div className={mounted ? 'block' : 'hidden'}>
													<Component {...pageProps} />
												</div>
												<Toaster richColors className="break-all" />
											</div>
										</AccountProvider>
									</PrivyWagmiConnector>
								</PrivyProvider>
							</PrivyConfigContext.Provider>
							{/* </SessionContextProvider> */}
						</MUIThemeProvider>
					</TooltipProvider>
					<TailwindIndicator />
				</ThemeWrapper>
			</ThemeProvider>
		</PlausibleProvider>
	)
}

export default trpc.withTRPC(App)
