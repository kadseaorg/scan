import React, { useContext, useEffect, useState } from 'react'

import {
	WalletWithMetadata,
	useMfaEnrollment,
	usePrivy,
	useWallets,
} from '@privy-io/react-auth'
import { usePrivyWagmi } from '@privy-io/wagmi-connector'
import {
	FileUp,
	MailIcon,
	Phone,
	PlusIcon,
	ShieldCheckIcon,
	Trash,
} from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { toast } from 'sonner'

import PageTitle from '@/components/common/page-title'
import AuthLinker from '@/components/settings/auth-linker'
import GitHubIcon from '@/components/settings/icons/social/github'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import PrivyConfigContext, {
	defaultDashboardConfig,
} from '@/context/privy-config'
import Container from '@/layout/container'
import { trpc } from '@/utils/trpc'

const Settings: React.FC = (props) => {
	const [isDeleting, setIsDeleting] = useState(false)
	// const [activeWallet, setActiveWallet] = useState<WalletWithMetadata | null>(null)
	const {
		isLoading: deleteLoading,
		mutateAsync: deleteMyAccount,
		error,
	} = trpc.account.deleteAccount.useMutation()
	const router = useRouter()
	const { showMfaEnrollmentModal } = useMfaEnrollment()
	const { setConfig } = useContext(PrivyConfigContext)
	const { wallet: activeWallet, setActiveWallet } = usePrivyWagmi()
	const {
		connectWallet,
		ready,
		authenticated,
		user,
		logout,
		linkEmail,
		linkWallet,
		unlinkEmail,
		linkPhone,
		unlinkPhone,
		linkGoogle,
		unlinkGoogle,
		linkTwitter,
		unlinkTwitter,
		linkDiscord,
		unlinkDiscord,
		linkGithub,
		unlinkGithub,
		linkApple,
		unlinkApple,
		linkLinkedIn,
		unlinkLinkedIn,
		linkTiktok,
		unlinkTiktok,
		linkFarcaster,
		unlinkFarcaster,
		getAccessToken,
		createWallet,
		exportWallet,
		unlinkWallet,
		setWalletPassword,
		setActiveWallet: sdkSetActiveWallet,
	} = usePrivy()

	const { wallets: connectedWallets } = useWallets()
	const mfaEnabled = user?.mfaMethods.length ?? 0 > 0

	const linkedAccounts = user?.linkedAccounts || []
	const wallets = linkedAccounts.filter(
		(a) => a.type === 'wallet',
	) as WalletWithMetadata[]
	const hasSetPassword = wallets.some(
		(w) =>
			w.walletClientType === 'privy' && w.recoveryMethod === 'user-passcode',
	)

	const linkedAndConnectedWallets = wallets
		.filter((w) => connectedWallets.some((cw) => cw.address === w.address))
		.sort((a, b) =>
			b.verifiedAt
				.toLocaleString()
				.localeCompare(a.verifiedAt.toLocaleString()),
		)

	// useEffect(() => {
	//   // if no active wallet is set, set it to the first one if available
	//   if (!activeWallet && linkedAndConnectedWallets.length > 0) {
	//     setActiveWallet(linkedAndConnectedWallets[0]!)
	//   }
	//   // if an active wallet was removed from wallets, clear it out
	//   if (!linkedAndConnectedWallets.some(w => w.address === activeWallet?.address)) {
	//     setActiveWallet(linkedAndConnectedWallets.length > 0 ? linkedAndConnectedWallets[0]! : null)
	//   }
	// }, [activeWallet, linkedAndConnectedWallets])

	useEffect(() => {
		setConfig?.({ ...defaultDashboardConfig })
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const embeddedWallet = wallets.filter(
		(wallet) => wallet.walletClient === 'privy',
	)?.[0]

	const numAccounts = linkedAccounts.length || 0
	const canRemoveAccount = numAccounts > 1

	const emailAddress = user?.email?.address
	const phoneNumber = user?.phone?.number

	const googleSubject = user?.google?.subject
	const googleName = user?.google?.name

	const twitterSubject = user?.twitter?.subject
	const twitterUsername = user?.twitter?.username

	const discordSubject = user?.discord?.subject
	const discordUsername = user?.discord?.username

	const githubSubject = user?.github?.subject
	const githubUsername = user?.github?.username

	const linkedinSubject = user?.linkedin?.subject
	const linkedinName = user?.linkedin?.name

	const appleSubject = user?.apple?.subject
	const appleEmail = user?.apple?.email

	const tiktokSubject = user?.tiktok?.subject
	const tiktokUsername = user?.tiktok?.username

	const farcasterSubject = user?.farcaster?.fid
	const farcasterName = user?.farcaster?.username

	if (!ready || !authenticated || !user) {
		return <div>Loading...</div>
	}

	const deleteAccount = async () => {
		try {
			await deleteMyAccount()
		} catch (e) {
			console.log(e)
			toast.error('Something went wrong. Please try again later.')
		}
		await logout()
		// router.push('/')
		window.location.replace('/')
	}

	// Remove unknown walletClients.
	// `user` has to be `any` type because by default walletClient is required.
	const removeUnknownWalletClients = (user: any) => {
		user.linkedAccounts.forEach((linkedAccount: any, index: number) => {
			if (
				linkedAccount.type === 'wallet' &&
				linkedAccount.walletClient === 'unknown'
			) {
				delete user.linkedAccounts[index].walletClient
			}
		})
		if (user.wallet?.walletClient === 'unknown') {
			delete user.wallet.walletClient
		}
		return user
	}

	const linkedSocials = [
		{
			socialIcon: (
				<MailIcon
					className="h-[1.125rem] w-[1.125rem] shrink-0 grow-0"
					strokeWidth={2}
				/>
			),
			label: 'Email',
			linkedLabel: emailAddress,
			canUnlink: canRemoveAccount,
			isLinked: !!emailAddress,
			unlinkAction: () => {
				unlinkEmail(emailAddress as string)
			},
			linkAction: linkEmail,
		},
		{
			socialIcon: (
				<Phone
					className="h-[1.125rem] w-[1.125rem] shrink-0 grow-0"
					strokeWidth={2}
				/>
			),
			label: 'Phone',
			linkedLabel: `${phoneNumber}`,
			canUnlink: canRemoveAccount,
			isLinked: !!phoneNumber,
			unlinkAction: () => {
				unlinkPhone(phoneNumber as string)
			},
			linkAction: linkPhone,
		},
		{
			socialIcon: (
				<div className="h-[1.125rem] w-[1.125rem] shrink-0 grow-0">
					<Image src="/svgs/google.svg" height={20} width={20} alt="Google" />
				</div>
			),

			label: 'Google',
			linkedLabel: googleName,
			canUnlink: canRemoveAccount,
			isLinked: !!googleSubject,
			unlinkAction: () => {
				unlinkGoogle(googleSubject as string)
			},
			linkAction: linkGoogle,
		},
		{
			socialIcon: (
				<div className="h-[1.125rem] w-[1.125rem] shrink-0 grow-0">
					<GitHubIcon height={18} width={18} />
				</div>
			),
			label: 'Github',
			linkedLabel: githubUsername,
			canUnlink: canRemoveAccount,
			isLinked: !!githubSubject,
			unlinkAction: () => {
				unlinkGithub(githubSubject as string)
			},
			linkAction: linkGithub,
		},
		// {
		//   socialIcon: (
		//     <div className="h-[1.125rem] w-[1.125rem] shrink-0 grow-0">
		//       <TwitterXIcon height={18} width={18} />
		//     </div>
		//   ),
		//   label: 'Twitter',
		//   linkedLabel: twitterUsername,
		//   canUnlink: canRemoveAccount,
		//   isLinked: !!twitterSubject,
		//   unlinkAction: () => {
		//     unlinkTwitter(twitterSubject as string)
		//   },
		//   linkAction: linkTwitter
		// },
		// {
		//   socialIcon: (
		//     <div className="h-[1.125rem] w-[1.125rem] shrink-0 grow-0">
		//       <Image src="/svgs/discord_social.svg" height={20} width={20} alt="Discord" />
		//     </div>
		//   ),
		//   label: 'Discord',
		//   linkedLabel: discordUsername,
		//   canUnlink: canRemoveAccount,
		//   isLinked: !!discordSubject,
		//   unlinkAction: () => {
		//     unlinkDiscord(discordSubject as string)
		//   },
		//   linkAction: linkDiscord
		// },

		// {
		//   socialIcon: (
		//     <div className="h-[1.125rem] w-[1.125rem] shrink-0 grow-0 text-privy-color-foreground">
		//       <AppleIcon height={18} width={18} />
		//     </div>
		//   ),
		//   label: 'Apple',
		//   linkedLabel: appleEmail,
		//   canUnlink: canRemoveAccount,
		//   isLinked: !!appleSubject,
		//   unlinkAction: () => {
		//     unlinkApple(appleSubject as string)
		//   },
		//   linkAction: linkApple
		// },
		// {
		//   socialIcon: (
		//     <div className="h-[1.125rem] w-[1.125rem] shrink-0 grow-0">
		//       <Image src="/svgs/linkedin.svg" height={20} width={20} alt="LinkedIn" />
		//     </div>
		//   ),

		//   label: 'LinkedIn',
		//   linkedLabel: linkedinName,
		//   canUnlink: canRemoveAccount,
		//   isLinked: !!linkedinSubject,
		//   unlinkAction: () => {
		//     unlinkLinkedIn(linkedinSubject as string)
		//   },
		//   linkAction: linkLinkedIn
		// },
		// {
		//   socialIcon: (
		//     <div className="h-[1.125rem] w-[1.125rem] shrink-0 grow-0 text-privy-color-foreground">
		//       <TikTokIcon height={18} width={18} />
		//     </div>
		//   ),
		//   label: 'TikTok',
		//   linkedLabel: tiktokUsername,
		//   canUnlink: canRemoveAccount,
		//   isLinked: !!tiktokSubject,
		//   unlinkAction: () => {
		//     unlinkTiktok(tiktokSubject as string)
		//   },
		//   linkAction: linkTiktok
		// },
		// {
		//   socialIcon: (
		//     <div className="h-[1.125rem] w-[1.125rem] shrink-0 grow-0 text-privy-color-foreground">
		//       <FarcasterIcon height={18} width={18} />
		//     </div>
		//   ),
		//   label: 'Farcaster',
		//   linkedLabel: farcasterName,
		//   canUnlink: canRemoveAccount,
		//   isLinked: !!farcasterSubject,
		//   unlinkAction: () => {
		//     unlinkFarcaster(farcasterSubject as number)
		//   },
		//   linkAction: linkFarcaster
		// }
	]

	return (
		<Container>
			<PageTitle title="Settings" />
			<div className="px-3">
				<Card className="rounded-lg border bg-card text-card-foreground shadow-sm mb-6">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-sm">
							<p>Wallets</p>
						</CardTitle>
						<CardDescription>
							<div className="pb-1 text-sm text-muted-foreground">
								Connect and link wallets to your account.
							</div>
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 gap-2">
							{wallets.map((wallet) => {
								return (
									<AuthLinker
										isLinked
										wallet={wallet}
										isActive={wallet.address === activeWallet?.address}
										setActiveWallet={() => {
											const connectedWallet = connectedWallets.find(
												(w) => w.address === wallet.address,
											)
											if (!connectedWallet) connectWallet()
											else setActiveWallet(connectedWallet)
										}}
										key={wallet.address}
										label={wallet.address}
										canUnlink={canRemoveAccount}
										unlinkAction={() => {
											unlinkWallet(wallet.address)
										}}
										walletConnectorName={
											connectedWallets.find(
												(cw) => cw.address === wallet.address,
											)?.walletClientType
										}
										linkAction={linkWallet}
										isConnected={connectedWallets.some(
											(cw) => cw.address === wallet.address,
										)}
										connectAction={sdkSetActiveWallet}
									/>
								)
							})}
							<button
								className="flex items-center justify-center border hover:bg-accent  rounded button h-10 gap-x-1 px-4 text-sm"
								onClick={linkWallet}
							>
								<PlusIcon className="h-4 w-4" strokeWidth={2} />
								Link a Wallet
							</button>
						</div>
					</CardContent>
				</Card>
				<Card className="rounded-lg border bg-card text-card-foreground shadow-sm mb-6">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-sm">
							<p>Embedded Wallets</p>
						</CardTitle>
						<CardDescription>
							<div className="pb-1 text-sm text-muted-foreground">
								{embeddedWallet
									? " A user's embedded wallet is theirs to keep, and even take with them."
									: ' With Privy, even non web3 natives can enjoy the benefits of life on chain.'}
							</div>
						</CardDescription>
					</CardHeader>
					<CardContent>
						{embeddedWallet ? (
							<div className="grid grid-cols-2 gap-2 pt-4">
								{!hasSetPassword && (
									<button
										className="flex items-center justify-center border hover:bg-accent rounded button h-10 gap-x-1 px-4 text-sm"
										disabled={!(ready && authenticated)}
										onClick={setWalletPassword}
									>
										<ShieldCheckIcon className="h-4 w-4" strokeWidth={2} />
										Set a recovery password
									</button>
								)}
								<button
									className="flex items-center justify-center border hover:bg-accent rounded button h-10 gap-x-1 px-4 text-sm"
									disabled={!(ready && authenticated)}
									onClick={exportWallet}
								>
									<FileUp className="h-4 w-4" strokeWidth={2} />
									Export Embedded wallet
								</button>
							</div>
						) : (
							<div className="grid grid-cols-2 gap-2 pt-4">
								<button
									className="flex items-center justify-center border border-primary rounded button h-10 gap-x-1 px-4 text-sm"
									disabled={!(ready && authenticated)}
									onClick={() => {
										createWallet()
									}}
								>
									<PlusIcon className="h-4 w-4" strokeWidth={2} />
									Create an Embedded Wallet
								</button>
							</div>
						)}
					</CardContent>
				</Card>
				<Card className="rounded-lg border bg-card text-card-foreground shadow-sm mb-6">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-sm">
							<p>Linked Socials</p>
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 gap-2">
							{linkedSocials.map((social) => (
								<AuthLinker
									key={social.label}
									socialIcon={social.socialIcon}
									label={social.label}
									linkedLabel={social.linkedLabel}
									canUnlink={social.canUnlink}
									isLinked={social.isLinked}
									unlinkAction={social.unlinkAction}
									linkAction={social.linkAction}
								/>
							))}
						</div>
					</CardContent>
				</Card>
				<Card className="rounded-lg border bg-card text-card-foreground shadow-sm mb-6">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-sm">
							<p>Account</p>
						</CardTitle>
					</CardHeader>
					<CardContent>
						<button
							className="flex items-center justify-center border hover:bg-accent rounded button h-10 gap-x-1 px-4 text-sm  !text-red-400"
							disabled={!(ready && authenticated)}
							onClick={deleteAccount}
						>
							<Trash className="h-4 w-4" strokeWidth={2} />
							{!deleteLoading ? 'Delete Account' : 'Deleting account...'}
						</button>
					</CardContent>
				</Card>
			</div>
		</Container>
	)
}

export default Settings
