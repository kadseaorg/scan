import { Chain, defineChain, toHex } from 'viem'
import {
	arbitrum,
	base,
	goerli,
	linea,
	mainnet,
	manta,
	mantaTestnet,
	scroll,
	scrollSepolia,
	sepolia,
	zkSync,
	zkSyncSepoliaTestnet,
	zkSyncTestnet,
} from 'viem/chains'

import { EPortalNetwork } from '@/stores/portal'
import { BridgeNetworks } from '@/types/bridge'

import { EnumChainType, IChainItem } from '../types/chain'

export const CHAIN_TYPE = process.env.NEXT_PUBLIC_CHAIN as EnumChainType
export const IsScroll = [
	EnumChainType.SCROLL,
	EnumChainType.SCROLL_SEPOLIA,
].includes(CHAIN_TYPE)
export const IsZkSync = [
	EnumChainType.ZKSYNC,
	EnumChainType.ZKSYNC_SEPOLIA,
	EnumChainType.ZKSYNC_TESTNET,
	//
].includes(CHAIN_TYPE)
export const Is_Mainnet = [
	EnumChainType.SCROLL,
	EnumChainType.ZKSYNC,
	EnumChainType.LINEA,
	EnumChainType.BASE,
	EnumChainType.ARB,
].includes(CHAIN_TYPE)
export const IsManta = [
	EnumChainType.MANTA,
	EnumChainType.MANTA_TESTNET,
].includes(CHAIN_TYPE)
export const IsBsquaredTestnet = [EnumChainType.BSQUARED_TESTNET].includes(
	CHAIN_TYPE,
)
export const IsArbitrum = [EnumChainType.ARB].includes(CHAIN_TYPE)
export const IsOKX1 = [EnumChainType.OKX1_TESTNET].includes(CHAIN_TYPE)
export const IsKadsea = [
	EnumChainType.KADSEA,
	EnumChainType.KADSEA_TESTNET,
].includes(CHAIN_TYPE)

/**
 * wether the explorer can allows user use bridge in Portal.
 */
export const IsChainSupportBridge = [
	EnumChainType.SCROLL_SEPOLIA,
	EnumChainType.ZKSYNC,
	EnumChainType.ZKSYNC_SEPOLIA,
].includes(CHAIN_TYPE)

export const bsquaredTestnet = /*#__PURE__*/ defineChain({
	id: 1123,
	name: 'B² Testnet',
	network: 'bsquared-testnet',
	nativeCurrency: {
		decimals: 18,
		name: 'tBTC',
		symbol: 'tBTC',
	},
	rpcUrls: {
		default: { http: ['https://habitat-rpc.bsquared.network/'] },
		public: { http: ['https://habitat-rpc.bsquared.network/'] },
	},
	blockExplorers: {
		default: {
			name: 'B² Testnet L2scan Explorer',
			url: 'https://bsquared-testnet.l2scan.co/',
		},
	},
	// contracts: {
	//   multicall3: {
	//     address: '0x211B1643b95Fe76f11eD8880EE810ABD9A4cf56C',
	//     blockCreated: 419915,
	//   },
	// },
	testnet: true,
})
export const _scroll = {
	...scroll,
	...{
		blockExplorers: {
			default: {
				name: 'Scroll',
				url: 'https://scroll.l2scan.co/',
			},
		},
	},
}

export const _scrollSepolia = {
	...scrollSepolia,
	...{
		blockExplorers: {
			default: {
				name: 'Scroll Sepolia',
				url: 'https://scroll-sepolia.l2scan.co/',
			},
		},
	},
}

export const _zkSync = {
	...zkSync,
	...{
		blockExplorers: {
			default: {
				name: 'zkSync Era',
				url: 'https://zksync-era.l2scan.co/',
			},
		},
	},
}

// export const _zkSyncTestnet = {
// FIXME:TO DELETE
//   ...zkSyncTestnet,
//   ...{
//     blockExplorers: {
//       default: {
//         name: 'zkSync Era Testnet',
//         url: 'https://zksync-testnet.l2scan.co/'
//       }
//     }
//   }
// }

export const _zkSyncTestnet = {
	...zkSyncSepoliaTestnet,
	...{
		blockExplorers: {
			default: {
				name: 'zkSync Era Testnet',
				url: 'https://zksync-era-sepolia.l2scan.co/',
			},
		},
	},
}

export const oroTestnet = defineChain({
	id: 42069,
	network: 'oroTestnet',
	name: 'Oro Testnet',
	nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
	rpcUrls: {
		default: {
			http: ['http://ec2-54-159-125-156.compute-1.amazonaws.com:8545'],
		},
		public: {
			http: ['http://ec2-54-159-125-156.compute-1.amazonaws.com:8545'],
		},
	},
	blockExplorers: {
		blockscout: {
			name: 'Basescout',
			url: 'https://base.blockscout.com',
		},
		default: {
			name: 'Basescan',
			url: 'https://basescan.org',
		},
		etherscan: {
			name: 'Basescan',
			url: 'https://basescan.org',
		},
	},
	contracts: {
		multicall3: {
			address: '0xca11bde05977b3631167028862be2a173976ca11',
			blockCreated: 5022,
		},
	},
})

// https://github.com/wevm/viem/pull/1768
export const x1Testnet = /*#__PURE__*/ defineChain({
	id: 195,
	name: 'X1 Testnet',
	nativeCurrency: {
		decimals: 18,
		name: 'OKB',
		symbol: 'OKB',
	},
	rpcUrls: {
		default: { http: ['https://x1testrpc.okx.com'] },
		public: { http: ['https://x1testrpc.okx.com'] },
	},
	network: 'okx1-testnet',
	blockExplorers: {
		default: {
			name: 'OKLink',
			url: 'https://www.oklink.com/x1-test',
		},
	},
	contracts: {
		multicall3: {
			address: '0xca11bde05977b3631167028862be2a173976ca11',
			blockCreated: 624344,
		},
	},
	testnet: true,
})
export const kadsea = /*#__PURE__*/ defineChain({
	id: 878,
	// id: 56,
	// izumi test
	name: 'Kadsea',
	network: 'kadsea',
	nativeCurrency: {
		decimals: 18,
		name: 'KAD',
		symbol: 'KAD',
	},
	rpcUrls: {
		default: { http: ['https://rpchttp.kadsea.org'] },
		public: { http: ['https://rpchttp.kadsea.org'] },
	},
	blockExplorers: {
		default: {
			name: 'KAD SEA  Explorer',
			url: 'https://kadscan.kadsea.org/',
		},
	},
	// contracts: {
	//   multicall3: {
	//     address: '0x211B1643b95Fe76f11eD8880EE810ABD9A4cf56C',
	//     blockCreated: 419915,
	//   },
	// },
	testnet: false,
})

export const kadseaTestnet = /*#__PURE__*/ defineChain({
	id: 879,
	name: 'Kadsea Testnet',
	network: 'kadsea-testnet',
	nativeCurrency: {
		decimals: 18,
		name: 'KAD',
		symbol: 'KAD',
	},
	rpcUrls: {
		default: { http: ['https://rpchttp.kadsea.ink'] },
		public: { http: ['https://rpchttp.kadsea.ink'] },
	},
	blockExplorers: {
		default: {
			name: 'KAD SEA Test  Explorer',
			url: 'https://kadscan.kadsea.ink/',
		},
	},
	// contracts: {
	//   multicall3: {
	//     address: '0x211B1643b95Fe76f11eD8880EE810ABD9A4cf56C',
	//     blockCreated: 419915,
	//   },
	// },
	testnet: true,
})

export const DEFAULT_CHAIN_MAP = {
	[EnumChainType.ARB]: arbitrum,
	[EnumChainType.BASE]: base,
	[EnumChainType.BSQUARED_TESTNET]: bsquaredTestnet,
	[EnumChainType.KADSEA]: kadsea,
	[EnumChainType.KADSEA_TESTNET]: kadseaTestnet,
	[EnumChainType.OKX1_TESTNET]: x1Testnet,
	[EnumChainType.ORO_TESTNET]: oroTestnet,
	[EnumChainType.SCROLL]: _scroll,
	[EnumChainType.SCROLL_SEPOLIA]: _scrollSepolia,
	[EnumChainType.ZKSYNC]: _zkSync,
	[EnumChainType.ZKSYNC_TESTNET]: _zkSyncTestnet,
	[EnumChainType.ZKSYNC_SEPOLIA]: zkSyncSepoliaTestnet,
} as unknown as Record<EnumChainType, Chain>

export const CHAIN_MAP: Record<EnumChainType, IChainItem> = {
	[EnumChainType.SCROLL]: {
		url: 'https://scroll.io/',
		title: 'Scroll',
		l1Title: 'Ethereum',
		logo: '/svgs/logo/scroll.svg',
		nativeCurrency: scroll.nativeCurrency,
		description:
			'Scroll is a zkEVM-based zkRollup on Ethereum that enables native compatibility for existing Ethereum applications and tools.',
		chainType: EnumChainType.SCROLL,
		network: {
			chainId: toHex(scroll.id),
			chainType: 'Scroll',
		},
		networkSwitchers: [
			{
				name: 'Mainnet',
				explorerUrl: 'https://scroll.l2scan.co',
			},
			{
				name: 'Sepolia Testnet',
				explorerUrl: 'https://scroll-sepolia.l2scan.co',
			},
		],
		blockExplorerUrl: 'https://scroll.l2scan.co',
		rpcUrl: scroll.rpcUrls.default.http[0],
		viemChain: scroll,
		l1ExplorerUrl: 'https://etherscan.io',
		bridgeContract: [
			'0x4C0926FF5252A435FD19e10ED15e5a249Ba19d79',
			'0x781e90f1c8Fc4611c9b7497C3B47F99Ef6969CbC',
			'0x6EA73e05AdC79974B931123675ea8F78FfdacDF0',
			'0x7003E7B7186f0E6601203b99F7B8DECBfA391cf9',
			'0xE2b4795039517653c5Ae8C2A9BFdd783b48f447A',
			'0x64CCBE37c9A82D85A1F2E74649b7A42923067988',
			'0x7bC08E1c04fb41d75F1410363F0c5746Eae80582',
			'0x62597Cc19703aF10B58feF87B0d5D29eFE263bcc',
		], // https://docs.scroll.io/en/developers/scroll-contracts/
		bridgeDepositMethodId: '0xd0e30db0', // deposit()
	},
	[EnumChainType.SCROLL_SEPOLIA]: {
		url: 'https://scroll.io/',
		title: 'Scroll Sepolia',
		l1Title: 'Sepolia',
		logo: '/svgs/logo/scroll.svg',
		description:
			'Scroll is a zkEVM-based zkRollup on Ethereum that enables native compatibility for existing Ethereum applications and tools.',
		chainType: EnumChainType.SCROLL_SEPOLIA,
		nativeCurrency: scrollSepolia.nativeCurrency,
		network: {
			chainId: toHex(scrollSepolia.id),
			chainType: 'Scroll Sepolia',
		},
		networkSwitchers: [
			{
				name: 'Sepolia Testnet',
				explorerUrl: 'https://scroll-sepolia.l2scan.co',
			},
			{
				name: 'Mainnet',
				explorerUrl: 'https://scroll.l2scan.co',
			},
		],
		blockExplorerUrl: 'https://scroll-sepolia.l2scan.co',
		rpcUrl: scrollSepolia.rpcUrls.default.http[0],
		l1ExplorerUrl: 'https://sepolia.etherscan.io',
		bridgeContract: [
			'0x9aD3c5617eCAa556d6E166787A97081907171230',
			'0xBa50f5340FB9F3Bd074bD638c9BE13eCB36E603d',
			'0x91e8ADDFe1358aCa5314c644312d38237fC1101C',
			'0x481B20A927206aF7A754dB8b904B052e2781ea27',
			'0xaDcA915971A336EA2f5b567e662F5bd74AEf9582',
			'0x058dec71E53079F9ED053F3a0bBca877F6f3eAcf',
			'0x179B9415194B67DC3c0b8760E075cD4415785c97',
			'0xe17C9b9C66FAF07753cdB04316D09f52144612A5',
		], // https://docs.scroll.io/en/developers/scroll-contracts/#scroll-sepolia-contracts
		bridgeDepositMethodId: '0xd0e30db0', // deposit()
	},
	[EnumChainType.ZKSYNC]: {
		url: 'https://zksync.io',
		title: 'zkSync Era',
		l1Title: 'Ethereum',
		logo: '/svgs/logo/zksync-era.svg',
		description:
			'zkSync Era is a Layer-2 protocol that scales Ethereum with cutting-edge ZK tech.',
		chainType: EnumChainType.ZKSYNC,
		nativeCurrency: zkSync.nativeCurrency,
		darkOnly: true,
		network: {
			chainId: toHex(zkSync.id),
			chainType: 'zkSync Era',
		},
		networkSwitchers: [
			{
				name: 'Mainnet',
				explorerUrl: 'https://zksync-era.l2scan.co',
			},
			{
				name: 'Sepolia Testnet',
				explorerUrl: 'https://zksync-era-sepolia.l2scan.co',
			},
		],
		blockExplorerUrl: 'https://zksync-era.l2scan.co',
		rpcUrl: 'https://mainnet.era.zksync.io',
		l1ExplorerUrl: 'https://etherscan.io',
		bridgeContract: [
			'0x11f943b2c77b743AB90f4A0Ae7d5A4e7FCA3E102',
			'0x57891966931Eb4Bb6FB81430E6cE0A03AAbDe063',
		], // ETH/ERC20 Gateway
		bridgeDepositMethodId: '0xcfe7af7c', // finalizeDeposit()
		externalExplorers: [
			{
				name: 'Blockscout',
				url: 'https://zksync.blockscout.com',
			},
		],
	},
	[EnumChainType.ZKSYNC_TESTNET]: {
		url: 'https://zksync.io',
		title: 'zkSync Era Testnet',
		l1Title: 'Goerli',
		logo: '/svgs/logo/zksync-era.svg',
		description:
			'zkSync Era is a Layer-2 protocol that scales Ethereum with cutting-edge ZK tech.',
		chainType: EnumChainType.ZKSYNC_TESTNET,
		darkOnly: true,
		nativeCurrency: zkSyncTestnet.nativeCurrency,
		network: {
			chainId: toHex(zkSyncTestnet.id),
			chainType: 'zkSync Era Testnet',
		},
		networkSwitchers: [
			{
				name: 'Testnet',
				explorerUrl: 'https://zksync-era-testnet.l2scan.co/',
			},
			{
				name: 'Mainnet',
				explorerUrl: 'https://zksync-era.l2scan.co',
			},
		],
		blockExplorerUrl: 'https://sepolia.explorer.zksync.io',
		rpcUrl: 'https://testnet.era.zksync.dev/',
		l1ExplorerUrl: 'https://goerli.etherscan.io/',
		bridgeContract: [
			'0x000000000000000000000000000000000000800A',
			'0x00ff932A6d70E2B8f1Eb4919e1e09C1923E7e57b',
		],
		bridgeDepositMethodId: '0xcfe7af7c', // finalizeDeposit()
	},
	[EnumChainType.ZKSYNC_SEPOLIA]: {
		url: 'https://zksync.io',
		title: 'zkSync Era Sepolia',
		l1Title: 'Sepolia',
		logo: '/svgs/logo/zksync-era.svg',
		description:
			'zkSync Era is a Layer-2 protocol that scales Ethereum with cutting-edge ZK tech.',
		chainType: EnumChainType.ZKSYNC_SEPOLIA,
		darkOnly: true,
		nativeCurrency: zkSyncSepoliaTestnet.nativeCurrency,
		network: {
			chainId: toHex(zkSyncSepoliaTestnet.id),
			chainType: 'zkSync Era Sepolia',
		},
		networkSwitchers: [
			{
				name: 'Testnet',
				explorerUrl: 'https://sepolia.explorer.zksync.io/',
			},
			{
				name: 'Mainnet',
				explorerUrl: 'https://zksync-era.l2scan.co',
			},
		],
		blockExplorerUrl: 'https://sepolia.explorer.zksync.io',
		rpcUrl: 'https://sepolia.era.zksync.dev/',
		l1ExplorerUrl: 'https://sepolia.etherscan.io/',
		bridgeContract: [
			'0x9a6de0f62Aa270A8bCB1e2610078650D539B1Ef9',
			'0x681A1AFdC2e06776816386500D2D461a6C96cB45',
			'0xe566fDf458C6f9Cf77E7F96C3dDF21030Bf7f0ec',
		],
		bridgeDepositMethodId: '0xcfe7af7c', // finalizeDeposit()
	},
	[EnumChainType.LINEA]: {
		url: 'https://linea.build/',
		title: 'Linea',
		l1Title: 'Ethereum',
		logo: '/svgs/logo/linea.svg',
		description: 'A developer-ready zkEVM rollup for scaling Ethereum dapps.',
		chainType: EnumChainType.LINEA,
		darkOnly: true,
		nativeCurrency: linea.nativeCurrency,
		network: {
			chainId: toHex(linea.id),
			chainType: 'Linea',
		},
		networkSwitchers: [
			{
				name: 'Linea',
				explorerUrl: 'https://linea.l2scan.co',
			},
		],
		blockExplorerUrl: 'https://linea.l2scan.co',
		rpcUrl: linea.rpcUrls.default.http[0],
		l1ExplorerUrl: 'https://etherscan.io',
		bridgeContract: ['0x508Ca82Df566dCD1B0DE8296e70a96332cD644ec'],
		bridgeDepositMethodId: '0x9f3ce55a', // sendMessage(address,uint256,bytes)
	},
	[EnumChainType.BASE]: {
		url: 'https://base.org/',
		title: 'Base',
		l1Title: 'Ethereum',
		logo: '/svgs/logo/base.svg',
		description:
			'Base is a secure, low-cost, builder-friendly Ethereum L2 built to bring the next billion users onchain.',
		chainType: EnumChainType.BASE,
		darkOnly: true,
		nativeCurrency: base.nativeCurrency,
		network: {
			chainId: toHex(base.id),
			chainType: 'Base',
		},
		networkSwitchers: [
			{
				name: 'Base',
				explorerUrl: 'https://base.l2scan.co',
			},
		],
		blockExplorerUrl: 'https://base.l2scan.co',
		rpcUrl: base.rpcUrls.default.http[0],
		l1ExplorerUrl: 'https://etherscan.io',
		bridgeContract: ['0x00008453E27e8e88F305F13CF27c30D724fDd055'],
		bridgeDepositMethodId: '0x8c874ebd', // mintPublic()
		externalExplorers: [
			{
				name: 'Blockscout',
				url: 'https://base.blockscout.com',
			},
		],
	},
	[EnumChainType.ARB]: {
		url: 'https://arbitrum.io/',
		title: 'Arbitrum One',
		l1Title: 'Ethereum',
		logo: '/svgs/logo/arb-one.svg',
		description:
			'Designed with you in mind, Arbitrum is the leading Layer 2 technology that empowers you to explore and build in the largest Layer 1 ecosystem, Ethereum.',
		chainType: EnumChainType.ARB,
		darkOnly: true,
		nativeCurrency: arbitrum.nativeCurrency,
		network: {
			chainId: toHex(arbitrum.id),
			chainType: arbitrum.name, // for add to wallet
		},
		networkSwitchers: [
			{
				name: 'Arbitrum',
				explorerUrl: 'https://arbitrum.l2scan.co',
			},
		],
		blockExplorerUrl: 'https://arbitrum.l2scan.co',
		rpcUrl: arbitrum.rpcUrls.default.http[0],
		l1ExplorerUrl: 'https://etherscan.io',
		externalExplorers: [
			{
				name: 'Arbiscan',
				url: 'https://arbiscan.io',
			},
		],
		bridgeContract: ['0x5288c571Fd7aD117beA99bF60FE0846C4E84F933'],
		bridgeDepositMethodId: '0x7b3a3c8b', // outboundTransfer()
	},
	[EnumChainType.MANTA]: {
		url: 'https://pacific.manta.network/',
		title: 'Manta Pacific',
		l1Title: 'Ethereum',
		logo: '/svgs/logo/manta-pacific.svg',
		description:
			'Manta Pacific is the first EVM-equivalent ZK-application platform that is scalable and secure through Celestia DA and Polygon zkEVM.',
		chainType: EnumChainType.MANTA,
		darkOnly: false,
		nativeCurrency: manta.nativeCurrency,
		network: {
			chainId: toHex(manta.id),
			chainType: 'Manta',
		},
		networkSwitchers: [
			{
				name: 'Manta',
				explorerUrl: 'https://manta-pacific.l2scan.co',
			},
		],
		blockExplorerUrl: 'https://manta-pacific.l2scan.co',
		rpcUrl: manta.rpcUrls.default.http[0],
		l1ExplorerUrl: 'https://etherscan.io',
		bridgeContract: [''],
		bridgeDepositMethodId: '', // mintPublic()
	},
	[EnumChainType.MANTA_TESTNET]: {
		url: 'https://pacific.manta.network/',
		title: 'Manta Testnet',
		l1Title: 'Ethereum',
		logo: '/svgs/logo/manta-pacific.svg',
		description:
			'Manta Pacific is the first EVM-equivalent ZK-application platform that is scalable and secure through Celestia DA and Polygon zkEVM.',
		chainType: EnumChainType.MANTA_TESTNET,
		darkOnly: false,
		nativeCurrency: mantaTestnet.nativeCurrency,
		network: {
			chainId: toHex(mantaTestnet.id),
			chainType: 'Manta Testnet',
		},
		networkSwitchers: [
			{
				name: 'Manta Testnet',
				explorerUrl: 'https://manta-test.l2scan.co',
			},
		],
		blockExplorerUrl: 'https://manta-test.l2scan.co',
		rpcUrl: mantaTestnet.rpcUrls.default.http[0],
		l1ExplorerUrl: 'https://etherscan.io',
		bridgeContract: [''],
		bridgeDepositMethodId: '', // mintPublic()
	},
	[EnumChainType.BSQUARED_TESTNET]: {
		url: 'https://bsquared.network/',
		title: 'Bsquared Testnet',
		l1Title: 'KAD',
		logo: '/svgs/logo/bsquared-testnet.svg',
		description:
			'B² Network is a Bitcoin Layer 2 network implemented through ZK Rollup and an on-chain logical gate commitment verification mechanism.',
		chainType: EnumChainType.BSQUARED_TESTNET,
		darkOnly: true,
		nativeCurrency: bsquaredTestnet.nativeCurrency,
		network: {
			chainId: toHex(bsquaredTestnet.id),
			chainType: 'BSquared Testnet',
		},
		networkSwitchers: [
			{
				name: 'BSquared Testnet',
				explorerUrl: 'https://bsquared-testnet.l2scan.co',
			},
		],
		blockExplorerUrl: 'https://bsquared-testnet.l2scan.co',
		rpcUrl: bsquaredTestnet.rpcUrls.default.http[0],
		l1ExplorerUrl: '',
		bridgeContract: [''],
		bridgeDepositMethodId: '', // mintPublic()
	},
	[EnumChainType.KADSEA]: {
		url: 'https://kadscan.kadsea.org/',
		title: 'Kadsea',
		l1Title: 'KAD',
		logo: '/svgs/logo/kadsea.png',
		description: 'KAD',
		chainType: EnumChainType.KADSEA,
		darkOnly: true,
		nativeCurrency: kadsea.nativeCurrency,
		network: {
			chainId: toHex(kadsea.id),
			chainType: 'Kadsea',
		},
		networkSwitchers: [
			{
				name: 'Kadsea',
				explorerUrl: 'https://kadscan.kadsea.org/',
			},
			{
				name: 'Kadsea Testnet',
				explorerUrl: 'https://kadscan.kadsea.ink/',
			},
		],
		blockExplorerUrl: 'https://kadscan.kadsea.org/',
		rpcUrl: kadsea.rpcUrls.default.http[0],
		l1ExplorerUrl: '',
		bridgeContract: [''],
		bridgeDepositMethodId: '', // mintPublic()
		swap: {
			quoterAddress: '0x0e79C263EeBc37977038F26fb86Dfa84636cFE84',
			swapAddress: '0xedf2021f41AbCfE2dEA4427E1B61f4d0AA5aA4b8',
			tokens: [
				{
					iconUrl: '/imgs/logo.png',
					name: 'Wrapped BNB',
					symbol: 'WBNB',
					address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
				},
				{
					iconUrl: '/imgs/logo.png',
					name: 'USDT USDT',
					symbol: 'USDT',
					address: '0x55d398326f99059ff775485246999027b3197955',
				},
				{
					iconUrl: '/imgs/logo.png',
					name: 'USDC USDC',
					symbol: 'USDC',
					address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
				},
			],
		},
	},
	[EnumChainType.KADSEA_TESTNET]: {
		url: 'https://kadscan.kadsea.org/',
		title: 'Kadsea Testnet',
		l1Title: 'KAD',
		logo: '/svgs/logo/kadsea.png',
		description: 'KAD',
		chainType: EnumChainType.KADSEA_TESTNET,
		darkOnly: true,
		nativeCurrency: kadseaTestnet.nativeCurrency,
		network: {
			chainId: toHex(kadseaTestnet.id),
			chainType: 'Kadsea Testnet',
		},
		networkSwitchers: [
			{
				name: 'Kadsea Testnet',
				explorerUrl: 'https://kadscan.kadsea.ink/',
			},
			{
				name: 'Kadsea Mainnet',
				explorerUrl: 'https://kadscan.kadsea.org/',
			},
		],
		blockExplorerUrl: 'https://kadscan.kadsea.org/',
		rpcUrl: kadseaTestnet.rpcUrls.default.http[0],
		l1ExplorerUrl: '',
		bridgeContract: [''],
		bridgeDepositMethodId: '', // mintPublic()
	},
	[EnumChainType.OKX1_TESTNET]: {
		url: 'https://www.okx.com/x1',
		logo: '/svgs/logo/okx1.png',
		title: 'X1',
		l1Title: 'Ethereum',
		description:
			'X1 is a ZK-powered layer 2 network that connects the OKX and Ethereum communities to allow anyone to take part in a truly global on-chain ecosystem.',
		chainType: EnumChainType.OKX1_TESTNET,
		darkOnly: true,
		nativeCurrency: x1Testnet.nativeCurrency,
		network: {
			chainId: toHex(x1Testnet.id),
			chainType: 'X1 Testnet',
		},
		networkSwitchers: [
			{
				name: 'X1 Testnet',
				explorerUrl: 'https://okx1-testnet.l2scan.co',
			},
		],
		blockExplorerUrl: 'https://okx1-testnet.l2scan.co',
		rpcUrl: x1Testnet.rpcUrls.default.http[0],
		l1ExplorerUrl: 'https://www.okx.com/explorer/sepolia-test',
	},
	[EnumChainType.ORO_TESTNET]: {
		url: 'https://oro-testnet.org/',
		title: 'Oro Testnet',
		l1Title: 'Sepolia',
		logo: '/svgs/logo/oro.svg',
		description: 'Oro testnet is Oro testnet',
		chainType: EnumChainType.ORO_TESTNET,
		darkOnly: true,
		nativeCurrency: oroTestnet.nativeCurrency,
		network: {
			chainId: toHex(oroTestnet.id),
			chainType: 'Oro',
		},
		networkSwitchers: [
			{
				name: 'Oro Testnet',
				explorerUrl: 'https://oro-testnet.l2scan.co',
			},
		],
		blockExplorerUrl: 'https://oro-testnet.l2scan.co',
		rpcUrl: oroTestnet.rpcUrls.default.http[0],
		l1ExplorerUrl: 'https://sepolia.etherscan.io',
		bridgeContract: ['0x47aC0DB6d578C346230d0bf6A732B7AE98abbc8b'],
		bridgeDepositMethodId: '0x8c874ebd', // mintPublic()
		externalExplorers: [
			{
				name: 'Blockscout',
				url: 'https://base.blockscout.com',
			},
		],
	},
}

/**
 * The native currency name of the current chain.
 */
export const CHAIN_TOKEN_NAME = CHAIN_MAP[CHAIN_TYPE].nativeCurrency.name
export const CHAIN_TOKEN_SYMBOL = CHAIN_MAP[CHAIN_TYPE]?.nativeCurrency?.symbol

export const CURRENT_CHAIN_ITEM = CHAIN_MAP[CHAIN_TYPE]
export const BROWSER_TITLE = CURRENT_CHAIN_ITEM.title
export const ChainSwitcherList = [
	EnumChainType.SCROLL,
	EnumChainType.ZKSYNC,
	EnumChainType.LINEA,
	EnumChainType.BASE,
	EnumChainType.ARB,
	EnumChainType.OKX1_TESTNET,
	// EnumChainType.KADSEA
]

// portal
export const L1Networks = {
	mainnet: mainnet,
	goerli: goerli,
	sepolia: sepolia,
}

export const PORTAN_CHAIN_MAP: Record<EnumChainType, Chain[]> = {
	[EnumChainType.SCROLL]: [
		L1Networks.mainnet,
		_scroll,
		L1Networks.sepolia,
		_scrollSepolia,
	],
	[EnumChainType.SCROLL_SEPOLIA]: [
		L1Networks.mainnet,
		_scroll,
		L1Networks.sepolia,
		_scrollSepolia,
	],
	[EnumChainType.ZKSYNC]: [
		L1Networks.mainnet,
		_zkSync,
		L1Networks.sepolia,
		L1Networks.goerli,
		_zkSyncTestnet,
	],
	[EnumChainType.ZKSYNC_TESTNET]: [
		L1Networks.mainnet,
		_zkSync,
		L1Networks.sepolia,
		_zkSyncTestnet,
	],
	[EnumChainType.ZKSYNC_SEPOLIA]: [
		L1Networks.mainnet,
		_zkSync,
		L1Networks.sepolia,
		_zkSyncTestnet,
	],
	[EnumChainType.LINEA]: [linea],
	[EnumChainType.BASE]: [base],
	[EnumChainType.ARB]: [arbitrum],
	[EnumChainType.MANTA]: [manta],
	[EnumChainType.MANTA_TESTNET]: [mantaTestnet],
	[EnumChainType.BSQUARED_TESTNET]: [bsquaredTestnet],
	[EnumChainType.KADSEA]: [kadsea],
	[EnumChainType.KADSEA_TESTNET]: [kadseaTestnet],
	[EnumChainType.OKX1_TESTNET]: [x1Testnet],
	[EnumChainType.ORO_TESTNET]: [oroTestnet],
}

export const ScrollNetworks: BridgeNetworks = {
	[EPortalNetwork.MAINNET]: {
		id: _scroll.id,
		key: _scroll.network,
		name: _scroll.name,
		shortName: _scroll.name,
		rpcUrl: _scroll.rpcUrls.default.http[0],
		blockExplorerUrl: _scroll.blockExplorers.default.url,
		displaySettings: {
			showPartnerLinks: true,
			showZkSyncLiteNetworks: true,
		},
		l1Network: L1Networks.mainnet,
		isL2: true,
	},
	[EPortalNetwork.TESTNET]: {
		id: _scrollSepolia.id,
		key: _scrollSepolia.network,
		name: _scrollSepolia.name,
		shortName: _scrollSepolia.name,
		rpcUrl: _scrollSepolia.rpcUrls.default.http[0],
		blockExplorerUrl: _scrollSepolia.blockExplorers.default.url,
		displaySettings: {
			showPartnerLinks: true,
			showZkSyncLiteNetworks: true,
		},
		l1Network: L1Networks.sepolia,
		isL2: true,
	},
}

export const EraNetworks: BridgeNetworks = {
	[EPortalNetwork.MAINNET]: {
		id: _zkSync.id,
		key: _zkSync.network,
		name: _zkSync.name,
		shortName: _zkSync.name,
		rpcUrl: _zkSync.rpcUrls.default.http[0],
		blockExplorerUrl: _zkSync.blockExplorers.default.url,
		displaySettings: {
			showPartnerLinks: true,
			showZkSyncLiteNetworks: true,
		},
		l1Network: L1Networks.mainnet,
		isL2: true,
	},
	// [EPortalNetwork.TESTNET]: {
	//   //FIXME TO DELETE
	//   id: zkSyncTestnet.id,
	//   key: zkSyncTestnet.network,
	//   name: zkSyncTestnet.name,
	//   shortName: zkSyncTestnet.name,
	//   rpcUrl: zkSyncTestnet.rpcUrls.default.http[0],
	//   blockExplorerUrl: zkSyncTestnet.blockExplorers.default.url,
	//   faucetUrl: 'https://faucet.quicknode.com/ethereum/sepolia',
	//   displaySettings: {
	//     showPartnerLinks: true,
	//     showZkSyncLiteNetworks: true
	//   },
	//   l1Network: L1Networks.goerli,
	//   isL2: true
	// }
	[EPortalNetwork.TESTNET]: {
		id: 300,
		key: _zkSyncTestnet.network,
		name: _zkSyncTestnet.name,
		shortName: _zkSyncTestnet.name,
		rpcUrl: _zkSyncTestnet.rpcUrls.default.http[0],
		blockExplorerUrl: _zkSyncTestnet.blockExplorers.default.url,
		faucetUrl: 'https://faucet.quicknode.com/ethereum/sepolia',
		displaySettings: {
			showPartnerLinks: true,
			showZkSyncLiteNetworks: true,
		},
		l1Network: L1Networks.sepolia,
		isL2: true,
	},
}

export const UnsupportedInternalTxnsNetworks = [
	EnumChainType.ZKSYNC,
	EnumChainType.ZKSYNC_SEPOLIA,
	EnumChainType.ARB,
	EnumChainType.OKX1_TESTNET,
]
