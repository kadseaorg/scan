import { useState } from 'react'

import { SortingState } from '@tanstack/react-table'

import { InfiniteDataTable } from '@/components/common/data-table/infinite-data-table'
import { PAGE_SIZE } from '@/constants'
import { getTokenTxsColumns } from '@/constants/columns/tokens'
import { TokenTypeEnum } from '@/types'
import { trpc } from '@/utils/trpc'

const TokenTxsTable: React.FC<{ type: TokenTypeEnum }> = ({ type }) => {
	const [sorting, setSorting] = useState<SortingState>([])
	const fetchResult = trpc.token.getTokenTxs.useInfiniteQuery(
		{ tokenType: type, take: PAGE_SIZE, desc: sorting[0]?.desc },
		{
			getNextPageParam: (lastPage) => lastPage.nextCursor,
			enabled: !!type,
		},
	)

	const columns = getTokenTxsColumns(type)
	return (
		<InfiniteDataTable
			fetchResult={fetchResult}
			columns={columns}
			sorting={sorting}
			setSorting={setSorting}
		/>
	)
}

export default TokenTxsTable
