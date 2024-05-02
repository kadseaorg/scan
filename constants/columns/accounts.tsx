import { ColumnDef } from '@tanstack/react-table'

import Link, { AddressLinkWithCopy } from '@/components/common/link'
import { LinkTypeEnum } from '@/types'
import { formatNum, transDisplayNum } from '@/utils'

import { CHAIN_TOKEN_NAME } from '../chain'

export const accountsColumns: ColumnDef<any>[] = [
	{
		header: 'Rank',
		accessorKey: 'rank',
		cell: ({ row }) => formatNum(row.getValue('rank')),
	},
	{
		header: 'Address',
		accessorKey: 'address',
		cell: ({ row }) => (
			<AddressLinkWithCopy address={row.getValue('address')} />
		),
		// <Link type={LinkTypeEnum.ADDRESS} value={row.getValue('address')} ellipsis />
	},
	{
		header: 'Balance',
		accessorKey: 'balance',
		cell: ({ row }) =>
			transDisplayNum({
				num: row.getValue('balance'),
				suffix: CHAIN_TOKEN_NAME,
			}),
	},
	{
		header: 'Percentage',
		accessorKey: 'balance_percentage',
		cell: ({ row }) =>
			transDisplayNum({
				num: (row.getValue('balance_percentage') as number) * 100,
				suffix: '%',
				decimals: 0,
			}),
	},
	{
		header: 'Txn Count',
		accessorKey: 'txn_count',
		cell: ({ row }) => formatNum(row.getValue('txn_count')),
	},
]
