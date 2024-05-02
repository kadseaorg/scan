import { useEffect, useMemo } from 'react'

import {
	manta,
	mantaTestnet,
	scroll,
	scrollSepolia,
	zkSync,
	zkSyncSepoliaTestnet,
} from '@wagmi/core/chains'
import BigNumber from 'bignumber.js'
import { erc20ABI } from 'wagmi'
import { useBalance, useContractReads } from 'wagmi'

import { ETH_ICON_URL, IsManta, IsScroll, IsZkSync } from '@/constants'
import { ETH_L1_ADDRESS } from '@/constants/address'
import useUsdExchangeRates from '@/hooks/common/use-usd-exchange-rates'
import usePortalContext from '@/hooks/portal/use-portal-context'
import { usePortalStore } from '@/stores/portal'
import { useBridgeConfigStore } from '@/stores/portal/bridge/config'

import { useBridgeTokens } from './use-bridge-tokens'

export const useBridgeTokensMap = () => {
	const {
		tokensMap,
		setTokensMap,
		setTokenUsdBalanceMap,
		setErc20Balances,
		setNativeBalance,
	} = useBridgeConfigStore()
	const { isMainnet } = usePortalStore()
	const { walletAddress } = usePortalContext()
	const {
		isFetching: isFetchingUsdRates,
		usdExchangeRates,
		convertToUsdPrice,
	} = useUsdExchangeRates(IsScroll)
	const chainId = useMemo(
		() =>
			isMainnet
				? IsScroll
					? scroll.id
					: zkSync.id
				: IsScroll
				  ? scrollSepolia.id
				  : zkSyncSepoliaTestnet.id,
		[isMainnet],
	)

	const tokensRaw = useBridgeTokens()

	const tokens = useMemo(
		() =>
			tokensRaw
				? Object.fromEntries(
						tokensRaw.map((token) => {
							return [token.address, token]
						}),
				  )
				: undefined,
		[tokensRaw],
	)

	useEffect(() => {
		if (!!tokensMap && Object.values(tokensMap).length) {
			const _tokenUsdBalanceMap = new Map()
			Object.values(tokensMap).forEach(
				({ address, formatedBalance, symbol, usdPrice }) => {
					let usdBalance
					if (IsScroll)
						usdBalance = convertToUsdPrice?.(formatedBalance, {
							showPreffix: false,
							symbol,
						})

					if (IsZkSync)
						usdBalance = !!usdPrice
							? BigNumber(
									BigNumber(formatedBalance || 0)
										.multipliedBy(usdPrice)
										.toFixed(2),
							  ).toFixed()
							: undefined

					_tokenUsdBalanceMap.set(address, usdBalance)
				},
			)

			setTokenUsdBalanceMap(_tokenUsdBalanceMap)
		}
	}, [tokensMap, usdExchangeRates, convertToUsdPrice, setTokenUsdBalanceMap])

	const { data: nativeTokenBalance } = useBalance({
		watch: true,
		enabled: !!walletAddress && undefined !== isMainnet,
		address: walletAddress as `0x${string}`,
		// chainId,
		token: undefined,
	})

	useEffect(() => {
		if (!!tokensRaw?.length && !!nativeTokenBalance) {
			setNativeBalance(nativeTokenBalance.value)
		}
	}, [tokensRaw, nativeTokenBalance, setNativeBalance])

	const contracts = useMemo(
		() =>
			tokensRaw
				?.filter(({ native }) => !native)
				?.map(({ address }) => ({
					abi: erc20ABI,
					functionName: 'balanceOf',
					address: address as `0x${string}`,
					args: [walletAddress as `0x${string}`],
					// chainId
				})),
		[tokensRaw, walletAddress],
	)

	const { isLoading: isFetchingBalances } = useContractReads({
		contracts,
		watch: true,
		enabled: !!walletAddress && !!tokensRaw?.length,
		onSuccess(data) {
			const map = new Map()
			for (let index = 0; index < data.length; index++) {
				const item = data[index]
				map.set(contracts[index].address, item.result as bigint)
			}
			if (!!nativeTokenBalance) {
				map.set(ETH_L1_ADDRESS, nativeTokenBalance.value)
			}
			setErc20Balances(map)
		},
	})

	useEffect(() => {
		setTokensMap(tokens)
		//TODO: fetch tokens usd balance
	}, [tokens, setTokensMap])

	return { tokensMap, isFetchingBalances }
}
