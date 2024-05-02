import React, { useState } from 'react'

import {
	CheckCircleOutlined,
	CloseCircleOutlined,
	GiftOutlined,
	Loading3QuartersOutlined,
	TwitterOutlined,
	UserOutlined,
	WalletOutlined,
} from '@ant-design/icons'
import { isAddress } from '@ethersproject/address'
import { LoadingButton } from '@mui/lab'
import {
	Button,
	Card,
	Step,
	StepLabel,
	Stepper,
	TextField,
} from '@mui/material'
import { useLogin, usePrivy } from '@privy-io/react-auth'
// import { useSession } from '@supabase/auth-helpers-react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { usePlausible } from 'next-plausible'
import Link from 'next/link'
import { toast } from 'sonner'
import { Hex } from 'viem'
import { useWaitForTransaction } from 'wagmi'

import { CURRENT_CHAIN_ITEM } from '@/constants'
import Container from '@/layout/container'
import { SOCIAL_LINKS } from '@/layout/menu/config'
import { PlausibleEvents } from '@/types/events'
import { trpc } from '@/utils/trpc'
import { useRouter } from 'next/router'

const faucetL1Fee = 0.01
const faucetL2Fee = 0.02

const messageDuration = 5

const App: React.FC = (props) => {
	const plausible = usePlausible<PlausibleEvents>()
	const [current, setCurrent] = useState(0)
	const [tweetUrl, setTweetUrl] = useState('')
	const [twitterIsVerified, setTwitterIsVerified] = useState(false)
	const [walletAddress, setWalletAddress] = useState('')
	const [txhash, setTxhash] = useState('')
	const [claiming, setClaiming] = useState(false)
	const router = useRouter()
	const { login } = useLogin()
	const { data, isError, isLoading } = useWaitForTransaction({
		hash: txhash as Hex,
	})
	const { ready, authenticated, user } = usePrivy()

	// const session = useSession()
	const isLogin = ready && authenticated
	const { network, title } = CURRENT_CHAIN_ITEM
	const chainTips = `${title} ${network.chainType}`

	const handleGenerateTweet = () => {
		const tweetContent = `🔥 I just claimed some test ETH 💰 on @l2scan\n\nThis is the first native #faucet on #scroll. 🚀 \nhttps://scroll-sepolia.l2scan.co/faucet \n\nJoin the #l2scan community and get your free test ETH now!`

		const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
			tweetContent,
		)}`

		plausible('Faucet-Generate tweet')
		window.open(tweetUrl)
	}

	const handleTweetUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setTweetUrl(event.target.value)
	}

	const next = () => {
		if (current === 0 && !isLogin) {
			return
		}
		setCurrent(current + 1)
	}

	const prev = () => {
		setCurrent(current - 1)
	}

	const { isLoading: verifyingTweet, mutate: verifyTweet } =
		trpc.faucet.verifyTweet.useMutation({
			async onSuccess(data) {
				if (data.ok) {
					toast.success('Tweet verified! You can claim your reward now.')
					setTwitterIsVerified(true)
				} else {
					if (data.error) {
						toast.error(data.error)
					} else {
						toast.error(
							'Sorry, the tweet content is not verified. Please share the correct tweet.',
						)
					}
				}
			},
		})

	function handleVerifyTweet(tweetUrl: string) {
		// 1. Check if the tweet URL is valid
		if (!isValidTweetUrl(tweetUrl)) {
			toast.error('Please enter a valid tweet URL.')
			return
		}

		// 2. Verify the tweet content
		verifyTweet(tweetUrl)
	}

	const onClaim = () => {
		// 1. Check if the wallet address is valid
		if (!isAddress(walletAddress)) {
			toast.error('Please enter a valid wallet address.')
			return
		}

		setClaiming(true)

		plausible('Faucet-Claim')
		// 2. Claim the reward
		fetch('/api/faucet/claim', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				address: walletAddress,
				level: twitterIsVerified ? 2 : 1,
			}),
		})
			.then((res) => res.json())
			.then((data) => {
				if (data.message === 'success') {
					setTxhash(data.hash)
					next()
				} else {
					toast.error(data.error)
				}
			})

		setClaiming(false)
	}

	const steps = [
		{
			title: 'Sign up & Log in Account',
			content: (
				<div>
					<div className="text-sm mb-1">
						Please sign up or log in account, then we'll send you{' '}
						<b>{faucetL1Fee} ETH</b>.
					</div>
					<div className="text-sm mb-1">
						You can get <b>{faucetL1Fee} ETH</b> directly, or continue to get
						more by generating the tweet and sharing it for us.
					</div>
					<div className="flex space-x-3">
						<div className="text-lg font-semibold">Account Status:</div>
						{isLogin ? (
							<div className="flex items-center gap-2">
								<CheckCircle2 className="text-green-600" />
								<div className="uppercase font-semibold">logged in</div>
							</div>
						) : (
							<div className="text-red-600 flex space-x-3 items-center">
								<div className="flex items-center gap-2">
									<XCircle className="text-green-600" />
									<div className="uppercase font-semibold">not logged in</div>
								</div>
								<Button size="small" onClick={login}>
									Log in
								</Button>
							</div>
						)}
					</div>
				</div>
			),
			icon: <UserOutlined size={32} />,
		},
		{
			title: 'Share a tweet (optional)',
			content: (
				<div className="flex flex-col space-y-7">
					<div>
						<div className="text-sm">
							Generate the tweet content and share it on Twitter. Don't forget
							to follow{' '}
							<a className="text-primary" href={SOCIAL_LINKS.TWITTER}>
								@l2scan
							</a>{' '}
							and tag us!
						</div>

						<Button onClick={handleGenerateTweet}>
							Generate the tweet
							<TwitterOutlined className="ml-2" />
						</Button>
					</div>

					<div>
						<div className="text-sm mb-1">Share a tweet to get 2x bonus!</div>

						<div className="flex space-x-1 w-96 sm:flex-col sm:space-x-0 sm:w-full">
							<TextField
								className="sm:mb-3"
								size="small"
								placeholder="Enter tweet URL"
								value={tweetUrl}
								onChange={handleTweetUrlChange}
							/>
							<LoadingButton
								className="min-w-[120px]"
								onClick={() => handleVerifyTweet(tweetUrl)}
								disabled={!isValidTweetUrl(tweetUrl)}
								loading={verifyingTweet}
							>
								{twitterIsVerified ? (
									<div className="flex space-x-0.5 items-center">
										<CheckCircleOutlined className="text-green-600" />
										<div className="uppercase font-semibold">verified</div>
									</div>
								) : verifyingTweet ? null : (
									<div>Verify tweet</div>
								)}
							</LoadingButton>
						</div>
					</div>
				</div>
			),
			icon: <TwitterOutlined size={32} />,
		},
		{
			title: 'Configure Wallet',
			content: (
				<div className="flex flex-col space-y-4">
					<div className="text-sm mb-1">
						<WalletOutlined className="mr-2" />
						Wallet address
					</div>

					<div className="flex space-x-2 items-center">
						<TextField
							placeholder="Enter your wallet address"
							className="w-96"
							size="small"
							required
							// pattern="^0x[a-fA-F0-9]{40}$"
							// minLength={10}
							onChange={(e) => setWalletAddress(e.target.value)}
						/>
						<LoadingButton onClick={onClaim} loading={claiming}>
							Claim
						</LoadingButton>
					</div>
					<div className="text-sm py-2">
						Your wallet must hold at least 0.001 ETH on {chainTips} to claim
						your eth.
					</div>
				</div>
			),
			icon: <WalletOutlined />,
		},
		{
			title: 'Dripping',
			content: (
				<div>
					<div className="text-sm mb-1">
						Transaction Hash:{' '}
						<Link target="_blank" href={`/tx/${txhash}`}>
							{txhash}
						</Link>
					</div>
					<div className="text-sm mb-1">
						Transaction Status:{' '}
						{txhash &&
							(isLoading ? (
								<span className="text-primary">
									<Loading3QuartersOutlined className="mx-2 animate-spin" />
									Pending
								</span>
							) : data && data.status === 'success' ? (
								<span className="text-green-600">
									<CheckCircleOutlined className="mx-2" />
									Success
								</span>
							) : (
								<span className="text-red-600">
									<CloseCircleOutlined className="mx-2" />
									Failed
								</span>
							))}
					</div>
					<div className="text-sm mb-1">
						Join in{' '}
						<Link type="link" href={SOCIAL_LINKS.DISCORD}>
							Discord
						</Link>{' '}
						<span className="font-semibold">#scroll-testnet-faucet</span>{' '}
						channel to get more eth.
					</div>
				</div>
			),
			icon: <GiftOutlined />,
		},
	]

	const items = steps.map((item) => ({ key: item.title, title: item.title }))

	return (
		<Container>
			<div className="flex flex-col justify-center items-center py-7 font-mono">
				<div className="text-2xl py-7 font-semibold text-primary dark:text-primary mx-auto flex justify-center sm:text-[20px]">
					{chainTips} Faucet
				</div>
				<div className="text-sm text-center text-muted-foreground dark:text-muted-foreground-dark">
					Native & Fast
				</div>
			</div>

			<Card sx={{ p: 3 }} className="rounded-lg mx-8 sm:mx-0">
				<div className="flex flex-col">
					<div>
						<Stepper activeStep={current} sx={{ mb: 3 }}>
							{items.map(({ key, title }, index) => {
								return (
									<Step
										key={key}
										sx={{ cursor: 'pointer' }}
										onClick={() => setCurrent(index)}
									>
										<StepLabel>{title}</StepLabel>
									</Step>
								)
							})}
						</Stepper>
						<div className="w-full mx-8 leading-7 py-7 sm:mx-0">
							{steps[current].content}
						</div>
						<div className="mx-8 sm:mx-0">
							{current < steps.length - 1 && (
								<Button
									onClick={() => next()}
									disabled={current === 0 && !isLogin}
								>
									Next
								</Button>
							)}
							{current === steps.length - 1 && <Button href="/">Done</Button>}
							{current > 0 && (
								<Button style={{ margin: '0 8px' }} onClick={() => prev()}>
									Previous
								</Button>
							)}
						</div>
					</div>
				</div>
			</Card>
		</Container>
	)
}

function isValidTweetUrl(url: string) {
	// Check if the URL matches the pattern of a tweet URL
	// For example, a tweet URL looks like this: https://twitter.com/{username}/status/{tweetId}
	const pattern = /^https?:\/\/twitter\.com\/\w+\/status\/\d+(?:\?.*)?$/
	return pattern.test(url)
}

export default App
