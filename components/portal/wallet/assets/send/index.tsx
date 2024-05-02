import { useCallback, useEffect, useMemo, useState } from 'react'

import BigNumber from 'bignumber.js'
import dayjs from 'dayjs'
import { CheckCircle, Loader2, Send } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { toast } from 'sonner'
import {
	TransactionReceipt,
	formatUnits,
	getContract,
	parseEther,
	parseUnits,
} from 'viem'
import { erc20ABI, usePublicClient, useWalletClient } from 'wagmi'

import SimpleTooltip from '@/components/common/simple-tooltip'
import { RefreshGasProgress } from '@/components/portal/bridge/bridge-form'
import { WalletAssetsBack } from '@/components/portal/wallet/assets'
import { ContactAddressAvatar } from '@/components/portal/wallet/contact-list'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { CHAIN_TOKEN_NAME, ETH_SYMBOL, IsZkSync } from '@/constants'
import { ETH_L1_ADDRESS, ETH_ZKSYNC_L2_ADDRESS } from '@/constants/address'
import ROUTES from '@/constants/routes'
import useUsdExchangeRates from '@/hooks/common/use-usd-exchange-rates'
import {
	useWalletSendGasFee,
	useWalletSendNetwork,
} from '@/hooks/portal/wallet/use-wallet-send'
import {
	IPortalWalletToken,
	usePortalWalletStore,
} from '@/stores/portal/wallet'
import {
	EWalletSendStep,
	usePortalWalletSendStore,
} from '@/stores/portal/wallet/send'
import { getThemeImgSrc } from '@/utils'

const TokenSelectItem = ({ token }: { token?: IPortalWalletToken }) => (
	<div className="flex items-center gap-2">
		<div className="w-[120px] flex items-center gap-2">
			{!!token?.logo ? (
				<Image
					className="rounded-full"
					src={token?.logo}
					width={24}
					height={24}
					alt="logo"
				/>
			) : (
				<div className="w-[24px] h-[24px] rounded-full bg-muted"></div>
			)}
			<div className="w-[90px] ellipsis text-left">{token?.symbol}</div>
		</div>

		<div className="flex flex-col">
			<div className="w-fit">Balance:</div>
			<div className="w-fit">
				{token?.formatedBalance} {token?.symbol}
			</div>
		</div>
	</div>
)

const WalletSendPage: React.FC = () => {
	const router = useRouter()
	const publicClient = usePublicClient()
	const { data: walletClient } = useWalletClient()
	const { tokenList } = usePortalWalletStore()
	const { sendPrePage, setSendStep, sendToken, sendTo, setSendToken } =
		usePortalWalletSendStore()
	const {
		onSwitchNetwork,
		isSwitchingNetwork,
		correctNetwork,
		isCorrectNetworkSet,
	} = useWalletSendNetwork()
	const { isFetchingGas, gasEstimate, onEstimateGas } = useWalletSendGasFee()
	const { convertToUsdPrice } = useUsdExchangeRates()

	const [amount, setAmount] = useState('')

	useEffect(() => {
		setAmount('')
	}, [walletClient?.account?.address, sendToken])

	useEffect(() => {
		// change network
		if (!!!sendToken || tokenList[0]?.chainId !== sendToken?.chainId) {
			undefined !== tokenList[0]?.balance && setSendToken(tokenList[0])
		}
	}, [sendToken, setSendToken, tokenList])

	const selectedTokenAddress = useMemo(() => {
		if (!!sendToken) return sendToken?.address

		return IsZkSync ? ETH_ZKSYNC_L2_ADDRESS : ETH_L1_ADDRESS
	}, [sendToken])

	const selectedToken = useMemo(
		() => tokenList?.find(({ address }) => address === selectedTokenAddress),
		[selectedTokenAddress, tokenList],
	)

	const onSelectToken = useCallback(
		(tokenAddress: string) =>
			setSendToken(tokenList?.find(({ address }) => address === tokenAddress)),
		[setSendToken, tokenList],
	)

	const invalidSendStatus = useMemo(
		() =>
			!isCorrectNetworkSet || (sendToken?.balance ?? BigInt(0)) === BigInt(0),
		[isCorrectNetworkSet, sendToken?.balance],
	)

	const maxAmount = useMemo(() => {
		if (!!!sendToken) return '0'

		const tokenBalance = formatUnits(
			sendToken?.balance ?? BigInt(0),
			sendToken.decimals,
		)

		return sendToken.native
			? BigNumber(tokenBalance)
					.minus(gasEstimate ?? '0')
					.toString()
			: tokenBalance
	}, [gasEstimate, sendToken])

	const invalidSendAmount = useMemo(
		() =>
			BigNumber(amount || 0).isZero() ||
			BigNumber(amount || '0').isGreaterThan(maxAmount),
		[amount, maxAmount],
	)

	const onAmountChange = useCallback(
		(value?: string) => {
			const _value = value?.trim()

			if (
				!!!sendToken ||
				undefined === _value ||
				BigNumber(_value).isLessThan(0)
			) {
				setAmount('0.0')
				return
			}

			if (
				_value.includes('.') &&
				(_value.split('.')[1].length || 0) > sendToken.decimals
			) {
				setAmount('0.0')
				console.error(
					`The fractional component exceeds ${sendToken.decimals} decimal places.`,
				)
				return
			}

			if (BigNumber(_value).isGreaterThan(maxAmount)) {
				setAmount(maxAmount)
				return
			}

			setAmount(_value)
		},
		[maxAmount, sendToken],
	)

	const [txLoading, setTxLoading] = useState(false)
	const [openTxResultDialog, setOpenTxResultDialog] = useState(false)
	const [txData, setTxData] = useState<
		TransactionReceipt & {
			amount?: string
			token?: IPortalWalletToken
			timestamp?: number
		}
	>()

	const onSend = useCallback(async () => {
		if (
			!publicClient ||
			!walletClient ||
			!walletClient.account.address ||
			invalidSendStatus ||
			invalidSendAmount
		)
			return

		setTxLoading(true)
		const _amount = parseUnits(amount ?? '0', sendToken!.decimals)

		const sendETH = async () => {
			try {
				const hash = await walletClient.sendTransaction({
					to: sendTo as `0x${string}`,
					value: parseEther(amount ?? '0'),
				})
				const txResult = await publicClient.waitForTransactionReceipt({ hash })
				return Promise.resolve(txResult)
			} catch (error) {
				return Promise.reject(error)
			} finally {
				setTxLoading(false)
			}
		}

		const sendERC20 = async () => {
			try {
				const account = walletClient.account.address
				const contract = getContract({
					address: sendToken!.address as `0x${string}`,
					abi: erc20ABI,
					walletClient,
				})
				const allowance = await publicClient.readContract({
					address: sendToken!.address as `0x${string}`,
					abi: erc20ABI,
					functionName: 'allowance',
					args: [account, account],
				})
				if (allowance === BigInt(0)) {
					const hash = await contract.write.approve([account, _amount])
					await publicClient.waitForTransactionReceipt({ hash })
				}
				const txHash = await contract.write.transfer([
					sendTo as `0x${string}`,
					_amount,
				])
				const txResult = await publicClient.waitForTransactionReceipt({
					hash: txHash,
				})
				return Promise.resolve(txResult)
			} catch (error) {
				return Promise.reject(error)
			} finally {
				setTxLoading(false)
			}
		}

		try {
			const txResult = sendToken!.native ? await sendETH() : await sendERC20()
			let _timestamp
			if (!!txResult.blockNumber) {
				const { timestamp } = await publicClient.getBlock({
					blockNumber: txResult.blockNumber,
				})
				_timestamp = Number(timestamp) * 1000
			}
			setTxData({
				...txResult,
				amount,
				token: sendToken,
				timestamp: _timestamp,
			})
			setOpenTxResultDialog(true)
			setAmount('')
		} catch (error: any) {
			if (error?.cause?.code !== 4001) {
				!!error?.message && toast.error(error.message)
			}
		}
	}, [
		amount,
		invalidSendAmount,
		invalidSendStatus,
		publicClient,
		sendTo,
		sendToken,
		walletClient,
	])

	const [showFeeUsdPrice, setShowFeeUsdPrice] = useState(false)

	return (
		<>
			<section className="w-full max-w-[600px] mx-auto">
				<WalletAssetsBack
					onClick={
						sendPrePage === 'FROM_CONTACT_TAB'
							? () =>
									router.push({
										pathname: ROUTES.PORTAL.WALLET.INDEX,
										query: { tab: 'contacts' },
									})
							: undefined
					}
					sendStep={
						sendPrePage === 'FROM_CHOOSE_CONTACT'
							? EWalletSendStep.CHOOSE_CONTACT
							: undefined
					}
				/>
				<Card className="w-full px-6 py-8 space-y-6">
					<div className="mb-4 text-2xl text-center font-bold">Send To</div>
					<div className="flex justify-center items-center gap-4">
						<ContactAddressAvatar className="shrink-0" address={sendTo} />
						<div className="break-all">{sendTo}</div>
					</div>

					<div className="w-full flex items-center gap-2 sm:flex-col sm:items-start">
						<div className="w-[85px] text-xl font-bold">Asset:</div>

						<div className="flex-1 sm:w-full">
							<Select
								value={sendToken?.address}
								onValueChange={onSelectToken}
								disabled={!isCorrectNetworkSet || !!!tokenList}
							>
								<SelectTrigger className="!h-[60px]">
									{<TokenSelectItem token={selectedToken} />}
								</SelectTrigger>
								<SelectContent>
									{!!tokenList &&
										tokenList?.map((token) => (
											<SelectItem key={token.address} value={token.address}>
												{<TokenSelectItem token={token} />}
											</SelectItem>
										))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="w-full flex items-center gap-2 sm:flex-col sm:items-start">
						<div className="w-[85px] text-xl font-bold">Amount:</div>

						<div className="flex-1 sm:w-full relative">
							<Button
								className="absolute left-0 top-0 bottom-0 my-auto"
								variant="link"
								size="sm"
								disabled={!!!gasEstimate || invalidSendStatus}
								onClick={() => setAmount(maxAmount)}
							>
								Max
							</Button>
							<Input
								className="h-[60px] pl-[55px] pr-[100px] bg-background"
								placeholder="0.0"
								type="number"
								disabled={invalidSendStatus}
								value={amount}
								onChange={({ target }) => onAmountChange(target.value)}
							/>
							<div className="absolute right-4 top-0 bottom-0 my-auto w-fit h-fit">
								{sendToken?.symbol}
							</div>
						</div>
					</div>

					<div className="flex items-center gap-1 text-xs">
						<div>Estimated gas fees:</div>
						{!isCorrectNetworkSet ? (
							'-'
						) : isFetchingGas ? (
							<Skeleton className="w-[100px] h-[16px]" />
						) : (
							<SimpleTooltip
								content={`Click to switch to ${
									showFeeUsdPrice ? CHAIN_TOKEN_NAME : 'USD'
								}`}
							>
								<div
									className="cursor-pointer"
									onClick={() => setShowFeeUsdPrice((pre) => !pre)}
								>
									{undefined === gasEstimate
										? '-'
										: showFeeUsdPrice
										  ? convertToUsdPrice(gasEstimate, {
													symbol: CHAIN_TOKEN_NAME,
											  }) || '$0'
										  : `${gasEstimate} ${ETH_SYMBOL}`}
								</div>
							</SimpleTooltip>
						)}

						{isCorrectNetworkSet && undefined !== gasEstimate && (
							<RefreshGasProgress size={10} refreshCb={onEstimateGas} />
						)}
					</div>

					{isCorrectNetworkSet ? (
						<Button
							className="w-full"
							disabled={invalidSendStatus || invalidSendAmount || txLoading}
							onClick={onSend}
						>
							{txLoading && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
							Confirm
						</Button>
					) : (
						<Button
							className="w-full"
							variant="destructive"
							onClick={onSwitchNetwork}
							disabled={isSwitchingNetwork}
						>
							{isSwitchingNetwork && (
								<Loader2 className="mr-2 w-4 h-4 animate-spin" />
							)}
							{`Change wallet network to ${correctNetwork?.name}`}
						</Button>
					)}
				</Card>
			</section>

			<Dialog open={openTxResultDialog} onOpenChange={setOpenTxResultDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className="flex gap-3 items-center mx-auto text-muted-foreground">
							<div className="flex justify-center items-center gap-3">
								<div>Transaction completed</div>
								<CheckCircle className="stroke-green-500 h-5 w-5" />
							</div>
						</DialogTitle>
					</DialogHeader>
					{!!txData && (
						<div
							className="flex items-center justify-between gap-3  mx-auto py-3 bg-background cursor-pointer hover:bg-muted rounded-md shadow-md max-h-24 text-muted-foreground/90 px-4 text-sm"
							onClick={() => {
								!!txData.transactionHash &&
									window.open(
										`${correctNetwork?.blockExplorers.default.url}/tx/${txData.transactionHash}`,
										'_blank',
									)
							}}
						>
							<div className="flex items-center gap-3">
								<Image width={32} src={getThemeImgSrc('logo')} alt="logo" />

								<div>
									<div>Send</div>
									<div>
										{txData.timestamp
											? dayjs(txData.timestamp).format('MMM D YYYY, HH:mm')
											: ''}
									</div>
								</div>
							</div>

							<div className="flex items-center gap-3">
								<div>
									<div className="text-right">
										{txData?.amount} {txData?.token?.symbol}
									</div>
									<div className="text-right">
										{convertToUsdPrice(txData?.amount, {
											symbol: txData?.token?.symbol,
										}) || '-'}
									</div>
								</div>

								<Send size={16} />
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</>
	)
}

export default WalletSendPage
