import { useState } from 'react'

import { SortingState } from '@tanstack/react-table'

import { InfiniteDataTable } from '@/components/common/data-table/infinite-data-table'
import { CHAIN_TYPE, PAGE_SIZE } from '@/constants'
import {
	batchesBaseColumns,
	batchesFullColumns,
	batchesLineaColumns,
} from '@/constants/columns/batches'
import { EnumChainType } from '@/types/chain'
import { trpc } from '@/utils/trpc'

const BatchesTableCard: React.FC = () => {
	const columns =
		CHAIN_TYPE == EnumChainType.LINEA
			? batchesLineaColumns
			: EnumChainType.BASE
			  ? batchesBaseColumns
			  : batchesFullColumns
	const [sorting, setSorting] = useState<SortingState>([])

	const fetchResult = trpc.batch.getBatchList.useInfiniteQuery(
		{ take: PAGE_SIZE, desc: sorting[0]?.desc },
		{
			getNextPageParam: (lastPage) => lastPage.nextCursor,
		},
	)

	return (
		<InfiniteDataTable
			fetchResult={fetchResult}
			columns={columns}
			sorting={sorting}
			setSorting={setSorting}
		/>
	)
}

export default BatchesTableCard
