import { useCallback, useEffect, useMemo, useState } from 'react'

import { produce } from 'immer'
import Image from 'next/image'
import { toast } from 'sonner'
import { getContract, isAddress } from 'viem'
import { erc20ABI, usePublicClient, useToken } from 'wagmi'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { IsScroll } from '@/constants'
import usePortalContext from '@/hooks/portal/use-portal-context'
import useWalletTokenList from '@/hooks/portal/wallet/use-token-list'
import { useWalletSendNetwork } from '@/hooks/portal/wallet/use-wallet-send'
import { cn } from '@/lib/utils'
import { IPortalWalletToken } from '@/stores/portal/wallet'
import { usePortalWalletSendStore } from '@/stores/portal/wallet/send'
import { shortAddress } from '@/utils'

export type IWalletTokenList = {
	className?: string
	hideZeroBalanceToken?: boolean
}

const WalletTokenList: React.FC<IWalletTokenList> = ({
	className,
	hideZeroBalanceToken = false,
}) => {
	const publicClient = usePublicClient()
	const { walletAddress } = usePortalContext()
	const { correctNetwork } = useWalletSendNetwork()
	const { setSendToken } = usePortalWalletSendStore()
	const {
		addToken,
		tokenList,
		tokenUsdBalanceMap,
		isFetchingTokenList,
		isFetchingBalances,
		isFetchingUsdRates,
		chainId,
	} = useWalletTokenList(IsScroll)

	const balanceTokenList = useMemo(
		() =>
			tokenList.filter(
				({ balance, native }) =>
					!!!native && (balance ?? BigInt(0)) !== BigInt(0),
			),
		[tokenList],
	)

	const zeroBalanceTokenList = useMemo(
		() =>
			tokenList.filter(
				({ balance, native }) =>
					!!!native && (balance ?? BigInt(0)) === BigInt(0),
			),
		[tokenList],
	)

	const displayTokenList = useMemo(() => {
		const nativeToken = tokenList?.find(({ native }) => native)
		const nativeTokenList = !!nativeToken ? [nativeToken] : []
		return hideZeroBalanceToken
			? [...nativeTokenList, ...balanceTokenList]
			: [...nativeTokenList, ...balanceTokenList, ...zeroBalanceTokenList]
	}, [balanceTokenList, hideZeroBalanceToken, tokenList, zeroBalanceTokenList])

	const onSelectToken = useCallback(
		(token: IPortalWalletToken) => setSendToken(token, true),
		[setSendToken],
	)

	const [openImportTokenDialog, setOpenImportTokenDialog] = useState(false)
	const [tokenInfo, setTokenInfo] = useState<{
		name?: string
		address: string
		symbol: string
		decimals: string
	}>({
		name: '',
		address: '',
		symbol: '',
		decimals: '',
	})

	const { data: searchedToken } = useToken({
		address: tokenInfo.address as `0x${string}`,
		enabled:
			openImportTokenDialog &&
			!!tokenInfo.address &&
			isAddress(tokenInfo.address) &&
			undefined !== correctNetwork?.id,
		chainId: correctNetwork?.id,
	})

	useEffect(() => {
		if (openImportTokenDialog) {
			setTokenInfo((pre) => ({
				name: searchedToken?.name || '',
				address: searchedToken?.address || pre?.address || '',
				symbol: searchedToken?.symbol || '',
				decimals: searchedToken?.decimals?.toString() || '',
			}))
		}
	}, [openImportTokenDialog, searchedToken])

	const onImportToken = useCallback(() => {
		if (!!!walletAddress) return

		if (tokenList?.some(({ address }) => address === tokenInfo.address)) {
			toast.error('Token has already been added.')
			return
		}
		addToken(chainId, walletAddress, {
			...tokenInfo,
			decimals: Number(tokenInfo.decimals),
			chainId,
		})
		setOpenImportTokenDialog(false)
	}, [addToken, chainId, tokenInfo, tokenList, walletAddress])

	return (
		<>
			<ScrollArea
				className={cn(
					'w-full px-8 sm:px-4',
					(displayTokenList?.length ?? 0) > 5 && 'h-[350px]',
					className,
				)}
			>
				<section className="w-full flex flex-col gap-3 py-2">
					{displayTokenList?.map((token) => {
						return (
							<div
								key={token.address}
								className="flex justify-between items-center cursor-pointer transition-all duration-300 hover:bg-primary px-6 py-3 sm:px-2 sm:py-2 rounded-lg"
								onClick={() => onSelectToken(token)}
							>
								<div className="flex items-center gap-3">
									{isFetchingTokenList ? (
										<Skeleton className="w-[40px] h-[40px] rounded-full" />
									) : !!token?.logo ? (
										<Image
											className="rounded-full"
											src={token.logo}
											alt="eth"
											width={44}
											height={44}
										/>
									) : (
										<div className="w-[40px] h-[40px] rounded-full bg-muted"></div>
									)}
									<div>
										{isFetchingTokenList ? (
											<Skeleton className="h-[20px] w-[100px] mb-[8px]" />
										) : (
											<div className="flex items-center">
												<span className="mr-1">{token.symbol}</span>
												{!!!token.native && (
													<span className="text-xs">
														({shortAddress(token.address, 4)})
													</span>
												)}
											</div>
										)}

										{isFetchingTokenList || isFetchingBalances ? (
											<Skeleton className="h-[16px] w-[100px]" />
										) : (
											<div className="text-sm">
												{token?.formatedBalance || 0}
											</div>
										)}
									</div>
								</div>

								{isFetchingTokenList ||
								isFetchingBalances ||
								isFetchingUsdRates ? (
									<Skeleton className="h-[24px] w-[100px]" />
								) : (
									<div>
										{undefined !== tokenUsdBalanceMap?.get(token.address)
											? `$${tokenUsdBalanceMap?.get(token.address)}`
											: '-'}
									</div>
								)}
							</div>
						)
					})}
				</section>
			</ScrollArea>
			<div className="px-4">
				<Button
					variant="link"
					size="sm"
					onClick={() => setOpenImportTokenDialog(true)}
				>
					Import tokens
				</Button>
			</div>

			<Dialog
				open={openImportTokenDialog}
				onOpenChange={(open) => {
					setOpenImportTokenDialog(open)
					setTokenInfo({ address: '', symbol: '', decimals: '' })
				}}
			>
				<DialogContent className="w-full max-w-[500px]">
					<DialogHeader>
						<DialogTitle>Import tokens</DialogTitle>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="relative">
							<div className="flex items-center absolute top-1/2 -translate-y-1/2 left-3 z-20 text-sm">
								<div className="w-[45px]">Address</div>
								<div className="ml-4 text-muted-foreground">|</div>
							</div>

							<Input
								className="pl-[90px]"
								placeholder="Token contract address"
								value={tokenInfo.address}
								onChange={(e) => {
									const address = e.target.value as `0x${string}`

									const contract = getContract({
										address,
										abi: erc20ABI,
										publicClient,
									})

									setTokenInfo((pre) =>
										produce(pre, (draft) => {
											draft.address = address
										}),
									)
								}}
								maxLength={42}
							/>
						</div>

						<div className="relative">
							<div className="flex items-center absolute top-1/2 -translate-y-1/2 left-3 z-20 text-sm">
								<div className="w-[45px]">Symbol</div>
								<div className="ml-4 text-muted-foreground">|</div>
							</div>

							<Input
								className="pl-[90px]"
								placeholder="Token symbol"
								value={tokenInfo.symbol}
								onChange={(e) =>
									setTokenInfo((pre) =>
										produce(pre, (draft) => {
											draft.symbol = e.target.value
										}),
									)
								}
								maxLength={11}
								disabled={!!searchedToken?.decimals}
							/>
						</div>

						<div className="relative">
							<div className="flex items-center absolute top-1/2 -translate-y-1/2 left-3 z-20 text-sm">
								<div className="w-[45px]">Decimals</div>
								<div className="ml-4 text-muted-foreground">|</div>
							</div>

							<Input
								className="pl-[90px]"
								placeholder="Token decimal"
								value={tokenInfo.decimals}
								onChange={(e) =>
									setTokenInfo((pre) =>
										produce(pre, (draft) => {
											draft.decimals = e.target.value
										}),
									)
								}
								type="number"
								max={36}
								min={0}
								disabled={!!searchedToken?.decimals}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							className="w-full"
							variant="default"
							disabled={
								!!!tokenInfo.address ||
								!!!tokenInfo.symbol ||
								!!!tokenInfo.decimals ||
								!isAddress(tokenInfo.address?.trim()) ||
								tokenInfo.symbol?.trim()?.length > 11 ||
								Number(tokenInfo.decimals?.trim()) > 36
							}
							onClick={onImportToken}
						>
							Confirm
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}

export default WalletTokenList
