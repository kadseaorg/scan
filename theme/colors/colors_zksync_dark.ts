import { alpha } from '@mui/material'

export const GRAY = {
	50: '#DCDCDC',
	100: '#CDCDCD',
	200: '#999999',
	300: '#666666',
	400: '#444444',
	500: '#424242',
	600: '#383838',
	700: '#333333',
	800: '#262626',
	900: '#000000',
}

const PRIMARY = {
	lighter: '#7595f0',
	light: '#537bed',
	main: '#3567F6',
	dark: '#1546d3',
	darker: '#0c329f',
}

const SECONDARY = {
	main: '#3567F6',
}

const INFO = {
	main: '#00B8D9',
}

const SUCCESS = {
	main: '#00A700',
	// main: '#00C29E'
}

const WARNING = {
	main: '#F0AF08',
}

const ERROR = {
	main: '#E34D59',
}

const colors_zksync_dark = {
	primary: PRIMARY,
	secondary: SECONDARY,
	info: INFO,
	success: SUCCESS,
	warning: WARNING,
	error: ERROR,
	gray: GRAY,
	divider: alpha(GRAY[500], 0.24),
	text: {
		primary: GRAY[50],
		secondary: GRAY[200],
		disabled: GRAY[600],
	},
	background: {
		paper: GRAY[800],
		primary: GRAY[50],
		secondary: GRAY[600],
	},
	neutral: {
		border: GRAY[700],
		primary: GRAY[300],
		secondary: GRAY[600],
	},
	chain: {
		menuBg: '#1D1D1D',
	},
}

export default colors_zksync_dark
