import { GridColDef } from '@mui/x-data-grid'

export const mergeDefaultColumns = (columns: GridColDef[]): GridColDef[] => {
	return columns.map((c) => ({
		minWidth: 90,
		sortable: false,
		disableColumnMenu: true,
		...c,
	}))
}
