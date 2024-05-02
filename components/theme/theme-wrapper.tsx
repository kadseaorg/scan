import { useEffect } from 'react'

import { useThemeConfig } from '@/hooks/common/use-theme-config'
import { cn } from '@/lib/utils'

interface ThemeWrapperProps extends React.ComponentProps<'div'> {
	defaultTheme?: string
}

export function ThemeWrapper({
	defaultTheme,
	children,
	className,
}: ThemeWrapperProps) {
	const [config] = useThemeConfig()

	useEffect(() => {
		document.body.classList.add(`theme-${defaultTheme || config.theme}`)
	}, [config.theme, defaultTheme])

	return (
		<div
			className={cn('w-full', className)}
			style={
				{
					'--radius': `${defaultTheme ? 0.5 : config.radius}rem`,
				} as React.CSSProperties
			}
		>
			{children}
		</div>
	)
}
