import { theme } from 'antd'

import { themeColor } from '@/theme/colors'

import useTheme from './useTheme'

export default function useAntdTheme() {
	const { light, dark } = themeColor
	const { themeMode } = useTheme()

	const isLight = themeMode === 'light'

	const ANTD_THEME_CONFIG = {
		light: {
			token: {
				colorInfo: isLight ? light.primary.main : dark.primary.main,
				colorPrimary: isLight ? light.primary.main : dark.primary.main,
				borderRadius: 4,
				colorText: '#333',
				colorTextHeading: '#333',
				colorSplit: '#e7e7e7',
				colorBorder: '#e7e7e7',
				colorBorderSecondary: light.gray[500], // 表格中较弱的分割线
				colorInfoActive: '#a6603f',
				colorInfoBg: '#fff7f0',
				colorInfoBgHover: '#f2e6dc',
				colorInfoBorder: '#e6c4ac',
				colorInfoBorderHover: '#d9a280',
				colorInfoHover: '#d9a280',
				colorInfoText: '#d9a280',
				colorInfoTextActive: '#a6603f',
				colorInfoTextHover: '#d9a280',
				colorPrimaryActive: '#d9a280',
				colorPrimaryBg: '#fff7f0',
				colorPrimaryBgHover: '#f2e6dc',
				colorPrimaryBorder: '#e6c4ac',
				colorPrimaryBorderHover: '#d9a280',
				colorPrimaryHover: '#d9a280',
				colorPrimaryText: '#d9a280',
				colorPrimaryTextActive: '#a6603f',
				colorPrimaryTextHover: '#d9a280',
				colorLink: '#cb8158',
				// colorLinkActive: '#00a183',
				// colorLinkHover: '#00a183',
				// colorTextQuaternary: ,
				controlItemBgActiveHover: '#e6c4ac',
				controlOutline: '#f2e6dc',
				colorBgContainerDisabled: '#e5e7eb',
			},
		},
		dark: {
			algorithm: theme.darkAlgorithm,
			token: {
				colorInfo: dark.primary.main,
				colorPrimary: dark.primary.main,
				borderRadius: 4,
				colorText: dark.gray[50],
				colorBgContainer: dark.gray[800], // card背景色
				colorBgElevated: dark.gray[800],
				colorBorderSecondary: dark.gray[700], // 表格中较弱的分割线
				colorTextQuaternary: dark.gray[500],
			},
		},
	}
	return ANTD_THEME_CONFIG
}
