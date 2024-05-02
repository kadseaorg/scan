import { useState } from 'react'

import { SortingState } from '@tanstack/react-table'

import { InfiniteDataTable } from '@/components/common/data-table/infinite-data-table'
import { PAGE_SIZE } from '@/constants'
import { getTokenHoldersColumns } from '@/constants/columns/tokens'
import { TokenTypeEnum } from '@/types'
import { trpc } from '@/utils/trpc'

const TokenDetailHoldersTable: React.FC<{
	tokenAddress: string
	type: TokenTypeEnum
}> = ({ tokenAddress, type }) => {
	const [sorting, setSorting] = useState<SortingState>([])

	const fetchResult = trpc.token.getTokenHolders.useInfiniteQuery(
		{ address: tokenAddress, take: PAGE_SIZE, desc: sorting[0]?.desc },
		{
			enabled: !!tokenAddress,
			getNextPageParam: (lastPage) => lastPage.nextCursor,
		},
	)

	const { data: tokenDetail } = trpc.token.getTokenDetail.useQuery(
		tokenAddress,
		{
			enabled: !!tokenAddress,
		},
	)

	const columns = getTokenHoldersColumns(tokenDetail?.decimals)

	return (
		<InfiniteDataTable
			fetchResult={fetchResult}
			columns={columns}
			sorting={sorting}
			setSorting={setSorting}
		/>
	)
}

export default TokenDetailHoldersTable
