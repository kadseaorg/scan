import { Button, Tooltip, Typography } from '@mui/material'
import { ColumnDef } from '@tanstack/react-table'
import { ArrowDown, ArrowUp } from 'lucide-react'

import Link from '@/components/common/link'
import { L1StatusLabel } from '@/components/common/table-col-components'
import { TABLE_CONFIG } from '@/constants'
import { LinkTypeEnum } from '@/types'
import { shortAddress, transDisplayTime, transDisplayTimeAgo } from '@/utils'

export const batchesFullColumns: ColumnDef<any>[] = [
	{
		header: 'L1 Status',
		accessorKey: 'status',
		cell: ({ row }) => <L1StatusLabel l1Status={row.getValue('status')} />,
	},
	{
		header: 'Batch Index',
		accessorKey: 'number',
		cell: ({ row }) => (
			<Link type={LinkTypeEnum.BATCH} value={row.getValue('number')} />
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
	// {
	//   header: 'Txn',
	//   accessorKey: 'l2_tx_count',
	//   cell: ({ row }) => formatNum(row.getValue('l2_tx_count'))
	// },
	{
		header: 'Commit Tx Hash',
		accessorKey: 'commit_tx_hash',
		cell: ({ row }) => (
			<Link
				type={LinkTypeEnum.CROSS_BROWSER_TX}
				value={row.getValue('commit_tx_hash')}
				width={TABLE_CONFIG.COL_WIDHT.TXHASH}
				ellipsis
				target="_blank"
			/>
		),
	},
	{
		header: 'Verified Tx Hash',
		accessorKey: 'prove_tx_hash',
		cell: ({ row }) => (
			<Link
				type={LinkTypeEnum.CROSS_BROWSER_TX}
				value={row.getValue('prove_tx_hash')}
				width={TABLE_CONFIG.COL_WIDHT.TXHASH}
				ellipsis
				target="_blank"
			/>
		),
	},
	{
		header: 'Root Hash',
		accessorKey: 'root_hash',
		cell: ({ row }) => (
			<Tooltip title={transDisplayTime(row.getValue('root_hash'))}>
				<Typography variant="body2">
					{shortAddress(row.getValue('root_hash'))}
				</Typography>
			</Tooltip>
		),
	},
]

export const batchesLineaColumns: ColumnDef<any>[] = [
	{
		header: 'L1 Status',
		accessorKey: 'status',
		cell: ({ row }) => <L1StatusLabel l1Status={row.getValue('status')} />,
	},
	{
		header: 'Batch Index',
		accessorKey: 'number',
		cell: ({ row }) => (
			<Link type={LinkTypeEnum.BATCH} value={row.getValue('number')} />
		),
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
	{
		header: 'Verified Tx Hash',
		accessorKey: 'prove_tx_hash',
		cell: ({ row }) => (
			<Link
				type={LinkTypeEnum.CROSS_BROWSER_TX}
				value={row.getValue('prove_tx_hash')}
				width={TABLE_CONFIG.COL_WIDHT.TXHASH}
				ellipsis
				target="_blank"
			/>
		),
	},
]

export const batchesBaseColumns: ColumnDef<any>[] = [
	{
		header: 'L1 Status',
		accessorKey: 'status',
		cell: ({ row }) => <L1StatusLabel l1Status={row.getValue('status')} />,
	},
	{
		header: 'Batch Index',
		accessorKey: 'number',
		cell: ({ row }) => (
			<Link type={LinkTypeEnum.BATCH} value={row.getValue('number')} />
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
		header: 'Verified Tx Hash',
		accessorKey: 'prove_tx_hash',
		cell: ({ row }) => (
			<Link
				type={LinkTypeEnum.CROSS_BROWSER_TX}
				value={row.getValue('prove_tx_hash')}
				width={TABLE_CONFIG.COL_WIDHT.TXHASH}
				ellipsis
				target="_blank"
			/>
		),
	},
	{
		header: 'Root Hash',
		accessorKey: 'root_hash',
		cell: ({ row }) => (
			<Tooltip title={transDisplayTime(row.getValue('root_hash'))}>
				<Typography variant="body2">
					{shortAddress(row.getValue('root_hash'))}
				</Typography>
			</Tooltip>
		),
	},
]
