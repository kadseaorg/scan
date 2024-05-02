import { alpha } from '@mui/material'

export const GRAY = {
	50: '#DCDCDC',
	100: '#CDCDCD',
	200: '#999999',
	300: '#666666',
	400: '#444444',
	500: '#444444',
	600: '#1f2937',
	700: '#333333',
	800: '#1f2025ff',
	900: '#000000ff',
}

const PRIMARY = {
	lighter: '#829ce3',
	light: '#2e59d1',
	main: '#2D48AD',
	dark: '#172d69',
	darker: '#122454',
}

const SECONDARY = {
	main: '#84a6f8ff',
}

const INFO = {
	main: '#00B8D9',
}

const SUCCESS = {
	main: '#00A700',
}

const WARNING = {
	main: '#F0AF08',
}

const ERROR = {
	main: '#E34D59',
}

const colors_base_dark = {
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
		primary: GRAY[900],
		secondary: GRAY[800],
	},
	neutral: {
		border: GRAY[700],
		primary: GRAY[300],
		secondary: GRAY[600],
	},
	chain: {
		menuBg: GRAY[800],
	},
}

export default colors_base_dark
