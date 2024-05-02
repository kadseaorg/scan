import { Button, Tooltip, Typography } from '@mui/material'
import { ColumnDef } from '@tanstack/react-table'
import { ArrowDown, ArrowUp } from 'lucide-react'

import Link, { AddressLinkWithCopy } from '@/components/common/link'
import { L1StatusLabel } from '@/components/common/table-col-components'
import { LinkTypeEnum } from '@/types'
import {
	convertNum,
	formatNum,
	transDisplayTime,
	transDisplayTimeAgo,
} from '@/utils'
import { IsKadsea } from '../chain'

export const blocksColumns: ColumnDef<any>[] = [
	{
		header: 'L1 Status',
		accessorKey: 'l1_status',
		cell: ({ row }) => <L1StatusLabel l1Status={row.getValue('l1_status')} />,
	},
	{
		header: 'Block',
		accessorKey: 'number',
		cell: ({ row }) => (
			<Link type={LinkTypeEnum.BLOCK} value={row.getValue('number')} />
		),
	},
	{
		header: ({ column }) => {
			const isAsc = column.getIsSorted() === 'asc'

			return (
				<Button
					variant="text"
					color="inherit"
					endIcon={isAsc ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
					onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
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
		header: 'Txn',
		accessorKey: 'transaction_count',
		cell: ({ row }) => (
			<Link type={LinkTypeEnum.BLOCKS} value={row.getValue('number')}>
				{convertNum(row.getValue('transaction_count'))}
			</Link>
		),
	},
	{
		header: 'Validator',
		accessorKey: 'validator',
		cell: ({ row }) => (
			<AddressLinkWithCopy address={row.getValue('validator')} />
		),
		// <Link type={LinkTypeEnum.ADDRESS} value={row.getValue('validator')} ellipsis />
	},
	{
		header: 'Gas Used',
		accessorKey: 'gas_used',
		cell: ({ row }) => formatNum(row.getValue('gas_used')),
	},
	{
		header: 'Gas Limit',
		accessorKey: 'gas_limit',
		cell: ({ row }) => formatNum(row.getValue('gas_limit')),
	},
].filter((item) => {
	return IsKadsea ? item.accessorKey !== 'l1_status' : true
})
