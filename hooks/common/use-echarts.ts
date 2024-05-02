import { useMemo } from 'react'

import useTheme from '@/hooks/common/useTheme'

export default function useEcharts() {
	const { isLight } = useTheme()

	const labelColor = useMemo(() => (isLight ? '#1C2E32' : '#dcdcdc'), [isLight])

	const lineColor = useMemo(() => (isLight ? '#F5F5F5' : '#333'), [isLight])

	const tooltipColor = useMemo(
		() =>
			isLight
				? {}
				: {
						backgroundColor: '#1d1d1d',
						borderColor: '#1d1d1d',
						textStyle: { color: '#eee' },
				  },
		[isLight],
	)

	const legendTextColor = useMemo(() => (isLight ? '#333' : '#eee'), [isLight])

	return { isLight, labelColor, lineColor, tooltipColor, legendTextColor }
}
