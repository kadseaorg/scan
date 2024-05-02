import { useMemo } from 'react'

import { ethers, providers } from 'ethers'
import {
	type PublicClient,
	WalletClient,
	usePublicClient,
	useWalletClient,
} from 'wagmi'

import L1_GATEWAY_ROUTER_PROXY_ABI from '@/abis/scroll-bridge/L1_GATEWAY_ROUTER_PROXY_ADDR.json'
import L2_GATEWAY_ROUTER_PROXY_ABI from '@/abis/scroll-bridge/L2_GATEWAY_ROUTER_PROXY_ADDR.json'
import { SCROLL_BRIDGE_CONTRACT } from '@/constants/bridge'
import { ScrollNetworks } from '@/constants/chain'
import { EPortalNetwork } from '@/stores/portal'

export function publicClientToProvider(publicClient: PublicClient) {
	try {
		const { chain, transport } = publicClient
		const network = {
			chainId: chain.id,
			name: chain.name,
			ensAddress: chain.contracts?.ensRegistry?.address,
		}

		return new providers.Web3Provider(transport, network)
	} catch (error) {
		console.error('publicClientToProvider', error)
	}
}

export function useEthersProvider({ chainId }: { chainId?: number } = {}) {
	const publicClient = usePublicClient({ chainId })

	return useMemo(() => publicClientToProvider(publicClient), [publicClient])
}

export function walletClientToSigner(walletClient: WalletClient) {
	try {
		const { account, chain, transport } = walletClient
		const network = {
			chainId: chain.id,
			name: chain.name,
			ensAddress: chain.contracts?.ensRegistry?.address,
		}
		const provider = new providers.Web3Provider(transport, network)
		const signer = provider.getSigner(account.address)
		return signer
	} catch (error) {
		console.error('walletClientToSigner', error)
	}
}

/** Hook to convert a viem Wallet Client to an ethers.js Signer. */
export function useEthersSigner({ chainId }: { chainId?: number } = {}) {
	const { data: walletClient } = useWalletClient({ chainId })

	return useMemo(
		() => (walletClient ? walletClientToSigner(walletClient) : undefined),
		[walletClient],
	)
}

export function useScrollProviderAndSigners() {
	const l1MainnetChainId = useMemo(
		() => ScrollNetworks[EPortalNetwork.MAINNET].l1Network?.id ?? 0,
		[],
	)
	const l1TestnetChainId = useMemo(
		() => ScrollNetworks[EPortalNetwork.TESTNET].l1Network?.id ?? 0,
		[],
	)
	const l2MainnetChainId = useMemo(
		() => ScrollNetworks[EPortalNetwork.MAINNET].id,
		[],
	)
	const l2TestnetChainId = useMemo(
		() => ScrollNetworks[EPortalNetwork.TESTNET].id,
		[],
	)

	const l1MainnetProvider = useEthersProvider({ chainId: l1MainnetChainId })
	const l1MainnetSigner = useEthersSigner({ chainId: l1MainnetChainId })
	const l1MainnetGateway = useMemo(
		() =>
			new ethers.Contract(
				SCROLL_BRIDGE_CONTRACT.MAINNET.L1_GATEWAY_ROUTER_PROXY_ADDR,
				L1_GATEWAY_ROUTER_PROXY_ABI,
				l1MainnetSigner,
			),
		[l1MainnetSigner],
	)

	const l1TestnetProvider = useEthersProvider({ chainId: l1TestnetChainId })
	const l1TestnetSigner = useEthersSigner({ chainId: l1TestnetChainId })
	const l1TestnetGateway = useMemo(
		() =>
			new ethers.Contract(
				SCROLL_BRIDGE_CONTRACT.TESTNET.L1_GATEWAY_ROUTER_PROXY_ADDR,
				L1_GATEWAY_ROUTER_PROXY_ABI,
				l1TestnetSigner,
			),
		[l1TestnetSigner],
	)

	const l2MainnetProvider = useEthersProvider({ chainId: l2MainnetChainId })
	const l2MainnetSigner = useEthersSigner({ chainId: l2MainnetChainId })
	const l2MainnetGateway = useMemo(
		() =>
			new ethers.Contract(
				SCROLL_BRIDGE_CONTRACT.MAINNET.L2_GATEWAY_ROUTER_PROXY_ADDR,
				L2_GATEWAY_ROUTER_PROXY_ABI,
				l2MainnetSigner,
			),
		[l2MainnetSigner],
	)

	const l2TestnetProvider = useEthersProvider({ chainId: l2TestnetChainId })
	const l2TestnetSigner = useEthersSigner({ chainId: l2TestnetChainId })
	const l2TestnetGateway = useMemo(
		() =>
			new ethers.Contract(
				SCROLL_BRIDGE_CONTRACT.TESTNET.L2_GATEWAY_ROUTER_PROXY_ADDR,
				L2_GATEWAY_ROUTER_PROXY_ABI,
				l2TestnetSigner,
			),
		[l2TestnetSigner],
	)

	return useMemo(
		() => ({
			[l1MainnetChainId]: {
				provider: l1MainnetProvider,
				signer: l1MainnetSigner,
				gateway: l1MainnetGateway,
				contracts: SCROLL_BRIDGE_CONTRACT.MAINNET,
			},
			[l1TestnetChainId]: {
				provider: l1TestnetProvider,
				signer: l1TestnetSigner,
				gateway: l1TestnetGateway,
				contracts: SCROLL_BRIDGE_CONTRACT.TESTNET,
			},
			[l2MainnetChainId]: {
				provider: l2MainnetProvider,
				signer: l2MainnetSigner,
				gateway: l2MainnetGateway,
				contracts: SCROLL_BRIDGE_CONTRACT.MAINNET,
			},
			[l2TestnetChainId]: {
				provider: l2TestnetProvider,
				signer: l2TestnetSigner,
				gateway: l2TestnetGateway,
				contracts: SCROLL_BRIDGE_CONTRACT.TESTNET,
			},
		}),
		[
			l1MainnetChainId,
			l1MainnetGateway,
			l1MainnetProvider,
			l1MainnetSigner,
			l1TestnetChainId,
			l1TestnetGateway,
			l1TestnetProvider,
			l1TestnetSigner,
			l2MainnetChainId,
			l2MainnetGateway,
			l2MainnetProvider,
			l2MainnetSigner,
			l2TestnetChainId,
			l2TestnetGateway,
			l2TestnetProvider,
			l2TestnetSigner,
		],
	)
}
