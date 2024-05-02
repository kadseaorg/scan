import { Palette } from '@mui/material'

import { CustomShadowOptions } from './customShadows'

declare module '@mui/material/styles' {
	interface Theme {
		customShadows: CustomShadowOptions
	}
	interface Palette {
		neutral: {
			border: string
			secondary: string
		}
	}
	interface ThemeOptions {
		customShadows?: CustomShadowOptions
	}
}
