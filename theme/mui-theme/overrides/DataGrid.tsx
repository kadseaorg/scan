import { Stack, Typography } from '@mui/material'
import { Theme } from '@mui/material/styles'
import { ArchiveIcon } from 'lucide-react'

import { TABLE_CONFIG } from '@/constants'

export default function DataGrid(theme: Theme) {
	function CustomNoRowsOverlay() {
		return (
			<Stack className="w-full h-full flex-center">
				<ArchiveIcon width={50} height={50} color="gray" />
				<Typography variant="body1" color={'text.secondary'}>
					No data
				</Typography>
			</Stack>
		)
	}
	return {
		MuiDataGrid: {
			defaultProps: {
				rowHeight: TABLE_CONFIG.ROW_HEIGHT,
				autoHeight: true,
				rowSelection: false,
				hideFooter: true,
				disableSelectionOnClick: true,
				components: {
					noRowsOverlay: CustomNoRowsOverlay,
				},
			},

			styleOverrides: {
				root: {
					borderRadius: 0,
					border: `1px solid transparent`,
					'& .MuiTablePagination-root': {
						borderTop: 0,
					},
				},
				'columnHeader--moving': {
					background: theme.palette.neutral.secondary,
				},
				columnHeaderRow: {
					background: theme.palette.neutral.secondary,
				},
				withBorderColor: {
					borderColor: theme.palette.neutral.border,
				},
				cell: {
					borderBottom: `1px solid ${theme.palette.divider}`,
				},
				columnSeparator: {
					display: 'none',
					color: theme.palette.divider,
				},
				toolbarContainer: {
					padding: theme.spacing(2),
					backgroundColor: theme.palette.background.neutral,
					'& .MuiButton-root': {
						marginRight: theme.spacing(1.5),
						color: theme.palette.text.primary,
						'&:hover': {
							backgroundColor: theme.palette.action.hover,
						},
					},
				},
				paper: {
					boxShadow: theme.customShadows.dropdown,
				},
				menu: {
					'& .MuiPaper-root': {
						boxShadow: theme.customShadows.dropdown,
					},
					'& .MuiMenuItem-root': {
						...theme.typography.body2,
						'& .MuiListItemIcon-root': {
							minWidth: 'auto',
						},
					},
				},
				panelFooter: {
					padding: theme.spacing(2),
					justifyContent: 'flex-end',
					borderTop: `1px solid ${theme.palette.divider}`,
					'& .MuiButton-root': {
						'&:first-of-type': {
							marginRight: theme.spacing(1.5),
							color: theme.palette.text.primary,
							'&:hover': {
								backgroundColor: theme.palette.action.hover,
							},
						},
						'&:last-of-type': {
							color: theme.palette.common.white,
							backgroundColor: theme.palette.primary.main,
							'&:hover': {
								backgroundColor: theme.palette.primary.dark,
							},
						},
					},
				},
				filterForm: {
					padding: theme.spacing(1.5, 0),
					'& .MuiFormControl-root': {
						margin: theme.spacing(0, 0.5),
					},
					'& .MuiInput-root': {
						marginTop: theme.spacing(3),
						'&::before, &::after': {
							display: 'none',
						},
						'& .MuiNativeSelect-select, .MuiInput-input': {
							...theme.typography.body2,
							padding: theme.spacing(0.75, 1),
							borderRadius: theme.shape.borderRadius,
							backgroundColor: theme.palette.background.neutral,
						},
						'& .MuiSvgIcon-root': {
							right: 4,
						},
					},
				},
			},
		},
	}
}
