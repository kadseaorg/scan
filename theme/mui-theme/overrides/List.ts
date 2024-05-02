import { Theme } from '@mui/material/styles'

export default function List(theme: Theme) {
	return {
		MuiList: {
			styleOverrides: {
				root: {
					maxHeight: 300,
				},
			},
		},
		MuiListItemIcon: {
			styleOverrides: {
				root: {
					color: 'inherit',
					minWidth: 'auto',
					marginRight: theme.spacing(2),
				},
			},
		},
		MuiListItemAvatar: {
			styleOverrides: {
				root: {
					minWidth: 'auto',
					marginRight: theme.spacing(2),
				},
			},
		},
		MuiListItemText: {
			styleOverrides: {
				root: {
					marginTop: 0,
					marginBottom: 0,
				},
				multiline: {
					marginTop: 0,
					marginBottom: 0,
				},
			},
		},
	}
}
