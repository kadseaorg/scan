import { useMemo, useState } from 'react'

import { SortingState } from '@tanstack/react-table'

import { InfiniteDataTable } from '@/components/common/data-table/infinite-data-table'
import { MethodLabel } from '@/components/common/table-col-components'
import { PAGE_SIZE } from '@/constants'
import { getTokenTxsColumns } from '@/constants/columns/tokens'
import { TokenTypeEnum } from '@/types'
import { trpc } from '@/utils/trpc'

const TokenDetailTxsTable: React.FC<{
	tokenAddress: string
	type: TokenTypeEnum
}> = ({ tokenAddress, type }) => {
	const [sorting, setSorting] = useState<SortingState>([])
	const fetchResult = trpc.token.getTokenTxs.useInfiniteQuery(
		{
			tokenType: type,
			address: tokenAddress,
			take: PAGE_SIZE,
			desc: sorting[0]?.desc,
		},
		{
			getNextPageParam: (lastPage) => lastPage.nextCursor,
			enabled: !!tokenAddress && !!type,
		},
	)

	const columns = useMemo(() => {
		const cols = getTokenTxsColumns(type)

		// cols.splice(1, 0, {
		// 	header: 'Method',
		// 	accessorKey: 'method_id',
		// 	cell: ({ row }) => <MethodLabel method={row.original.method_id} />,
		// })
		cols.splice(TokenTypeEnum.ERC20 === type ? 7 : 8, 1)
		TokenTypeEnum.ERC20 !== type && cols.splice(-1, 1)

		return cols
	}, [type])

	return (
		<InfiniteDataTable
			fetchResult={fetchResult}
			columns={columns}
			sorting={sorting}
			setSorting={setSorting}
		/>
	)
}

export default TokenDetailTxsTable
