import { createElement, useEffect, useMemo, useState } from 'react'

import { ArrowLeft, ArrowLeftRight, Search, Send, Spline } from 'lucide-react'
import { useRouter } from 'next/router'

import WalletSendPage from '@/components/portal/wallet/assets/send'
import ContactList from '@/components/portal/wallet/contact-list'
import WalletTokenList from '@/components/portal/wallet/token-list'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { IsChainSupportBridge } from '@/constants'
import ROUTES from '@/constants/routes'
import usePortalContext from '@/hooks/portal/use-portal-context'
import useWalletTokenList from '@/hooks/portal/wallet/use-token-list'
import { usePortalStore } from '@/stores/portal'
import { usePortalWalletStore } from '@/stores/portal/wallet'
import {
	EWalletSendStep,
	usePortalWalletSendStore,
} from '@/stores/portal/wallet/send'

export const WalletAssetsBack: React.FC<{
	sendStep?: EWalletSendStep
	onClick?: () => void
}> = ({ sendStep, onClick }) => {
	const { setSendStep } = usePortalWalletSendStore()

	return (
		<Button
			className="rounded-full w-[80px] h-[34px] mb-4 !p-0 flex items-center justify-center gap-1"
			variant="secondary"
			onClick={() => {
				if (!!onClick) {
					onClick()
					return
				}

				undefined !== sendStep && setSendStep(sendStep)
			}}
		>
			<ArrowLeft size={14} />
			<div>Back</div>
		</Button>
	)
}

const ChooseTokenPage: React.FC = () => {
	const router = useRouter()
	const { setSendStep } = usePortalWalletSendStore()
	const { totalUsdBalance } = usePortalWalletStore()

	const [hideZeroBalanceToken, setHideZeroBalanceToken] = useState(false)

	const menuConfig = useMemo(
		() =>
			!IsChainSupportBridge
				? [
						{
							label: 'Send',
							icon: Send,
							onClick: () => setSendStep(EWalletSendStep.CHOOSE_CONTACT),
						},
						{
							label: 'Swap',
							icon: ArrowLeftRight,
							route: ROUTES.PORTAL.SWAP,
						},
				  ]
				: [
						{
							label: 'Send',
							icon: Send,
							onClick: () => setSendStep(EWalletSendStep.CHOOSE_CONTACT),
						},
						{
							label: 'Bridge',
							icon: Spline,
							iconSize: 18,
							route: ROUTES.PORTAL.BRIDGE,
						},
						{
							label: 'Swap',
							icon: ArrowLeftRight,
							route: ROUTES.PORTAL.SWAP,
						},
				  ],
		[setSendStep],
	)

	return (
		<Card className="max-w-[600px] w-full pt-10 pb-6 m-auto sm:pt-6 sm:pb-4">
			<div className="flex justify-center items-center text-3xl font-bold px-8 sm:px-4">
				{undefined === totalUsdBalance ? (
					<Skeleton className="h-[36px] w-[220px]" />
				) : (
					`$ ${totalUsdBalance}`
				)}
			</div>

			<div className="flex justify-center items-center gap-10 mt-8 mb-10 px-8 sm:px-4">
				{menuConfig.map(({ label, icon, iconSize = 20, route, onClick }) => (
					<div
						key={label}
						className="flex flex-col items-center gap-2 text-muted-foreground"
					>
						<div
							className="w-[50px] h-[50px] flex justify-center items-center bg-muted rounded-full cursor-pointer transition-all hover:opacity-80"
							onClick={() => {
								onClick?.()
								!!route && router.push(route)
							}}
						>
							{createElement(icon, {
								className: 'text-primary',
								size: iconSize,
							})}
						</div>
						<div>{label}</div>
					</div>
				))}
			</div>

			<div className="flex justify-between items-center px-8 sm:px-4">
				<div>Balances</div>
				<div className="flex items-center space-x-2">
					<Checkbox
						id="hideZero"
						checked={hideZeroBalanceToken}
						onCheckedChange={(checked) => setHideZeroBalanceToken(!!checked)}
					/>
					<label htmlFor="hideZero" className="text-sm text-muted-foreground">
						Hide zero balances
					</label>
				</div>
			</div>

			<WalletTokenList
				className="mt-4"
				hideZeroBalanceToken={hideZeroBalanceToken}
			/>
		</Card>
	)
}

const ChooseContactPage: React.FC = () => {
	const { setSendPrePage } = usePortalWalletSendStore()

	const [filterKeyWord, setFilterKeyWord] = useState('')

	useEffect(() => {
		setSendPrePage('FROM_CHOOSE_CONTACT')
	}, [])

	return (
		<div className="w-full max-w-[600px] mx-auto">
			<WalletAssetsBack sendStep={EWalletSendStep.CHOOSE_TOKEN} />
			<Card className="px-4 py-8">
				<div className="mb-4 text-2xl text-center font-bold">Send To</div>
				<div className="relative flex-1">
					<Input
						className="pr-[30px]"
						placeholder="Address or ENS or ContactName"
						onChange={(e) => setFilterKeyWord(e.target.value)}
					/>
					<Search
						className="absolute top-1/2 -translate-y-1/2 right-2 z-20 text-muted-foreground"
						size={16}
					/>
				</div>
			</Card>
			<ContactList className="mt-6" filterKeyWord={filterKeyWord} />
		</div>
	)
}

const WalletAssetsTab: React.FC = () => {
	const { isMainnet } = usePortalStore()
	const { walletAddress } = usePortalContext()
	const { setSendToken, sendStep } = usePortalWalletSendStore()
	useWalletTokenList(true)

	useEffect(() => {
		undefined !== isMainnet && setSendToken(undefined)
	}, [isMainnet])

	if (!walletAddress)
		return (
			<div className="w-full flex justify-center items-center mt-[50px]">
				Please connect your wallet first.
			</div>
		)

	switch (sendStep) {
		case EWalletSendStep.CHOOSE_TOKEN:
			return <ChooseTokenPage />

		case EWalletSendStep.CHOOSE_CONTACT:
			return <ChooseContactPage />

		case EWalletSendStep.SEND:
			return <WalletSendPage />

		default:
			return <ChooseTokenPage />
	}
}

export default WalletAssetsTab
