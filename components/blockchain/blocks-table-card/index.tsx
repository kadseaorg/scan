import { useState } from 'react'

import { SortingState } from '@tanstack/react-table'

import { InfiniteDataTable } from '@/components/common/data-table/infinite-data-table'
import { Card } from '@/components/ui/card'
import { PAGE_SIZE } from '@/constants'
import { blocksColumns } from '@/constants/columns/blocks'
import { trpc } from '@/utils/trpc'

const BlocksTableCard: React.FC<{ batchNumber?: number }> = (props) => {
	const [sorting, setSorting] = useState<SortingState>([])

	const fetchResult = trpc.block.getBlocks.useInfiniteQuery(
		{ batchNumber: props.batchNumber, take: PAGE_SIZE, desc: sorting[0]?.desc },
		{
			getNextPageParam: (lastPage) => lastPage.nextCursor,
			refetchOnWindowFocus: false,
		},
	)

	return (
		<Card className="p-6">
			<InfiniteDataTable
				fetchResult={fetchResult}
				columns={blocksColumns}
				sorting={sorting}
				setSorting={setSorting}
			/>
		</Card>
	)
}

export default BlocksTableCard
