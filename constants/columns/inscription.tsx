import { Badge, LinearProgress, Tooltip, Typography } from '@mui/material'
import { ColumnDef } from '@tanstack/react-table'

import Link, { AddressLinkWithCopy } from '@/components/common/link'
import { TABLE_CONFIG } from '@/constants'
import { LinkTypeEnum } from '@/types'
import {
	convertGwei,
	convertNum,
	formatNum,
	transDisplayNum,
	transDisplayTime,
	transDisplayTimeAgo,
} from '@/utils'

export const inscriptionColumns: ColumnDef<any>[] = [
	{
		header: 'Tick',
		accessorKey: 'tick',
		cell: ({ row }) => (
			<Link type={LinkTypeEnum.INSCRIPTION} value={row.getValue('tick')} />
		),
	},
	{
		header: 'Standard',
		accessorKey: 'standard',
		cell: ({ row }) => (
			<Typography variant="body1">{row.getValue('standard')}</Typography>
		),
	},
	{
		header: 'Total supply',
		accessorKey: 'max_supply',
		cell: ({ row }) => formatNum(row.getValue('max_supply')),
	},
	{
		header: 'Inscribed',
		accessorKey: 'total_minted',
		cell: ({ row }) => {
			const percentage =
				Number(
					Number(row.getValue('total_minted')) /
						Number(row.getValue('max_supply')),
				) * 100
			return (
				<div className="flex flex-col">
					<Typography>
						{formatNum(
							Math.min(
								row.getValue('total_minted'),
								row.getValue('max_supply'),
							),
						)}
					</Typography>
					<LinearProgress
						variant="determinate"
						value={percentage > 100 ? 100 : percentage}
						sx={{ mb: 2, width: 1 }}
					/>
				</div>
			)
		},
	},
	{
		header: 'Holders',
		accessorKey: 'holder_count',
		cell: ({ row }) => formatNum(row.getValue('holder_count')),
	},
]

export const txColumns: ColumnDef<any>[] = [
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
		header: 'Tick',
		accessorKey: 'tick',
		// cell: ({ row }) => <Link type={LinkTypeEnum.INSCRIPTION} value={row.getValue('tick')}  /> //FIXME: only detail page for inscription whitelist
		cell: ({ row }) => (
			<Typography variant="body1">{row.getValue('tick')}</Typography>
		),
	},
	{
		header: 'Operation',
		accessorKey: 'operation',
		cell: ({ row }) => {
			const op = row.getValue('operation') as string
			const opText = op ? op.charAt(0).toUpperCase() + op.slice(1) : ''
			return (
				<div className="px-[6px] py-[4px] text-sm rounded  text-white bg-gray-400 ">
					{opText}
				</div>
			)
		},
	},
	{
		header: 'Block',
		accessorKey: 'block_number',
		cell: ({ row }) => (
			<Link type={LinkTypeEnum.BLOCK} value={row.getValue('block_number')} />
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
		header: 'Amount',
		accessorKey: 'amount',
		cell: ({ row }) => formatNum(row.getValue('amount')),
	},
	{
		header: 'Gas Price',
		accessorKey: 'gas_price',
		cell: ({ row }) => convertGwei(row.getValue('gas_price')),
	},
	{
		header: 'Age',
		accessorKey: 'timestamp',
		cell: ({ row }) => (
			<Tooltip title={transDisplayTime(row.getValue('timestamp'))}>
				<Typography variant="body2">
					{transDisplayTimeAgo(row.getValue('timestamp'))}
				</Typography>
			</Tooltip>
		),
	},
]

export const topAccountsColumns: ColumnDef<any>[] = [
	{
		header: 'Rank',
		accessorKey: 'rank',
		cell: ({ row }) => formatNum(row.getValue('rank')),
	},
	{
		header: 'Account',
		accessorKey: 'account',
		cell: ({ row }) => (
			<AddressLinkWithCopy address={row.getValue('account')} />
		),
		// <Link type={LinkTypeEnum.ADDRESS} value={row.getValue('account')} ellipsis />
	},
	{
		header: 'Inscriptions',
		accessorKey: 'inscriptions',
		cell: ({ row }) => formatNum(row.getValue('inscriptions')),
	},
]

export const holderColumns: ColumnDef<any>[] = [
	{
		header: 'Rank',
		accessorKey: 'rank',
		cell: ({ row }) => formatNum(row.getValue('rank')),
	},
	{
		header: 'Account',
		accessorKey: 'address',
		cell: ({ row }) => (
			<AddressLinkWithCopy address={row.getValue('address')} />
		),
		//  <Link type={LinkTypeEnum.ADDRESS} value={row.getValue('address')} />
	},
	{
		header: 'Inscriptions',
		accessorKey: 'minted_count',
		cell: ({ row }) => formatNum(row.getValue('minted_count')),
	},
	{
		header: 'Sharing',
		accessorKey: 'percentage',
		cell: ({ row }) => {
			const sharing =
				(row.getValue('percentage') as number) > 100
					? 100
					: (row.getValue('percentage') as number)
			return (
				<div className="flex flex-col">
					<Typography>{(sharing * 100).toFixed(4) + '%'}</Typography>
					<LinearProgress
						variant="determinate"
						value={sharing * 100}
						sx={{ mb: 2, width: 1 }}
					/>
				</div>
			)
		},
	},
]
