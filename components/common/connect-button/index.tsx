import { useCallback, useContext, useEffect, useState } from 'react'

import { useLogin, usePrivy, useWallets } from '@privy-io/react-auth'
import { usePrivyWagmi } from '@privy-io/wagmi-connector'
import { Check, ChevronDown, Copy, LogOut } from 'lucide-react'
import Router, { useRouter } from 'next/router'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import PrivyConfigContext, {
	defaultDashboardConfig,
} from '@/context/privy-config'
import { useCopyToClipboard } from '@/lib/hooks/use-copy-to-clipboard'
import { truncate } from '@/utils/abi'
import { usePlausible } from 'next-plausible'
import { PlausibleEvents } from '@/types/events'

const ConnectButton = () => {
	const router = useRouter()
	const plausible = usePlausible<PlausibleEvents>()

	const { logout, ready, authenticated } = usePrivy()
	const { wallet, setActiveWallet } = usePrivyWagmi()
	const [open, setOpen] = useState(false)
	const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 })
	const { setConfig } = useContext(PrivyConfigContext)
	useEffect(() => {
		setConfig?.({ ...defaultDashboardConfig })
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const onCopy = () => {
		if (isCopied) return
		copyToClipboard(wallet?.address || '')
	}
	const onLogout = async () => {
		wallet?.disconnect()
		await logout()
		setOpen(false)
		Router.reload() // clear trpc cache
	}
	const { login } = useLogin()
	return (
		<>
			<div>
				{!(ready && authenticated) && (
					// <Button onClick={login}>Connect Wallet</Button>
					<Button
						onClick={() => {
							plausible('Account-Sign in')
							login()
						}}
					>
						Connect Wallet
					</Button>
				)}
				{ready && authenticated && wallet && (
					<div
						className="flex items-center py-2 px-4 rounded border hover:scale-[1.1] transition-all cursor-pointer"
						onClick={() => setOpen(true)}
					>
						<span>{truncate(wallet?.address)}</span>
						<ChevronDown size={16} />
					</div>
				)}
			</div>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent>
					<div className="flex-col flex-center mx-auto text-muted-foreground w-fit text-base">
						<p className="text-lg font-medium text-center mb-4">
							{truncate(wallet?.address || '')}
						</p>
						<div className="flex flex-center gap-2">
							<Button variant="secondary" className="" onClick={onCopy}>
								<span className="mr-2">
									{isCopied ? 'Copied!' : 'Copy Address'}{' '}
								</span>
								{isCopied ? <Check size={16} /> : <Copy size={16} />}
							</Button>
							<Button variant="secondary" className="" onClick={onLogout}>
								<span className="mr-2">Disconect</span>
								<LogOut size={16} />
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	)
}

export default ConnectButton
