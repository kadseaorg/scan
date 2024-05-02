import {
	MenuItem,
	Pagination,
	PaginationProps,
	Select,
	Stack,
	SxProps,
	Theme,
	Typography,
} from '@mui/material'

import { formatNum } from '@/utils'

interface IPaginationDataGridProps extends PaginationProps {
	sx?: SxProps<Theme>
	resultLabel: string
	totalResults: number
	pageSize: number
	onPageSizeChange: (pageSize: number) => void
}

const DataGridPagination = (props: IPaginationDataGridProps) => {
	const {
		sx = {},
		totalResults,
		resultLabel = 'transactions',
		pageSize,
		onPageSizeChange,
		...paginationProps
	} = props
	const paginationCount = Math.ceil(totalResults / pageSize)

	return totalResults > 0 ? (
		<Stack
			flexDirection={'row'}
			alignItems={'center'}
			sx={{
				height: 56,
				...sx,
			}}
		>
			<Typography variant="body2" color={'text.secondary'} sx={{ mr: 'auto' }}>
				A total of {formatNum(totalResults)} {resultLabel} found
			</Typography>

			<div className="sm:hidden">
				<Select
					size="small"
					value={pageSize}
					defaultValue={pageSize}
					sx={{
						mr: 2,
						'& .MuiSelect-select': {
							padding: '4px 8px',
							fontSize: 14,
						},
					}}
					onChange={(event) => {
						onPageSizeChange(event.target.value as number)
					}}
				>
					{[
						{ value: 10, label: '10 / page' },
						{ value: 20, label: '20 / page' },
						{ value: 50, label: '50 / page' },
						{ value: 100, label: '100 / page' },
					].map((item) => (
						<MenuItem key={item.value} value={item.value}>
							{item.label}
						</MenuItem>
					))}
				</Select>
			</div>
			<Pagination
				shape="rounded"
				size="small"
				count={paginationCount}
				{...paginationProps}
			/>
		</Stack>
	) : null
}

export default DataGridPagination
