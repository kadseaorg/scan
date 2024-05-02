import { FetchBalanceResult } from '@wagmi/core'
import BigNumber from 'bignumber.js'
import { produce } from 'immer'
import { formatUnits } from 'viem'
import { create } from 'zustand'

import { ETH_L1_ADDRESS, ETH_ZKSYNC_L2_ADDRESS } from '@/constants/address'
import { decimalToBigNumber } from '@/lib/formatters'
import { useBridgeNetworkStore } from '@/stores/portal/bridge/network'
import { Token } from '@/types/bridge'

export enum TxHistoryTabType {
	RECENT = 'recent',
	CLAIM = 'claim',
}

export type BridgeConfigStore = {
	balance?: FetchBalanceResult
	amount?: string
	formattedAmount?: string
	needApproval?: boolean

	tokensMap?: { [tokenAddress: string]: Token }
	nativeToken?: Token
	isSelectedNativeToken?: boolean
	selectedToken?: Token

	txHistoryTabType: TxHistoryTabType
	tokenUsdBalanceMap: Map<string, string | undefined>
	setBalance: (balance: BridgeConfigStore['balance']) => void
	setAmount: (amount?: BridgeConfigStore['amount']) => void
	setNeedApproval: (needApproval: BridgeConfigStore['needApproval']) => void
	setTokensMap: (tokensMap: BridgeConfigStore['tokensMap']) => void
	setSelectedToken: (selectedToken: BridgeConfigStore['selectedToken']) => void
	setTxHistoryTabType: (
		txHistoryTabType: BridgeConfigStore['txHistoryTabType'],
	) => void
	setTokenUsdBalanceMap: (
		tokenUsdBalanceMap: BridgeConfigStore['tokenUsdBalanceMap'],
	) => void
	setNativeBalance: (balance: Token['balance']) => void
	setErc20Balances: (balances: Map<string, Token['balance']>) => void
}

export const useBridgeConfigStore = create<BridgeConfigStore>()((set, get) => ({
	tokensMap: {},
	txHistoryTabType: TxHistoryTabType.RECENT,
	tokenUsdBalanceMap: new Map(),
	setBalance: (balance) => set({ balance }),
	setAmount: (amount) =>
		set({
			amount,
			formattedAmount: decimalToBigNumber(
				amount || '0',
				get().selectedToken?.decimals ?? 18,
			).toString(),
		}),
	setNeedApproval: (needApproval) => set({ needApproval }),
	setTokensMap: (tokensMap) => {
		if (!!!tokensMap) return

		const nativeToken =
			tokensMap?.[ETH_ZKSYNC_L2_ADDRESS] || tokensMap?.[ETH_L1_ADDRESS]

		const selectedToken = get().selectedToken
		if (!!selectedToken?.l1Address && !!selectedToken?.l2Address) {
			get().setSelectedToken(
				tokensMap[
					(useBridgeNetworkStore.getState().fromNetwork as any)?.isL2
						? selectedToken?.l2Address
						: selectedToken?.l1Address
				],
			)
		}

		!!nativeToken &&
			!!!get().selectedToken &&
			get().setSelectedToken(nativeToken)
		set({
			nativeToken,
			isSelectedNativeToken:
				nativeToken?.address === get().selectedToken?.address,
			tokensMap,
		})
	},
	setSelectedToken: (selectedToken) =>
		set({
			selectedToken,
			isSelectedNativeToken:
				get().nativeToken?.address === selectedToken?.address,
		}),
	setTxHistoryTabType: (txHistoryTabType) => set({ txHistoryTabType }),
	setTokenUsdBalanceMap: (tokenUsdBalanceMap) =>
		set({
			tokenUsdBalanceMap,
		}),
	setNativeBalance: (balance) =>
		set({
			tokensMap: produce(get().tokensMap, (draft) => {
				if (!!draft && !!draft[ETH_L1_ADDRESS]) {
					const token = draft[ETH_L1_ADDRESS]
					token.balance = balance
					token.formatedBalance = BigNumber(
						BigNumber(
							formatUnits(balance ?? BigInt(0), token.decimals),
						).toFixed(8),
					).toFixed()
				}
			}),
		}),
	setErc20Balances: (balances) =>
		set({
			tokensMap: produce(get().tokensMap, (draft) => {
				if (!!draft) {
					for (const [address, balance] of balances.entries()) {
						const token = [ETH_L1_ADDRESS, ETH_ZKSYNC_L2_ADDRESS].includes(
							address,
						)
							? draft[ETH_L1_ADDRESS] || draft[ETH_ZKSYNC_L2_ADDRESS]
							: draft[address]
						if (!!token) {
							token.balance = balance
							token.formatedBalance = BigNumber(
								BigNumber(
									formatUnits(balance ?? BigInt(0), token.decimals),
								).toFixed(8),
							).toFixed()
						}
					}
				}
			}),
		}),
}))
