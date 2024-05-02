// skeleton-table.tsx
import { Skeleton } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'

import { TABLE_CONFIG } from '@/constants'

interface ISkeletonDataGridProps {
	loading: boolean
	showHeader?: boolean
	rowCount?: number
	rowHeight?: number
	columns: any[]
	children?: React.ReactNode
	className?: string
}

// Function to convert ColumnDef to GridColDef
const toGridColDef = (column: any): GridColDef => {
	// define the mapping from ColumnDef to GridColDef here
	const { header } = column
	return {
		header: header,
		accessorKey: header,
		flex: 1,
	}
}

export default function DataGridSkeleton(props: ISkeletonDataGridProps) {
	const {
		loading = false,
		showHeader = false,
		rowCount = 10,
		rowHeight = TABLE_CONFIG.ROW_HEIGHT,
		columns,
		children,
		className = '',
	} = props

	return loading ? (
		<DataGrid
			sx={{
				'& .MuiDataGrid-columnHeaders': {
					display: showHeader ? 'block' : 'none',
				},
			}}
			rows={[...Array(rowCount)].map((_, index) => ({
				id: index,
			}))}
			disableColumnSelector
			disableColumnFilter
			disableColumnMenu
			disableDensitySelector
			rowHeight={rowHeight}
			columns={columns.map((column) => {
				const gridColDef = toGridColDef(column)
				const { width = 80 } = gridColDef
				return {
					...gridColDef,
					renderCell: function renderPlaceholder() {
						return (
							<Skeleton
								variant="text"
								className={className}
								width={width}
								height={rowHeight / 2}
							/>
						)
					},
				}
			})}
		/>
	) : (
		<>{children}</>
	)
}
