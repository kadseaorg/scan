import { useState } from 'react'

import { SortingState } from '@tanstack/react-table'

import { InfiniteDataTable } from '@/components/common/data-table/infinite-data-table'
import { PAGE_SIZE } from '@/constants'
import { getTokenTxsColumns } from '@/constants/columns/tokens'
import { TokenTypeEnum } from '@/types'
import { trpc } from '@/utils/trpc'

const AddressTokenTxsTable: React.FC<{
	address: string | undefined
	type: TokenTypeEnum
}> = ({ address = '', type }) => {
	const [sorting, setSorting] = useState<SortingState>([])

	const fetchResult = trpc.address.getAddressTokenTxList.useInfiniteQuery(
		{ address, tokenType: type, take: PAGE_SIZE, desc: sorting[0]?.desc },
		{ enabled: !!address, getNextPageParam: (lastPage) => lastPage.nextCursor },
	)
	return (
		<InfiniteDataTable
			fetchResult={fetchResult}
			columns={getTokenTxsColumns(type)}
			sorting={sorting}
			setSorting={setSorting}
		/>
	)
}

export default AddressTokenTxsTable
