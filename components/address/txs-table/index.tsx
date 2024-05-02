import { useEffect, useMemo, useState } from 'react'

import { IconButton } from '@mui/material'
import { ArrowDown, ArrowUp } from 'lucide-react'

import { txColumns } from '@/components/common/data-table/columns'
import { TxStatusFilterPopover } from '@/components/common/data-table/filter-popover'
import { InfiniteDataTable } from '@/components/common/data-table/infinite-data-table'
import { PAGE_SIZE } from '@/constants'
import { isSameAddress } from '@/constants/address'
import { useColumnFilters } from '@/hooks/common/useColumnFilters'
import { trpc } from '@/utils/trpc'

interface AddressTxsTableProps {
	address: string
	isContract: boolean | undefined
}

const AddressTxsTable: React.FC<AddressTxsTableProps> = ({
	address,
	isContract,
}) => {
	const [fetchParams, setFetchParams] = useState<any>({
		address: address,
		take: PAGE_SIZE,
		desc: true,
	})
	const { filterHandlers, popoverComponents } = useColumnFilters(setFetchParams)

	const addressFetchResult = trpc.address.getAddressTxs.useInfiniteQuery(
		fetchParams,
		{
			enabled: !!address && isContract !== undefined && !isContract,
			getNextPageParam: (lastPage) => lastPage.nextCursor,
			refetchOnWindowFocus: false,
			// initialCursor: 1, // <-- optional you can pass an initialCursor
		},
	)

	const contractFetchResult = trpc.contract.getContractTxs.useInfiniteQuery(
		fetchParams,
		{
			enabled: !!address && isContract !== undefined && isContract,
			getNextPageParam: (lastPage) => lastPage.nextCursor,
		},
	)

	useEffect(() => {
		setFetchParams((prevParams) => ({ ...prevParams, address }))
	}, [address])

	const handleTxStatusFilterApply = (status: string) => {
		setFetchParams((prevParams) => ({ ...prevParams, status: status }))
	}

	const fetchResult = isContract ? contractFetchResult : addressFetchResult

	const txColumnsCanFilter = txColumns.map((column) => {
		// if (column.header === 'From' || column.header === 'To') {
		//   // skip
		//   return column
		// }

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

	// if (column.header === 'Age') {
	//   // timestamp
	//   return {
	//     ...column,
	//     header: props => (
	//       <div className="flex items-center gap-1">
	//         <span>Age</span>
	//         <div className="flex">
	//           <IconButton
	//             className="border-none"
	//             onClick={() => {
	//               setFetchParams(prevState => ({ ...prevState, desc: !prevState.desc }))
	//             }}>
	//             {fetchParams.desc ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
	//           </IconButton>
	//           <TimeFilterPopover onApply={handleApplyTimeRange} />
	//         </div>
	//       </div>
	//     )
	//   }
	// }

	return (
		<div className="relative">
			<TxStatusFilterPopover
				onApply={handleTxStatusFilterApply}
				style={{ position: 'absolute', top: -10, right: -10, zIndex: 10 }}
			/>
			<InfiniteDataTable
				fetchResult={fetchResult}
				columns={txColumnsCanFilter}
			/>
		</div>
	)
}

export { AddressTxsTable }
