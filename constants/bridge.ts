import {
	CHAIN_TYPE,
	IsScroll,
	IsZkSync,
	ScrollNetworks,
} from '@/constants/chain'
import { checksumAddress } from '@/lib/formatters'
import { EPortalNetwork } from '@/stores/portal'
import { ClaimTransaction, Transaction } from '@/stores/portal/bridge/tx'
import { ScrollToken } from '@/types/bridge'
import { EnumChainType } from '@/types/chain'

export const PORTAL_BRIDEG_CONTRACT = {
	MAINNET: {
		L1_DEPOSIT_BRIDGE: '0x375424756f4a5ada1CE1E0849ABDd19255b1729e',
		ZKSYNC_WITHDRAW_BRIDGE: '0xBDeE01e06Aa1d860d5D3a3BA2C3831D49462249c',
		SCROLL_WITHDRAW_BRIDGE: '0x375424756f4a5ada1CE1E0849ABDd19255b1729e',
	},
	TESTNET: {
		L1_DEPOSIT_BRIDGE: '0x35f4C882a0457d65f316DffCEC81dbde75B3F8De',
		ZKSYNC_WITHDRAW_BRIDGE: '0x2AAFec2cEF631d3090986a21c99b6A124E016AaB',
		// L1_DEPOSIT_BRIDGE: '0xA46D91DEe7Edc52467c5A8Da5ed9194B04C516eB', // FIEXME TO DELETE
		// ZKSYNC_WITHDRAW_BRIDGE: '0xA29bD815e009E4126A99238F140A69BbCb5ad315', // FIEXME TO DELETE
		SCROLL_WITHDRAW_BRIDGE: '0x131e97971ba1dcbd52e97edf7153f6e2666490b7',
	},
}

export const getPortalBridgeContract = (
	isMainnet: boolean,
	isDeposit: boolean,
) => {
	if (isMainnet) {
		return PORTAL_BRIDEG_CONTRACT.MAINNET[
			isDeposit
				? 'L1_DEPOSIT_BRIDGE'
				: IsZkSync
				  ? 'ZKSYNC_WITHDRAW_BRIDGE'
				  : 'SCROLL_WITHDRAW_BRIDGE'
		]
	} else {
		return PORTAL_BRIDEG_CONTRACT.TESTNET[
			isDeposit
				? 'L1_DEPOSIT_BRIDGE'
				: IsZkSync
				  ? 'ZKSYNC_WITHDRAW_BRIDGE'
				  : 'SCROLL_WITHDRAW_BRIDGE'
		]
	}
}

export const SCROLL_BRIDGE_CONTRACT = {
	MAINNET: {
		L1_SCROLL_MESSENGER: '0x6774Bcbd5ceCeF1336b5300fb5186a12DDD8b367',
		L1_STANDARD_ERC20_GATEWAY_PROXY_ADDR:
			'0xD8A791fE2bE73eb6E6cF1eb0cb3F36adC9B3F8f9',
		L1_GATEWAY_ROUTER_PROXY_ADDR: '0xF8B1378579659D8F7EE5f3C929c2f3E332E41Fd6',
		L1_GAS_PRICE_ORACLE: '0x5300000000000000000000000000000000000002',
		L1_ETH_GATEWAY_PROXY_ADDR: '0x7F2b8C31F88B6006c382775eea88297Ec1e3E905',
		L1_WETH_GATEWAY_PROXY_ADDR: '0x7AC440cAe8EB6328de4fA621163a792c1EA9D4fE',

		L2_GATEWAY_ROUTER_PROXY_ADDR: '0x4C0926FF5252A435FD19e10ED15e5a249Ba19d79',
		L2_ETH_GATEWAY_PROXY_ADDR: '0x6EA73e05AdC79974B931123675ea8F78FfdacDF0',
		L2_WETH_GATEWAY_PROXY_ADDR: '0x7003E7B7186f0E6601203b99F7B8DECBfA391cf9',
		L2_STANDARD_ERC20_GATEWAY_PROXY_ADDR:
			'0xE2b4795039517653c5Ae8C2A9BFdd783b48f447A',
		L2_SCROLL_MESSENGER: '0x781e90f1c8Fc4611c9b7497C3B47F99Ef6969CbC',
		L2_WETH_ADDRESS: '0x5300000000000000000000000000000000000004',
		L2_GAS_PRICE_ORACLE: '0x987e300fDfb06093859358522a79098848C33852',

		SCROLL_CHAIN: '0xa13BAF47339d63B743e7Da8741db5456DAc1E556',

		L1_CUSTOM_ERC20_GATEWAY_PROXY_ADDR:
			'0xb2b10a289A229415a124EFDeF310C10cb004B6ff',
		L1_USDC_GATEWAY_PROXY_ADDR: '0xf1AF3b23DE0A5Ca3CAb7261cb0061C0D779A5c7B',
		L1_DAI_GATEWAY_PROXY_ADDR: '0x67260A8B73C5B77B55c1805218A42A7A6F98F515',
		L1_LIDO_GATEWAY_PROXY_ADDR: '0x6625C6332c9F91F2D27c304E729B86db87A3f504',

		L2_CUSTOM_ERC20_GATEWAY_PROXY_ADDR:
			'0x64CCBE37c9A82D85A1F2E74649b7A42923067988',
		L2_USDC_GATEWAY_PROXY_ADDR: '0x33B60d5Dd260d453cAC3782b0bDC01ce84672142',
		L2_DAI_GATEWAY_PROXY_ADDR: '0xaC78dff3A87b5b534e366A93E785a0ce8fA6Cc62',
		L2_LIDO_GATEWAY_PROXY_ADDR: '0x8aE8f22226B9d789A36AC81474e633f8bE2856c9',
	},
	TESTNET: {
		L1_SCROLL_MESSENGER: '0x50c7d3e7f7c656493D1D76aaa1a836CedfCBB16A',
		L1_STANDARD_ERC20_GATEWAY_PROXY_ADDR:
			'0x65D123d6389b900d954677c26327bfc1C3e88A13',
		L1_GATEWAY_ROUTER_PROXY_ADDR: '0x13FBE0D0e5552b8c9c4AE9e2435F38f37355998a',
		L1_GAS_PRICE_ORACLE: '0x5300000000000000000000000000000000000002',
		L1_ETH_GATEWAY_PROXY_ADDR: '0x8A54A2347Da2562917304141ab67324615e9866d',
		L1_WETH_GATEWAY_PROXY_ADDR: '0x3dA0BF44814cfC678376b3311838272158211695',

		L2_GATEWAY_ROUTER_PROXY_ADDR: '0x9aD3c5617eCAa556d6E166787A97081907171230',
		L2_ETH_GATEWAY_PROXY_ADDR: '0x91e8ADDFe1358aCa5314c644312d38237fC1101C',
		L2_WETH_GATEWAY_PROXY_ADDR: '0x481B20A927206aF7A754dB8b904B052e2781ea27',
		L2_STANDARD_ERC20_GATEWAY_PROXY_ADDR:
			'0xaDcA915971A336EA2f5b567e662F5bd74AEf9582',
		L2_SCROLL_MESSENGER: '0xBa50f5340FB9F3Bd074bD638c9BE13eCB36E603d',
		L2_WETH_ADDRESS: '0x5300000000000000000000000000000000000004',
		L2_GAS_PRICE_ORACLE: '0x247969F4fad93a33d4826046bc3eAE0D36BdE548',

		SCROLL_CHAIN: '0x2D567EcE699Eabe5afCd141eDB7A4f2D0D6ce8a0',

		L1_CUSTOM_ERC20_GATEWAY_PROXY_ADDR:
			'0x31C994F2017E71b82fd4D8118F140c81215bbb37',
		L1_USDC_GATEWAY_PROXY_ADDR: '',
		L1_DAI_GATEWAY_PROXY_ADDR: '0x8b0B9c4e9f41b9bbDEfFee24F9f11C328093d248',
		L1_LIDO_GATEWAY_PROXY_ADDR: '',

		L2_CUSTOM_ERC20_GATEWAY_PROXY_ADDR:
			'0x058dec71E53079F9ED053F3a0bBca877F6f3eAcf',
		L2_USDC_GATEWAY_PROXY_ADDR: '',
		L2_DAI_GATEWAY_PROXY_ADDR: '0xbF28c28490988026Dca2396148DE50136A54534e',
		L2_LIDO_GATEWAY_PROXY_ADDR: '',
	},
}

export function getScrollBridgeContract(isMainnet: boolean) {
	const BRIDGE_API_URL = isMainnet
		? 'https://mainnet-api-bridge.scroll.io/api'
		: 'https://sepolia-api-bridge.scroll.io/api'

	const SCROLL_API = {
		tokenList: isMainnet
			? 'https://scroll-tech.github.io/token-list/scroll.tokenlist.json'
			: 'https://scroll-tech.github.io/token-list/scroll.tokenlist.json',
		txHashes: `${BRIDGE_API_URL}/txsbyhashes`,
		claimTxHashes: (walletAddress: string) =>
			`${BRIDGE_API_URL}/claimable?address=${walletAddress}&page=1&page_size=1000`,
	}

	return { SCROLL_API }
}

export function getZksyncBridgeContract(isMainnet: boolean) {
	const ZKSYNC_API = {
		l1ExplorerApi: isMainnet
			? 'https://api.etherscan.io/api?module=account&startblock=0&endblock=99999999&page=1&sort=asc'
			: 'https://api-goerli.etherscan.io/api?module=account&startblock=0&endblock=99999999&page=1&sort=asc',
		l2ExplorerApi: isMainnet
			? 'https://block-explorer-api.mainnet.zksync.io'
			: 'https://block-explorer-api.sepolia.zksync.dev',
		tokenList: isMainnet
			? 'https://block-explorer-api.mainnet.zksync.io/tokens?page=1&limit=100'
			: 'https://block-explorer-api.sepolia.zksync.dev/tokens?page=1&limit=100',
	}

	return { ZKSYNC_API }
}

export async function getScrollBridgeTokenList(
	isMainnet?: boolean,
): Promise<{ l1Tokens: ScrollToken[]; l2Tokens: ScrollToken[] }> {
	if (undefined === isMainnet)
		return Promise.resolve({ l1Tokens: [], l2Tokens: [] })

	try {
		const response = await fetch(
			getScrollBridgeContract(isMainnet).SCROLL_API.tokenList,
		)
		const { tokens = [] } = await response.json()

		const MAINNET_TOKEN_BLACK_LIST = ['']
		const l1Tokens: ScrollToken[] = []
		const l2Tokens: ScrollToken[] = []

		tokens?.forEach((token: any) => {
			const l2ChainId =
				ScrollNetworks[EPortalNetwork[isMainnet ? 'MAINNET' : 'TESTNET']].id
			if (
				(isMainnet &&
					ScrollNetworks[EPortalNetwork.MAINNET].id === token.chainId &&
					!MAINNET_TOKEN_BLACK_LIST.includes(token.symbol)) ||
				(!isMainnet &&
					ScrollNetworks[EPortalNetwork.TESTNET].id === token.chainId)
			) {
				token.l2ChainId = l2ChainId
				l2Tokens.push(token)
			}

			if (
				(isMainnet &&
					ScrollNetworks[EPortalNetwork.MAINNET].l1Network?.id ===
						token.chainId &&
					!MAINNET_TOKEN_BLACK_LIST.includes(token.symbol)) ||
				(!isMainnet &&
					ScrollNetworks[EPortalNetwork.TESTNET].l1Network?.id ===
						token.chainId)
			) {
				token.l2ChainId =
					ScrollNetworks[EPortalNetwork[isMainnet ? 'MAINNET' : 'TESTNET']].id
				token.address = checksumAddress(token.address as `0x${string}`)
				l1Tokens.push(token)
			}
		})

		return Promise.resolve({ l1Tokens, l2Tokens })
	} catch (error) {
		return Promise.reject(error)
	}
}

export async function getScrollBridgeTxHashes(
	txs: string[],
	isMainnet?: boolean,
): Promise<Transaction[]> {
	if (undefined === isMainnet) return Promise.resolve([])

	try {
		const txsArr = []
		let index = 0
		while (index < txs.length) {
			txsArr.push(txs.slice(index, index + 10))
			index += 10
		}

		const data: Transaction[] = await Promise.all(
			txsArr?.map((_txs) =>
				(async () => {
					const response = await fetch(
						getScrollBridgeContract(isMainnet).SCROLL_API.txHashes,
						{
							method: 'post',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ txs: _txs }),
						},
					)
					const { data } = await response.json()

					return Promise.resolve(data.result)
				})(),
			),
		)

		return Promise.resolve(data?.flat())
	} catch (error) {
		return Promise.reject(error)
	}
}

export async function getScrollBridgeClaimableTxHashes(
	walletAddress?: string,
	isMainnet?: boolean,
): Promise<ClaimTransaction[] | undefined> {
	if (undefined === isMainnet || !!!walletAddress)
		return Promise.resolve(undefined)

	try {
		const response = await fetch(
			getScrollBridgeContract(isMainnet).SCROLL_API.claimTxHashes(
				walletAddress,
			),
		)
		const { data } = await response.json()

		return Promise.resolve(data.result)
	} catch (error) {
		return Promise.reject(error)
	}
}

const isScrollMainnet = CHAIN_TYPE === EnumChainType.SCROLL
export const ScrollL2ETHGatewayProxy = isScrollMainnet
	? '0x6EA73e05AdC79974B931123675ea8F78FfdacDF0'
	: '0x91e8addfe1358aca5314c644312d38237fc1101c'
export const ScrollL2WETHGatewayProxy = isScrollMainnet
	? '0x7003E7B7186f0E6601203b99F7B8DECBfA391cf9'
	: '0x481B20A927206aF7A754dB8b904B052e2781ea27'
export const ScrollL2ERC20GatewayProxy = isScrollMainnet
	? '0xE2b4795039517653c5Ae8C2A9BFdd783b48f447A'
	: '0xaDcA915971A336EA2f5b567e662F5bd74AEf9582'
export const ScrollL2FinalizeDepositETHTopic =
	'0x9e86c356e14e24e26e3ce769bf8b87de38e0faa0ed0ca946fa09659aa606bd2d'
export const ScrollL2WithdrawETHTopic =
	'0xd8ed6eaa9a7a8980d7901e911fde6686810b989d3082182d1d3a3df6306ce20e'
export const ScrollL2ETHEventDataABIParameters = [
	{ name: 'amount', type: 'uint256' },
	{ name: 'data', type: 'bytes' },
]
export const ScrollL2FinalizeDepositERC20Topic =
	'0x165ba69f6ab40c50cade6f65431801e5f9c7d7830b7545391920db039133ba34'
export const ScrollL2WithdrawERC20Topic =
	'0xd8d3a3f4ab95694bef40475997598bcf8acd3ed9617a4c1013795429414c27e8'
export const ScrollL2ERC20BridgeEventDataABIParameters = [
	{ name: 'to', type: 'address' },
	{ name: 'amount', type: 'uint256' },
	{ name: 'data', type: 'bytes' },
]

// https://github.com/matter-labs/era-contracts/blob/a8429e8ec10cb43edef1b1e8bb9b4b480d09222d/zksync/contracts/bridge/interfaces/IL2Bridge.sol#L7
const isZksyncMainnet = CHAIN_TYPE === EnumChainType.ZKSYNC
export const ZkSyncL2ETHGatewayProxy =
	'0x000000000000000000000000000000000000800A'
export const ZkSyncL2ETHMintTopic =
	'0x0f6798a560793a54c3bcfe86a93cde1e73087d944c0ea20544137d4121396885'
export const ZkSyncL2ETHWithdrawalTopic =
	'0x2717ead6b9200dd235aad468c9809ea400fe33ac69b5bfaa6d3e90fc922b6398'
export const ZkSyncL2ERC20BridgeProxy = isZksyncMainnet
	? '0x11f943b2c77b743AB90f4A0Ae7d5A4e7FCA3E102'
	: '0x681A1AFdC2e06776816386500D2D461a6C96cB45'
export const ZkSyncL2ERC20FinalizeDepositTopic =
	'0xb84fba9af218da60d299dc177abd5805e7ac541d2673cbee7808c10017874f63'
export const ZkSyncL2ERC20WithdrawalInitiatedTopic =
	'0x2fc3848834aac8e883a2d2a17a7514dc4f2d3dd268089df9b9f5d918259ef3b0'
export const ZkSyncL2ETHEventDataABIParameters = [
	{ name: 'amount', type: 'uint256' },
]
export const ZkSyncL2BridgeETHTransferTopic =
	'0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
