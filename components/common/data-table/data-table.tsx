import * as React from 'react'

import { Table, TableBody, TableCell, TableHead } from '@mui/material'
import TableRow from '@mui/material/TableRow'
import {
	ColumnDef,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from '@tanstack/react-table'
import { UseTRPCQueryResult } from '@trpc/react-query/shared'

import DataGridSkeleton from '@/components/common/data-grid/DataGridSkeleton'

import { EmptyTable } from './empty-table'

interface DataTableProps {
	fetchResult: UseTRPCQueryResult<any, any>
	columns: ColumnDef<any>[]
}

export const DataTable: React.FC<DataTableProps> = ({
	fetchResult,
	columns,
}) => {
	const { data, isLoading } = fetchResult

	const table = useReactTable({
		data: data?.list ?? [],
		columns: columns,
		getCoreRowModel: getCoreRowModel(),
	})

	const [rowsData, setrowsData] = React.useState<any[]>([])
	React.useEffect(() => {
		if (table && data?.list) {
			const rows = table.getRowModel().rows
			setrowsData(rows)
		}
	}, [table, data?.list])

	return (
		<DataGridSkeleton loading={isLoading} columns={columns} showHeader={true}>
			<Table>
				<TableHead>
					{table.getHeaderGroups().map((headerGroup, index: number) => (
						<TableRow key={index}>
							{headerGroup.headers.map((header, itemIndex: number) => (
								<TableCell key={itemIndex}>
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
					{rowsData.length > 0
						? rowsData.map((row: any, index: number) => {
								return (
									<TableRow key={index}>
										{row
											.getVisibleCells()
											.map((cell: any, itemIndex: number) => (
												<TableCell key={itemIndex}>
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
		</DataGridSkeleton>
	)
}
