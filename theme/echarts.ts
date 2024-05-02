import * as echarts from 'echarts/core'

import { themeColor } from './colors'

export const registerEchartsTheme = (isLight: boolean) => {
	const current = isLight ? themeColor.light : themeColor.dark

	const splitLine = {
		lineStyle: {
			// color: current.border.primary,
			color: 'red',
		},
	}

	const echartsTheme = {
		color: [
			current.primary.main,
			current.warning.main,
			current.success.main,
			current.error.main,
		],
		backgroundColor: 'transparent',
		legend: {
			textStyle: {
				color: current.text.secondary,
			},
		},
		textStyle: {
			color: current.text.secondary,
		},
	}
	echarts.registerTheme('echartsTheme', echartsTheme)
}
