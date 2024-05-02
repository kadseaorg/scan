import { useContext } from 'react'

import {
	ThemeContext,
	ThemeContextType,
} from '@/components/theme/theme-provider'

export default function useTheme(): ThemeContextType {
	return useContext(ThemeContext)
}
