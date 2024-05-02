import { useEffect, useState } from 'react'

import { zkSyncTestnet } from 'viem/chains'

import { ETH_ICON_URL, IsScroll, IsZkSync } from '@/constants'
import { ETH_L1_ADDRESS } from '@/constants/address'
import { getScrollBridgeTokenList } from '@/constants/bridge'
import { EraNetworks, ScrollNetworks, _zkSync } from '@/constants/chain'
import usePortalContext from '@/hooks/portal/use-portal-context'
import { getTokensByNetworkId } from '@/lib/zksync'
import { EPortalNetwork, usePortalStore } from '@/stores/portal'
import { useBridgeNetworkStore } from '@/stores/portal/bridge/network'
import { Token } from '@/types/bridge'

export function useBridgeTokens() {
	const { isMainnet } = usePortalStore()
	const { currentChainId } = usePortalContext()
	const { isCorrectNetworkSet } = useBridgeNetworkStore()

	// we use same token list in l1 and l2

	const [tokens, setTokens] = useState<Token[]>([]) // Initial state is an empty array

	useEffect(() => {
		const fetchTokens = async () => {
			// if (!!!currentChainId || !isCorrectNetworkSet || undefined === isMainnet) return
			if (!!!currentChainId || undefined === isMainnet) return // fix bug: erc20 token symbol displays eth

			if (IsScroll) {
				try {
					const { l1Tokens, l2Tokens } =
						await getScrollBridgeTokenList(isMainnet)

					setTokens([
						{
							address: ETH_L1_ADDRESS,
							name: 'ETH',
							symbol: 'ETH',
							decimals: 18,
							iconUrl: ETH_ICON_URL,
							l1Address: ETH_L1_ADDRESS,
							l2Address: ETH_L1_ADDRESS,
							native: true,
							l2ChainId: isMainnet
								? ScrollNetworks[EPortalNetwork.MAINNET].id
								: ScrollNetworks[EPortalNetwork.TESTNET].id,
						},
						...l1Tokens?.map(
							({
								address: l1Address,
								decimals,
								logoURI,
								name,
								symbol,
								l2ChainId,
							}) => {
								const isL2 = [
									ScrollNetworks[EPortalNetwork.MAINNET].id,
									ScrollNetworks[EPortalNetwork.TESTNET].id,
								].includes(currentChainId)

								const l2Address = l2Tokens?.filter(
									(l2Token) => l2Token.symbol === symbol,
								)?.[0]?.address

								return {
									address: isL2 ? l2Address : l1Address,
									name,
									symbol,
									decimals,
									iconUrl: logoURI,
									l1Address,
									l2Address,
									l2ChainId,
								}
							},
						),
					])
				} catch (error) {
					console.error(error)
					// handle error
				}
			}

			if (IsZkSync) {
				try {
					const newTokens = await getTokensByNetworkId(currentChainId, true)
					//TODO: only add wstETH for zksync mainnet
					const isL1 = ![
						EraNetworks[EPortalNetwork.MAINNET].id,
						EraNetworks[EPortalNetwork.TESTNET].id,
					].includes(currentChainId)
					const wstETH = {
						mainnet: {
							l1: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
							l2: '0xCafB42a2654C20cb3739F04243E925aa47302bec',
						},
						testnet: {
							l1: '0x6320cd32aa674d2898a68ec82e869385fc5f7e2f',
							l2: '0xDd982954B70AEAdBCB9766b1f2218Aa9b3939e53',
						}, // goerli
					}
					if (isMainnet) {
						//  only add wstETH for zksync mainnet. Add to the 4th place to show in the first page of token list
						const wstETHtoken = {
							address: isL1
								? wstETH[isMainnet ? 'mainnet' : 'testnet'].l1
								: wstETH[isMainnet ? 'mainnet' : 'testnet'].l2,
							l1Address: wstETH[isMainnet ? 'mainnet' : 'testnet'].l1,
							l2Address: wstETH[isMainnet ? 'mainnet' : 'testnet'].l2,
							symbol: 'wstETH',
							name: 'wstETH',
							decimals: 18,
							iconUrl:
								'https://tokens.1inch.io/0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0.png',
							enabledForFees: false,
							usdPrice: undefined,
							native: false,
							l2ChainId: isMainnet ? _zkSync.id : zkSyncTestnet.id,
						}
						setTokens([
							...newTokens.slice(0, 3),
							wstETHtoken,
							...newTokens.slice(3),
						])
					} else {
						setTokens(newTokens)
					}
				} catch (error) {
					console.error(error)
					// handle error
				}
			}
		}

		fetchTokens()
	}, [currentChainId, isCorrectNetworkSet, isMainnet])

	return tokens
}
