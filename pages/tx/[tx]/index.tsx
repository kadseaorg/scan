import { useMemo } from 'react'

import {
	CheckCircleFilled,
	ClockCircleOutlined,
	FieldTimeOutlined,
	FileTextOutlined,
	SyncOutlined,
} from '@ant-design/icons'
import { Tooltip } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-queryv5'
import type { AbiEvent } from 'abitype'
import BigNumber from 'bignumber.js'
import { ChevronDownIcon, CompassIcon } from 'lucide-react'
import { useRouter } from 'next/router'
import { type Log, formatEther } from 'viem'

import { DecodedCalldata } from '@/components/abi/decoded-calldata'
import TxnPrivateNoteInput from '@/components/account/txn-private-note/TxnPrivateNoteInput'
import AISummaryCard from '@/components/ai-summary-card'
import TxInternalDetailTable from '@/components/blockchain/tx-internal-detail-table'
import { AdvertisementBannerEnum } from '@/components/common/advertisement-banner'
import { CopyButton } from '@/components/common/copy-button'
import Link from '@/components/common/link'
import Loading from '@/components/common/loading'
import {
	OverviewCards,
	OverviewCellContent,
	OverviewCellContentType,
} from '@/components/common/overview-content'
import PageTitle from '@/components/common/page-title'
import {
	TokensOrCrossTransferredRow,
	TxStatusLabel,
} from '@/components/common/table-col-components'
import LinkableTabs, { LinkableTabProps } from '@/components/linkable-tabs'
import { DecodedLogs } from '@/components/logs/decoded-logs'
import TxAction from '@/components/txs/TxAction'
import TxFeeRefound from '@/components/txs/TxFeeRefound'
import TxsInfoStatus from '@/components/txs/TxsInfoStatus'
import { Card } from '@/components/ui/card'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'
import ToTransferView from '@/components/view/tx/toTransfer'
import {
	CHAIN_TOKEN_SYMBOL,
	CURRENT_CHAIN_ITEM,
	IsKadsea,
	IsZkSync,
} from '@/constants'
import useUsdExchangeRates from '@/hooks/common/use-usd-exchange-rates'
import Container from '@/layout/container'
import { LinkTypeEnum, TxStatusTypeEnum } from '@/types'
import {
	convertGwei,
	convertNum,
	formatAddressName,
	formatNum,
	transDisplayNum,
	transDisplayTime,
	transDisplayTimeAgo,
} from '@/utils'
import { trpc } from '@/utils/trpc'

const BlockchainTxDetail: React.FC = (props) => {
	const router = useRouter()
	const search: any = router?.query
	const { tx } = search
	const { isLoading: isTxDetailLoading, data: txDetail } =
		trpc.transaction.getTxDetail.useQuery(tx, { enabled: !!tx })
	const { isLoading: isTxLogsLoading, data: txLogs } =
		trpc.transaction.getTxLogs.useQuery(tx, { enabled: !!tx })
	const isPendingTx = useMemo(
		() => null === txDetail?.block_number,
		[txDetail?.block_number],
	)
	const { convertToUsdPrice } = useUsdExchangeRates(true)
	const { usdTxValue, usdTxFee } = useMemo(() => {
		const usdTxValue = convertToUsdPrice(
			formatEther(BigInt(txDetail?.value || 0)),
			{
				showPreffix: true,
				symbol: CHAIN_TOKEN_SYMBOL,
			},
		)

		const usdTxFee = convertToUsdPrice(
			formatEther(BigInt(txDetail?.fee || 0)),
			{
				showPreffix: true,
				symbol: CHAIN_TOKEN_SYMBOL,
			},
		)

		return { usdTxValue, usdTxFee }
	}, [txDetail?.value, txDetail?.fee, convertToUsdPrice])

	const hasLogs = useMemo(() => !!txLogs?.length, [txLogs])

	const parsedInputData = useMemo(() => {
		if (!txDetail?.input) return <span>-</span>
		return (
			<DecodedCalldata
				address={txDetail?.to_address || undefined}
				data={txDetail?.input}
			/>
		)
	}, [txDetail?.input, txDetail?.to_address])

	const txAction = useMemo(() => {
		if (!txDetail?.input || txDetail?.input === '0x') return <span>-</span>
		return <TxAction txDetail={txDetail} />
	}, [txDetail])

	const overviewContent = useMemo(
		() => [
			{
				img: 'value',
				content: [
					{
						tooltip: 'The value being transacted in Ether.',
						label: 'Value',
						value: `${transDisplayNum({
							num: txDetail?.value,
							fixedNum: 6,
						})} (${usdTxValue})`,
					},
				],
			},
			{
				img: 'fee',
				content: [
					{
						tooltip:
							'Total transaction fee that includes both L1 data fee and L2 execution fee.',
						label: 'Transaction Fee',
						value: `${transDisplayNum({
							num: BigNumber.sum(txDetail?.fee ?? 0, txDetail?.l1fee ?? 0),
							fixedNum: 9,
						})} (${usdTxFee})`,
					},
				],
			},
			{
				img: 'gas_price',
				content: [
					{
						tooltip:
							'Cost per unit of gas specified for the transaction in Gwei. The higher the gas price the higher chance of getting included in a block.',
						label: 'Gas Price',
						value: convertGwei(txDetail?.gas_price),
					},
				],
			},
			{
				img: 'gas_limit',
				content: [
					{
						tooltip: 'Maximum amount of gas allocated for the transaction.',
						label: 'Gas Limit',
						value: formatNum(txDetail?.gas_limit ?? 0),
					},
				],
			},
		],
		[
			txDetail?.value,
			txDetail?.fee,
			txDetail?.l1fee,
			txDetail?.gas_price,
			txDetail?.gas_limit,
		],
	)

	const cellContent = useMemo(() => {
		const isFailed = TxStatusTypeEnum.FAILED === txDetail?.status

		const cols: OverviewCellContentType = [
			{
				colSpan: 12,
				label: 'Status',
				tooltip: 'The status of the transaction.',
				value: isFailed ? (
					<TxStatusLabel
						status={txDetail.status}
						errorInfo={txDetail?.revert_reason}
					/>
				) : (
					<TxsInfoStatus
						status={txDetail?.status}
						l1Status={txDetail?.l1_status}
						l1_commit_tx_hash={txDetail?.l1_commit_tx_hash}
						l1_prove_tx_hash={txDetail?.l1_prove_tx_hash}
						l1_execute_tx_hash={txDetail?.l1_execute_tx_hash}
					/>
				),
			},
			...(isPendingTx
				? [
						{
							label: 'Time Last Seen',
							tooltip:
								'The time when the transaction is last seen in the network pool.',
							value: (
								<div>
									<ClockCircleOutlined className="mr-[6px]" />
									{transDisplayTimeAgo(txDetail?.lastSeen)} (
									{transDisplayTime(txDetail?.lastSeen)})
								</div>
							),
						},
						{
							label: 'Time First Seen',
							tooltip:
								'The time when the transaction is first seen in the network pool.',
							value: (
								<div>
									<ClockCircleOutlined className="mr-[6px]" />
									{transDisplayTimeAgo(txDetail?.firstSeen)} (
									{transDisplayTime(txDetail?.firstSeen)})
								</div>
							),
						},
				  ]
				: []),
			{
				label: 'From',
				tooltip: 'The sending party of the transaction.',
				value: (
					<div className="flex items-center sm:break-all">
						<Link
							type={LinkTypeEnum.ADDRESS}
							value={txDetail?.from_address}
							title={txDetail?.from_address}
						>
							{formatAddressName(txDetail?.from_address, txDetail?.from_name)}
						</Link>
						<CopyButton value={txDetail?.from_address ?? ''} />
					</div>
				),
			},
			{
				label: txDetail?.to_contract ? 'Interacted With (To)' : 'To',
				tooltip:
					'The receiving party of the transaction (could be a contract address).',
				value: (
					<>
						<div className="flex items-center sm:break-all">
							{txDetail?.to_contract && (
								<Tooltip title="Contract">
									<FileTextOutlined className="mr-[4px] text-xs" />
								</Tooltip>
							)}
							<Link
								type={LinkTypeEnum.ADDRESS}
								value={txDetail?.to_address}
								title={txDetail?.to_address}
							>
								{formatAddressName(
									txDetail?.to_address,
									txDetail?.to_contract_name,
								)}
							</Link>
							<CopyButton value={txDetail?.to_address ?? ''} />
							{!!txDetail?.to_contract_verified && (
								<CheckCircleFilled className="text-xs ml-[4px] text-green" />
							)}
						</div>
						<ToTransferView tx={txDetail?.hash}></ToTransferView>
					</>
				),
			},
			...(2 === txDetail?.transaction_type
				? [
						{
							label: 'Gas Fees',
							tooltip:
								'Base Fee refers to the network Base Fee at the time of the block, while Max Fee & Max Priority Fee refer to the max amount a user is willing to pay for their tx & to give to the miner respectively.',
							value: (
								<div className="flex items-center">
									<span className="text-muted-foreground dark:text-muted-foreground-dark mr-[6px]">
										Base:
									</span>
									<span>
										{convertGwei(
											new BigNumber(txDetail?.gas_price ?? 0)
												.minus(new BigNumber(txDetail?.max_priority ?? 0))
												.toString(),
										)}
									</span>
									<div className="w-[1px] h-10px bg-muted-foreground mx-[15px]" />
									<span className="text-muted-foreground dark:text-muted-foreground-dark mr-[6px]">
										Max:
									</span>
									<span>{convertGwei(txDetail?.max_fee)}</span>
									<div className="w-[1px] h-[10px] bg-muted-foreground mx-[15px]" />
									<span className="text-muted-foreground dark:text-muted-foreground-dark mr-[6px]">
										Max Priority:
									</span>
									<span>{convertGwei(txDetail?.max_priority)}</span>
								</div>
							),
						},
				  ]
				: []),
			...(txDetail?.l1fee
				? [
						{
							label: 'L1 Data Fee',
							tooltip: 'L1 fee that pays for rollup costs.',
							value: transDisplayNum({
								num: txDetail?.l1fee ?? 0,
								fixedNum: 9,
							}),
						},
				  ]
				: []),
			{
				label: 'Execution Fee',
				tooltip: 'L2 execution fee.',
				value: (
					<div className="flex items-center">
						<span>
							{transDisplayNum({ num: txDetail?.fee ?? 0, fixedNum: 9 })}
						</span>
						{IsZkSync && <TxFeeRefound txDetail={txDetail} />}
					</div>
				),
			},
			{
				label: 'Nonce',
				tooltip:
					'Transaction number from the sending address. Each transaction sent from an address increments the nonce by 1.',
				value: txDetail?.nonce ?? '-',
			},
			{
				label: 'Gas Used',
				tooltip: 'Total amount of gas used by the transaction.',
				value: (
					<div>
						{formatNum(txDetail?.gas_used ?? 0)} |{' '}
						{txDetail?.gas_used
							? `${((txDetail?.gas_used / txDetail?.gas_limit) * 100).toFixed(
									2,
							  )}%`
							: '-'}
					</div>
				),
			},
			{
				label: 'Position in block',
				tooltip: 'Index position of Transaction in the block.',
				value: txDetail?.transaction_index ?? '-',
			},
			{
				colSpan: 12,
				label: 'Input Data',
				tooltip:
					'Additional data included for this transaction. Commonly used as part of contract interaction or as a message sent to the recipient.',
				value: parsedInputData,
			},
			// Private Transaction Note
			{
				label: 'Private Note',
				tooltip: 'Private note for this transaction.',
				value: <TxnPrivateNoteInput txHash={txDetail?.hash} />,
			},
		]

		// Token Transfer Item
		if (!!txDetail?.token_transfers?.length) {
			cols.splice(-7, 0, {
				colSpan: 12,
				label: 'Tokens Transferred',
				tooltip: 'List of tokens transferred in the transaction.',
				value: <TokensOrCrossTransferredRow data={txDetail?.token_transfers} />,
			})
		}

		if (txDetail?.input && txDetail?.input !== '0x') {
			cols.splice(2, 0, {
				colSpan: 12,
				label: 'Transaction Action',
				tooltip: 'Highlighted events of the transaction',
				value: txAction,
			})
		}

		// Cross Transfer Item
		if (!!txDetail?.crossTransfer?.length) {
			cols.splice(-7, 0, {
				colSpan: 12,
				label: 'Cross Transferred',
				tooltip: 'List of cross transferred in the transaction.',
				value: <TokensOrCrossTransferredRow data={txDetail?.cross_transfer} />,
			})
		}

		return cols
	}, [txDetail, isPendingTx, parsedInputData])

	const overviewTab = useMemo(
		() => (
			<Card className="p-6">
				<OverviewCards className="mb-6" data={overviewContent} />
				<div className="w-full border-[1px] border-solid border-border rounded">
					<div className="p-6 text-muted-foreground lmd:px-[10px]">
						{isPendingTx ? (
							<SyncOutlined className="mr-1" spin />
						) : (
							<FieldTimeOutlined className="mr-1" />
						)}
						{transDisplayTimeAgo(txDetail?.timestamp)} (
						{transDisplayTime(txDetail?.timestamp)})
					</div>
					<div className="flex p-6 pt-0 border-b-[1px] border-solid border-border flex-wrap gap-7 sm:gap-3">
						<div className="flex flex-col">
							<div className="mb-3 text-muted-foreground flex gap-3">
								<p>Transaction Hash</p>
								{CURRENT_CHAIN_ITEM.externalExplorers && (
									<Popover>
										<PopoverTrigger>
											<div className="flex gap-1 border rounded-md p-1">
												<CompassIcon size={14} />
												<ChevronDownIcon size={14} />
											</div>
										</PopoverTrigger>
										<PopoverContent>
											<p className="text-sm text-muted-foreground">
												Verify with other explorers
											</p>
											<div className="flex flex-col gap-1 mt-2">
												{CURRENT_CHAIN_ITEM?.externalExplorers.map(
													(item, index) => (
														<a
															key={index}
															className="text-md font-medium text-primary cursor-pointer"
															// target="_blank"
															href={`${item.url}/tx/${txDetail?.hash ?? ''}`}
															rel="l2scan"
														>
															{item.name}
														</a>
													),
												)}
											</div>
										</PopoverContent>
									</Popover>
								)}
							</div>
							<CopyButton value={txDetail?.hash ?? ''}>
								<div className="text-[20px] font-medium break-all sm:text-base leading-7">
									{txDetail?.hash}
								</div>
							</CopyButton>
						</div>
						<div className="flex flex-col">
							<div className="mb-3 sm:mt-3 text-muted-foreground">Block</div>
							<Link
								className="text-[20px] font-medium text-primary dark:text-primary sm:text-base"
								type={LinkTypeEnum.BLOCK}
								value={convertNum(txDetail?.block_number)}
							/>
						</div>
						{!IsKadsea && (
							<div className="flex flex-col">
								<div className="mb-3 sm:mt-3 text-muted-foreground">Batch</div>
								{undefined === txDetail?.l1_batch_number ? (
									'-'
								) : (
									<Link
										type={LinkTypeEnum.BATCH}
										value={convertNum(txDetail?.l1_batch_number)}
									/>
								)}
							</div>
						)}
					</div>
					<div className="p-6 lmd:px-[10px]">
						<OverviewCellContent data={cellContent} />
					</div>
				</div>
			</Card>
		),
		[
			overviewContent,
			isPendingTx,
			txDetail?.timestamp,
			txDetail?.hash,
			txDetail?.block_number,
			txDetail?.l1_batch_number,
			cellContent,
		],
	)

	const tabs = useMemo(() => {
		const data: LinkableTabProps[] = []

		// Internal Txns Tab
		data.push({
			label: 'Internal Call Trace',
			value: 'internalcalltrace',
			children: (
				<Card className="p-6">
					<TxInternalDetailTable
						from={txDetail?.from_address ?? ''}
						to={txDetail?.to_address ?? ''}
						tx={tx}
					/>
				</Card>
			),
		})

		// Logs Tab
		if (hasLogs) {
			data.push({
				label: `Logs (${txLogs?.length})`,
				value: 'logs',
				children: (
					<Card className="p-6">
						<DecodedLogs
							logs={txLogs as Log<bigint, number, false, AbiEvent>[]}
						/>
					</Card>
				),
			})
		}

		return data
	}, [hasLogs, txDetail?.from_address, txDetail?.to_address, tx, txLogs])

	if (isTxDetailLoading) {
		return (
			<Container>
				<PageTitle
					title="Transaction Details"
					adBannerProps={{ type: AdvertisementBannerEnum.TRANSACTION_ADDRESS }}
				/>
				<Loading />
			</Container>
		)
	}

	const queryClient = new QueryClient()

	return (
		<QueryClientProvider client={queryClient}>
			<Container>
				<PageTitle
					title="Transaction Details"
					adBannerProps={{ type: AdvertisementBannerEnum.TRANSACTION_ADDRESS }}
				/>
				<div className="px-3 lmd:px-[0]">
					<AISummaryCard type="transaction" content={txDetail} />
				</div>
				<LinkableTabs
					tabs={[
						{
							label: 'Overview',
							value: 'overview',
							children: overviewTab,
						},
						...tabs,
					]}
				/>
			</Container>
		</QueryClientProvider>
	)
}

export default BlockchainTxDetail
