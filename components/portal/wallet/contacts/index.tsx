import { useEffect, useRef, useState } from 'react'

import { Search } from 'lucide-react'

import ContactList from '@/components/portal/wallet/contact-list'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import usePortalContext from '@/hooks/portal/use-portal-context'
import {
	EWalletSendStep,
	usePortalWalletSendStore,
} from '@/stores/portal/wallet/send'

const WalletContactsTab: React.FC = () => {
	const { walletAddress } = usePortalContext()
	const contactListRef: any = useRef()
	const { setSendPrePage, setSendStep } = usePortalWalletSendStore()

	const [filterKeyWord, setFilterKeyWord] = useState('')

	useEffect(() => {
		setSendStep(EWalletSendStep.CHOOSE_TOKEN)
		setSendPrePage('FROM_CONTACT_TAB')
	}, [])

	return (
		<section className="w-full max-w-[600px] mx-auto">
			<div className="flex justify-center items-center gap-4">
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
				<Button
					className="shrink-0"
					variant={walletAddress ? 'default' : 'destructive'}
					onClick={() => contactListRef.current?.onAddContact()}
					disabled={!walletAddress}
				>
					{walletAddress ? '+ Add Contact' : 'Connect your wallet first'}
				</Button>
			</div>

			<ContactList
				ref={contactListRef}
				className="mt-6"
				filterKeyWord={filterKeyWord}
			/>
		</section>
	)
}

export default WalletContactsTab
