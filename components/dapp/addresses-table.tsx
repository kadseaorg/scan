import { ColumnDef } from '@tanstack/react-table'
import { CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'

import { DataTable } from '@/components/common/data-table/data-table'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { trpc } from '@/utils/trpc'

export const addressesTableColumns: ColumnDef<any>[] = [
	{
		id: 'address',
		header: 'Address',
		accessorKey: 'address',
		cell: ({ row }) => (
			<Link className="text-primary" href={`/address/${row.original.address}`}>
				{row.original.address}
			</Link>
		),
	},
	{
		id: 'publicTags',
		header: 'Public Tag',
		accessorKey: 'publicTags',
		cell: ({ row }) => {
			if (undefined === row.original?.tags) return <span>-</span>

			return (
				<div className="flex items-center gap-2">
					{JSON.parse(row.original?.tags || '[]')?.map(
						(tag: string, index: number) => (
							<Badge key={index} variant="secondary">
								{tag}
							</Badge>
						),
					)}
				</div>
			)
		},
	},
	{
		id: 'verified',
		header: 'Verified',
		accessorKey: 'verified',
		cell: ({ row }) => {
			if (undefined === row.original?.is_verified) return <span>-</span>

			const is_verified = row.original?.is_verified
			const iconClass = is_verified ? 'text-green-400' : 'text-red-400'

			return (
				<div
					className={cn(
						'flex items-center justify-center text-white gap-2 w-fit rounded-md px-2 py-1',
						is_verified ? 'bg-green-900' : 'bg-red-900',
					)}
				>
					{is_verified ? (
						<CheckCircle2 className={iconClass} size={12} />
					) : (
						<XCircle className={iconClass} size={12} />
					)}
					<span>{is_verified ? 'Successful' : 'Failure'}</span>
				</div>
			)
		},
	},
]

const DappAddressTable = ({ id }: { id?: number }) => {
	const fetchResult = trpc.dapp.getDappAddressInfos.useQuery(id ?? 0, {
		enabled: !!id,
	})

	return <DataTable fetchResult={fetchResult} columns={addressesTableColumns} />
}

export default DappAddressTable
