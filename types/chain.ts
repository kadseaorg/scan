import { iSwapToken } from '@/constants/interface/token'
import { Chain } from 'viem'

export enum EnumChainType {
	SCROLL_SEPOLIA = 'scroll-sepolia',
	SCROLL = 'scroll',
	ZKSYNC = 'zksync-era',
	ZKSYNC_TESTNET = 'zksync-era-testnet',
	ZKSYNC_SEPOLIA = 'zksync-era-sepolia',
	LINEA = 'linea',
	BASE = 'base',
	ARB = 'arb-one',
	MANTA = 'manta-pacific',
	MANTA_TESTNET = 'manta-testnet',
	BSQUARED_TESTNET = 'bsquared-testnet',
	KADSEA = 'kadsea',
	KADSEA_TESTNET = 'kadsea-testnet',
	OKX1_TESTNET = 'okx1-testnet',
	ORO_TESTNET = 'oro-testnet',
}

export interface IChainItem {
	url: string
	title: string
	l1Title: string
	description: string
	logo: string
	chainType: EnumChainType
	network: {
		chainId: string
		chainType: string
	}
	networkSwitchers: Array<{
		name: string
		explorerUrl: string
	}>
	darkOnly?: boolean
	blockExplorerUrl: string
	rpcUrl: string
	viemChain?: Chain
	l1ExplorerUrl?: string
	bridgeContract?: string[]
	bridgeDepositMethodId?: string
	externalExplorers?: Array<{
		name: string
		url: string
	}>

	nativeCurrency: {
		name: string
		symbol: string
		decimals: number
	}
	swap?: {
		tokens?: iSwapToken[]
		quoterAddress?: string
		swapAddress?: string
	}
}
