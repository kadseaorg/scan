import { Theme } from '@mui/material/styles'

export default function Dialog(theme: Theme) {
	return {
		MuiDialog: {
			styleOverrides: {
				paper: {
					boxShadow: theme.customShadows.dialog,
					'&.MuiPaper-rounded': {
						borderRadius: Number(theme.shape.borderRadius) * 2,
					},
					'&.MuiDialog-paperFullScreen': {
						borderRadius: 0,
					},
					'&.MuiDialog-paper .MuiDialogActions-root': {
						padding: theme.spacing(3),
					},
				},
			},
		},

		MuiDialogTitle: {
			styleOverrides: {
				root: {
					padding: theme.spacing(3),
				},
			},
		},
		MuiDialogContent: {
			styleOverrides: {
				root: {
					maxWidth: 800,
					padding: theme.spacing(0, 3),
				},
				dividers: {
					borderTop: 0,
					borderBottomStyle: 'dashed',
					paddingBottom: theme.spacing(3),
				},
			},
		},
		MuiDialogActions: {
			styleOverrides: {
				root: {
					'& > :not(:first-of-type)': {
						marginLeft: theme.spacing(1.5),
					},
				},
			},
		},
	}
}
