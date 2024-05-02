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
	lighter: '#66E3FF',
	light: '#52DEFF',
	main: '#3BDAFC',
	dark: '#29B8D9',
	darker: '#1C94B1',
	contrastText: '#fff',
}

const SECONDARY = {
	main: '#3BDAFC',
	contrastText: '#fff',
}

const INFO = {
	main: '#00B8D9',
	contrastText: '#fff',
}

const SUCCESS = {
	main: '#00A700',
	contrastText: '#fff',
}

const WARNING = {
	main: '#F0AF08',
	contrastText: '#fff',
}

const ERROR = {
	main: '#E34D59',
	contrastText: '#fff',
}

const colors_linea_dark = {
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
		default: GRAY[900],
		neutral: alpha(GRAY[500], 0.16),
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

export default colors_linea_dark
