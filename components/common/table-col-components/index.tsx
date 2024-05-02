import React, { CSSProperties, useMemo } from 'react'

import {
	CaretRightOutlined,
	CheckCircleFilled,
	ClockCircleFilled,
	CloseCircleFilled,
	ExclamationCircleFilled,
	SwapRightOutlined,
} from '@ant-design/icons'
import { getAddress } from '@ethersproject/address'
import { TextField, Tooltip } from '@mui/material'
import classNames from 'classnames'
import { ScrollText } from 'lucide-react'
import Image from 'next/image'

import Link, { TokenLink, getLinkRoute } from '@/components/common/link'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CHAIN_TYPE, IsZkSync } from '@/constants'
import {
	CrossTransferItemType,
	L1StatusTypeEnum,
	LinkTypeEnum,
	TokensTransferItemType,
	TxCrossTransferType,
	TxStatusType,
	TxStatusTypeEnum,
} from '@/types'
import { EnumChainType } from '@/types/chain'
import { getL1ExplorerUrl, transDisplayNum } from '@/utils'
import { groupBy } from 'lodash-es'
import { CopyButton } from '../copy-button'

export const TransArrowIcon: React.FC = () => (
	<div className="w-[20px] h-[20px] rounded-full flex-center bg-primary bg-opacity-20">
		<SwapRightOutlined className="text-xs" />
	</div>
)

export const MethodLabel: React.FC<{ method: string | undefined }> = ({
	method,
}) => (
	<Tooltip title={method}>
		<div className="max-w-[122px] min-h-[25px] px-[6px] py-[4px] text-xs rounded text-center ellipsis my-auto bg-primary text-primary-foreground">
			{method === '0x' ? 'Transfer' : method || '-'}
		</div>
	</Tooltip>
)

export const L1StatusLabel: React.FC<{
	style?: CSSProperties
	className?: string
	l1Status: L1StatusTypeEnum | undefined | string
	l1CommitTransactionHash?: string | undefined | null
	l1FinalizeTransactionHash?: string | undefined | null
	showIcon?: boolean
	showLabel?: boolean
	showBg?: boolean
	iconWidth?: number
	iconHeight?: number
}> = ({
	style: myStyle,
	className = '',
	l1Status,
	l1CommitTransactionHash,
	l1FinalizeTransactionHash,
	showIcon = true,
	showLabel = true,
	showBg = true,
	iconWidth = 16,
	iconHeight = 16,
}) => {
	const link = l1CommitTransactionHash || l1FinalizeTransactionHash || ''
	const hasLink =
		(L1StatusTypeEnum.COMMITTED === l1Status && !!l1CommitTransactionHash) ||
		(L1StatusTypeEnum.FINALIZED === l1Status && !!l1FinalizeTransactionHash)

	// wrap color
	let wrapColorClass = 'leading-4 font-normal'
	if (
		L1StatusTypeEnum.FINALIZED === l1Status ||
		L1StatusTypeEnum.VERIFIED === l1Status
	) {
		showBg && (wrapColorClass += ' bg-green dark:bg-green/20')
	}
	if (
		L1StatusTypeEnum.COMMITTED === l1Status ||
		L1StatusTypeEnum.INCLUDED === l1Status ||
		L1StatusTypeEnum.SEALED === l1Status
	) {
		showBg && (wrapColorClass += ' bg-lightOrange')
	}
	if (L1StatusTypeEnum.PENDING === l1Status) {
		showBg &&
			(wrapColorClass += ' bg-[#eee] dark:bg-[#373435] dark:text-foreground')
	}
	if (L1StatusTypeEnum.FAILED === l1Status) {
		showBg && (wrapColorClass += ' bg-pink-100')
	}

	// wrap hover color
	let wrapHoverColorClass = ''
	if (showBg && hasLink) {
		wrapHoverColorClass += `cursor-pointer transition-all hover:text-white`
		L1StatusTypeEnum.FINALIZED === l1Status &&
			(wrapHoverColorClass += ' hover:bg-[#00c29eb3]')
		L1StatusTypeEnum.COMMITTED === l1Status &&
			(wrapHoverColorClass += ' hover:bg-[#f9761ab3]')
	}

	// icon props
	const getIconProps = useMemo(
		() => ({
			width: iconWidth,
			height: iconHeight,
			className: classNames(
				showLabel && 'mr-[6px]',
				hasLink && 'transition-all',
			),
		}),
		[hasLink, iconHeight, iconWidth, showLabel],
	)

	const label = useMemo(() => {
		switch (l1Status) {
			case L1StatusTypeEnum.FINALIZED:
				return 'Finalized'
			case L1StatusTypeEnum.COMMITTED:
				return IsZkSync ? 'Validating' : 'Committed'
			case L1StatusTypeEnum.SEALED:
				return IsZkSync ? 'Executing' : 'Sealed'
			case L1StatusTypeEnum.UNCOMMITTED:
				return 'Uncommitted'
			case L1StatusTypeEnum.VERIFIED:
				return IsZkSync ? 'Executed' : 'Verified'
			case L1StatusTypeEnum.INCLUDED:
				return 'Included'
			case L1StatusTypeEnum.PENDING:
				return 'Pending'
			case L1StatusTypeEnum.FAILED:
				return 'Failed'
			default:
				if (
					CHAIN_TYPE! === EnumChainType.LINEA ||
					CHAIN_TYPE === EnumChainType.SCROLL_SEPOLIA ||
					CHAIN_TYPE === EnumChainType.BASE
				) {
					return 'Uncommitted'
				}
				if (CHAIN_TYPE === EnumChainType.ZKSYNC) {
					return 'Sending'
				}
				return 'Uncommitted'
		}
	}, [l1Status])

	return (
		<Tooltip title={!showLabel ? `L1 Status: ${label}` : undefined}>
			<div
				style={myStyle}
				className={classNames(
					className,
					wrapColorClass,
					wrapHoverColorClass,
					showBg && 'w-[120px] pl-[9px] py-[4px] rounded min-h-[25px]',
					'text-xs flex items-center my-auto text-foreground',
				)}
				onClick={() => !!link && window.open(getL1ExplorerUrl(link))}
			>
				{showIcon &&
					(L1StatusTypeEnum.FINALIZED === l1Status ||
						L1StatusTypeEnum.VERIFIED === l1Status) && (
						<Image
							src="/svgs/checked.svg"
							width={iconWidth}
							height={iconHeight}
							className={getIconProps.className}
							alt="checked"
						/>
					)}

				{showIcon &&
					(L1StatusTypeEnum.COMMITTED === l1Status ||
						L1StatusTypeEnum.INCLUDED === l1Status ||
						L1StatusTypeEnum.SEALED === l1Status) && (
						<Image
							src="/svgs/checking.svg"
							width={iconWidth}
							height={iconHeight}
							className={getIconProps.className}
							alt="checking"
						/>
					)}

				{showIcon &&
					(L1StatusTypeEnum.PENDING === l1Status ||
						label == 'Unsealed' ||
						label == 'Uncommitted') && (
						<Image
							src="/svgs/time.svg"
							width={iconWidth}
							height={iconHeight}
							className={getIconProps.className}
							alt="time"
						/>
					)}

				{showIcon && L1StatusTypeEnum.FAILED === l1Status && (
					<ExclamationCircleFilled className="text-pink-300 mr-[6px] text-base" />
				)}

				{showLabel && <span>{label}</span>}
			</div>
		</Tooltip>
	)
}

export const TxStatusLabel: React.FC<{
	status: TxStatusTypeEnum | undefined | null
	errorInfo?: string
}> = ({ status, errorInfo }) => (
	<Tooltip title={errorInfo}>
		<div
			className={classNames(
				undefined === status &&
					'bg-[#77838f1a] text-muted-foreground dark:text-muted-foreground-dark',
				TxStatusTypeEnum.SUCCEED === status &&
					'dark:bg-green dark:bg-opacity-20 text-green',
				TxStatusTypeEnum.FAILED === status &&
					'bg-destructive text-destructive-foreground',
				'w-fit rounded py-[4px] px-[10px] text-xs',
			)}
		>
			{/* pending */}
			{undefined === status && (
				<ClockCircleFilled className="text-xs mr-[4px] text-[#999]" />
			)}

			{/* indexing */}
			{null === status && (
				<ClockCircleFilled className="text-xs mr-[4px] text-[#999]" />
			)}

			{/* success */}
			{TxStatusTypeEnum.SUCCEED === status && (
				<CheckCircleFilled className="text-xs mr-[4px] text-green dark:text-darkGreen" />
			)}

			{/* failed */}
			{TxStatusTypeEnum.FAILED === status && (
				<CloseCircleFilled className="text-xs mr-[4px] text-red" />
			)}

			{status !== null && status !== undefined
				? TxStatusType?.[status]
				: status === null
				  ? 'Indexing'
				  : 'Pending'}
		</div>
	</Tooltip>
)

const TransferTabs = [
	{ label: 'All Transfers', value: 'ALL' },
	{ label: 'Net Transfers', value: 'NET' },
] as const
export const TokensOrCrossTransferredRow: React.FC<{
	data: Partial<TokensTransferItemType & CrossTransferItemType>[] | undefined
}> = ({ data }) => {
	const [tabValue, setTabValue] = React.useState<'ALL' | 'NET'>('ALL')

	const {
		erc20: erc20TokenTransfers,
		erc1155: erc1155TokenTransfers,
		erc721: erc721TokenTransfers,
	} = useMemo(() => {
		return groupBy(data, 'token_type') as {
			erc721: typeof data
			erc20: typeof data
			erc1155: typeof data
		}
	}, [data])

	const netTransfers = useMemo(() => {
		if (!erc20TokenTransfers) return []
		const addressRecords: any = {}
		erc20TokenTransfers.forEach(
			(transfer) => {
				const fromAddress = transfer.from_address!
				const toAddress = transfer.to_address!
				const token = transfer.symbol!
				if (fromAddress !== '0x0000000000000000000000000000000000000000') {
					if (!addressRecords[fromAddress]) {
						addressRecords[fromAddress] = {
							address: fromAddress,
							tokens: {
								[token]: [],
							},
						}
					}
					addressRecords[fromAddress].tokens[token]
						? addressRecords[fromAddress].tokens[token].push(transfer)
						: (addressRecords[fromAddress].tokens[token] = [transfer])
				}

				if (toAddress !== '0x0000000000000000000000000000000000000000') {
					if (!addressRecords[toAddress]) {
						addressRecords[toAddress] = {
							address: toAddress,
							tokens: {
								[token]: [],
							},
						}
					}
					addressRecords[toAddress].tokens[token]
						? addressRecords[toAddress].tokens[token].push(transfer)
						: (addressRecords[toAddress].tokens[token] = [transfer])
				}
			},
			[data],
		)
		const result = []
		for (const record of Object.values(addressRecords)) {
			const { address, tokens } = record
			for (const token of Object.values(tokens)) {
				const netToken = token.reduce((pre: any, cur: any) => {
					const { from_address, to_address, amount, value } = cur
					if (from_address === address) {
						pre = value ? pre - Number(value) : pre - Number(amount)
					} else if (to_address === address) {
						pre = value ? pre + Number(value) : pre + Number(amount)
					}
					return pre
				}, 0)
				const decimals = token[0]?.decimals
				result.push({
					address,
					token: token[0],
					netValueDisplay: transDisplayNum({
						num: netToken > 0 ? netToken : netToken * -1,
						suffix: '',
						decimals: decimals ?? 0,
					}),
					netValue: netToken,
				})
			}
		}
		return result
	}, [data])

	const renderNFTTransfer = (
		item: Partial<TokensTransferItemType & CrossTransferItemType>,
		index: number,
		type: 'ERC-721' | 'ERC-1155',
	) => {
		return (
			<div
				key={index}
				className="flex items-center mb-[4px] last:mb-0 flex-wrap"
			>
				<div className="w-12 h-12 mr-4 bg-primary/20 rounded-md text-sm flex items-center justify-center">
					NFT
				</div>
				<div className="flex flex-col">
					<div className="flex gap-1">
						<span className="text-muted-foreground">{type}</span>
						{type === 'ERC-1155' && (
							<>
								<span>For</span>
								<span>{item.amount}</span>
								<span>Of</span>
							</>
						)}
						<span>Token ID</span>[{item?.token_id}]
						<span dangerouslySetInnerHTML={{ __html: item.name! }} />
					</div>
					<div className="flex gap-1">
						From
						<Link
							type={LinkTypeEnum.ADDRESS}
							value={item?.from_address}
							ellipsis
						/>
						To
						<Link
							type={LinkTypeEnum.ADDRESS}
							value={item?.to_address}
							ellipsis
						/>
					</div>
				</div>
			</div>
		)
	}

	const erc721TokenTransfersEl = erc721TokenTransfers?.length > 0 && (
		<>
			<h3 className="!text-md">ERC 721 Token</h3>
			{erc721TokenTransfers?.map((item, index) =>
				renderNFTTransfer(item, index, 'ERC-721'),
			)}
		</>
	)

	const erc1155TokenTransfersEl = erc1155TokenTransfers?.length > 0 && (
		<>
			<h3 className="!text-md">ERC 1155 Token</h3>
			{erc1155TokenTransfers?.map((item, index) =>
				renderNFTTransfer(item, index, 'ERC-1155'),
			)}
		</>
	)

	return (
		<div>
			{erc20TokenTransfers?.length > 0 && (
				<>
					<h3 className="!text-md">ERC20 Token</h3>
					<Tabs value={tabValue} onValueChange={setTabValue}>
						<TabsList className="mb-2">
							{TransferTabs.map((tab) => {
								const isActive = tab.value === 'ALL'
								return (
									<TabsTrigger
										key={tab.value}
										value={tab.value}
										className={`w-32 px-2 py-1 ${isActive ? 'bg-muted' : ''}`}
									>
										{tab.label}
									</TabsTrigger>
								)
							})}
						</TabsList>
					</Tabs>
					{tabValue === 'ALL' &&
						erc20TokenTransfers?.map((item, index) => (
							<div
								key={index}
								className="flex items-center mb-[4px] last:mb-0 flex-wrap"
							>
								<CaretRightOutlined className="text-xs mr-[6px]" />
								<span className="font-bold mr-[6px]">From</span>
								<Link
									type={LinkTypeEnum.ADDRESS}
									value={item?.from_address}
									ellipsis
								/>
								<span className="font-bold mx-[6px]">To</span>
								<Link
									type={LinkTypeEnum.ADDRESS}
									value={item?.to_address}
									ellipsis
								/>
								<span className="font-bold mx-[6px]">For</span>
								<span className="mr-[8px]">
									{transDisplayNum({
										num: item?.value ?? item?.amount,
										suffix: '',
										decimals: item?.decimals ?? 0,
									})}
								</span>
								<TokenLink
									name={item?.name}
									symbol={item?.symbol}
									tokenAddress={item?.token_address || item?.l2Token || ''}
									img={item?.logo_path}
									ellipsis
								/>
								{/* TODO: handle l1 txns */}
								{!!item?.l1TransactionHash && (
									<>
										<div className="w-[70px] h-[22px] flex-center bg-green text-green text-xs rounded text-center mx-6">
											{undefined !== item?.type
												? TxCrossTransferType[item?.type]
												: '-'}
										</div>
										<a
											href={getL1ExplorerUrl(item?.l1TransactionHash)}
											target="_blank"
											rel="noreferrer"
										>
											l1Transaction
										</a>
									</>
								)}
							</div>
						))}
					{tabValue === 'NET' &&
						netTransfers.map((item, index) => (
							<div
								key={index}
								className="flex items-center mb-[4px] last:mb-0 flex-wrap"
							>
								<CaretRightOutlined className="text-xs mr-[6px]" />
								<Link
									type={LinkTypeEnum.ADDRESS}
									value={item?.address}
									ellipsis
								/>
								<span className="font-bold mx-[6px]">
									{item?.netValue > 0 ? 'received' : 'sent'}
								</span>

								<span className="font-bold mx-[6px]">For</span>
								<span className="mr-[8px]">{item.netValueDisplay}</span>
								<TokenLink
									name={item?.token.name}
									symbol={item?.token.symbol}
									tokenAddress={
										item?.token.token_address || item?.token.l2Token || ''
									}
									img={item?.token.logo_path}
									ellipsis
								/>
							</div>
						))}
				</>
			)}
			{erc721TokenTransfersEl}
			{erc1155TokenTransfersEl}
		</div>
	)
}

export const TextAreaRow: React.FC<{
	style?: CSSProperties
	className?: string
	value?: string | undefined | null
	maxRows?: number
}> = ({ style: _style = {}, className = '', value = '', maxRows = 14 }) => (
	<TextField
		style={_style}
		size="small"
		multiline
		rows={maxRows}
		className={classNames(
			className,
			'bg-gray text-xs px-3 py-[8px] dark:bg-darkGray',
		)}
		value={value || ''}
		InputProps={{
			readOnly: true,
		}}
	></TextField>
)

export const AddressPublicTag: React.FC<{
	address: string
	tag: string
	style?: CSSProperties
	className?: string
}> = ({ address, tag, style: _style = {}, className = '' }) => {
	return (
		<div className="flex items-center">
			<Tooltip
				title={
					<div className="flex flex-col items-center">
						<span>{tag}</span>
						<span>{address}</span>
					</div>
				}
			>
				<a
					className=""
					href={getLinkRoute(LinkTypeEnum.ADDRESS, getAddress(address))}
					onClick={(e) => e.stopPropagation()}
				>
					<div
						className={classNames(className, 'flex items-center')}
						style={{ width: 80, ..._style }}
					>
						<ScrollText size={14} />
						<span className="ml-[2px] ellipsis">{tag}</span>
					</div>
				</a>
			</Tooltip>
			<CopyButton value={address} />
		</div>
	)
}
