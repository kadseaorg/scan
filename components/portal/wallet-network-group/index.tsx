import { useCallback, useEffect } from 'react'

import { usePrivy, useWallets } from '@privy-io/react-auth'
import { usePrivyWagmi } from '@privy-io/wagmi-connector'
// import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useRouter } from 'next/router'

import ConnectButton from '@/components/common/connect-button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { IsArbitrum, IsBsquaredTestnet, IsKadsea, IsOKX1 } from '@/constants'
import { EPortalNetwork, usePortalStore } from '@/stores/portal'
import { usePathname, useSearchParams } from 'next/navigation'

interface IWalletNetworkGroup {
	showNetworkRadio?: boolean
}
const WalletNetworkGroup: React.FC<IWalletNetworkGroup> = ({
	showNetworkRadio = true,
}: IWalletNetworkGroup) => {
	const router = useRouter()
	const { login, user } = usePrivy()
	const { wallet, setActiveWallet } = usePrivyWagmi()
	const { wallets } = useWallets()
	const pathname = usePathname()
	const searchParams = useSearchParams()

	const { portalNetwork, setNetwork } = usePortalStore()
	const portalNetworks =
		IsKadsea || IsArbitrum
			? [EPortalNetwork.MAINNET]
			: IsBsquaredTestnet || IsOKX1 // TODO: when OKX mainnet launched, refactor this part
			  ? [EPortalNetwork.TESTNET]
			  : Object.values(EPortalNetwork)

	const goPortalNetworkRoute = useCallback(
		(portalNetwork: EPortalNetwork) => {
			if (!searchParams || !pathname) return
			const newSearchParams = new URLSearchParams(searchParams)
			newSearchParams.set('portalNetwork', portalNetwork)
			router.push(`${pathname}?${newSearchParams.toString()}`)
		},
		[pathname, searchParams, router],
	)

	useEffect(() => {
		const queryPortalNetwork = searchParams?.get('portalNetwork')
		if (queryPortalNetwork) {
			queryPortalNetwork !== portalNetwork &&
				setNetwork(queryPortalNetwork as EPortalNetwork)
		} else {
			goPortalNetworkRoute(portalNetwork || EPortalNetwork.MAINNET)
		}

		if (IsArbitrum || IsKadsea) {
			setNetwork(EPortalNetwork.MAINNET)
		} else if (IsBsquaredTestnet) {
			setNetwork(EPortalNetwork.TESTNET)
		} else if (IsOKX1) {
			// TODO: when OKX mainnet launched, refactor this part
			setNetwork(EPortalNetwork.TESTNET)
		}
	}, [goPortalNetworkRoute, portalNetwork, setNetwork, searchParams])

	return (
		<div className="flex items-center justify-end sm:flex-col sm:gap-4">
			<div className="flex-center">
				{/* <ConnectButton chainStatus="none" accountStatus="full" showBalance={false} /> */}
				<ConnectButton />
				{showNetworkRadio && (
					<RadioGroup
						className="grid-cols-2 ml-4"
						value={portalNetwork}
						onValueChange={(_portalNetwork) => {
							setNetwork(_portalNetwork as EPortalNetwork)
							goPortalNetworkRoute(_portalNetwork as EPortalNetwork)
						}}
						orientation="horizontal"
					>
						{portalNetworks.map((_portalNetwork) => (
							<div key={_portalNetwork} className="flex items-center space-x-2">
								<RadioGroupItem value={_portalNetwork} id={_portalNetwork} />
								<Label htmlFor={_portalNetwork}>{_portalNetwork}</Label>
							</div>
						))}
					</RadioGroup>
				)}
			</div>
		</div>
	)
}

export default WalletNetworkGroup
