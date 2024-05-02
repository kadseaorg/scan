import { useState } from 'react'

import { Drawer, Stack } from '@mui/material'
import { MenuIcon } from 'lucide-react'

import NavList from '@/components/common/nav-section/vertical/NavList'
import { CURRENT_CHAIN_ITEM } from '@/constants'
import ROUTES from '@/constants/routes'
import { EnumChainType } from '@/types/chain'

import { ROUTES_MENUS } from '../menu/config'

const MobileMenu = () => {
	const [isOpen, setOpen] = useState<boolean>(false)

	const menu_items = [...ROUTES_MENUS]
	const { chainType } = CURRENT_CHAIN_ITEM

	if (chainType === EnumChainType.SCROLL_SEPOLIA) {
		menu_items.push({
			key: ROUTES.FAUCET,
			label: 'Faucet',
			route: ROUTES.FAUCET,
		})
	}

	return (
		<Stack>
			<MenuIcon className="hidden sm:block" onClick={() => setOpen(true)} />

			<Drawer anchor={'top'} open={isOpen} onClose={() => setOpen(false)}>
				{menu_items.map((item) => {
					return (
						<NavList
							key={item.key}
							data={item}
							depth={1}
							hasChild={!!item.children}
						/>
					)
				})}
			</Drawer>
		</Stack>
	)
}

export default MobileMenu
