import { memo } from 'react'

import { useRouter } from 'next/router'

import Profile from '@/components/account/profile'
import AddNetworkButton from '@/components/common/add-network-button'
import ChainSwitcher from '@/components/common/chain-switcher'
import SearchInput from '@/components/common/search-input'
import ThemeSwitcher from '@/components/common/theme-switcher'
import { ThemeCustomizer } from '@/components/theme/theme-customizer'
import { Button } from '@/components/ui/button'
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { CHAIN_TYPE, CURRENT_CHAIN_ITEM } from '@/constants'
import ROUTES from '@/constants/routes'
import { cn } from '@/lib/utils'
import { EnumChainType } from '@/types/chain'

import MobileMenu from './MobileMenu'

const Header: React.FC = () => {
	const router = useRouter()

	return (
		<>
			<header className="bg-card w-full h-[56px] flex justify-between items-center shadow-transparent px-6 py-[6px] dark:bg-darkGray-800">
				<SearchInput className="w-3/5 sm:hidden flex-1" />

				<ChainSwitcher className="hidden sm:block" />

				<div className="flex items-center gap-2">
					<MobileMenu />

					<ThemeSwitcher />

					{CURRENT_CHAIN_ITEM.chainType === EnumChainType.SCROLL_SEPOLIA && (
						<Button
							className="sm:hidden rounded-full h-8"
							onClick={() => {
								window.open(ROUTES.FAUCET)
							}}
						>
							Faucet
						</Button>
					)}

					<ThemeCustomizer />

					{CHAIN_TYPE !== EnumChainType.BSQUARED_TESTNET && (
						<AddNetworkButton className="sm:hidden rounded-full h-8" />
					)}

					<Select
						defaultValue={CURRENT_CHAIN_ITEM.networkSwitchers[0].explorerUrl}
						onValueChange={(value) => {
							router.push(value)
						}}
					>
						<SelectTrigger className="sm:hidden gap-2 w-auto inline-flex items-center justify-center rounded-full text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3">
							<SelectValue />
						</SelectTrigger>
						<SelectContent align="end" className={cn(`theme-${CHAIN_TYPE}`)}>
							<SelectGroup className="flex flex-col">
								{CURRENT_CHAIN_ITEM.networkSwitchers.map((item) => (
									<SelectItem key={item.explorerUrl} value={item.explorerUrl}>
										{item.name}
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>

					<Separator className="sm:hidden" orientation="vertical" />
					<Profile />
				</div>
			</header>

			<SearchInput className="hidden px-6 w-full sm:flex" />
		</>
	)
}

export default memo(Header)
