import {
	CircleDollarSign,
	Compass,
	Component,
	GanttChartSquare,
	Hammer,
	Home,
	Info,
	Shapes,
	SquareCode,
} from 'lucide-react'

import { IRouteMenuItem } from '@/components/common/nav-section/types'
import { CHAIN_TYPE, IsChainSupportBridge, IsKadsea } from '@/constants'
import ROUTES from '@/constants/routes'
import { EnumChainType } from '@/types/chain'

export const DONATION_ADDRESS = '0xFDBab5e7404bC92a33245651B1D1828d3BEb7C21'

export const SOCIAL_LINKS = {
	TWITTER: 'https://twitter.com/l2scan',
	DISCORD: 'https://discord.gg/6fxayYKa3w',
	MAIL: 'mailto:business@unifra.io',
	FEEDBACK: 'https://6s04oc3w9bm.typeform.com/to/tsdMdOs1',
}

export const GLE_FOMRS = {
	PROJECT: {
		key: 'https://forms.gle/dNJL1oJEu77AJEgq8',
		label: 'Project Submission',
		route: 'https://forms.gle/dNJL1oJEu77AJEgq8',
	},
	PUBLIC_TAG: {
		key: 'https://forms.gle/RC93E5g2L36P2xUJA',
		label: 'Public Tag Submission',
		route: 'https://forms.gle/RC93E5g2L36P2xUJA',
	},
	AD: {
		key: 'https://forms.gle/76i93smCHidSZ1pa9',
		label: 'Advertising Inquiries',
		route: 'https://forms.gle/76i93smCHidSZ1pa9',
	},
}

export const INFORMATION_URLS: {
	DOCS?: { key: string; label: string; route: string }
	FEEDBACK: { key: string; label: string; route: string }
} = {
	DOCS: {
		key: 'https://docs.unifra.io/reference/l2scan',
		label: 'Docs',
		route: 'https://docs.unifra.io/reference/l2scan',
	},
	FEEDBACK: {
		key: 'https://6s04oc3w9bm.typeform.com/to/tsdMdOs1',
		label: 'Feedback',
		route: 'https://6s04oc3w9bm.typeform.com/to/tsdMdOs1',
	},
}
if (IsKadsea) {
	SOCIAL_LINKS.TWITTER = 'https://twitter.com/KadseaLayer2'
	SOCIAL_LINKS.DISCORD = 'https://discord.com/invite/JYqDYMu76e'
	SOCIAL_LINKS.MAIL = 'mailto:info@kadseachain.com'
	SOCIAL_LINKS.FEEDBACK = 'https://6s04oc3w9bm.typeform.com/to/iyV6q6Bv'
	Reflect.deleteProperty(INFORMATION_URLS, 'DOCS')
	INFORMATION_URLS.FEEDBACK.key = INFORMATION_URLS.FEEDBACK.route =
		'https://6s04oc3w9bm.typeform.com/to/iyV6q6Bv'
	GLE_FOMRS.PROJECT = {
		key: 'https://docs.google.com/forms/d/e/1FAIpQLSfIF24hU7CsTiLkbMizeRlCUn5itpqPtUV7V2CEBnMYDOTJKg/viewform?usp=pp_url',
		label: 'Project Submission',
		route:
			'https://docs.google.com/forms/d/e/1FAIpQLSfIF24hU7CsTiLkbMizeRlCUn5itpqPtUV7V2CEBnMYDOTJKg/viewform?usp=pp_url',
	}
	GLE_FOMRS.PUBLIC_TAG = {
		key: 'https://docs.google.com/forms/d/e/1FAIpQLSfJvdM3bd8epPXzFrrLmvUN30oBPJDhT_dtPlmcxorROwEFCA/viewform?usp=pp_url',
		label: 'Public Tag Submission',
		route:
			'https://docs.google.com/forms/d/e/1FAIpQLSfJvdM3bd8epPXzFrrLmvUN30oBPJDhT_dtPlmcxorROwEFCA/viewform?usp=pp_url',
	}

	GLE_FOMRS.AD = {
		key: 'https://docs.google.com/forms/d/e/1FAIpQLSeb5_9KPM1ePp_S_GkTzl5SxzglA8RztyWail4uPnpWtEFUSA/viewform?usp=pp_url',
		label: 'Advertising Inquiries',
		route:
			'https://docs.google.com/forms/d/e/1FAIpQLSeb5_9KPM1ePp_S_GkTzl5SxzglA8RztyWail4uPnpWtEFUSA/viewform?usp=pp_url',
	}
}

const ROUTES_MENUS_FULL: IRouteMenuItem[] = [
	{
		key: ROUTES.HOME,
		label: 'Home',
		route: ROUTES.HOME,
		icon: <Home size={18} />,
	},
	{
		key: 'Portal',
		label: 'Portal',
		icon: <Compass size={18} />,
		children: [
			{
				key: ROUTES.PORTAL.BRIDGE,
				label: 'Assets',
				route: ROUTES.PORTAL.WALLET.INDEX,
			},
			{
				key: ROUTES.PORTAL.BRIDGE,
				label: 'Bridge',
				route: ROUTES.PORTAL.BRIDGE,
			},
			{ key: ROUTES.PORTAL.BRIDGE, label: 'Swap', route: ROUTES.PORTAL.SWAP },
			{
				key: ROUTES.PORTAL.FAUCET,
				label: 'Faucet',
				route: ROUTES.PORTAL.FAUCET,
			},
		],
	},
	{
		key: ROUTES.DAPPS.INDEX,
		icon: <Component size={18} />,
		label: 'Dapps Ranking',
		route: ROUTES.DAPPS.INDEX,
	},
	{
		key: ROUTES.INSCRIPTIONS.INDEX,
		label: 'Inscriptions',
		icon: <Hammer size={18} />,
		route: ROUTES.INSCRIPTIONS.INDEX,
	},
	{
		key: 'Blockchain',
		label: 'Blockchain',
		icon: <Shapes size={18} />,
		children: [
			{
				key: ROUTES.BLOCK_CHAIN.TXNS,
				label: 'Transactions',
				route: ROUTES.BLOCK_CHAIN.TXNS,
			},
			{
				key: ROUTES.BLOCK_CHAIN.BLOCKS,
				label: 'Blocks',
				route: ROUTES.BLOCK_CHAIN.BLOCKS,
			},
			{
				key: ROUTES.BLOCK_CHAIN.BATCHES,
				label: 'Batches',
				route: ROUTES.BLOCK_CHAIN.BATCHES,
			},
			{
				key: ROUTES.BLOCK_CHAIN.BRIDGE,
				label: 'Bridge',
				route: ROUTES.BLOCK_CHAIN.BRIDGE,
			},
			{
				key: ROUTES.BLOCK_CHAIN.BRIDGE,
				label: 'Top Accounts',
				route: ROUTES.BLOCK_CHAIN.TopAccounts,
			},
			{
				key: ROUTES.BLOCK_CHAIN.VerifiedContracts,
				label: 'Verified Contracts',
				route: ROUTES.BLOCK_CHAIN.VerifiedContracts,
			},
		],
	},
	{
		key: 'Tokens',
		label: 'Tokens',
		icon: <CircleDollarSign size={18} />,
		children: [
			{ key: ROUTES.TOKENS.ERC20, label: 'ERC 20', route: ROUTES.TOKENS.ERC20 },
			{
				key: ROUTES.TOKENS.ERC721,
				label: 'ERC 721',
				route: ROUTES.TOKENS.ERC721,
			},
			{
				key: ROUTES.TOKENS.ERC1155,
				label: 'ERC 1155',
				route: ROUTES.TOKENS.ERC1155,
			},
		],
	},
	{
		key: 'Resources',
		label: 'Resources',
		icon: <GanttChartSquare size={18} />,
		children: [
			{ key: ROUTES.CHARTS.INDEX, label: 'Charts', route: ROUTES.CHARTS.INDEX },
			{
				key: ROUTES.LABEL.INDEX,
				label: 'Label Cloud',
				route: ROUTES.LABEL.INDEX,
			},
		],
	},
	{
		key: 'Dev Tools',
		label: 'Dev Tools',
		icon: <SquareCode size={18} />,
		children: [
			{
				key: ROUTES.CONTRACT.VERIFY,
				label: 'Verify Contract',
				route: ROUTES.CONTRACT.VERIFY,
			},
			GLE_FOMRS.PUBLIC_TAG,
			{
				key: ROUTES.DEVTOOLS.INDEX,
				label: 'Foundry Tools',
				route: ROUTES.DEVTOOLS.INDEX,
			},
			{
				key: ROUTES.CODEREADER.INDEX,
				label: 'Code Reader',
				route: ROUTES.CODEREADER.INDEX,
			},
		],
	},

	{
		key: 'Information',
		label: 'Information',
		icon: <Info size={18} />,
		children: [
			GLE_FOMRS.PROJECT,
			GLE_FOMRS.AD,
			...Object.values(INFORMATION_URLS),
		],
	},
]

// if chain is zksync-era, hidden the unsupported menu(Vefiry contract, dapps, label cloud)
export const ROUTES_MENUS = ROUTES_MENUS_FULL.filter((menuItem) => {
	if (
		CHAIN_TYPE === EnumChainType.ZKSYNC &&
		['Verify contract', 'Label Cloud'].includes(menuItem.label)
	) {
		return false
	}

	if (IsKadsea && menuItem.label === 'Inscriptions') {
		return false
	}

	// if (CHAIN_TYPE === EnumChainType.ARB && ['Dapps Ranking', 'Inscriptions'].includes(menuItem.label)) {
	//   return false
	// }

	// show only portal menu
	if (
		![
			EnumChainType.SCROLL,
			EnumChainType.SCROLL_SEPOLIA,
			EnumChainType.ZKSYNC,
			EnumChainType.MANTA,
			EnumChainType.BSQUARED_TESTNET,
			EnumChainType.KADSEA,
			EnumChainType.ARB,
			EnumChainType.OKX1_TESTNET,
		].includes(CHAIN_TYPE) &&
		menuItem.label === 'Portal'
	) {
		return false
	}

	if (menuItem.children) {
		menuItem.children = menuItem.children.filter((child) => {
			// if (CHAIN_TYPE === EnumChainType.ZKSYNC && ['Label Cloud'].includes(child.label)) {
			//   return false
			// }

			// hide bridge and batches menu for kadsea
			if (IsKadsea && ['Bridge', 'Batches'].includes(child.label)) {
				return false
			}

			if (IsKadsea && child.label === 'Advertising Inquiries') {
				return false
			}

			// only show faucet menu when chain is scroll sepolia
			if (
				CHAIN_TYPE !== EnumChainType.SCROLL_SEPOLIA &&
				child.label === 'Faucet'
			) {
				return false
			}

			// hidden bridge menu for some chains
			if (!IsChainSupportBridge && child.label === 'Bridge') {
				return false
			}
			return true
		})
	}

	return true
})
