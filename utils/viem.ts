import {
	type Client as Client_Base,
	type EIP1474Methods,
	type PublicActions,
	type Transport,
	type WalletActions,
	createClient,
	http,
	publicActions,
	walletActions,
} from 'viem'
import { type Chain, mainnet } from 'viem/chains'

import { CURRENT_CHAIN_ITEM } from '@/constants'

export type Client = Client_Base<
	Transport,
	Chain,
	undefined,
	EIP1474Methods,
	WalletActions & PublicActions
>

const clientCache = new Map()
export function getClient({ rpcUrl }: { rpcUrl: string }): Client {
	const cachedClient = clientCache.get(rpcUrl)
	if (cachedClient) return cachedClient

	const client = createClient({
		key: rpcUrl,
		chain: CURRENT_CHAIN_ITEM.viemChain ?? mainnet,
		transport: http(rpcUrl),
	})
		.extend(publicActions)
		.extend(walletActions)
	clientCache.set(rpcUrl, client)
	return client
}
