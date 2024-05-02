import { Chain } from '@wagmi/core'
import { BigNumberish } from 'ethers'
import { Signer } from 'zksync-web3'

import { EPortalNetwork } from '@/stores/portal'

export interface IBridgeFormKeys {
	amount: string
}

export enum BridgeTxTypeEnum {
	DEPOSIT = 'deposit',
	WITHDRAW = 'withdraw',
}

export interface IBridgeTxHistoryItem {
	// address: string;
}

export interface IZksyncEraProviderContext {
	eraBalances: Record<
		string,
		{
			balance: string
			token: Token
		}
	> | null
	eraL2Signer: Signer | null
	l1Balance: string
	l2Balance: string
	maxWithdrawFee: string
	updateWithdrawFee: () => void
}

export type ScrollToken = {
	address: string
	l2ChainId: number
	decimals: number
	logoURI: string
	name: string
	symbol: string
}

export type ZksyncToken = {
	decimals: number
	iconURL: string
	l1Address: string
	l2Address: string
	liquidity: number
	name: string
	symbol: string
	usdPrice: number
}

export type Token = {
	address: string
	l1Address: string
	l2Address: string
	name: string
	symbol: string
	decimals: number
	iconUrl: string
	enabledForFees?: boolean
	usdPrice?: number
	native?: boolean
	l2ChainId: number
	formatedBalance?: string
	balance?: bigint
}
export type TokenAmount = Token & { amount: BigNumberish }

export type L1Network = Chain
export type L2Network = {
	id: number
	rpcUrl: string
	faucetUrl?: string
	displaySettings?: {
		showPartnerLinks?: boolean
		showZkSyncLiteNetworks?: boolean
	}

	key: string
	name: string
	shortName: string
	l1Network?: L1Network
	blockExplorerUrl?: string
	// If set to true, the network will not be shown in the network selector
	hidden?: boolean

	isL2: true
}

export type BridgeNetworks = Record<EPortalNetwork, L2Network>
