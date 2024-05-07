import { EPortalNetwork } from '@/stores/portal'
import { getImgSrc } from '@/utils'

import { CHAIN_TOKEN_NAME, IsBsquaredTestnet, IsKadsea } from './chain'

export * from './chain'
export * from './prompts'
export const CHAIN_TOKEN = CHAIN_TOKEN_NAME
export const CHAIN_TOKEN_DECIMALS = 18
export const BLOCK_INTERVAL = 5

export const CONTENT_MIN_WIDTH = 1200
export const PAGE_SIZE = 20
export const TIME_FORMATTER = 'MMM-DD-YYYY HH:mm:ss A ZUTC'
export const DATE_PICKER_FORMATTER = 'MMM D,YYYY'
export const STORAGE_KEY = {
	BLOCK_NUMBERS: 'blockNumbers',
	BRIDGE_TRANSACTIONS: {
		[EPortalNetwork.MAINNET]: 'mainnetPortalTransactions',
		[EPortalNetwork.TESTNET]: 'testnetPortalTransactions',
	},
	CLAIM_TRANSACTIONS: 'claimTransactions',
	WALLET: {
		ADDED_TOKEN_LIST: 'addedTokenList',
		CONTACTS: 'walletContacts',
	},
	PORTAL_BRIDGE_ZKSYNC_NEW_TX: 'PORTAL_BRIDGE_ZKSYNC_NEW_TX',
	PORTAL_BRIDGE_ZKSYNC_WITHDRAW_CLAIM_TX:
		'PORTAL_BRIDGE_ZKSYNC_WITHDRAW_CLAIM_TX',
	SWAP: 'SWAP',
}
export const TABLE_CONFIG = {
	ROW_HEIGHT: 62,
	SCROLL_CONFIG: { x: 1450 },
	COL_WIDHT: {
		L1_STATUS: 160,
		TRANS_ARROW_ICON: 50,
		ADDRESS: 65,
		TXHASH: 120,
		TXFEE: 160,
		AGE: 140,
	},
}

export const TIPS = {
	netErr: 'net error!',
	copied: 'copy successfully!',
}

export const ICON = {
	NAV_ITEM: 24,
}
export const NAV = {
	W_BASE: 260,
	W_DASHBOARD: 280,
	W_DASHBOARD_MINI: 88,
	H_DASHBOARD_ITEM: 48,
	H_DASHBOARD_ITEM_SUB: 36,
	H_DASHBOARD_ITEM_HORIZONTAL: 32,
}

export const MAX_TAG_LIMIT = 1000

export const ETH_ICON_URL = getImgSrc('eth')
export const BTC_ICON_URL = getImgSrc('kad', true)
export const NATIVE_ICON_URL =
	IsBsquaredTestnet || IsKadsea ? BTC_ICON_URL : ETH_ICON_URL
export const ETH_SYMBOL = 'ETH'
export const WETH_SYMBOL = 'WETH'
export const USDC_SYMBOL = 'USDC'

export const PRIVY_TOKEN = 'privy-token'
export const PRIVY_REFRESH_TOKEN = 'privy-refresh-token'
