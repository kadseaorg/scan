import { useState } from 'react'

import { SortingState } from '@tanstack/react-table'

import { InfiniteDataTable } from '@/components/common/data-table/infinite-data-table'
import { PAGE_SIZE } from '@/constants'
import { internalTxColumns } from '@/constants/columns/txs'
import { trpc } from '@/utils/trpc'

interface AddressInternalTxsTableProps {
	address: string
	isContract: boolean | undefined
}

const AddressInternalTxsTable: React.FC<AddressInternalTxsTableProps> = ({
	address,
	isContract,
}) => {
	const [sorting, setSorting] = useState<SortingState>([])

	const getColumns = () => {
		const parentTransactionHashCol = internalTxColumns.find(
			(column) => column.header === 'Parent Txn Hash',
		)
		return [
			parentTransactionHashCol as any,
			...internalTxColumns.filter(
				(column) => column.header !== 'Parent Txn Hash',
			),
		]
	}

	const addressFetchResult =
		trpc.address.getAddressInternalTxs.useInfiniteQuery(
			{ address, take: PAGE_SIZE, desc: sorting[0]?.desc },
			{
				enabled: !!address && isContract !== undefined && !isContract,
				getNextPageParam: (lastPage) => lastPage.nextCursor,
			},
		)

	const contractFetchResult =
		trpc.contract.getContractInternalTxs.useInfiniteQuery(
			{ address, take: PAGE_SIZE, desc: sorting[0]?.desc },
			{
				enabled: !!address && isContract !== undefined && isContract,
				getNextPageParam: (lastPage) => lastPage.nextCursor,
			},
		)

	const fetchResult = isContract ? contractFetchResult : addressFetchResult

	return (
		<InfiniteDataTable
			fetchResult={fetchResult}
			columns={getColumns()}
			sorting={sorting}
			setSorting={setSorting}
		/>
	)
}

export { AddressInternalTxsTable }
