import { CURRENT_CHAIN_ITEM } from './chain'

export const etherscanApiUrls = {
	[1]: 'https://api.etherscan.io/api',
	[8543]: 'https://api.basescan.org/api',
	[534352]: 'https://api.scrollscan.com/api',
} as const

export const l2scanApiUrl =
	process.env.NODE_ENV === 'development'
		? 'http://localhost:3000/api/beta/contract'
		: `${CURRENT_CHAIN_ITEM.blockExplorerUrl}/api/beta/contract`
