import { Button, Tooltip, Typography } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import { ColumnDef } from '@tanstack/react-table'
import { ArrowDown, ArrowUp } from 'lucide-react'

import Link, { AddressLinkWithCopy } from '@/components/common/link'
import {
	L1StatusLabel,
	MethodLabel,
	TransArrowIcon,
	TxStatusLabel,
} from '@/components/common/table-col-components'
import { TABLE_CONFIG } from '@/constants'
import { LinkTypeEnum, TxStatusTypeEnum } from '@/types'
import {
	convertGwei,
	convertNum,
	formatNum,
	transDisplayNum,
	transDisplayTime,
	transDisplayTimeAgo,
} from '@/utils'
import { mergeDefaultColumns } from '@/utils/columns'

export const txColumns: ColumnDef<any>[] = [
	{
		header: 'L1 Status',
		accessorKey: 'l1_status',
		cell: ({ row }) => {
			const { status, revert_reason, l1_status } = row.original

			return TxStatusTypeEnum.FAILED === status ? (
				<TxStatusLabel status={status} errorInfo={revert_reason} />
			) : (
				<L1StatusLabel l1Status={l1_status} />
			)
		},
	},
	{
		header: 'Txn Hash',
		accessorKey: 'hash',
		cell: ({ row }) => (
			<Link
				type={LinkTypeEnum.TX}
				value={row.getValue('hash')}
				width={TABLE_CONFIG.COL_WIDHT.ADDRESS}
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
		header: 'From',
		accessorKey: 'from_address',
		cell: ({ row }) => (
			<AddressLinkWithCopy
				address={row.getValue('from_address')}
				width={TABLE_CONFIG.COL_WIDHT.ADDRESS}
			/>
		),
		//  <Link type={LinkTypeEnum.ADDRESS} value={row.getValue('from_address')} width={TABLE_CONFIG.COL_WIDHT.ADDRESS} ellipsis />
	},
	{
		id: 'arrow',
		header: '',
		accessorKey: '',
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
		header: 'Value',
		accessorKey: 'value',
		cell: ({ row }) => transDisplayNum({ num: row.getValue('value') }),
	},
	{
		header: 'Txn Fee',
		accessorKey: 'fee',
		cell: ({ row }) =>
			transDisplayNum({ num: row.getValue('fee'), fixedNum: 9 }),
	},
	{
		header: 'Gas Price',
		accessorKey: 'gas_price',
		cell: ({ row }) => convertGwei(row.getValue('gas_price')),
	},
]

export const internalTxColumns: ColumnDef<any>[] = [
	{
		header: 'Block',
		accessorKey: 'block_number',
		cell: ({ row }) => (
			<Link
				type={LinkTypeEnum.BLOCK}
				value={convertNum(row.getValue('block_number'))}
			/>
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
		header: 'Parent Txn Hash',
		accessorKey: 'parent_transaction_hash',

		cell: ({ row }) => (
			<Link
				type={LinkTypeEnum.TX}
				value={row.getValue('parent_transaction_hash')}
				ellipsis
			/>
		),
	},
	{ header: 'Type', accessorKey: 'type' },
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
		id: 'arrow',
		header: '',
		accessorKey: '',
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
		//  <Link type={LinkTypeEnum.ADDRESS} value={row.getValue('to_address')} width={TABLE_CONFIG.COL_WIDHT.ADDRESS} ellipsis />
	},
	{
		header: 'Value',
		accessorKey: 'value',
		cell: ({ row }) => transDisplayNum({ num: row.getValue('value') }),
	},
]

export const pendingTxsColumns: GridColDef[] = mergeDefaultColumns([
	{
		headerName: 'Txn Hash',
		field: 'hash',
		flex: 1,
		cell: (params) => (
			<Link type={LinkTypeEnum.TX} value={params.value} ellipsis />
		),
	},
	{ headerName: 'Nonce', field: 'nonce', flex: 1 },
	{
		headerName: 'Method',
		field: 'methodName',
		flex: 1,
		cell: (params) => <MethodLabel method={params.value} />,
	},
	{
		headerName: 'Last Seen',
		field: 'lastSeen',
		flex: 1,
		cell: (params) => transDisplayTimeAgo(params.value),
	},
	{
		headerName: 'Gas Limit',
		field: 'gasLimit',
		flex: 1,
		cell: (params) => formatNum(params.value),
	},
	{
		headerName: 'Gas Price',
		field: 'gasPrice',
		flex: 1,
		cell: (params) => convertGwei(params.value),
	},
	{
		headerName: 'From',
		field: 'from',
		flex: 1,
		cell: (params) => (
			<Link
				type={LinkTypeEnum.ADDRESS}
				value={params.value}
				width={TABLE_CONFIG.COL_WIDHT.ADDRESS}
				ellipsis
			/>
		),
	},
	{
		headerName: '',
		field: '',
		flex: 1,
		width: TABLE_CONFIG.COL_WIDHT.TRANS_ARROW_ICON,
		cell: () => <TransArrowIcon />,
	},
	{
		headerName: 'To',
		field: 'to',
		flex: 1,
		cell: (params) => (
			<Link
				type={LinkTypeEnum.ADDRESS}
				value={params.value}
				width={TABLE_CONFIG.COL_WIDHT.ADDRESS}
				ellipsis
			/>
		),
	},
	{
		headerName: 'Value',
		field: 'value',
		flex: 1,
		cell: (params) => transDisplayNum({ num: params.value }),
	},
])
