import { alpha } from '@mui/material'

export const GRAY = {
	50: '#F5F2FE',
	100: '#FAFAFA',
	200: '#F3F3F3',
	300: '#F1F1F1',
	400: '#DCDCDC',
	500: '#DCDCDC',
	600: '#666666',
	700: '#666666',
	800: '#333333',
	900: '#333333',
}

const PRIMARY = {
	lighter: '#f8cda5',
	light: '#d9883f',
	main: '#ED5855',
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

const colors_scroll_light = {
	primary: PRIMARY,
	secondary: SECONDARY,
	info: INFO,
	success: SUCCESS,
	warning: WARNING,
	error: ERROR,
	gray: GRAY,
	divider: alpha(GRAY[500], 0.24),
	text: {
		primary: GRAY[800],
		secondary: GRAY[700],
		disabled: GRAY[500],
	},
	background: { paper: '#fff', default: '#fff', neutral: GRAY[200] },
	neutral: {
		border: GRAY[50],
		primary: GRAY[700],
		secondary: GRAY[100],
	},
	chain: {
		menuBg: '#32242B',
	},
}

export default colors_scroll_light
