import * as React from 'react'
import { useInView } from 'react-intersection-observer'

import { Table, TableBody, TableCell, TableHead } from '@mui/material'
import TableRow from '@mui/material/TableRow'
import {
	ColumnDef,
	ColumnFiltersState,
	OnChangeFn,
	SortingState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	useReactTable,
} from '@tanstack/react-table'
import { UseTRPCInfiniteQueryResult } from '@trpc/react-query/shared'

import DataGridSkeleton from '@/components/common/data-grid/DataGridSkeleton'

import { EmptyTable } from './empty-table'

interface InfiniteDataTableProps<TData, TValue> {
	fetchResult: UseTRPCInfiniteQueryResult<any, any>
	columns: ColumnDef<TData, TValue>[]
	sorting?: SortingState
	setSorting?: OnChangeFn<SortingState>
}

export function InfiniteDataTable<TData, TValue>({
	fetchResult,
	columns,
	sorting,
	setSorting,
}: InfiniteDataTableProps<TData, TValue>) {
	const { data, fetchNextPage, isFetching, isLoading, refetch } = fetchResult
	const flatData = React.useMemo(
		() => data?.pages?.flatMap((page) => page.list) ?? [],
		[data],
	)
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
		[],
	)

	const table = useReactTable({
		data: flatData,
		columns: columns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		getFilteredRowModel: getFilteredRowModel(),
		state: {
			sorting,
			columnFilters,
		},
	})

	const { ref, inView, entry } = useInView({
		/* Optional options */
		threshold: 0,
	})

	React.useEffect(() => {
		if (
			inView &&
			!isFetching &&
			!isLoading &&
			data?.pages[data.pages.length - 1].nextCursor !== null
		) {
			fetchNextPage()
		}
	}, [inView, isFetching, isLoading, data, fetchNextPage])

	const rows = table.getRowModel().rows

	return (
		<DataGridSkeleton loading={isLoading} columns={columns} showHeader={true}>
			<div className="overflow-auto">
				<Table>
					<TableHead>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableCell key={header.id}>
										{flexRender(
											header.column.columnDef.header,
											header.getContext(),
										)}
									</TableCell>
								))}
							</TableRow>
						))}
					</TableHead>
					<TableBody>
						{rows.length > 0
							? rows.map((row) => {
									return (
										<TableRow key={row.index}>
											{row.getVisibleCells().map((cell) => (
												<TableCell key={cell.id}>
													{flexRender(
														cell.column.columnDef.cell,
														cell.getContext(),
													)}
												</TableCell>
											))}
										</TableRow>
									)
							  })
							: EmptyTable}
					</TableBody>
				</Table>
			</div>
			<div ref={ref}>
				<DataGridSkeleton loading={isFetching} columns={columns} />
			</div>
		</DataGridSkeleton>
	)
}
