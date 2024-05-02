import { useState } from 'react'

import { SortingState } from '@tanstack/react-table'

import { InfiniteDataTable } from '@/components/common/data-table/infinite-data-table'
import { PAGE_SIZE } from '@/constants'
import { contractsColumns } from '@/constants/columns/contracts'
import { trpc } from '@/utils/trpc'

const VerifiedContractTable = () => {
	const [sorting, setSorting] = useState<SortingState>([])

	const fetchResult = trpc.contract.getVerifiedContracts.useInfiniteQuery(
		{
			take: PAGE_SIZE,
		},
		{
			getNextPageParam: (lastPage: any) => lastPage.nextCursor,
			refetchOnWindowFocus: false,
		},
	)

	return (
		<InfiniteDataTable
			fetchResult={fetchResult}
			columns={contractsColumns}
			sorting={sorting}
			setSorting={setSorting}
		/>
	)
}

export default VerifiedContractTable
