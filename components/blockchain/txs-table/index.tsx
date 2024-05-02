import { useEffect, useState } from 'react'

import { IconButton } from '@mui/material'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { useRouter } from 'next/router'

import { txColumns } from '@/components/common/data-table/columns'
import { InfiniteDataTable } from '@/components/common/data-table/infinite-data-table'
import { Badge } from '@/components/ui/badge'
import { PAGE_SIZE } from '@/constants'
import { useColumnFilters } from '@/hooks/common/useColumnFilters'
import { trpc } from '@/utils/trpc'

const TxsTable: React.FC = () => {
	const [fetchParams, setFetchParams] = useState<any>({
		take: PAGE_SIZE,
		desc: true,
	})
	const { filterHandlers, popoverComponents, renderFilterTags } =
		useColumnFilters(setFetchParams)
	const router = useRouter()
	const search: any = router?.query

	const blockNumber = search?.block
		? parseInt(search.block as string)
		: undefined
	const fetchResult = trpc.transaction.getTransactions.useInfiniteQuery(
		fetchParams,
		{
			getNextPageParam: (lastPage) => lastPage.nextCursor,
		},
	)

	useEffect(() => {
		if (blockNumber !== undefined) {
			setFetchParams((prev) => ({ ...prev, block_number: blockNumber }))
		}
	}, [blockNumber])

	const txColumnsCanFilter = txColumns.map((column) => {
		const popoverComponent = popoverComponents[column.header]

		if (popoverComponent) {
			const FilterComponent = popoverComponent

			if (column.header === 'Age') {
				return {
					...column,
					header: (props) => (
						<div className="flex items-center gap-1">
							<span>Age</span>
							<div className="flex">
								<IconButton
									className="border-none"
									onClick={() => {
										setFetchParams((prevState) => ({
											...prevState,
											desc: !prevState.desc,
										}))
									}}
								>
									{fetchParams.desc ? (
										<ArrowDown size={16} />
									) : (
										<ArrowUp size={16} />
									)}
								</IconButton>
							</div>
							<FilterComponent onApply={filterHandlers[column.header]} />
						</div>
					),
				}
			}

			return {
				...column,
				header: (props) => (
					<div className="flex items-center gap-1">
						<span>{column.header}</span>
						<FilterComponent onApply={filterHandlers[column.header]} />
					</div>
				),
			}
		}

		return column
	})

	return (
		<>
			{renderFilterTags(fetchParams)}
			<InfiniteDataTable
				fetchResult={fetchResult}
				columns={txColumnsCanFilter}
			/>
		</>
	)
}

export default TxsTable
