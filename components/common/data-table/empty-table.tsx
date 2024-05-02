import { TableCell } from '@mui/material'
import TableRow from '@mui/material/TableRow'

import { themeColor } from '@/theme/colors'

import NoDataSvg from '../svg-icon/no-data'

export const EmptyTable = (
	<TableRow sx={{ height: 300 }}>
		<TableCell colSpan={12} align="center">
			<div className="flex flex-col items-center justify-center gap-1">
				<NoDataSvg strokeColor={themeColor.dark.primary.main} />
			</div>
		</TableCell>
	</TableRow>
)
