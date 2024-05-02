import { useCallback, useEffect, useMemo, useState } from 'react'

import {
	arbitrum,
	arbitrumSepolia,
	scroll,
	scrollSepolia,
	zkSync,
	zkSyncSepoliaTestnet,
} from '@wagmi/core/chains'
import BigNumber from 'bignumber.js'
import { erc20ABI, useBalance, useContractReads } from 'wagmi'

import {
	ETH_ICON_URL,
	IsArbitrum,
	IsBsquaredTestnet,
	IsKadsea,
	IsOKX1,
	IsScroll,
	IsZkSync,
	bsquaredTestnet,
	kadsea,
	x1Testnet,
} from '@/constants'
import { ETH_L1_ADDRESS, ETH_ZKSYNC_L2_ADDRESS } from '@/constants/address'
import { getScrollBridgeTokenList } from '@/constants/bridge'
import useUsdExchangeRates from '@/hooks/common/use-usd-exchange-rates'
import usePortalContext from '@/hooks/portal/use-portal-context'
import { getTokensByNetworkId } from '@/lib/zksync'
import { usePortalStore } from '@/stores/portal'
import { usePortalWalletStore } from '@/stores/portal/wallet'

import mantaConfig from './manta-config'
import { useRouter } from 'next/router'
let timerGetPrice: any = null
const fetching = false
export default function useWalletTokenList(initFetchData = false) {
	const { isMainnet } = usePortalStore()
	const { walletAddress } = usePortalContext()
	const router = useRouter()
	const {
		addToken,
		tokenList,
		tokenUsdBalanceMap,
		setTokenList,
		setErc20Balances,
		setNativeBalance,
		setTokenUsdBalanceMap,
	} = usePortalWalletStore()
	const {
		isFetching: isFetchingUsdRates,
		usdExchangeRates,
		convertToUsdPrice,
		refreshPrice,
	} = useUsdExchangeRates(IsScroll)

	useEffect(() => {
		if (!usdExchangeRates && refreshPrice) {
			if (timerGetPrice) {
				clearTimeout(timerGetPrice)
			}
			timerGetPrice = setTimeout(() => {
				refreshPrice && refreshPrice()
			}, 500)
		}
		return () => {
			if (timerGetPrice) {
				clearTimeout(timerGetPrice)
			}
		}
	}, [usdExchangeRates, refreshPrice])

	const chainId = useMemo(() => {
		if (isMainnet) {
			if (IsScroll) {
				return scroll.id
			}
			if (IsBsquaredTestnet) {
				return bsquaredTestnet.id
			}
			if (IsArbitrum) {
				return arbitrum.id
			}
			if (IsZkSync) {
				return zkSync.id
			}
			if (IsKadsea) {
				return kadsea.id
			}
		} else {
			if (IsScroll) {
				return scrollSepolia.id
			}
			if (IsBsquaredTestnet) {
				return bsquaredTestnet.id
			}
			if (IsArbitrum) {
				return arbitrumSepolia.id
			}
			if (IsZkSync) {
				return zkSyncSepoliaTestnet.id
			}
			if (IsOKX1) {
				return x1Testnet.id
			}
		}
	}, [isMainnet])

	useEffect(() => {
		if (initFetchData && !!tokenList?.length) {
			const _tokenUsdBalanceMap = new Map()
			tokenList.forEach(({ address, formatedBalance, symbol, usdPrice }) => {
				if (formatedBalance === undefined) {
					return
				}
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
				if (IsKadsea) {
					usdBalance = convertToUsdPrice(formatedBalance, {
						showPreffix: false,
						symbol,
					})
				}
				_tokenUsdBalanceMap.set(address, usdBalance)
			})

			setTokenUsdBalanceMap(_tokenUsdBalanceMap)
		}
	}, [initFetchData, tokenList, usdExchangeRates])

	const { data: nativeTokenBalance } = useBalance({
		watch: true,
		enabled: !!walletAddress && undefined !== isMainnet,
		address: walletAddress as `0x${string}`,
		chainId,
		token: undefined,
	})

	useEffect(() => {
		if (initFetchData && !!tokenList?.length && !!nativeTokenBalance) {
			setNativeBalance(nativeTokenBalance.value)
		}
	}, [initFetchData, tokenList, nativeTokenBalance])

	const contracts = useMemo(
		() =>
			tokenList
				?.filter(({ native }) => !native)
				?.map(({ address }) => ({
					abi: erc20ABI,
					functionName: 'balanceOf',
					address: address as `0x${string}`,
					args: [walletAddress as `0x${string}`],
					chainId,
				})),
		[tokenList, walletAddress],
	)

	const { isLoading: isFetchingBalances } = useContractReads({
		contracts,
		watch: true,
		enabled:
			initFetchData &&
			undefined !== isMainnet &&
			!!walletAddress &&
			!!tokenList?.length,
		onSuccess(data) {
			setErc20Balances(data?.map(({ result }) => result as bigint))
		},
	})

	const [isFetchingTokenList, setIsFetchingTokenList] = useState(false)

	const fetchScrollTokenList = useCallback(async () => {
		try {
			if (undefined === isMainnet || fetching || !!!walletAddress) return

			setIsFetchingTokenList(true)
			const { l2Tokens } = await getScrollBridgeTokenList(isMainnet)
			setTokenList(chainId, walletAddress, [
				{
					logo: ETH_ICON_URL,
					name: 'ETH',
					symbol: 'ETH',
					decimals: 18,
					address: ETH_L1_ADDRESS,
					native: true,
					chainId: isMainnet ? scroll.id : scrollSepolia.id,
				},
				...l2Tokens.map(
					({
						logoURI,
						name,
						symbol,
						decimals,
						address,
						l2ChainId: chainId,
					}) => ({
						logo: logoURI,
						name,
						symbol,
						decimals,
						address,
						chainId,
					}),
				),
			])
		} catch (error) {
			console.error(error)
		} finally {
			setIsFetchingTokenList(false)
		}
	}, [isMainnet, setTokenList, walletAddress])

	const fetchZksyncTokenList = useCallback(async () => {
		try {
			if (undefined === isMainnet || fetching || !walletAddress) return

			setIsFetchingTokenList(true)
			const _chainId = isMainnet ? zkSync.id : zkSyncSepoliaTestnet.id
			const tokens = await getTokensByNetworkId(_chainId, false)
			setTokenList(chainId, walletAddress, [
				{
					logo: ETH_ICON_URL,
					name: 'ETH',
					symbol: 'ETH',
					decimals: 18,
					address: ETH_ZKSYNC_L2_ADDRESS,
					native: true,
					chainId: _chainId,
					usdPrice: tokens.find(({ address }) =>
						[ETH_L1_ADDRESS, ETH_ZKSYNC_L2_ADDRESS].includes(address),
					)?.usdPrice,
				},
				...tokens
					?.filter(({ native }) => !native)
					?.map(
						({
							iconUrl,
							name,
							symbol,
							decimals,
							l2Address,
							l2ChainId: chainId,
							usdPrice,
						}) => ({
							logo: iconUrl,
							name,
							symbol,
							decimals,
							address: l2Address,
							chainId,
							usdPrice,
						}),
					),
			])
		} catch (error) {
			console.error(error)
		} finally {
			setIsFetchingTokenList(false)
		}
	}, [isMainnet, setTokenList, walletAddress])

	const fetchMantaTokenList = useCallback(() => {
		if (fetching || !!!walletAddress) return

		const tokens = isMainnet
			? mantaConfig.mainnet.config.tokens
			: mantaConfig.testnet.config.tokens
		const tokenList = tokens.map((token) => ({
			logo: token.l2.logoURI,
			name: token.tokenName,
			symbol: token.l2.symbol,
			decimals: token.decimals,
			address: token.l2.address,
			chainId: chainId,
			native: token.isNative,
		}))
		setTokenList(chainId, walletAddress, tokenList)
	}, [isMainnet, setTokenList, walletAddress, chainId])

	const fetchBsquaredTokenList = useCallback(() => {
		if (fetching || !!!walletAddress) return
		const tokenList = [
			{
				logo: 'https://macpfqqqcqgephesrhdq.supabase.co/storage/v1/object/sign/tokens/btc.svg?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJ0b2tlbnMvYnRjLnN2ZyIsImlhdCI6MTcwOTY2ODYzOSwiZXhwIjoxNzQxMjA0NjM5fQ.7cRQLJogGVHg6Pe25XoRqsX91evGID9dz-ROxSXbmFQ&t=2024-03-05T19%3A57%3A19.397Z',
				name: 'tBTC',
				symbol: 'tBTC',
				decimals: 18,
				address: ETH_L1_ADDRESS,
				chainId: bsquaredTestnet.id,
				native: true,
			},
			{
				logo: 'https://scroll-tech.github.io/token-list/data/USDC/logo.svg',
				name: 'USDC Test token',
				symbol: 'USDC',
				decimals: 18,
				address: '0x6125Bd1B49822EA3a052D2eDBD7ceb965f5C3eDD',
				chainId: bsquaredTestnet.id,
				native: false,
			},
		]
		setTokenList(chainId, walletAddress, tokenList)
	}, [isMainnet, setTokenList, walletAddress, chainId])

	const fetchKadseaTokenList = useCallback(() => {
		if (fetching || !!!walletAddress) return
		const tokenList = [
			{
				logo: 'https://macpfqqqcqgephesrhdq.supabase.co/storage/v1/object/sign/tokens/btc.svg?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJ0b2tlbnMvYnRjLnN2ZyIsImlhdCI6MTcwOTY2ODYzOSwiZXhwIjoxNzQxMjA0NjM5fQ.7cRQLJogGVHg6Pe25XoRqsX91evGID9dz-ROxSXbmFQ&t=2024-03-05T19%3A57%3A19.397Z',
				name: 'KAD',
				symbol: 'KAD',
				decimals: 18,
				address: ETH_L1_ADDRESS,
				chainId: kadsea.id,
				native: true,
			},
		]
		setTokenList(chainId, walletAddress, tokenList)
	}, [isMainnet, setTokenList, walletAddress, chainId])

	const fetchArbitrumTokenList = useCallback(() => {
		if (fetching || !!!walletAddress) return
		const tokenList = [
			{
				logo: ETH_ICON_URL,
				name: 'ETH',
				symbol: 'ETH',
				decimals: 18,
				address: ETH_L1_ADDRESS,
				chainId: arbitrum.id,
				native: true,
			},
			{
				logo: 'https://arbitrum.foundation/logo.png',
				name: 'Arbitrum',
				symbol: 'ARB',
				decimals: 18,
				address: '0x912CE59144191C1204E64559FE8253a0e49E6548',
				chainId: arbitrum.id,
				native: false,
			},
		]
		setTokenList(chainId, walletAddress, tokenList)
	}, [isMainnet, setTokenList, walletAddress, chainId])

	const fetchX1TokenList = useCallback(() => {
		// refer from https://www.okx.com/cn/x1/docs/developer/build-on-x1/bridge-to-x1
		const tokenList = [
			{
				logo: 'https://static.okx.com/cdn/wallet/logo/okb.png',
				name: 'OKB',
				symbol: 'OKB',
				decimals: 18,
				address: '0x3F4B6664338F23d2397c953f2AB4Ce8031663f80',
				chainId: x1Testnet.id,
				native: true,
			},
			{
				logo: ETH_ICON_URL,
				name: 'WETH',
				symbol: 'WETH',
				decimals: 18,
				address: '0xBec7859BC3d0603BeC454F7194173E36BF2Aa5C8',
				chainId: x1Testnet.id,
				native: false,
			},
		]
		// TODO: other ERC20 token
		// DAI USDC, USDT, WBTC
		setTokenList(chainId, walletAddress, tokenList)
	}, [])

	useEffect(() => {
		initFetchData && IsScroll && fetchScrollTokenList()
		initFetchData && IsZkSync && fetchZksyncTokenList()
		// initFetchData && IsManta && fetchMantaTokenList();
		initFetchData && IsBsquaredTestnet && fetchBsquaredTokenList()
		initFetchData && IsKadsea && fetchKadseaTokenList()
		initFetchData && IsArbitrum && fetchArbitrumTokenList()
		initFetchData && IsOKX1 && fetchX1TokenList()
	}, [initFetchData, isMainnet, walletAddress])

	return {
		addToken,
		tokenList,
		tokenUsdBalanceMap,
		isFetchingTokenList,
		isFetchingBalances,
		isFetchingUsdRates,
		chainId,
	}
}
