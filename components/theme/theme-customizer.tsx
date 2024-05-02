import * as React from 'react'

import { Check } from 'lucide-react'
import { useTheme } from 'next-themes'

import SimpleTooltip from '@/components/common/simple-tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { useThemeConfig } from '@/hooks/common/use-theme-config'
import { cn } from '@/lib/utils'
import { themes } from '@/theme/themes'

export function ThemeCustomizer() {
	const [config, setConfig] = useThemeConfig()
	const { resolvedTheme: mode } = useTheme()
	const [mounted, setMounted] = React.useState(false)

	React.useEffect(() => {
		setMounted(true)
	}, [])

	if (process.env.NODE_ENV === 'production') return null

	return (
		<div className="flex mr-2 items-center space-x-0.5 sm:hidden">
			{mounted ? (
				<>
					{themes.map((theme) => {
						const isActive = config.theme === theme.name

						if (!theme) {
							return null
						}

						return (
							<SimpleTooltip key={theme.name} content={theme.label}>
								<button
									onClick={() =>
										setConfig({
											...config,
											theme: theme.name,
										})
									}
									className={cn(
										'flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs',
										isActive
											? 'border-[--theme-primary]'
											: 'border-transparent',
									)}
									style={
										{
											'--theme-primary': `hsl(${
												theme?.activeColor[mode === 'dark' ? 'dark' : 'light']
											})`,
										} as React.CSSProperties
									}
								>
									<span
										className={cn(
											'flex h-4 w-4 items-center justify-center rounded-full bg-[--theme-primary]',
										)}
									>
										{isActive && <Check className="h-4 w-4 text-white" />}
									</span>
									<span className="sr-only">{theme.label}</span>
								</button>
							</SimpleTooltip>
						)
					})}
				</>
			) : (
				<div className="mr-1 flex items-center space-x-3">
					<Skeleton className="h-4 w-4 rounded-full" />
					<Skeleton className="h-4 w-4 rounded-full" />
					<Skeleton className="h-4 w-4 rounded-full" />
					<Skeleton className="h-4 w-4 rounded-full" />
					<Skeleton className="h-4 w-4 rounded-full" />
				</div>
			)}
		</div>
	)
}
