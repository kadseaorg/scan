import { alpha } from '@mui/material'

export const GRAY = {
	50: '#DCDCDC',
	100: '#CDCDCD',
	200: '#999999',
	300: '#666666',
	400: '#444444',
	500: '#424242',
	600: '#2F2A2C',
	700: '#333333',
	800: '#211E1F',
	900: '#151515',
}

const PRIMARY = {
	lighter: '#f8cda5',
	light: '#d9883f',
	main: '#A7570F',
	dark: '#6e3909',
	darker: '#733e0c',
}

const SECONDARY = {
	main: '#A7570F',
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

const colors_scroll_dark = {
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
		secondary: GRAY[200],
	},
	neutral: {
		border: GRAY[700],
		primary: GRAY[300],
		secondary: GRAY[600],
	},
	chain: {
		menuBg: '#1C191A',
	},
}

export default colors_scroll_dark
