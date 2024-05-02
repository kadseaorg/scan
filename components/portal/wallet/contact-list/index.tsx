import {
	Ref,
	forwardRef,
	useCallback,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from 'react'

import { isAddress } from '@ethersproject/address'
import { Pencil, Plus, SendHorizontal, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/router'
import pinyin from 'pinyin'
import { mainnet, useEnsAddress } from 'wagmi'

import AddressAvatar from '@/components/common/address-avatar'
import NoDataSvg from '@/components/common/svg-icon/no-data'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { IsScroll } from '@/constants'
import ROUTES from '@/constants/routes'
import usePortalContext from '@/hooks/portal/use-portal-context'
import { cn } from '@/lib/utils'
import {
	IWalletContractType,
	usePortalWalletContactStore,
} from '@/stores/portal/wallet/contact'
import { usePortalWalletSendStore } from '@/stores/portal/wallet/send'
import { getThemeImgSrc } from '@/utils'

export const AddWalletContactDialog = forwardRef(
	function AddWalletContact(_props, ref) {
		const { walletAddress } = usePortalContext()
		const {
			walletContacts,
			setWalletContact,
			editWalletContact,
			deleteWalletContact,
		} = usePortalWalletContactStore()

		const [openAddContactDialog, setOpenAddContactDialog] = useState(false)
		const [contactName, setContactName] = useState('')
		const [contactAddress, setContactAddress] = useState('')
		const [contactEditData, setContactEditData] =
			useState<IWalletContractType>()

		const isContactNameExists = useMemo(
			() =>
				!!walletAddress &&
				!!contactName &&
				!!!contactEditData &&
				walletContacts?.[walletAddress]?.some(
					({ name }) => name === contactName?.trim(),
				),
			[contactName, contactEditData, walletAddress, walletContacts],
		)

		const onAddContact = useCallback((name = '', address = '') => {
			setContactName(name)
			setContactAddress(address)
			setContactEditData(undefined)
			setOpenAddContactDialog(true)
		}, [])

		const onEditContact = useCallback((name: string, address: string) => {
			setContactName(name)
			setContactAddress(address)
			setContactEditData({ name, address })
			setOpenAddContactDialog(true)
		}, [])

		const onDeleteContact = useCallback(
			(name: string) => {
				if (!walletAddress) return
				deleteWalletContact(walletAddress, name)
			},
			[deleteWalletContact, walletAddress],
		)

		useImperativeHandle(ref, () => ({
			onAddContact,
			onEditContact,
			onDeleteContact,
		}))

		const onSaveContact = useCallback(() => {
			if (!walletAddress) return

			if (contactEditData) {
				editWalletContact(walletAddress, contactEditData, {
					name: contactName?.trim(),
					address: contactAddress?.trim(),
				})
			} else {
				setWalletContact(walletAddress, {
					name: contactName?.trim(),
					address: contactAddress?.trim(),
				})
			}

			setOpenAddContactDialog(false)
		}, [
			contactAddress,
			contactEditData,
			contactName,
			editWalletContact,
			setWalletContact,
			walletAddress,
		])

		return (
			<Dialog
				open={openAddContactDialog}
				onOpenChange={setOpenAddContactDialog}
			>
				<DialogContent className="w-full max-w-[500px]">
					<DialogHeader>
						<DialogTitle>
							{!!editWalletContact ? 'Edit' : 'Add'} Contact
						</DialogTitle>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="relative">
							<div className="flex items-center absolute top-1/2 -translate-y-1/2 left-3 z-20 text-sm">
								<div className="w-[45px]">Name</div>
								<div className="ml-4 text-muted-foreground">|</div>
							</div>

							<Input
								className="pl-[90px]"
								placeholder="Name of the contact"
								value={contactName}
								onChange={(e) => setContactName(e.target.value)}
								maxLength={20}
							/>
						</div>

						<div className="relative">
							<div className="flex items-center absolute top-1/2 -translate-y-1/2 left-3 z-20 text-sm">
								<div className="w-[45px]">Address</div>
								<div className="ml-4 text-muted-foreground">|</div>
							</div>

							<Input
								className="pl-[90px]"
								placeholder="Ethereum address"
								value={contactAddress}
								onChange={(e) => setContactAddress(e.target.value)}
								maxLength={42}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							className="w-full"
							variant={isContactNameExists ? 'destructive' : 'default'}
							disabled={
								isContactNameExists ||
								!walletAddress ||
								!contactName ||
								!contactAddress ||
								!isAddress(contactAddress?.trim())
							}
							onClick={onSaveContact}
						>
							{isContactNameExists
								? 'Contact name already exists'
								: 'Save Contact'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		)
	},
)

function getPinyin(text: string) {
	return pinyin(text?.trim()?.toLowerCase(), {
		style: pinyin.STYLE_NORMAL,
	}).join('')
}

export const ContactAddressAvatar = ({
	className,
	address,
}: { className?: string; address?: string }) => (
	<div className={cn('relative', className)}>
		<AddressAvatar
			className="shrink-0 rounded-full"
			address={address}
			size={40}
		/>
		<Image
			className="absolute bottom-0 right-0"
			height={IsScroll ? 18 : 20}
			src={getThemeImgSrc('logo')}
			alt="logo"
		/>
	</div>
)

const ContactList: React.ForwardRefRenderFunction<Ref<any>, any> = (
	{ className, filterKeyWord }: { className?: string; filterKeyWord?: string },
	ref: any,
) => {
	const router = useRouter()
	const { walletAddress } = usePortalContext()
	const { walletContacts } = usePortalWalletContactStore()
	const { setSendTo } = usePortalWalletSendStore()

	const addWalletContactDialogRef: any = useRef()

	const onAddContact = useCallback(
		(name = '', address = '') =>
			addWalletContactDialogRef.current?.onAddContact(name?.trim(), address),
		[],
	)

	const onEditContact = useCallback(
		(name: string, address?: string) =>
			addWalletContactDialogRef.current?.onEditContact(name?.trim(), address),
		[],
	)

	const onDeleteContact = useCallback(
		(name: string) =>
			addWalletContactDialogRef.current?.onDeleteContact(name?.trim()),
		[],
	)

	useImperativeHandle(ref, () => ({
		onAddContact,
		onEditContact,
		onDeleteContact,
	}))

	const filteredWalletContactsContent = useMemo(() => {
		if (!walletAddress) return []
		const contacts = walletContacts?.[walletAddress]
		if (!contacts?.length) return []

		if (undefined === filterKeyWord || '' === filterKeyWord?.trim())
			return contacts

		const _filterKeyWord = getPinyin(filterKeyWord)

		return contacts?.filter(
			({ name, address }) =>
				getPinyin(name)?.includes(_filterKeyWord) ||
				getPinyin(address)?.includes(_filterKeyWord),
		)
	}, [filterKeyWord, walletAddress, walletContacts])

	const filteredWalletContacts = useMemo(() => {
		if (!filteredWalletContactsContent?.length) return {}

		const keys = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
		const _filteredWalletContacts: Record<
			string,
			{ name: string; address: string }[]
		> = {}
		keys.split('').forEach((key) => {
			const content = filteredWalletContactsContent?.filter((text) =>
				getPinyin(text.name)?.startsWith(key.toLowerCase()),
			)

			if (!!content?.length) _filteredWalletContacts[key] = content
		})

		return _filteredWalletContacts
	}, [filteredWalletContactsContent])

	const { data: ensAddress, isLoading: isFetchingEnsAddress } = useEnsAddress({
		name: filterKeyWord?.trim(),
		enabled:
			!!filterKeyWord?.trim() &&
			!!filterKeyWord?.trim()?.includes('.') &&
			!!!filteredWalletContactsContent?.length,
		chainId: mainnet.id,
	})

	const onSendTo = useCallback(
		(address?: string) => {
			if (!address) return

			isAddress(address?.trim()) && setSendTo(address?.trim())
			router.push(`${ROUTES.PORTAL.WALLET.INDEX}?tab=assets`)
		},
		[router, setSendTo],
	)

	const renderContactView = useCallback(
		({
			isEnsAddress = false,
			loading = false,
			name,
			address,
		}: {
			isEnsAddress?: boolean
			loading?: boolean
			name?: string
			address?: string
		}) => {
			const iconBtnClass =
				'shrink-0 w-[30px] h-[30px] flex justify-center items-center rounded-full cursor-pointer transition-all hover:opacity-80'

			return (
				<div className="w-full p-4 rounded-lg bg-secondary/40 flex justify-between items-center gap-2">
					<div className="flex items-center gap-4">
						{loading ? (
							<Skeleton className="w-[40px] h-[40px] rounded-full" />
						) : (
							<div className="relative w-[40px] h-[40px]">
								<ContactAddressAvatar address={address} />
							</div>
						)}
						<div>
							{loading ? (
								<Skeleton className="w-[50px] h-[18px] mb-[6px]" />
							) : (
								!!name?.trim() && (
									<div className="font-bold mb-[2px]">{name?.trim()}</div>
								)
							)}

							{loading ? (
								<Skeleton className="w-[120px] h-[16px]" />
							) : (
								<div className={cn('break-all', !!name?.trim() && 'text-xs')}>
									{address}
								</div>
							)}
						</div>
					</div>

					{loading ? (
						<Skeleton className="w-[40px] h-[40px] rounded-full" />
					) : (
						<div className="flex items-center gap-3">
							{(isEnsAddress || !!!name?.trim()) && (
								<div
									className={cn(iconBtnClass, 'bg-secondary')}
									onClick={() => onAddContact?.(name, address)}
								>
									<Plus className="text-primary" size={14} />
								</div>
							)}

							<div
								className={cn(iconBtnClass, 'bg-primary/60')}
								onClick={() => onSendTo(address)}
							>
								<SendHorizontal className="text-white/50" size={14} />
							</div>

							{!isEnsAddress && !!name?.trim() && (
								<>
									<div
										className={cn(iconBtnClass, 'bg-secondary')}
										onClick={() => onEditContact(name, address)}
									>
										<Pencil className="text-primary" size={14} />
									</div>

									<div
										className={cn(iconBtnClass, 'bg-destructive')}
										onClick={() => onDeleteContact(name)}
									>
										<Trash2 className="text-white/50" size={14} />
									</div>
								</>
							)}
						</div>
					)}
				</div>
			)
		},
		[onSendTo],
	)

	const renderEmptyView = useMemo(
		() => (
			<div className="flex justify-center items-center h-[300px]">
				<NoDataSvg width="70px" height="140px" />
			</div>
		),
		[],
	)

	const renderContent = useMemo(() => {
		// ENS
		if (
			!!!filteredWalletContactsContent?.length &&
			!!filterKeyWord &&
			!isAddress(filterKeyWord.trim()) &&
			(!!ensAddress || isFetchingEnsAddress)
		)
			return renderContactView({
				loading: isFetchingEnsAddress,
				isEnsAddress: true,
				name: filterKeyWord,
				address: ensAddress as string,
			})

		// new contract address
		if (
			!!!filteredWalletContactsContent?.length &&
			!!filterKeyWord &&
			isAddress(filterKeyWord.trim())
		)
			return renderContactView({ address: filterKeyWord.trim() })

		// empty
		if (!!!filteredWalletContactsContent?.length) return renderEmptyView

		// contract addresses
		return (
			<div className="flex flex-col gap-4">
				{Object.keys(filteredWalletContacts).map((key) => (
					<div key={key} className="flex flex-col gap-4">
						<div className="font-bold pl-1 -mb-1">{key}</div>
						{filteredWalletContacts?.[key]?.map(({ name, address }) => (
							<div key={name + address}>
								{renderContactView({ name, address })}
							</div>
						))}
					</div>
				))}
			</div>
		)
	}, [
		ensAddress,
		filterKeyWord,
		filteredWalletContacts,
		filteredWalletContactsContent?.length,
		isFetchingEnsAddress,
		renderContactView,
		renderEmptyView,
	])

	return (
		<section className={className}>
			{renderContent}
			<AddWalletContactDialog ref={addWalletContactDialogRef} />
		</section>
	)
}

export default forwardRef(ContactList)
