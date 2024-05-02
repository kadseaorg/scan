import { EnumChainType } from '@/types/chain'

import colors_arb_dark from './colors_arb_dark'
import colors_arb_light from './colors_arb_light'
import colors_base_dark from './colors_base_dark'
import colors_bsquared_testnet_dark from './colors_bsquared_testnet_dark'
import colors_linea_dark from './colors_linea_dark'
import colors_manta_dark from './colors_manta_dark'
import colors_kadsea_dark from './colors_kadsea_dark'
import colors_scroll_dark from './colors_scroll_dark'
import colors_scroll_light from './colors_scroll_light'
import colors_zksync_dark from './colors_zksync_dark'
import colors_okx1_dark from './colors_okx1_dark'
import colors_oro_dark from './colors_oro_dark'
import { IsKadsea } from '@/constants'

const themeColor = {
	light: colors_scroll_light,
	// dark: colors_zksync_dark
	dark: colors_scroll_dark,
}

if (
	process.env.NEXT_PUBLIC_CHAIN === 'zksync-era' ||
	process.env.NEXT_PUBLIC_CHAIN === 'zksync-era-testnet' ||
	process.env.NEXT_PUBLIC_CHAIN === 'zksync-era-sepolia'
) {
	themeColor.dark = colors_zksync_dark
}
if (process.env.NEXT_PUBLIC_CHAIN === 'linea') {
	themeColor.dark = colors_linea_dark
}

if (process.env.NEXT_PUBLIC_CHAIN === 'base') {
	themeColor.dark = colors_base_dark
}
if (process.env.NEXT_PUBLIC_CHAIN === EnumChainType.ARB) {
	themeColor.dark = colors_arb_dark
	themeColor.light = colors_arb_light
}

if (
	process.env.NEXT_PUBLIC_CHAIN === EnumChainType.MANTA ||
	process.env.NEXT_PUBLIC_CHAIN === EnumChainType.MANTA_TESTNET
) {
	themeColor.dark = colors_manta_dark
}

if (process.env.NEXT_PUBLIC_CHAIN === EnumChainType.BSQUARED_TESTNET) {
	themeColor.dark = colors_bsquared_testnet_dark
}

if (IsKadsea) {
	themeColor.dark = colors_kadsea_dark
}

if (process.env.NEXT_PUBLIC_CHAIN === EnumChainType.OKX1_TESTNET) {
	themeColor.dark = colors_okx1_dark
}
if (process.env.NEXT_PUBLIC_CHAIN === EnumChainType.ORO_TESTNET) {
	themeColor.dark = colors_oro_dark
}

const { light, dark } = themeColor

const tailwindColor = {
	background: dark.chain.menuBg,
	foreground: dark.text.primary,
	accent: {
		DEFAULT: 'hsl(var(240 3.7% 15.9%;))',
		foreground: 'hsl(var())',
	},
	primary: dark.primary.main,
	secondary: dark.text.secondary,
	page: '#f1f2f2',
	main: light.primary.main,
	gray: light.gray,
	darkGray: dark.gray,
	red: '#ff4d4f',
	green: light.success.main,
	darkGreen: dark.success.main,
	orange: '#f9761a',
	lightOrange: '#f9761a1a',
	border: '#e7e7e7',
	secondText: { DEFAULT: light.text.secondary, dark: dark.text.secondary },
	// foreground: '#dcdcdc',
	darkPage: '#151515',
	menuBg: light.chain.menuBg,
	darkMenuBg: dark.chain.menuBg,
	light: light,
	dark: dark,
	scrollbar: {
		thumb: light.gray[400],
		darkThumb: dark.gray[400],
	},
}

const tailwindColorAlias = {
	'.theme-text-primary': {
		color: light.text.primary,
	},
	'.dark .theme-text-primary': {
		color: dark.text.primary,
	},
	'.theme-text-secondary': {
		color: light.text.secondary,
	},
	'.dark .theme-text-secondary': {
		color: dark.text.secondary,
	},

	'.theme-bg-secondary': {
		color: light.text.secondary,
	},
	'.dark .theme-bg-secondary': {
		color: dark.text.secondary,
	},
}

export { tailwindColor, tailwindColorAlias, themeColor }
