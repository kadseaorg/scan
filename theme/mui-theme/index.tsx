import { CssBaseline } from '@mui/material'
import { enUS } from '@mui/material/locale'
import {
	StyledEngineProvider,
	ThemeProvider,
	createTheme,
} from '@mui/material/styles'

import useTheme from '@/hooks/common/useTheme'

import customShadows from './customShadows'
import GlobalStyles from './globalStyles'
import componentsOverride from './overrides'
import palette from './palette'
import shadows from './shadows'
import typography from './typography'

type Props = {
	children: React.ReactNode
}

export default function MUIThemeProvider({ children }: Props) {
	const { themeMode } = useTheme()

	const theme = createTheme(
		{
			palette: palette(themeMode),
			typography,
			shape: { borderRadius: 4 },
			shadows: shadows(themeMode),
			customShadows: customShadows(themeMode),
		},
		enUS, // use 'de' locale for UI texts (start, next month, ...)
	)

	theme.components = componentsOverride(theme)

	return (
		<StyledEngineProvider injectFirst>
			<ThemeProvider theme={theme}>
				<CssBaseline />
				<GlobalStyles />
				{children}
			</ThemeProvider>
		</StyledEngineProvider>
	)
}
