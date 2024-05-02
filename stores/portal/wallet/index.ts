import BigNumber from 'bignumber.js'
import { produce } from 'immer'
import { formatUnits } from 'viem'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { STORAGE_KEY } from '@/constants'

export type IPortalWalletToken = {
	logo?: string
	name?: string
	symbol: string
	decimals: number
	address: string
	balance?: bigint
	formatedBalance?: string
	native?: boolean
	chainId: number
	usdPrice?: number
}

export type PortalWalletStore = {
	tokenList: IPortalWalletToken[]
	addedTokenList: Record<number, Record<string, IPortalWalletToken[]>>
	tokenUsdBalanceMap: Map<string, string | undefined>
	totalUsdBalance?: number
	setTokenList: (
		chainId: number,
		account: string,
		tokenList: PortalWalletStore['tokenList'],
	) => void
	addToken: (
		chainId: number,
		account: string,
		token: IPortalWalletToken,
	) => void
	setErc20Balances: (balances: IPortalWalletToken['balance'][]) => void
	setNativeBalance: (balance: IPortalWalletToken['balance']) => void
	setTokenUsdBalanceMap: (
		tokenUsdBalanceMap: PortalWalletStore['tokenUsdBalanceMap'],
	) => void
}

function sortTokenList(_tokenList?: IPortalWalletToken[]) {
	if (!!!_tokenList || !!!_tokenList?.length) return []

	const priorityList = ['USDT', 'USDC', 'WBTC', 'WETH', 'DAI', 'SHIB']

	let nativeToken: IPortalWalletToken[] = [],
		priorityTokenList: IPortalWalletToken[] = [],
		otherTokenList: IPortalWalletToken[] = [],
		startsWithNumberTokenList: IPortalWalletToken[] = []

	_tokenList.forEach((token) => {
		if (!!token?.native) nativeToken.push(token)
		else if (priorityList.includes(token?.symbol)) priorityTokenList.push(token)
		else if (/^\d/.test(token?.symbol)) startsWithNumberTokenList.push(token)
		else otherTokenList.push(token)
	})

	const sortArr = (arr: IPortalWalletToken[]) =>
		arr.sort((a, b) => a.symbol.localeCompare(b.symbol))

	return [
		...nativeToken,
		...priorityTokenList.sort(
			(a, b) => priorityList.indexOf(a.symbol) - priorityList.indexOf(b.symbol),
		),
		...sortArr(otherTokenList),
		...sortArr(startsWithNumberTokenList),
	]
}

export const usePortalWalletStore = create<PortalWalletStore>()(
	persist(
		(set, get) => ({
			tokenList: [],
			addedTokenList: {},
			tokenUsdBalanceMap: new Map(),
			setTokenList: (chainId, account, tokenList = []) =>
				set({
					tokenList: sortTokenList([
						...tokenList,
						...(get().addedTokenList?.[chainId]?.[account] || []),
					]),
				}),
			addToken: (chainId, account, token) =>
				set({
					addedTokenList: produce(get().addedTokenList, (draft) => {
						if (draft[chainId]) {
							!!draft[chainId]?.[account]
								? draft[chainId][account].push(token)
								: (draft[chainId][account] = [token])
						} else {
							draft[chainId] = { [account]: [token] }
						}
					}),
					tokenList: sortTokenList([...get().tokenList, token]),
				}),
			setErc20Balances: (balances) =>
				balances?.length === get().tokenList?.length - 1 &&
				set({
					tokenList: produce(get().tokenList, (draft) => {
						draft.forEach((item, index) => {
							if (!!index) {
								const balance = balances?.[index - 1] ?? BigInt(0)
								item.balance = balance
								item.formatedBalance = BigNumber(
									BigNumber(formatUnits(balance, item.decimals)).toFixed(8),
								).toFixed()
							}
						})
					}),
				}),
			setNativeBalance: (balance) =>
				set({
					tokenList: produce(get().tokenList, (draft) => {
						if (!!draft?.[0]?.native) {
							draft[0].balance = balance
							draft[0].formatedBalance = BigNumber(
								BigNumber(
									formatUnits(balance ?? BigInt(0), draft[0].decimals),
								).toFixed(8),
							).toFixed()
						}
					}),
				}),
			setTokenUsdBalanceMap: (tokenUsdBalanceMap) =>
				set({
					tokenUsdBalanceMap,
					totalUsdBalance: [...(tokenUsdBalanceMap?.values() || [])]?.reduce(
						(pre, current) => pre + Number(current ?? 0),
						0,
					),
				}),
		}),
		{
			name: STORAGE_KEY.WALLET.ADDED_TOKEN_LIST,
			partialize: (state) => ({ addedTokenList: state.addedTokenList }),
		},
	),
)
