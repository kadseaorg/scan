import { useCallback, useState } from 'react'

import { Avatar, MenuItem } from '@mui/material'
import { User, usePrivy, useWallets } from '@privy-io/react-auth'
import { usePrivyWagmi } from '@privy-io/wagmi-connector'
// import { User, useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { User2 as UserIcon } from 'lucide-react'
import { usePlausible } from 'next-plausible'
import Router, { useRouter } from 'next/router'
import { useLogin } from '@privy-io/react-auth'

import ROUTES from '@/constants/routes'
import { PlausibleEvents } from '@/types/events'

import MenuPopover from '../common/menu-popover/MenuPopover'
import { Notification } from '../notification'
import { Button } from '../ui/button'

interface SignedProps {
	user: User
}

const Signed = ({ user }: SignedProps) => {
	// const supabase = useSupabaseClient()
	const { login, ready, authenticated, logout } = usePrivy()
	const { wallet, setActiveWallet } = usePrivyWagmi()

	const onSignOut = useCallback(async () => {
		if (!authenticated) {
			Router.push('/')
			return
		}
		wallet?.disconnect()
		await logout()
		setTimeout(() => {
			// Router.reload() // clear trpc cache
			// Router.push('/')
			window.location.replace('/')
		}, 500)
	}, [authenticated])

	const items = [
		{
			label: 'My Accounts',
			onClick: () => Router.push(ROUTES.ACCOUNT.MY_ACCOUNTS),
		},
		{
			label: 'Watch List',
			onClick: () => Router.push(ROUTES.ACCOUNT.WATCH_LIST),
		},
		{
			label: 'Favorite Tokens',
			onClick: () => Router.push(ROUTES.ACCOUNT.FAVORITE_TOKENS),
		},
		{
			label: 'Favorite Dapps',
			onClick: () => Router.push(ROUTES.ACCOUNT.FAVORITE_DAPPS),
		},
		{
			label: 'Name Tags',
			onClick: () => Router.push(ROUTES.ACCOUNT.NAME_TAGS),
		},
		{
			label: 'Txn Private Notes',
			onClick: () => Router.push(ROUTES.ACCOUNT.TXN_PRIVATE_NOTES),
		},
		{
			label: 'API Key',
			onClick: () => Router.push(ROUTES.ACCOUNT.API_KEY),
		},
		{
			label: 'Settings',
			onClick: () => Router.push(ROUTES.ACCOUNT.SETTINGS),
		},
		{
			label: 'Sign Out',
			onClick: onSignOut,
		},
	]

	const [openPopover, setOpenPopover] = useState<HTMLElement | null>(null)

	const handleOpenPopover = (event: React.MouseEvent<HTMLElement>) => {
		setOpenPopover(event.currentTarget)
	}

	const handleClosePopover = () => {
		setOpenPopover(null)
	}

	return (
		<div className="flex items-center space-x-3">
			<Avatar
				onClick={handleOpenPopover}
				sx={{
					width: 28,
					height: 28,
					cursor: 'pointer',
				}}
				src={user.id}
			/>
			<MenuPopover
				disabledArrow
				open={openPopover}
				onClose={handleClosePopover}
				sx={{ width: 200, p: 0 }}
			>
				{items.map((item) => {
					const { onClick, label } = item
					return (
						<MenuItem key={label} onClick={onClick} sx={{ m: 1 }}>
							{label}
						</MenuItem>
					)
				})}
			</MenuPopover>
		</div>
	)
}

const Profile = () => {
	const { user } = usePrivy()
	const plausible = usePlausible<PlausibleEvents>()
	const { login } = useLogin()

	return (
		<div className="flex items-center space-x-3">
			{user ? (
				<div className="flex gap-3">
					<Notification />

					<Signed user={user} />
				</div>
			) : (
				<Button
					className="rounded-full h-8 whitespace-nowrap sm:h-6"
					onClick={() => {
						plausible('Account-Sign in')
						login()
					}}
				>
					<UserIcon className="sm:hidden" size={20} />
					Sign In
				</Button>
			)}
		</div>
	)
}

export default Profile
