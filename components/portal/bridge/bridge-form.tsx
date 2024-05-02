import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'

import BigNumber from 'bignumber.js'
import {
	AlertCircle,
	AlertTriangle,
	ArrowDown,
	CheckCircle,
	Info,
	Loader2,
	MessageCircleQuestion,
	MoveRight,
	XCircle,
} from 'lucide-react'
import { usePlausible } from 'next-plausible'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import { useInterval } from 'usehooks-ts'
import { formatEther } from 'viem'
import { useBalance, useSwitchNetwork } from 'wagmi'

import SimpleTooltip from '@/components/common/simple-tooltip'
import BridgeTxDialogContent from '@/components/portal/bridge/bridge-tx-dialog-content'
import CircularProgress from '@/components/portal/bridge/circular-progress'
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
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CHAIN_TOKEN_NAME, ETH_ICON_URL, IsScroll, IsZkSync } from '@/constants'
import { ETH_L1_ADDRESS } from '@/constants/address'
import useUsdExchangeRates from '@/hooks/common/use-usd-exchange-rates'
import useTheme from '@/hooks/common/useTheme'
import useFetchBlockNumbers from '@/hooks/portal/bridge/scroll/use-block-numbers'
import useBridgeContext from '@/hooks/portal/bridge/use-bridge-context'
import useBridgeGas from '@/hooks/portal/bridge/use-bridge-gas'
import { useBridgeTokensMap } from '@/hooks/portal/bridge/use-bridge-tokens-map'
// import useSendTransaction from '@/hooks/portal/bridge/use-send-transaction'
import useSendTransaction, {
	FALLBACK_FEE_RATE,
	FEE_RATE_FACTOR,
	usePortalBridgeFeeRate,
} from '@/hooks/portal/bridge/use-portal-bridge-tx'
import usePortalContext from '@/hooks/portal/use-portal-context'
import useWalletTokenList from '@/hooks/portal/wallet/use-token-list'
import { ROUTES_MENUS, SOCIAL_LINKS } from '@/layout/menu/config'
import { usePortalStore } from '@/stores/portal'
import {
	TxHistoryTabType,
	useBridgeConfigStore,
} from '@/stores/portal/bridge/config'
import { useBridgeGasFeeStore } from '@/stores/portal/bridge/gas-fee'
import { useBridgeNetworkStore } from '@/stores/portal/bridge/network'
import {
	IPortalWalletToken,
	usePortalWalletStore,
} from '@/stores/portal/wallet'
import { BridgeTxTypeEnum, Token } from '@/types/bridge'
import { PlausibleEvents } from '@/types/events'
import { getImgSrc, getThemeImgSrc, shortAddress } from '@/utils'

const DisableZksyncBridge = false

const TokenSelectItem = ({
	token,
	usdBalance,
	onSelect,
}: { token?: Token; usdBalance: string; onSelect: () => void }) => (
	<div
		onClick={onSelect}
		className="flex items-center justify-between gap-2  cursor-pointer transition-all duration-300 hover:bg-primary px-3 py-2 sm:px-2 sm:py-2 rounded-lg"
	>
		<div className="w-[120px] flex items-center gap-2">
			{!!token?.iconUrl ? (
				<Image
					className="rounded-full"
					src={token?.iconUrl}
					width={24}
					height={24}
					alt="logo"
				/>
			) : (
				<div className="w-[24px] h-[24px] rounded-full bg-muted"></div>
			)}
			<div className="w-[90px] ellipsis text-left">{token?.symbol}</div>
		</div>

		<div className="flex flex-col items-end">
			<div className="w-fit">{token?.formatedBalance}</div>
			<div className="w-fit">{usdBalance}</div>
		</div>
	</div>
)

export const RefreshGasProgress = ({
	size,
	refreshCb,
}: { size?: number; refreshCb: () => void }) => {
	const [progress, setProgress] = useState(0)
	const [counter, setCounter] = useState(0)

	useInterval(() => {
		setCounter(counter + 10)
		const newProgress = Math.min((counter / 100) * 100, 100)
		if (newProgress < 100) {
			setProgress(newProgress)
		} else {
			refreshCb()
			setProgress(0)
			setCounter(0)
		}
	}, 1000)

	return <CircularProgress size={size ?? 18} value={progress} strokeWidth={2} />
}

const tabs = [
	{
		label: 'Deposit',
		value: BridgeTxTypeEnum.DEPOSIT,
	},
	{
		label: 'Withdraw',
		value: BridgeTxTypeEnum.WITHDRAW,
	},
]

const BridgeForm = () => {
	const plausible = usePlausible<PlausibleEvents>()
	const { isMainnet } = usePortalStore()
	const { walletAddress } = usePortalContext()
	const { isDeposit, txType, setTxType } = useBridgeContext()
	const { l1Network, l2Network, fromNetwork, toNetwork, isCorrectNetworkSet } =
		useBridgeNetworkStore()
	const {
		balance,
		amount,
		setAmount,
		needApproval,
		nativeToken,
		isSelectedNativeToken,
		selectedToken,
		setSelectedToken,
		tokensMap,
		tokenUsdBalanceMap,
		setTxHistoryTabType,
	} = useBridgeConfigStore()
	const {
		totalFee,
		scrollGasFee,
		scrollTxGasLimit,
		scrollGasLimit,
		scrollGasPrice,
		scrollWithdrawDataFee,
	} = useBridgeGasFeeStore()
	const { switchNetwork } = useSwitchNetwork()
	const { loading: isFetchingGas, calculateGas } = useBridgeGas()
	const { convertToUsdPrice } = useUsdExchangeRates()
	const { feeRate } = usePortalBridgeFeeRate()
	const [maxLoading, setMaxLoading] = useState(false)

	const { isFetchingBalances } = useBridgeTokensMap()
	useFetchBlockNumbers()
	const [displayTokens, setDisplayTokens] = useState<Token[]>([])
	const [content, setContent] = useState('')
	useEffect(() => {
		!!tokensMap && setDisplayTokens(Object.values(tokensMap))
	}, [tokensMap])
	useEffect(() => {
		const tokenList = !!tokensMap ? Object.values(tokensMap) : []
		if (content) {
			const list = tokenList.filter((item) =>
				content.startsWith('0x')
					? item.address.toLowerCase().includes(content.toLowerCase())
					: item.symbol.toLowerCase().includes(content.toLowerCase()),
			)
			setDisplayTokens(list)
		} else {
			setDisplayTokens(tokenList)
		}
	}, [content, tokensMap])

	useEffect(() => {
		setAmount(undefined)
	}, [isMainnet])

	const handleSelect = (token: Token) => {
		const value = token.address
		setAmount(undefined)
		!!tokensMap?.[value] && setSelectedToken(tokensMap?.[value])
		setTokenSelectDialog(false)
		setContent('')
	}

	const scrollL1Fee = useMemo(
		() => (isDeposit ? scrollGasFee : scrollGasLimit * scrollGasPrice),
		[isDeposit, scrollGasFee, scrollGasLimit, scrollGasPrice],
	)

	const scrollL2Fee = useMemo(
		() => (isDeposit ? scrollGasLimit * scrollGasPrice : scrollGasFee),
		[isDeposit, scrollGasFee, scrollGasLimit, scrollGasPrice],
	)

	const [showFeeUsdPrice, setShowFeeUsdPrice] = useState(false)

	const renderFeeWrap = useCallback(
		({ title, formattedVal }: { title: ReactNode; formattedVal: string }) => (
			<div
				className="flex gap-2 text-sm"
				onClick={() => setShowFeeUsdPrice((pre) => !pre)}
			>
				<p className="text-muted-foreground">{title}:</p>
				<SimpleTooltip
					content={`Click to switch to ${
						showFeeUsdPrice ? CHAIN_TOKEN_NAME : 'USD'
					}`}
				>
					<div className="flex gap-1 items-center pt-[1px] cursor-pointer">
						{isFetchingGas ? (
							<Skeleton className="h-[20px] w-[90px]" />
						) : showFeeUsdPrice ? (
							<div>
								{convertToUsdPrice(formattedVal, {
									symbol: CHAIN_TOKEN_NAME,
								}) || '$0'}
							</div>
						) : (
							<>
								<div>
									{BigNumber(
										BigNumber(formattedVal).toFixed(IsScroll ? 7 : 10),
									).toFixed()}
								</div>
								<div>{nativeToken?.symbol}</div>
							</>
						)}
					</div>
				</SimpleTooltip>
			</div>
		),
		[convertToUsdPrice, isFetchingGas, nativeToken?.symbol, showFeeUsdPrice],
	)

	const { data: nativeTokenBalance } = useBalance({
		watch: true,
		enabled: isCorrectNetworkSet && !!walletAddress && !!fromNetwork?.id,
		address: walletAddress as `0x${string}`,
		chainId: fromNetwork?.id,
		token: undefined,
	})

	const { data: toNetworkBalance } = useBalance({
		watch: true,
		enabled: isCorrectNetworkSet && !!walletAddress && !!toNetwork?.id,
		address: walletAddress as `0x${string}`,
		chainId: toNetwork?.id,
		token:
			!!selectedToken && nativeToken?.address === selectedToken?.address
				? undefined
				: (((toNetwork as any)?.isL2
						? selectedToken?.l2Address
						: selectedToken?.l1Address) as `0x${string}`),
	})

	const usdBalance = useMemo(
		() =>
			convertToUsdPrice(balance?.formatted, { symbol: selectedToken?.symbol }),
		[balance?.formatted, convertToUsdPrice, selectedToken?.symbol],
	)

	const toNetworkUsdBalance = useMemo(
		() =>
			convertToUsdPrice(toNetworkBalance?.formatted, {
				symbol: selectedToken?.symbol,
			}),
		[toNetworkBalance?.formatted, convertToUsdPrice, selectedToken?.symbol],
	)

	const [hasFocus, setFocus] = useState(false)

	const {
		txLoading,
		sendTransaction,
		txData,
		txError,
		resetTxData,
		currentTx,
	} = useSendTransaction()

	const [error, setError] = useState<string | undefined>()
	useEffect(() => {
		setError(txError)
	}, [txError])

	const maxAmount = useMemo(() => {
		const fee = isSelectedNativeToken
			? BigNumber(formatEther(BigInt(totalFee || 0)))
			: 0
		const slippage =
			IsScroll && selectedToken?.native
				? fromNetwork?.id === 1
					? '0.01'
					: '0.001'
				: 0
		const amount = BigNumber(balance?.formatted ?? 0)
			.minus(fee)
			.minus(slippage)
			.multipliedBy(feeRate > 0 ? feeRate : FALLBACK_FEE_RATE)
			.div(FEE_RATE_FACTOR)

		return amount.lte(0) ? '0' : amount.toString()
	}, [
		balance?.formatted,
		fromNetwork?.id,
		isSelectedNativeToken,
		selectedToken?.native,
		totalFee,
		feeRate,
	])

	const isInsufficientBalance = useMemo(() => {
		if (!!nativeTokenBalance && nativeTokenBalance.value === BigInt(0))
			return true

		const bnBalance = BigNumber(balance?.formatted || '0')
		let bnAmount = BigNumber(amount || '0')

		return bnBalance.eq(0) || bnAmount.lte(0) || bnAmount.gt(maxAmount)
	}, [balance?.formatted, amount, maxAmount, nativeTokenBalance])

	useEffect(() => {
		calculateGas()
	}, [selectedToken, calculateGas])

	useEffect(() => {
		if (maxLoading && !isFetchingGas) {
			setAmount(maxAmount)
			setMaxLoading(false)
		}
	}, [maxLoading, maxAmount, isFetchingGas, setAmount])

	const actionDisabled = useMemo(() => {
		if (!walletAddress || !isCorrectNetworkSet) return false
		if (txLoading) return true

		if (isInsufficientBalance) return true

		if (IsScroll && !needApproval) {
			if (isDeposit && (!!!scrollGasLimit || !!!scrollGasPrice)) return true
			if (!isDeposit && !!!scrollTxGasLimit) return true
		}

		if (IsZkSync && !!!totalFee) return true

		return false
	}, [
		walletAddress,
		isCorrectNetworkSet,
		txLoading,
		isInsufficientBalance,
		needApproval,
		isDeposit,
		scrollGasLimit,
		scrollGasPrice,
		scrollTxGasLimit,
		totalFee,
	])

	const actionText = useMemo(() => {
		if (txLoading) return 'Waiting for confirmation'

		if (!isCorrectNetworkSet)
			return `Change wallet network to ${fromNetwork?.name}`

		if (!!amount && isInsufficientBalance) return 'Insufficient balance'

		if (needApproval) return 'Approve'

		return isDeposit ? 'Deposit' : 'Withdraw'
	}, [
		isCorrectNetworkSet,
		fromNetwork?.name,
		amount,
		isInsufficientBalance,
		txLoading,
		needApproval,
		isDeposit,
	])

	const processingOnNetworkText = useMemo(() => {
		if (isDeposit) {
			if (txData?.status == 'success' || txData?.status == 1) {
				return l2Network?.name
			} else {
				return l1Network?.name
			}
		} else {
			if (txData?.status == 'success' || txData?.status == 1) {
				return l1Network?.name
			} else {
				return l2Network?.name
			}
		}
	}, [txData, isDeposit, l1Network, l2Network])

	const [openBridgeDepositDialog, setOpenBridgeDepositDialog] = useState(false)
	const [openScrollWithdrawDialog, setScrollWithdrawDialog] = useState(false)
	const [openTokenSelectDialog, setTokenSelectDialog] = useState(false)
	const onChangeTxType = useCallback(
		(value: any) => {
			setAmount(undefined)
			setError(undefined)
			setTxType(value)
		},
		[setAmount, setTxType],
	)

	return (
		<>
			<Tabs
				className="max-w-[550px] w-full"
				value={txType}
				onValueChange={onChangeTxType}
			>
				<Card className="flex flex-col w-full p-12 py-6 h-[650px] sm:px-6">
					<div className="flex flex-col gap-4 w-full items-center">
						<TabsList>
							{tabs.map((tab) => {
								const isActive = tab.value === 'deposit'
								return (
									<TabsTrigger
										key={tab.value}
										value={tab.value}
										className={`w-32 ${isActive ? 'bg-muted' : ''}`}
									>
										{tab.label}
									</TabsTrigger>
								)
							})}
						</TabsList>

						<div className="flex flex-col gap-2 w-full">
							<div className="text-xl font-bold flex items-center">
								<div className="sm:hidden">From</div>
								<div className="hidden sm:block">{fromNetwork?.name}</div>
							</div>
							<div className="flex flex-col gap-2">
								<div className="flex gap-2 items-center bg-muted px-3 py-1 rounded-lg">
									<div className="flex flex-1 font-bold text-xl border-none items-center justify-between">
										<SimpleTooltip content={fromNetwork?.name}>
											<div className="font-bold text-lg whitespace-nowrap sm:hidden ellipsis">
												{fromNetwork?.name}
											</div>
										</SimpleTooltip>
										<Separator
											orientation="vertical"
											className="mx-3 h-8 sm:hidden"
										/>
										<Input
											className="border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 pb-2"
											value={
												hasFocus
													? amount !== undefined
														? amount
														: ''
													: amount !== undefined
													  ? parseFloat(amount).toString()
													  : '0.00'
											}
											type="number"
											required
											onInput={(e) => {
												const value = e.currentTarget.value
												const decimals = selectedToken?.decimals || 18

												try {
													if (
														value.includes('.') &&
														(value.split('.')[1].length || 0) > decimals
													) {
														throw new Error(
															`The fractional component exceeds ${decimals} decimal places.`,
														)
													}
													setAmount(value)
													setError('')
												} catch (error: any) {
													setError(error.message)
												}
											}}
											onFocus={() => setFocus(true)}
										/>
									</div>
									<Button
										variant="link"
										onClick={(e) => {
											if (isFetchingGas) {
												setMaxLoading(true)
												return
											}

											e.preventDefault()
											setAmount(maxAmount)
											setMaxLoading(false)
										}}
										disabled={!isCorrectNetworkSet && maxLoading}
									>
										{maxLoading && (
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										)}
										Max
									</Button>
									<div>
										<Select
											defaultValue={selectedToken?.address}
											value={selectedToken?.address}
											// onValueChange={(value: string) => {
											//   setAmount(undefined)
											//   !!tokensMap?.[value] && setSelectedToken(tokensMap?.[value])
											// }}
											disabled={!isCorrectNetworkSet || !!!tokensMap}
											open
										>
											<SelectTrigger onClick={() => setTokenSelectDialog(true)}>
												<div className="flex items-center gap-2 mx-1">
													{!!selectedToken?.iconUrl ||
													!!selectedToken?.native ? (
														<Image
															className="rounded-full"
															src={
																!!selectedToken?.native
																	? ETH_ICON_URL
																	: selectedToken?.iconUrl
															}
															width={24}
															height={24}
															alt="token_logo"
														/>
													) : (
														<div className="w-[24px] h-[24px] rounded-full bg-muted"></div>
													)}
													<p>{selectedToken?.symbol}</p>
												</div>
											</SelectTrigger>
										</Select>
									</div>
								</div>
								{isCorrectNetworkSet && !!balance && (
									<div className="text-sm text-muted-foreground self-end">
										Balance:{' '}
										{BigNumber(
											BigNumber(balance?.formatted).toFixed(8),
										).toFixed()}{' '}
										{selectedToken?.symbol}
										{!!usdBalance && ` (${usdBalance})`}
									</div>
								)}
								{isInsufficientBalance && BigNumber(amount || '0').gt(0) && (
									<div className="flex justify-start items-center p-2 mx-auto gap-1 text-sm text-destructive w-full">
										<AlertTriangle className="text-destructive w-4 h-4" />
										<span className="text-sm">
											Insufficient balance.{' '}
											{BigNumber(maxAmount).gt(0) &&
												`The amount should be less than ${maxAmount.toString()} ${
													selectedToken?.symbol
												}`}
										</span>
									</div>
								)}
							</div>

							<Button
								className="rounded-full h-12 w-12 mt-7 mx-auto"
								variant="outline"
								size="icon"
								onClick={() =>
									onChangeTxType(
										isDeposit
											? BridgeTxTypeEnum.WITHDRAW
											: BridgeTxTypeEnum.DEPOSIT,
									)
								}
							>
								<ArrowDown className="h-8 w-8" />
							</Button>

							<div className="flex flex-col gap-2 w-full">
								<div className="text-xl font-bold flex items-center">
									<div className="sm:hidden">To</div>
									<div className="hidden sm:block">{toNetwork?.name}</div>
								</div>
								<div className="flex flex-col gap-2">
									<div className="flex gap-2 items-center bg-muted px-3 py-1 rounded-lg">
										<div className="flex flex-1 font-bold border-none items-center justify-between">
											<div className="font-bold text-lg whitespace-nowrap sm:hidden">
												{toNetwork?.name}
											</div>
											<Separator
												orientation="vertical"
												className="mx-3 h-8 sm:hidden"
											/>
											<Input
												disabled
												className="border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 pb-3"
												placeholder="0.00"
												value={amount || '0.00'}
											/>

											<span>{selectedToken?.symbol}</span>
										</div>
									</div>
								</div>
								{isCorrectNetworkSet && !!toNetworkBalance && (
									<div className="text-sm text-muted-foreground self-end">
										Balance:{' '}
										{BigNumber(
											BigNumber(toNetworkBalance?.formatted).toFixed(8),
										).toFixed()}{' '}
										{selectedToken?.symbol}
										{!!toNetworkUsdBalance && ` (${toNetworkUsdBalance})`}
									</div>
								)}
							</div>

							{isCorrectNetworkSet && BigNumber(amount ?? '0').gt(0) && (
								<div className="flex gap-2 w-full justify-between items-center my-3 sm:flex-wrap">
									{IsScroll && (
										<>
											{[
												{
													title: isDeposit
														? 'Ethereum gas fee'
														: 'Ethereum data fee',
													value: isDeposit
														? scrollL1Fee
														: scrollWithdrawDataFee,
												},
												{ title: 'Scroll gas fee', value: scrollL2Fee },
											].map(({ title, value }) => (
												<div key={title}>
													{renderFeeWrap({
														title,
														formattedVal: formatEther(value),
													})}
												</div>
											))}
										</>
									)}

									{IsZkSync &&
										renderFeeWrap({
											title: 'Fee',
											formattedVal: formatEther(BigInt(totalFee || 0)),
										})}

									<RefreshGasProgress refreshCb={calculateGas} />
								</div>
							)}

							{!!!walletAddress && (
								<div className="flex justify-center items-center p-2 mx-auto gap-1 text-sm text-destructive bg-destructive/40 w-full rounded-lg">
									<AlertCircle className="text-destructive w-4 h-4" />
									<h1 className="text-sm text-destructive">
										Please connect your wallet
									</h1>
								</div>
							)}

							{!!error && (
								<ScrollArea className="break-all max-h-[60px]">
									<div className="flex justify-center items-center p-2 mx-auto gap-1 text-sm text-destructive bg-destructive/40 w-full rounded-lg">
										{error}
									</div>
								</ScrollArea>
							)}
						</div>

						{IsZkSync && !isDeposit && (
							<Link
								className="text-sm -mb-2 cursor-pointer transition-all duration-300 hover:text-primary/70 text-primary underline"
								href="https://era.zksync.io/docs/reference/troubleshooting/withdrawal-delay.html#withdrawal-delay"
								target="_blank"
							>
								Arriving in ~24 hours
							</Link>
						)}

						{!!walletAddress && (
							<div className="flex flex-col justify-between items-center w-full gap-3">
								<Button
									className="w-full"
									variant={!isCorrectNetworkSet ? 'destructive' : 'default'}
									disabled={actionDisabled}
									onClick={() => {
										if (txLoading) return

										setError(undefined)
										if (
											!isCorrectNetworkSet &&
											fromNetwork?.id &&
											switchNetwork
										) {
											switchNetwork(fromNetwork?.id)
										} else {
											//FIXME: disable for zksync upgrade
											if (
												IsZkSync &&
												DisableZksyncBridge &&
												isDeposit &&
												isMainnet
											) {
												toast.info(
													'Due to a network upgrade, deposits are disabled. The upgrade will be fast, please check again in 10-20 minutes',
													{
														duration: 5000,
														style: { width: 360, wordBreak: 'break-word' },
													},
												)
												return
											}
											resetTxData()
											sendTransaction(() => {
												actionText === 'Deposit' &&
													plausible('Portal-Native Bridge Deposit')
												actionText === 'Withdraw' &&
													plausible('Portal-Native Bridge Withdraw')

												IsZkSync && setOpenBridgeDepositDialog(true)

												IsScroll &&
													(isDeposit
														? setOpenBridgeDepositDialog(true)
														: setScrollWithdrawDialog(true))
											})
										}
									}}
								>
									{txLoading && (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									)}
									{actionText}
								</Button>

								<SimpleTooltip
									content={`Explorer Bridge is powered by the ${
										IsScroll ? 'Scroll' : 'zkSync Era'
									} Native Bridge.  A 0.3% Explorer Bridge fee might occur due to maintenance & gas cost.`}
								>
									<div className="flex-center gap-1 text-muted-foreground/70 p-3">
										<Info className="w-4 h-4 mr-1" />
										<div className="font-semibold">
											Powered by {IsScroll ? 'Scroll' : 'zkSync Era'} Official
											Bridge
										</div>
									</div>
								</SimpleTooltip>
							</div>
						)}
					</div>
					<div className="fixed right-3 bottom-3">
						<Link
							href={SOCIAL_LINKS.FEEDBACK}
							target="_blank"
							rel="noreferrer"
							className="hover:opacity-80"
						>
							<MessageCircleQuestion size={30} />
						</Link>
					</div>
				</Card>
			</Tabs>

			<Dialog
				open={openBridgeDepositDialog}
				onOpenChange={setOpenBridgeDepositDialog}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className="flex gap-3 items-center mx-auto text-muted-foreground">
							<div className="flex-center flex-col">
								<Image
									width={58}
									src={
										(fromNetwork as any)?.isL2
											? getThemeImgSrc('logo')
											: getImgSrc('eth')
									}
									alt=""
								/>
								<div className="mt-3 flex-center">
									<div className="mr-3">
										Transaction submitted on {isDeposit ? 'L1' : 'L2'}
									</div>
									{!!!txData?.status && !!!txError ? (
										<Loader2 className="h-5 w-5 animate-spin" />
									) : txData?.status == 'success' || txData?.status == 1 ? (
										<CheckCircle className="w-5 h-5 stroke-green-500" />
									) : (
										<SimpleTooltip content={txData?.status || txError}>
											<XCircle className="w-5 h-5 stroke-red-500" />
										</SimpleTooltip>
									)}
								</div>
							</div>
						</DialogTitle>
					</DialogHeader>
					{!!currentTx && <BridgeTxDialogContent transactionHash={currentTx} />}
					<div className="flex-center mx-auto text-muted-foreground w-fit text-base">
						<p>Processing On {processingOnNetworkText}</p>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog
				open={openTokenSelectDialog}
				onOpenChange={(open) => {
					setContent('')
					setTokenSelectDialog(open)
				}}
			>
				<DialogContent>
					<DialogHeader>Choose Token</DialogHeader>
					<div className="p-2 flex flex-col">
						<Input
							className="border focus-visible:ring-0 sm:text-sm h-10"
							placeholder="Symbol or address"
							onInput={(e) => setContent(e.currentTarget.value)}
							// onKeyUp={onKeyUp}
						/>
					</div>
					<div className="flex flex-col gap-2 p-2 h-[300px] overflow-auto">
						{!isFetchingBalances &&
							displayTokens.map((token) => (
								<div key={token.address}>
									<TokenSelectItem
										token={token}
										usdBalance={
											undefined !== tokenUsdBalanceMap?.get(token.address)
												? `$${tokenUsdBalanceMap?.get(token.address)}`
												: '-'
										}
										onSelect={() => handleSelect(token)}
									/>
								</div>
							))}
						{isFetchingBalances && <Loader2 className="h-5 w-5 animate-spin" />}
					</div>
				</DialogContent>
			</Dialog>

			<Dialog
				open={openScrollWithdrawDialog}
				onOpenChange={setScrollWithdrawDialog}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className="flex gap-3 items-center mx-auto text-muted-foreground">
							<div className="flex-center flex-col">
								<div className="mt-3 flex-center">
									<div className="mr-3">Moving Funds to Ethereum</div>
									{!!!txData?.status && !!!txError ? (
										<Loader2 className="h-5 w-5 animate-spin" />
									) : txData?.status == 'success' || txData?.status == 1 ? (
										<CheckCircle className="w-5 h-5 stroke-green-500" />
									) : !!txError ? (
										<SimpleTooltip content={txData?.status || txError}>
											<XCircle className="w-5 h-5 stroke-red-500" />
										</SimpleTooltip>
									) : undefined}
								</div>

								<div className="flex-center mt-4">
									<Image
										className="rounded-full"
										width={40}
										height={40}
										src={getImgSrc('scroll')}
										alt="eth_logo"
									/>

									<Image
										className="mx-3"
										width={80}
										height={11}
										src={getImgSrc('arrow')}
										alt="arrow"
									/>

									<Image
										className="rounded-full"
										width={40}
										height={40}
										src={getImgSrc('eth')}
										alt="scroll_logo"
									/>
								</div>
							</div>
						</DialogTitle>
					</DialogHeader>

					<div className="text-muted-foreground text-center px-2">
						Now transaction has confirmed on Scroll. Waiting for Scroll provers
						to finalize your transaction approximately 4 hours. Then you can
						claim your funds on the target network.
					</div>

					<div className="flex-center my-3">
						<div className="mr-1">Transaction Hash:</div>
						{!!currentTx ? (
							<div className="text-sm">
								<a
									href={`${l2Network?.blockExplorerUrl}/tx/${currentTx}`}
									target="_blank"
									rel="noreferrer"
								>
									<Button className="text-base h-8" variant="link">
										{shortAddress(currentTx)}
									</Button>
								</a>
							</div>
						) : (
							<Skeleton className="h-8 w-[200px]" />
						)}
					</div>

					<div className="flex-center">
						<div className="px-6 text-sm h-12 border-1-solid border-r-0 border-primary rounded-md rounded-tr-none rounded-br-none flex-center flex-col">
							<div className="text-center leading-3 mb-[5px]">
								Claim funds in the
							</div>
							<div className="text-center leading-3">
								<b>Transaction Claiming</b> list
							</div>
							<div></div>
						</div>
						<Button
							className="w-12 h-12 rounded-tl-none rounded-bl-none"
							size="icon"
							onClick={() => {
								setTxHistoryTabType(TxHistoryTabType.CLAIM)
								setScrollWithdrawDialog(false)
							}}
						>
							<MoveRight />
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</>
	)
}

export default BridgeForm
