import {
	Button,
	LinearProgress,
	Stack,
	Tooltip,
	Typography,
} from '@mui/material'
import { ColumnDef } from '@tanstack/react-table'
import BigNumber from 'bignumber.js'
import {
	ArrowDown,
	ArrowUp,
	ChevronDown,
	ChevronUp,
	Loader2,
	Star,
} from 'lucide-react'

import Link, { AddressLinkWithCopy, TokenLink } from '@/components/common/link'
import SimpleTooltip from '@/components/common/simple-tooltip'
import {
	MethodLabel,
	TransArrowIcon,
} from '@/components/common/table-col-components'
import { TABLE_CONFIG } from '@/constants'
import { cn } from '@/lib/utils'
import { LinkTypeEnum, TokenTypeEnum } from '@/types'
import {
	convertNum,
	formatNum,
	shortString,
	transDisplayNum,
	transDisplayTime,
	transDisplayTimeAgo,
} from '@/utils'

export const getTokenTxsColumns = (type: TokenTypeEnum) => {
	const cols: ColumnDef<any>[] = [
		{
			header: 'Txn Hash',
			accessorKey: 'transaction_hash',
			cell: ({ row }) => (
				<Link
					type={LinkTypeEnum.TX}
					value={row.getValue('transaction_hash')}
					ellipsis
				/>
			),
		},
		{
			header: 'Method',
			accessorKey: 'method_name',
			cell: ({ row }) => <MethodLabel method={row.getValue('method_name')} />,
		},

		{
			header: ({ column }) => {
				const isAsc = column.getIsSorted() === 'asc'

				return (
					<Button
						variant="text"
						color="inherit"
						endIcon={isAsc ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
						onClick={() => {
							column.toggleSorting(isAsc)
						}}
					>
						Age
					</Button>
				)
			},
			accessorKey: 'timestamp',
			cell: ({ row }) => (
				<Tooltip title={transDisplayTime(row.getValue('timestamp'))}>
					<Typography variant="body2">
						{transDisplayTimeAgo(row.getValue('timestamp'))}
					</Typography>
				</Tooltip>
			),
		},
		{
			header: 'From',
			accessorKey: 'from_address',
			cell: ({ row }) => (
				<AddressLinkWithCopy
					address={row.getValue('from_address')}
					width={TABLE_CONFIG.COL_WIDHT.ADDRESS}
				/>
			),
			// <Link type={LinkTypeEnum.ADDRESS} value={row.getValue('from_address')} width={TABLE_CONFIG.COL_WIDHT.ADDRESS} ellipsis />
		},
		{
			id: 'icon',
			header: '',
			accessorKey: 'icon_key',
			cell: () => <TransArrowIcon />,
		},
		{
			header: 'To',
			accessorKey: 'to_address',
			cell: ({ row }) => (
				<AddressLinkWithCopy
					address={row.getValue('to_address')}
					width={TABLE_CONFIG.COL_WIDHT.ADDRESS}
				/>
			),
			// <Link type={LinkTypeEnum.ADDRESS} value={row.getValue('to_address')} width={TABLE_CONFIG.COL_WIDHT.ADDRESS} ellipsis />
		},
		{
			header: 'Amount',
			accessorKey: '',
			cell: ({ row }) => {
				const { value, decimals } = row.original
				return transDisplayNum({ num: value, decimals: decimals, suffix: '' })
			},
		},
		{
			header: 'Token',
			accessorKey: '',
			cell: ({ row }) => {
				const { name, symbol, token_address, logo_path } = row.original
				return (
					<TokenLink
						name={name}
						symbol={symbol}
						tokenAddress={token_address}
						img={logo_path}
						ellipsis
					/>
				)
			},
		},
	]

	if (TokenTypeEnum.ERC20 !== type) {
		cols.splice(5, 0, {
			header: 'TokenID',
			accessorKey: 'token_id',
			cell: ({ row }) => (
				<Tooltip title={new BigNumber(row.getValue('token_id'))?.toString(10)}>
					<div className="w-[100px] ellipsis">
						{shortString(new BigNumber(row.getValue('token_id'))?.toString(10))}
					</div>
				</Tooltip>
			),
		})
	}

	TokenTypeEnum.ERC721 === type && cols.splice(6, 1)

	// return mergeDefaultColumns(cols)
	return cols
}

export const getTokenHoldersColumns = (decimals = 18) => {
	const columns: ColumnDef<any>[] = [
		{
			header: 'Rank',
			accessorKey: 'rank',
			cell: ({ row }) => row.getValue('rank'),
		},
		{
			header: 'Address',
			accessorKey: 'address',
			cell: ({ row }) => (
				<AddressLinkWithCopy address={row.getValue('address')} />
			),
		},
		//<Link type={LinkTypeEnum.ADDRESS} value={row.getValue('address')} />
		// ...(type === TokenTypeEnum.ERC1155 || type === TokenTypeEnum.ERC721
		//   ? [
		//       {
		//         header: 'TokenID',
		//         accessorKey: 'token_id',
		//         cell: ({ row }: any) => (
		//           <Tooltip title={new BigNumber(row.getValue('token_id'))?.toString(10)}>
		//             <div className="w-[100px] ellipsis">{shortString(new BigNumber(row.getValue('token_id'))?.toString(10))}</div>
		//           </Tooltip>
		//         )
		//       }
		//     ]
		//   : []),
		{
			header: 'Quantity',
			accessorKey: 'quantity',
			cell: ({ row }) => {
				const value = BigNumber(row.getValue('quantity')).div(10 ** decimals)
				return (
					<Tooltip title={value.toFormat()}>
						<span>{value.toFormat(4)}</span>
					</Tooltip>
				)
			},
		},
		{
			header: 'Percentage',
			accessorKey: 'percentage',
			cell: ({ row }) => {
				return (
					<Stack sx={{ mt: 2 }}>
						<Typography variant="body2">
							{transDisplayNum({
								num: Number(row.getValue('percentage')) * 100,
								fixedNum: 4,
								suffix: '%',
								decimals: 0,
							})}
						</Typography>

						<LinearProgress
							variant="determinate"
							value={Number(row.getValue('percentage')) * 100}
							sx={{ mb: 2, width: 1 }}
						/>
					</Stack>
				)
			},
		},
	]

	return columns
}

export const getTokenColumns = (
	type: TokenTypeEnum,
	handleAddFavorite?: (address: string, isAdd: boolean) => void,
) => {
	let cols: ColumnDef<any>[] = [
		{
			header: '#',
			accessorKey: 'rank',
			cell: ({ row }) => row.getValue('rank'),
		},
		{
			header: 'Token',
			accessorKey: 'token',
			cell: (params) => {
				const { name, symbol, address } = params.row.original
				return (
					<TokenLink
						className="whitespace-nowrap"
						name={name}
						symbol={symbol}
						imgSize={22}
						tokenAddress={address}
						// img={logo_path} desc={description}
					/>
				)
			},
		},
	]
	const middleColumns: ColumnDef<any>[] = [
		{
			header: 'Price',
			accessorKey: 'price',
			cell: ({ row }) =>
				!!row.getValue('price')
					? formatNum(convertNum(row.getValue('price')), '$')
					: '-',
		},
		{
			header: 'Change (%)',
			accessorKey: 'percentChange24h',
			cell: ({ row }) => {
				const value = row.getValue('percentChange24h') as number
				const isUp = Number(row.getValue('percentChange24h') ?? 0) > 0
				const iconClass = 'w-3 h-3 mr-1'

				return !!value ? (
					<div
						className={cn(
							'w-fit flex items-center',
							isUp ? 'text-green-500' : 'text-red-500',
						)}
					>
						{isUp ? (
							<ChevronUp className={iconClass} />
						) : (
							<ChevronDown className={iconClass} />
						)}
						<span>{value}%</span>
					</div>
				) : (
					'-'
				)
			},
		},
		{
			header: 'Volume (24H)',
			accessorKey: 'volume24h',
			cell: ({ row }) =>
				!!row.getValue('volume24h')
					? formatNum(convertNum(row.getValue('volume24h')), '$')
					: '-',
		},
		{
			header: 'Market Cap',
			accessorKey: 'marketCap',
			cell: ({ row }) =>
				!!row.getValue('marketCap')
					? formatNum(convertNum(row.getValue('marketCap')), '$')
					: '-',
		},
	]
	if (TokenTypeEnum.ERC20 === type) {
		cols = [...cols, ...middleColumns]
	}
	const otherCols: ColumnDef<any>[] =
		TokenTypeEnum.ERC20 === type
			? [
					// { headerName: 'Price', field: 'Price', flex: 1, width: 150, renderCell: params => formatNum(params.value || '0.0', '$') },
					// {
					//   headerName: 'Change (%)',
					//   field: 'Change',
					//   width: 150,
					//   flex: 1,
					//   renderCell: params => <ValueFluctuation value={params.value} isPercentage={true} />
					// },
					// { headerName: 'Market Cap', field: 'OnChainMarketCap', width: 150, flex: 1, renderCell: params => formatNum(params.value || '0.0', '$') },
					{
						header: 'Holders',
						accessorKey: 'holders',
						cell: ({ row }) => formatNum(convertNum(row.getValue('holders'))),
					},
					{
						id: 'add_favorite',
						header: '',
						cell: ({ row }) =>
							row.original.isUpdating ? (
								<Loader2 size={16} className="animate-spin" />
							) : (
								<SimpleTooltip
									content={
										row.original.is_favorite
											? 'Remove from favorite tokens'
											: 'Add to favorite tokens'
									}
								>
									<Star
										className="cursor-pointer"
										size={16}
										fill={row.original.is_favorite ? 'yellow' : undefined}
										onClick={() =>
											handleAddFavorite?.(
												row.original.address,
												!row.original.is_favorite,
											)
										}
									/>
								</SimpleTooltip>
							),
					},
			  ]
			: [
					{
						header: 'Transfers (24H)',
						accessorKey: 'trans24h',
						cell: ({ row }) => formatNum(convertNum(row.getValue('trans24h'))),
					},
					{
						header: 'Transfers (3D)',
						accessorKey: 'trans3d',
						cell: ({ row }) => formatNum(convertNum(row.getValue('trans3d'))),
					},
			  ]

	// return mergeDefaultColumns([...cols, ...otherCols])
	// const addFavoriteCol = {
	//   id: 'add_favorite',
	//   header: '',
	//   accesorKey: '',
	//   cell: ({ row }) => (
	//     <Star
	//       className="cursor-pointer"
	//       size={14}
	//       fill={row.original.is_favorite ? 'yellow' : undefined}
	//       onClick={() => handleAddFavorite?.(row.original.address)}
	//     />
	//   )
	// }
	return [...cols, ...otherCols]
}
