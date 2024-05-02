import { Theme, alpha } from '@mui/material/styles'

export default function Tooltip(theme: Theme) {
	const isLight = theme.palette.mode === 'light'

	return {
		MuiTooltip: {
			defaultProps: {
				arrow: true,
				placement: 'top',
			},
			styleOverrides: {
				tooltip: {
					backgroundColor: theme.palette.grey[isLight ? 600 : 500],
				},
				arrow: {
					color: theme.palette.grey[isLight ? 600 : 300],
				},
			},
		},
	}
}
