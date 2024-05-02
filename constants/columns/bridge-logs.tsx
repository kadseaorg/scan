import { Button, Tooltip, Typography } from '@mui/material'
import { ColumnDef } from '@tanstack/react-table'
import { ArrowDown, ArrowUp } from 'lucide-react'

import Link, { AddressLinkWithCopy } from '@/components/common/link'
import { MethodLabel } from '@/components/common/table-col-components'
import { TABLE_CONFIG } from '@/constants'
import { transaction_logs } from '@/lib/generated/prisma/main'
import { LinkTypeEnum } from '@/types'
import { transDisplayNum, transDisplayTime, transDisplayTimeAgo } from '@/utils'

export const logsColumns: ColumnDef<
	transaction_logs & {
		amount: number
		token_symbol: string
		token_decimals: number
	}
>[] = [
	{
		header: 'Txn Hash',
		accessorKey: 'transaction_hash',
		cell: ({ row }) => (
			<Link
				type={LinkTypeEnum.TX}
				value={row.getValue('transaction_hash')}
				width={TABLE_CONFIG.COL_WIDHT.TXHASH}
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
		header: 'Block',
		accessorKey: 'block_number',
		cell: ({ row }) => (
			<Link type={LinkTypeEnum.BLOCK} value={row.getValue('block_number')} />
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
		header: 'Address',
		accessorKey: 'address',
		cell: ({ row }) => (
			<AddressLinkWithCopy
				address={row.getValue('address')}
				width={TABLE_CONFIG.COL_WIDHT.ADDRESS}
			/>
		),
		// <Link type={LinkTypeEnum.ADDRESS} value={row.getValue('address')} width={TABLE_CONFIG.COL_WIDHT.ADDRESS} ellipsis />
	},
	{
		header: 'Amount',
		accessorKey: 'amount',
		cell: ({ row }) =>
			transDisplayNum({
				num: row.original.amount,
				decimals: row.original.token_decimals,
				suffix: row.original.token_symbol,
			}),
	},
]
