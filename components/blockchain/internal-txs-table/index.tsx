import { useState } from 'react'

import { SortingState } from '@tanstack/react-table'
import { useRouter } from 'next/router'

import { InfiniteDataTable } from '@/components/common/data-table/infinite-data-table'
import { PAGE_SIZE } from '@/constants'
import { internalTxColumns } from '@/constants/columns/txs'
import { trpc } from '@/utils/trpc'

const InternalTxsTable: React.FC = () => {
	const router = useRouter()
	const search: any = router?.query
	const blockNumber = search?.internalBlock
		? parseInt(search.internalBlock as string)
		: undefined
	const [sorting, setSorting] = useState<SortingState>([])

	const fetchResult = trpc.transaction.getInternalTxs.useInfiniteQuery(
		{ blockNumber, take: PAGE_SIZE, desc: sorting[0]?.desc },
		{
			getNextPageParam: (lastPage) => lastPage.nextCursor,
		},
	)

	return (
		<InfiniteDataTable
			fetchResult={fetchResult}
			columns={internalTxColumns}
			sorting={sorting}
			setSorting={setSorting}
		/>
	)
}

export default InternalTxsTable
