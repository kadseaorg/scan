import { ChevronRight, PanelLeftOpen, PanelRightOpen } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'

import ChainSwitcher from '@/components/common/chain-switcher'
import {
	Menubar,
	MenubarContent,
	MenubarItem,
	MenubarMenu,
	MenubarTrigger,
} from '@/components/ui/menubar'
import { Separator } from '@/components/ui/separator'
import { CHAIN_TYPE, CURRENT_CHAIN_ITEM } from '@/constants'
import { useMenuCollapsed } from '@/hooks/common/useMenuCollapsed'
import useTheme from '@/hooks/common/useTheme'
import { ROUTES_MENUS, SOCIAL_LINKS } from '@/layout/menu/config'
import { cn } from '@/lib/utils'

import { LogoIcon } from './common/svg-icon'
import { Button } from './ui/button'

// const donationsAddr = '0xFDBab5e7404bC92a33245651B1D1828d3BEb7C21'

export function MainNav() {
	const { isLight } = useTheme()
	const [menuCollapsed, setMenuCollapsed] = useMenuCollapsed()
	const router = useRouter()
	const activeMenu = (() => {
		for (const menu of ROUTES_MENUS) {
			if (menu.route === router.pathname) {
				return menu.key
			} else if (menu.children) {
				const submenu = menu.children.find(
					(sub) => sub.route === router.pathname,
				)
				if (submenu) {
					return menu.key
				}
			}
		}
	})()

	return !menuCollapsed ? (
		<div className="flex flex-col gap-7 items-center py-7 sm:hidden">
			<ChainSwitcher className="px-[4px]" />
			<Menubar className="flex flex-col gap-5 mx-3 border-none bg-transparent">
				{ROUTES_MENUS.map((menu) => (
					<MenubarMenu key={menu.key}>
						<MenubarTrigger
							className={cn(
								menu.key == activeMenu && 'bg-primary text-primary-foreground',
								'flex items-center justify-between w-full text-md',
							)}
						>
							{menu.children ? (
								<div className="flex items-center gap-2">
									{menu.icon}
									{menu.label}
								</div>
							) : (
								<Link
									href={menu.route || ''}
									className="flex items-center gap-2"
								>
									{menu.icon}
									{menu.label}
								</Link>
							)}
							{menu.children && <ChevronRight size={18} />}
						</MenubarTrigger>
						{menu.children && (
							<MenubarContent
								side="right"
								className={cn(`theme-${CHAIN_TYPE}`)}
							>
								{menu.children.map((submenu) => (
									<Link key={submenu.key} href={submenu.route}>
										<MenubarItem
											className={cn(
												submenu.route == router.pathname &&
													'bg-primary text-foreground',
											)}
											key={submenu.key}
										>
											{submenu.label}
										</MenubarItem>
									</Link>
								))}
							</MenubarContent>
						)}
					</MenubarMenu>
				))}
			</Menubar>

			<div className="fixed bottom-0 flex flex-col items-center justify-center px-4 py-3 gap-7 text-muted-foreground/50 border-b">
				<div className={cn('pt-4 flex space-x-4 justify-center')}>
					<Link
						href={SOCIAL_LINKS.TWITTER}
						target="_blank"
						rel="noreferrer"
						className="hover:opacity-80"
					>
						<Image
							src="/svgs/twitter.svg"
							width={20}
							height={20}
							alt="twitter"
							className="text-blue-300"
						/>
					</Link>
					<Link
						href={SOCIAL_LINKS.DISCORD}
						target="_blank"
						rel="noreferrer"
						className="hover:opacity-80"
					>
						<Image
							src="/svgs/discord.svg"
							width={20}
							height={20}
							alt="discord"
						/>
					</Link>
					<Link
						href={SOCIAL_LINKS.MAIL}
						target="_blank"
						rel="noreferrer"
						className="hover:opacity-80"
					>
						<Image
							src="/svgs/email.svg"
							width={20}
							height={20}
							alt="telegram"
							className="text-orange"
						/>
					</Link>
					<Separator
						orientation="vertical"
						className="mx-1 h-[20px] sm:hidden"
					/>
					<Link
						href={SOCIAL_LINKS.FEEDBACK}
						target="_blank"
						rel="noreferrer"
						className="hover:opacity-80"
					>
						<Image
							src={isLight ? '/svgs/feedback.svg' : '/svgs/feedback_dark.svg'}
							width={20}
							height={20}
							alt="feedback"
							className="text-orange"
						/>
					</Link>
				</div>

				{/* <div className={`flex items-center flex-col`}>
          <p>Donations:</p>
          <L2scanLink type={LinkTypeEnum.ADDRESS} value={donationsAddr}>
            {donationsAddr.slice(0, 6) + '...' + donationsAddr.slice(-4)}
          </L2scanLink>
        </div> */}

				<Button
					variant="ghost"
					onClick={() => setMenuCollapsed(!menuCollapsed)}
				>
					<PanelRightOpen />
				</Button>
			</div>
		</div>
	) : (
		<div className="flex flex-col gap-7 items-center py-7 px-3 text-muted-foreground/50 sm:hidden">
			<LogoIcon chain={CURRENT_CHAIN_ITEM.chainType} />
			{ROUTES_MENUS.map((menu) => (
				<Button
					variant="ghost"
					key={menu.key}
					onClick={() => setMenuCollapsed(!menuCollapsed)}
				>
					{menu.icon}
				</Button>
			))}
			<Button
				className="fixed bottom-0 "
				variant="ghost"
				onClick={() => setMenuCollapsed(!menuCollapsed)}
			>
				<PanelLeftOpen />
			</Button>
		</div>
	)
}
