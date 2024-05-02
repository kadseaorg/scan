import * as React from 'react'
import { useCallback, useMemo } from 'react'

import { providers } from 'ethers'
import {
	type PublicClient,
	type WalletClient,
	usePublicClient,
	useWalletClient,
} from 'wagmi'
import { L1Signer, Provider, Signer, Web3Provider } from 'zksync-web3'

import { useBridgeNetworkStore } from '@/stores/portal/bridge/network'

export function walletClientToSigner(walletClient: WalletClient) {
	const { account, chain, transport } = walletClient
	const network = {
		chainId: chain.id,
		name: chain.name,
		ensAddress: chain.contracts?.ensRegistry?.address,
	}
	const provider = new providers.Web3Provider(transport, network)
	const signer = provider.getSigner(account.address)
	return signer
}

/** Hook to convert a viem Wallet Client to an ethers.js Signer. */
export function useEthersSigner({ chainId }: { chainId?: number } = {}) {
	const { data: walletClient } = useWalletClient({ chainId })
	return React.useMemo(
		() => (walletClient ? walletClientToSigner(walletClient) : undefined),
		[walletClient],
	)
}

export function usePublicClientToProvider() {
	const { l2Network } = useBridgeNetworkStore()

	return React.useCallback(
		(publicClient: PublicClient) => {
			const { chain, transport } = publicClient
			const network = {
				chainId: chain.id,
				name: chain.name,
				ensAddress: chain.contracts?.ensRegistry?.address,
			}
			if (transport.type === 'fallback')
				// return new providers.FallbackProvider(
				//   (transport.transports as ReturnType<HttpTransport>[]).map(
				//     ({ value }) => new Provider(value?.url, network)
				//   )
				// );
				// create zksync provider directly
				return new Provider(
					transport.transports[0].value?.url ?? l2Network?.rpcUrl,
					network,
				)
			return new Provider(transport?.url, network)
		},
		[l2Network?.rpcUrl],
	)
}

/** Hook to convert a viem Public Client to an ethers.js Provider. */
export function useZksyncEthersProvider({
	chainId,
}: { chainId?: number } = {}): Provider {
	const publicClient = usePublicClient({ chainId })
	const publicClientToProvider = usePublicClientToProvider()
	return React.useMemo(() => {
		const p = publicClientToProvider(publicClient) as Provider
		return p
	}, [publicClient, publicClientToProvider])
}

export function useEraProvider({ chainId }: { chainId?: number } = {}) {
	const { l2Network } = useBridgeNetworkStore()
	const publicClient = usePublicClient({ chainId })
	const { chain } = publicClient

	return useMemo(() => {
		const network = {
			chainId: chain.id,
			name: chain.name,
			ensAddress: chain.contracts?.ensRegistry?.address,
		}

		return new Provider(l2Network?.rpcUrl, network)
	}, [
		chain.contracts?.ensRegistry?.address,
		chain.id,
		chain.name,
		l2Network?.rpcUrl,
	])
}

export function useWalletClientToSigner() {
	const { l2Network } = useBridgeNetworkStore()

	return useCallback(
		(walletClient: WalletClient, signerType?: 'L1' | 'L2') => {
			const { account, chain, transport } = walletClient
			// const network = {
			//   chainId: chain.id,
			//   name: chain.name,
			//   ensAddress: chain.contracts?.ensRegistry?.address
			// }
			const provider = new Web3Provider(transport, 'any')
			const signer = provider.getSigner(account.address)

			if (signerType === 'L1') {
				// TODO: support testnet and mainnet
				const zksyncProvider = new Provider(l2Network?.rpcUrl)
				return L1Signer.from(signer, zksyncProvider)
			}
			return signer
		},
		[l2Network],
	)
}

/** Hook to convert a viem Wallet Client to an ethers.js Signer. */
export function useZksyncEthersSigner({ chainId }: { chainId?: number } = {}) {
	const walletClientToSigner = useWalletClientToSigner()
	const { data: walletClient } = useWalletClient({ chainId })

	return React.useMemo(
		() => (walletClient ? walletClientToSigner(walletClient, 'L2') : undefined),
		[walletClient, walletClientToSigner],
	)
}

export function useZksyncL1Signer({
	chainId,
}: { chainId?: number } = {}): L1Signer {
	const walletClientToSigner = useWalletClientToSigner()
	const { data: walletClient } = useWalletClient({ chainId })

	return React.useMemo(
		() =>
			(walletClient
				? walletClientToSigner(walletClient, 'L1')
				: undefined) as L1Signer,
		[walletClient, walletClientToSigner],
	)
}

export function useZksyncL2Signer({
	chainId,
}: { chainId?: number } = {}): Signer {
	const walletClientToSigner = useWalletClientToSigner()
	const { data: walletClient } = useWalletClient({ chainId })

	return React.useMemo(
		() =>
			(walletClient
				? walletClientToSigner(walletClient, 'L2')
				: undefined) as Signer,
		[walletClient, walletClientToSigner],
	)
}
