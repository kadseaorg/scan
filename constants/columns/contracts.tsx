import { ColumnDef } from '@tanstack/react-table'

import Link, { AddressLinkWithCopy } from '@/components/common/link'
import { LinkTypeEnum } from '@/types'
import { transDisplayNum, transDisplayTimeAgo } from '@/utils'

export const contractsColumns: ColumnDef<any>[] = [
	{
		header: 'Address',
		accessorKey: 'address',
		cell: ({ row }) => (
			<AddressLinkWithCopy address={row.getValue('address')} />
		),
		// <Link type={LinkTypeEnum.ADDRESS} value={row.getValue('address')} ellipsis />
	},
	{
		header: 'Contract Name',
		accessorKey: 'name',
		cell: ({ row }) => row.getValue('name') || '-',
	},
	// {
	//   header: 'EVM Version',
	//   accessorKey: 'evm_version',
	//   cell: ({ row }) => row.getValue('evm_version')
	// },
	{
		header: 'Compiler Version',
		accessorKey: 'compiler_version',
		cell: ({ row }) => row.getValue('compiler_version'),
	},
	{
		header: 'Creator',
		accessorKey: 'creator',
		cell: ({ row }) => (
			<AddressLinkWithCopy address={row.getValue('creator')} />
		),
		// <Link type={LinkTypeEnum.ADDRESS} value={row.getValue('creator')} ellipsis />
	},
	{
		header: 'Creation Age',
		accessorKey: 'creation_timestamp',
		cell: ({ row }) => transDisplayTimeAgo(row.getValue('creation_timestamp')),
	},
	{
		header: 'Creation Tx Hash',
		accessorKey: 'creation_tx_hash',
		cell: ({ row }) => (
			<Link
				type={LinkTypeEnum.TX}
				value={row.getValue('creation_tx_hash')}
				width={65}
				ellipsis
			/>
		),
	},
]
