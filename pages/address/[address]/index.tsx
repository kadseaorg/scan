import { useCallback, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { generatePath } from 'react-router-dom'

import { getAddress, isAddress } from '@ethersproject/address'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Dialog, TextField, Tooltip } from '@mui/material'
import { useLogin, usePrivy } from '@privy-io/react-auth'
import BigNumber from 'bignumber.js'
import {
	ChevronRight,
	HelpCircle,
	Loader2,
	Plus,
	QrCode,
	Star,
} from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { formatEther } from 'viem'

import NameTagAddDialog from '@/components/account/name-tag/NameTagAddDialog'
import AddressActivity from '@/components/address/activity'
import InscriptionBalance from '@/components/address/inscription/inscription-balance'
import InscriptionTxTable from '@/components/address/inscription/inscription-txs-table'
import { AddressInternalTxsTable } from '@/components/address/internal-txs-table'
import AddressTokenTxsTable from '@/components/address/token-txs-table'
import { AddressTxsTable } from '@/components/address/txs-table'
import AISummaryCard from '@/components/ai-summary-card'
import BridgeTxsTable from '@/components/blockchain/bridge-txs-table'
import AddressAvatar from '@/components/common/address-avatar'
import AddressQrcode from '@/components/common/address-qrcode'
import { AdvertisementBannerEnum } from '@/components/common/advertisement-banner'
import { CopyButton } from '@/components/common/copy-button'
import FormProvider from '@/components/common/hook-form/FormProvider'
import Label from '@/components/common/label/Label'
import { TokenLink, getLinkRoute } from '@/components/common/link'
import MenuPopover from '@/components/common/menu-popover/MenuPopover'
import PageTitle from '@/components/common/page-title'
import SimpleTooltip from '@/components/common/simple-tooltip'
import TabCard, { TabCardListProps } from '@/components/common/tab-card'
import ContractTab from '@/components/contract/contract-tab'
import ContractTabTitle from '@/components/contract/contract-tab/ContractTabTitle'
import LinkableTabs from '@/components/linkable-tabs'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
} from '@/components/ui/select'
import {
	CHAIN_TOKEN_NAME,
	CHAIN_TYPE,
	CURRENT_CHAIN_ITEM,
	IsKadsea,
	IsZkSync,
	NATIVE_ICON_URL,
} from '@/constants'
import { nameTagAddSchema } from '@/constants/form/account'
import ROUTES from '@/constants/routes'
import { WagmiRainbowkitProvider } from '@/context/rainbowkit'
import useAccountContext from '@/hooks/account/useAccountContext'
import useUsdExchangeRates from '@/hooks/common/use-usd-exchange-rates'
import useMultichainBalances from '@/hooks/use-multichain-balances'
import Container from '@/layout/container'
import { cn } from '@/lib/utils'
import { AddressTokenBalanceType, LinkTypeEnum, TokenTypeEnum } from '@/types'
import { convertBalance, formatNum, transDisplayNum } from '@/utils'
import { trpc } from '@/utils/trpc'

import style from './index.module.scss'

const BlockchainAddressDetail: React.FC = (props) => {
	const router = useRouter()
	const search: any = router?.query
	const address = isAddress(search?.address)
		? getAddress(search?.address)
		: search?.address
	const { data: publicLabels } = trpc.label.getLabels.useQuery(address, {
		enabled: !!address,
	})
	const { data: publicTags } = trpc.address.getAddressPublicTags.useQuery(
		address,
		{ enabled: !!address },
	)
	const { tagNames } = useAccountContext()
	const privateTagName = useMemo(
		() =>
			tagNames?.filter(
				({ address: _address }) =>
					_address?.toLowerCase() === address?.toLowerCase(),
			)?.[0]?.tag,
		[address, tagNames],
	)
	const [dialogOpen, setDialogOpen] = useState(false)
	const [isAdd, setIsAdd] = useState(true)
	const [showDialog, setShowDialog] = useState(false)
	// const session = useSession()
	// const isLogin = !!session
	const { ready, authenticated, user } = usePrivy()
	const isLogin = ready && authenticated
	const methods = useForm<{
		address: string
		tag: string
		description: string | undefined
	}>({
		resolver: zodResolver(nameTagAddSchema),
		defaultValues: { address: address, tag: '', description: '' },
	})

	const { convertToUsdPrice } = useUsdExchangeRates(true)
	const { login } = useLogin()

	const handleAddPrivateTag = useCallback(() => {
		if (!isLogin) {
			login()
			return
		}
		setIsAdd(true)
		setShowDialog(true)
	}, [isLogin, login])

	const [showAddressQrcodeModal, setShowAddressQrcodeModal] = useState(false)
	const { isFetching: addressTypeLoading, data: addressType } =
		trpc.util.search.useQuery(address, { enabled: !!address })
	const { isFetching: addressSummaryLoading, data: addressSummary } =
		trpc.address.getAddressSummary.useQuery(address, { enabled: !!address })
	const { isFetching: txsCountLoading, data: txsCount } =
		trpc.address.getAddressTxsCount.useQuery(address, { enabled: !!address })

	const { isFetching: balanceFetching, data: balance } =
		trpc.address.getAddressBalance.useQuery(address, { enabled: !!address })

	const { isFetching: erc20TokenBalanceLoading, data: erc20TokenBalance } =
		trpc.address.getAddressTokenBalance.useQuery(
			{
				address: address,
				tokenType: TokenTypeEnum.ERC20,
			},
			{ enabled: !!address },
		)
	const { isFetching: erc721TokenBalanceLoading, data: erc721TokenBalance } =
		trpc.address.getAddressTokenBalance.useQuery(
			{
				address: address,
				tokenType: TokenTypeEnum.ERC721,
			},
			{ enabled: !!address },
		)
	const { isFetching: erc1155TokenBalanceLoading, data: erc1155TokenBalance } =
		trpc.address.getAddressTokenBalance.useQuery(
			{
				address: address,
				tokenType: TokenTypeEnum.ERC1155,
			},
			{ enabled: !!address },
		)

	const rawSummaryContent = useMemo(() => {
		if (
			addressType === undefined ||
			addressSummary === undefined ||
			txsCount === undefined ||
			erc20TokenBalance === undefined ||
			erc721TokenBalance === undefined ||
			erc1155TokenBalance === undefined
		) {
			return null
		}
		return {
			addressType: addressType,
			addressSummary: {
				...addressSummary,
				balance: balance || addressSummary?.balance,
			},
			txsCount: txsCount,
			erc20TokenBalance: erc20TokenBalance,
			erc721TokenBalance: erc721TokenBalance,
			erc1155TokenBalance: erc1155TokenBalance,
		}
	}, [
		addressSummary,
		addressType,
		txsCount,
		erc20TokenBalance,
		erc721TokenBalance,
		erc1155TokenBalance,
		balance,
	])

	const tokensNum = useMemo(() => {
		const erc20TokenBalanceNum = erc20TokenBalance?.length || 0
		const erc721TokenBalanceNum = erc721TokenBalance?.length || 0
		const erc1155TokenBalanceNum = erc1155TokenBalance?.length || 0
		return erc20TokenBalanceNum + erc721TokenBalanceNum + erc1155TokenBalanceNum
	}, [
		erc20TokenBalance?.length,
		erc721TokenBalance?.length,
		erc1155TokenBalance?.length,
	])

	const isContract = useMemo(
		() =>
			undefined === addressType
				? undefined
				: LinkTypeEnum.CONTRACT === addressType?.result,
		[addressType],
	)

	const { isFetching: isFetchingContract, data: contractDetail } =
		trpc.contract.getContractDetail.useQuery(address, {
			enabled: !!isContract,
		})

	const { data: isToken } = trpc.token.hasToken.useQuery(address, {
		enabled: !!address,
	})

	const usdBalance = useMemo(() => {
		if (balance) {
			return convertToUsdPrice(formatEther(BigInt(balance)), {
				showPreffix: true,
				symbol: CHAIN_TOKEN_NAME,
			})
		}
	}, [balance, convertToUsdPrice])

	const [tokenBalanceMenuOpen, setTokenBalanceMenuOpen] =
		useState<HTMLElement | null>(null)

	const { data: mulchainBalances, isLoading } = useMultichainBalances({
		address,
	})

	const title = useMemo(
		() => ({
			[TokenTypeEnum.ERC20]: 'ERC-20',
			[TokenTypeEnum.ERC721]: 'ERC-721',
			[TokenTypeEnum.ERC1155]: 'ERC-1155',
		}),
		[],
	)

	const renderTokenList = useCallback(
		(tokenList: AddressTokenBalanceType[], tokenType: TokenTypeEnum) => (
			<Card className="pb-3">
				<div className="rounded px-3 py-[6px] flex items-center mb-[6px]">
					<ChevronRight size={18} className="mr-1" />
					<span className="font-bold mr-[4px]">{title[tokenType]}</span>
					<span>({tokenList?.length})</span>
				</div>
				{tokenList?.map(
					({
						name,
						symbol,
						token_address,
						balance,
						decimals,
						logo_path,
						token_id,
					}) => (
						<div
							key={token_address}
							className="rounded px-3 py-[4px] transition-all duration-200 cursor-pointer flex justify-between items-center text-xs mb-[4px] last:border-none last:mb-0"
							onClick={() =>
								router.push(getLinkRoute(LinkTypeEnum.TOKEN, token_address))
							}
						>
							<div className="w-full ellipsis flex gap-1 flex-col">
								<TokenLink
									name={name}
									symbol={symbol}
									tokenAddress={token_address}
									img={logo_path}
									imgSize={14}
									imgLineHeight={15}
									ellipsis
								/>
								<div className="text-muted-foreground mt-[2px] ellipsis">
									<span className="mr-4">
										{transDisplayNum({
											num: balance,
											decimals,
											suffix: symbol,
										})}
									</span>
									{tokenType === TokenTypeEnum.ERC20 &&
										convertToUsdPrice(convertBalance({ balance, decimals }), {
											showPreffix: true,
											symbol: symbol,
										})}
									{tokenType === TokenTypeEnum.ERC1155 &&
										` (${new BigNumber(token_id, 16)?.toString(10)})`}
								</div>
							</div>
						</div>
					),
				)}
			</Card>
		),
		[router, title, convertToUsdPrice],
	)

	const txTabs = IsZkSync
		? [
				{
					label: 'Transactions',
					children: (
						<AddressTxsTable address={address} isContract={isContract} />
					),
				},
		  ]
		: [
				{
					label: 'Transactions',
					children: (
						<AddressTxsTable address={address} isContract={isContract} />
					),
				},
				{
					label: 'Internal Txns',
					children: (
						<AddressInternalTxsTable
							address={address}
							isContract={isContract}
						/>
					),
				},
		  ]

	const tokenTabs = useMemo(() => {
		const data: TabCardListProps = []

		data.push({
			label: 'Erc20 Token Txns',
			children: (
				<AddressTokenTxsTable address={address} type={TokenTypeEnum.ERC20} />
			),
		})

		data.push({
			label: 'Erc721 Token Txns',
			children: (
				<AddressTokenTxsTable address={address} type={TokenTypeEnum.ERC721} />
			),
		})

		data.push({
			label: 'Erc1155 Token Txns',
			children: (
				<AddressTokenTxsTable address={address} type={TokenTypeEnum.ERC1155} />
			),
		})

		!IsKadsea &&
			data.push({
				label: 'Bridge Txns',
				children: <BridgeTxsTable address={address} />,
			})

		data.push({
			label: 'Inscription Txns',
			children: <InscriptionTxTable address={address} />,
		})

		if (!!isContract && !!contractDetail) {
			data.push({
				label: <ContractTabTitle contractDetail={contractDetail} />,
				children: <ContractTab contractDetail={contractDetail} />,
			})
		}

		return data
	}, [isContract, contractDetail, address])

	const OverviewContent = useMemo(
		() => (
			<Card>
				<CardContent className="pt-6">
					<div className="grid grid-cols-3 gap-3 items-center sm:grid-cols-1">
						<div>
							<div className="flex items-center mb-[6px]">
								<div className="font-normal text-muted-foreground">
									{CHAIN_TOKEN_NAME} Balance
								</div>
								<Tooltip
									title={`Address balance in ${CHAIN_TOKEN_NAME} doesn't include ERC20, ERC721, ERC1155 tokens.`}
								>
									<HelpCircle
										className="cursor-pointer ml-[6px] text-muted-foreground"
										width={14}
									/>
								</Tooltip>
							</div>
							{balanceFetching ? (
								<Loader2 size={14} className="animate-spin" />
							) : (
								<div className="flex items-baseline gap-2">
									<Image
										width={18}
										height={18}
										src={NATIVE_ICON_URL}
										alt="native-icon"
									/>
									<div className="flex flex-col">
										<span>
											{balance === null || balance === undefined
												? '-'
												: formatEther(BigInt(balance))}
										</span>
										{usdBalance && (
											<span className="text-sm text-muted-foreground">
												{usdBalance}
											</span>
										)}
									</div>
								</div>
							)}
						</div>

						<div>
							<div className="flex items-center mb-[6px] ">
								<div className="font-normal text-muted-foreground">Token</div>
								<Tooltip title="All tokens in the account and total number.">
									<HelpCircle
										className="cursor-pointer ml-[6px] text-muted-foreground"
										width={14}
									/>
								</Tooltip>
							</div>
							{tokensNum === 0 ? (
								<span>0</span>
							) : (
								<div className="w-[80%] max-w-400px">
									<TextField
										className="caret-transparent"
										size="small"
										sx={{ width: 320 }}
										value={tokensNum}
										onClick={(e) => setTokenBalanceMenuOpen(e.currentTarget)}
									/>
									<MenuPopover
										open={tokenBalanceMenuOpen}
										onClose={() => setTokenBalanceMenuOpen(null)}
									>
										<ScrollArea
											className={cn(
												'h-[300px] w-[320px] rounded',
												`theme-${CHAIN_TYPE}`,
											)}
										>
											{!!erc20TokenBalance?.length &&
												renderTokenList(erc20TokenBalance, TokenTypeEnum.ERC20)}
											{!!erc721TokenBalance?.length &&
												renderTokenList(
													erc721TokenBalance,
													TokenTypeEnum.ERC721,
												)}
											{!!erc1155TokenBalance?.length &&
												renderTokenList(
													erc1155TokenBalance,
													TokenTypeEnum.ERC1155,
												)}
										</ScrollArea>
									</MenuPopover>
									{/* {erc20TokenBalance || erc721TokenBalance || erc1155TokenBalance ? (
                  !!!erc20TokenBalance?.length && !!!erc721TokenBalance?.length && !!!erc1155TokenBalance?.length ? (
                    <span>$0.00</span>
                  ) : (
                    <Dropdown dropdownRender={() => tokenContent} trigger={['click']}>
                      <Input className={style.tokenBalanceInput} suffix={<DownOutlined className="text-xs" />} value="$0" readOnly />
                    </Dropdown>
                  )
                ) : (
                  <Loader2 size={14} className="animate-spin" />
                )} */}
								</div>
							)}
						</div>
						<div>
							<div className="flex items-center mb-[6px]">
								<div className="font-normal text-muted-foreground">
									Gas Used
								</div>
								<Tooltip title="Gas used by the address.">
									<HelpCircle
										className="cursor-pointer ml-[6px] text-muted-foreground"
										width={14}
									/>
								</Tooltip>
							</div>
							<div>
								{addressSummary ? (
									addressSummary?.gas_used || 0
								) : (
									<Loader2 size={14} className="animate-spin" />
								)}
							</div>
						</div>
						<div>
							<div className="flex items-center mb-[6px]">
								<div className="font-normal text-muted-foreground">
									Transactions
								</div>
								<Tooltip title="Number of transactions related to this address.">
									<HelpCircle
										className="cursor-pointer ml-[6px] text-muted-foreground"
										width={14}
									/>
								</Tooltip>
							</div>
							<div>
								{txsCount != undefined ? (
									formatNum(isContract ? txsCount + 1 : txsCount) || 0
								) : (
									<Loader2 size={14} className="animate-spin" />
								)}
							</div>
						</div>
						<div>
							<div className="flex items-center mb-[6px]">
								<div className="font-normal text-muted-foreground">
									Transfers
								</div>
								<Tooltip title="Number of transfers to/from this address.">
									<HelpCircle
										className="cursor-pointer ml-[6px] text-muted-foreground"
										width={14}
									/>
								</Tooltip>
							</div>
							<div>
								{addressSummary ? (
									formatNum(addressSummary?.token_transfer_count) || 0
								) : (
									<Loader2 size={14} className="animate-spin" />
								)}
							</div>
						</div>
						<div>
							<div className="flex items-center mb-[6px]">
								<div className="font-normal text-muted-foreground">
									Last Balance Update
								</div>
								<Tooltip title="Block number in which the address was updated.">
									<HelpCircle
										className="cursor-pointer ml-[6px] text-muted-foreground"
										width={14}
									/>
								</Tooltip>
							</div>
							<div>
								{addressSummary ? (
									formatNum(addressSummary?.last_balance_update) || '-'
								) : (
									<Loader2 size={14} className="animate-spin" />
								)}
							</div>
						</div>
						{isToken && (
							<div>
								<div className="flex items-center mb-[6px]">
									<div className="font-normal text-muted-foreground">
										Token Tracker
									</div>
									<Tooltip title="Track token details and movements.">
										<HelpCircle
											className="cursor-pointer ml-[6px] text-muted-foreground"
											width={14}
										/>
									</Tooltip>
								</div>
								<TokenLink
									name={contractDetail?.token?.name as string}
									symbol={contractDetail?.token?.symbol as string}
									tokenAddress={address}
									// img={contractDetail?.token?.logo_path}
								/>
							</div>
						)}
						{CURRENT_CHAIN_ITEM?.chainType?.toLowerCase()?.indexOf('kadsea') >
						-1 ? (
							<></>
						) : (
							<div className="">
								<div className="flex items-center mb-[6px]">
									<div className="font-normal text-muted-foreground">
										MultiChain Balances
									</div>
									<Tooltip title="Show balances on all l2scan supported chains.">
										<HelpCircle
											className="cursor-pointer ml-[6px] text-muted-foreground"
											width={14}
										/>
									</Tooltip>
								</div>
								<Select
									onValueChange={(value) => {
										router.push(value)
									}}
								>
									<SelectTrigger className="bg-transparent w-2/3 sm:w-full">
										<div>{`Find ${mulchainBalances?.length} address balances`}</div>
									</SelectTrigger>
									<SelectContent className={cn(`theme-${CHAIN_TYPE}`)}>
										<SelectGroup className="flex flex-col">
											{mulchainBalances.map((item) => (
												<SelectItem key={item.name} value={item.url}>
													<div className="flex justify-between items-center gap-1 hover:cursor-pointer hover:font-bold">
														<div className="hover:underline">{item.name}</div>
														<div className="">{item.balance?.formatted}</div>
													</div>
												</SelectItem>
											))}
										</SelectGroup>
									</SelectContent>
								</Select>
							</div>
						)}
						<div>
							<div className="flex items-center mb-[6px]">
								<div className="font-normal text-muted-foreground">
									Private Name Tags
								</div>
								<Tooltip title="Private name tags are only visible to you.">
									<HelpCircle
										className="cursor-pointer ml-[6px] text-muted-foreground"
										width={14}
									/>
								</Tooltip>
							</div>
							<div className="flex items-center gap-2">
								{!!privateTagName && (
									<Button
										sx={{ borderRadius: 24 }}
										variant="outlined"
										size="small"
									>
										{privateTagName}
									</Button>
								)}
								<Button
									sx={{ borderRadius: 24 }}
									variant="outlined"
									size="small"
									onClick={handleAddPrivateTag}
									startIcon={<Plus width={14} />}
								>
									Add
								</Button>
							</div>
							<FormProvider methods={methods}>
								<NameTagAddDialog
									methods={methods}
									open={showDialog}
									onClose={() => setShowDialog(false)}
									isAdd={isAdd}
								/>
							</FormProvider>
						</div>
					</div>
				</CardContent>
			</Card>
		),
		[
			address,
			addressSummary,
			balance,
			contractDetail,
			erc1155TokenBalance,
			erc20TokenBalance,
			erc721TokenBalance,
			handleAddPrivateTag,
			isAdd,
			balanceFetching,
			isToken,
			methods,
			mulchainBalances,
			privateTagName,
			renderTokenList,
			router,
			showDialog,
			tokenBalanceMenuOpen,
			tokensNum,
			txsCount,
		],
	)

	return (
		<WagmiRainbowkitProvider>
			<Container>
				<PageTitle
					title={
						<div>
							<div className="flex items-center flex-wrap gap-2">
								<AddressAvatar address={address} />
								<span>{isContract ? 'Contract' : 'Address'}</span>
								<span className="text-muted-foreground text-base mt-[2px] sm:w-full sm:text-sm sm:my-[6px]">
									{address}
								</span>

								<CopyButton className={style.titleIcon} value={address ?? ''} />

								<div
									className={style.titleIcon}
									onClick={() => setShowAddressQrcodeModal(true)}
								>
									<QrCode size={14} />
								</div>
								<SimpleTooltip content="Add to watch list">
									<div
										className={style.titleIcon}
										onClick={() =>
											router.push({
												pathname: '/account/watch-list',
												query: { address },
											})
										}
									>
										<Star size={14} />
									</div>
								</SimpleTooltip>
							</div>
							<div className="flex items-center  flex-wrap">
								{publicTags?.map((tag: string, index: number) => (
									<Badge key={index} variant="secondary">
										{tag}
									</Badge>
								))}
							</div>
						</div>
					}
					adBannerProps={{ type: AdvertisementBannerEnum.TRANSACTION_ADDRESS }}
					showBack
				/>

				{publicLabels && publicLabels.labels.length > 0 && (
					<div className="w-full mb-3 flex gap-2">
						{publicLabels.labels?.map((label) => (
							<div key={label} className="flex items-center flex-wrap">
								<Label
									className="cursor-pointer mr-[6px]"
									onClick={() =>
										router.push(
											generatePath(ROUTES.LABEL.LABEL, { name: label }),
										)
									}
								>
									<span># {label}</span>
								</Label>
								{!!isToken && <Label># Token Contract</Label>}
							</div>
						))}
					</div>
				)}

				<AISummaryCard type="address" content={rawSummaryContent} />

				<LinkableTabs
					tabs={[
						{ label: 'Overview', value: 'overview', children: OverviewContent },
						{
							label: 'Activity',
							value: 'activity',
							children: <AddressActivity address={address} />,
						},
						{
							label: 'Inscriptions',
							value: 'inscriptions',
							children: <InscriptionBalance address={address} />,
						},
					]}
				/>

				<TabCard tabList={[...txTabs, ...tokenTabs]} />
				<Dialog
					open={showAddressQrcodeModal}
					onClose={() => setShowAddressQrcodeModal(false)}
					sx={{
						'& .MuiDialog-paper': {
							p: 3,
						},
					}}
				>
					<div className="flex-center flex-col">
						<div className="text-base mt-6 mb-3 font-bold break-all">
							{address}
						</div>
						<AddressQrcode address={address} size={300} />
					</div>
				</Dialog>
			</Container>
		</WagmiRainbowkitProvider>
	)
}

export default BlockchainAddressDetail
