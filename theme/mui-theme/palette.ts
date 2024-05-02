import { alpha } from '@mui/material/styles'

import { themeColor } from '../colors'

export type ColorSchema =
	| 'primary'
	| 'secondary'
	| 'info'
	| 'success'
	| 'warning'
	| 'error'

declare module '@mui/material/styles/createPalette' {
	interface TypeBackground {
		neutral: string
	}
	interface SimplePaletteColorOptions {
		lighter: string
		darker: string
	}
	interface PaletteColor {
		lighter: string
		darker: string
	}
}

export default function palette(themeMode: 'light' | 'dark') {
	const isLight = themeMode === 'light'

	const GREY = isLight ? themeColor.light.gray : themeColor.dark.gray
	const COMMON = {
		common: { black: '#000', white: '#fff' },
		action: {
			hover: alpha(GREY[500], 0.6),
			selected: alpha(GREY[500], 0.16),
			disabled: alpha(GREY[500], 0.8),
			disabledBackground: alpha(GREY[500], 0.24),
			focus: alpha(GREY[500], 0.24),
			hoverOpacity: 0.08,
			disabledOpacity: 0.48,
		},
	}
	const light = {
		...COMMON,
		mode: 'light',
		action: {
			...COMMON.action,
			active: GREY[600],
		},
		...themeColor.light,
	} as const

	const dark = {
		...COMMON,
		mode: 'dark',
		action: {
			...COMMON.action,
			active: GREY[500],
		},
		...themeColor.dark,
	} as const

	return isLight ? light : dark
}
