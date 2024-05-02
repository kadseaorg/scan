import { ETH_L1_ADDRESS, ETH_ZKSYNC_L2_ADDRESS } from '@/constants/address'
import { getZksyncBridgeContract } from '@/constants/bridge'
import { EraNetworks } from '@/constants/chain'
import { checksumAddress } from '@/lib/formatters'
import { EPortalNetwork } from '@/stores/portal'
import { Token, ZksyncToken } from '@/types/bridge'

// the USDC item is in the 3th page of list, so we can directly hardcode it.
const STABLE_TOKEN_ITEMS = [
	{
		l2Address: '0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4',
		l1Address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
		symbol: 'USDC',
		name: 'USD Coin',
		decimals: 6,
		usdPrice: 1,
		liquidity: 0,
		iconURL:
			'https://assets.coingecko.com/coins/images/35262/large/USDC_Icon.png?1708008941',
	},
	{
		l2Address: '0x493257fD37EDB34451f62EDf8D2a0C418852bA4C',
		l1Address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
		symbol: 'USDT',
		name: 'Tether USD',
		decimals: 6,
		usdPrice: 1.021,
		liquidity: 0,
		iconURL:
			'https://assets.coingecko.com/coins/images/35001/large/logo.png?1706959346',
	},
]

export async function getTokenCollection(
	isMainnet: boolean,
	chainId: number,
): Promise<any[]> {
	const response = await fetch(
		getZksyncBridgeContract(isMainnet).ZKSYNC_API.tokenList,
	)
	const { items }: { items: ZksyncToken[] } = await response.json()
	return items
		.filter(
			({ symbol, l2Address, decimals }) =>
				!!symbol && !!l2Address && !!decimals,
		)
		.map(
			({
				decimals,
				iconURL,
				l1Address,
				l2Address,
				name,
				symbol,
				usdPrice,
			}: ZksyncToken) => ({
				name,
				symbol,
				l1Address,
				l2Address,
				decimals,
				iconURL,
				usdPrice,
				chainId,
			}),
		)
}

export const getTokensByNetworkId = async (
	networkId: number,
	isBridge: boolean,
): Promise<Token[]> => {
	const isL1 = ![
		EraNetworks[EPortalNetwork.MAINNET].id,
		EraNetworks[EPortalNetwork.TESTNET].id,
	].includes(networkId)

	let fetchNetworkId = networkId
	const isL2Mainnet =
		!isL1 && networkId === EraNetworks[EPortalNetwork.MAINNET].id
	if (networkId === EraNetworks[EPortalNetwork.MAINNET]?.l1Network?.id) {
		fetchNetworkId = EraNetworks[EPortalNetwork.MAINNET].id
	}
	if (networkId === EraNetworks[EPortalNetwork.TESTNET]?.l1Network?.id) {
		fetchNetworkId = EraNetworks[EPortalNetwork.TESTNET].id
	}

	if (![270, 324, 280, 300].includes(fetchNetworkId))
		throw new Error(`Network id ${fetchNetworkId} is not supported`)

	const tokens = await getTokenCollection(
		fetchNetworkId === EraNetworks[EPortalNetwork.MAINNET].id,
		fetchNetworkId,
	)

	if (isL2Mainnet) {
		tokens.unshift(...STABLE_TOKEN_ITEMS)
	}
	const filterTokens = tokens.filter(
		({ symbol, l1Address, l2Address, decimals }) =>
			!!symbol && (isBridge ? !!l1Address : true) && !!l2Address && !!decimals,
	)

	return filterTokens.map((token) => {
		const l2Address =
			token.l2Address === ETH_L1_ADDRESS
				? ETH_ZKSYNC_L2_ADDRESS
				: checksumAddress(token.l2Address)
		const address = isL1 ? checksumAddress(token.l1Address) : l2Address

		return {
			address,
			l1Address: token.l1Address,
			l2Address,
			symbol: token.symbol,
			name: token.name,
			decimals: token.decimals,
			iconUrl: token.iconURL,
			enabledForFees: l2Address === ETH_ZKSYNC_L2_ADDRESS,
			usdPrice: token.usdPrice,
			native: [ETH_L1_ADDRESS, ETH_ZKSYNC_L2_ADDRESS].includes(address),
			l2ChainId: token.chainId,
		}
	})
}
