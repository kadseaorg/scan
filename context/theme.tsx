import {
	Context,
	ReactNode,
	createContext,
	useCallback,
	useEffect,
	useState,
} from 'react'

import { CURRENT_CHAIN_ITEM } from '@/constants'
import { themeColor } from '@/theme/colors'
import { registerEchartsTheme } from '@/theme/echarts'

export type ThemeMode = 'light' | 'dark'

export interface ThemeContextType {
	palette: any
	themeMode: ThemeMode
	isLight: boolean
	changeTheme: (themeMode: ThemeMode) => void
}

export const ThemeContext: Context<ThemeContextType> = createContext({
	themeMode: 'light',
	palette: null,
	isLight: true,
	changeTheme: () => {},
} as ThemeContextType)

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({
	children,
}) => {
	const defaultMode = CURRENT_CHAIN_ITEM.darkOnly ? 'dark' : 'light'

	const [themeMode, setThemeMode] = useState<ThemeMode>(defaultMode)
	const isLight = themeMode === 'light'

	useEffect(() => {
		if (isLight) {
			document.documentElement.classList.remove('dark')
		} else {
			document.documentElement.classList.add('dark')
		}
		registerEchartsTheme(isLight)
	}, [isLight])

	const palette = themeColor[themeMode]

	const changeTheme = useCallback((themeMode: ThemeMode) => {
		localStorage.themeMode = themeMode
		setThemeMode(themeMode)
	}, [])

	useEffect(() => {
		if (CURRENT_CHAIN_ITEM.darkOnly) {
			changeTheme('dark')
		} else {
			setThemeMode(localStorage?.themeMode || defaultMode)
		}
	}, [])

	return (
		<ThemeContext.Provider value={{ palette, themeMode, isLight, changeTheme }}>
			{children}
		</ThemeContext.Provider>
	)
}
