import { loaders, whatsabi } from '@shazow/whatsabi'
import { queryOptions, useQuery } from '@tanstack/react-queryv5'
import { type Address, type Client } from 'viem'

import { etherscanApiUrls, l2scanApiUrl } from '@/constants/etherscan'
import { createQueryKey } from '@/lib/react-query'

import { useClient } from './use-client'

type AutoloadAbiParameters = {
	address?: Address | null
	enabled?: boolean
}

export const autoloadAbiQueryKey = createQueryKey<
	'autoload-abi',
	[key: Client['key'], address: Address]
>('autoload-abi')

export function useAutoloadAbiQueryOptions({
	address,
	enabled,
}: AutoloadAbiParameters) {
	const client = useClient()
	return queryOptions({
		enabled: enabled && Boolean(address),
		gcTime: Infinity,
		staleTime: Infinity,
		queryKey: autoloadAbiQueryKey([client.key, address!]),
		async queryFn() {
			if (!address) throw new Error('address is required')
			if (!client) throw new Error('client is required')
			const result = await whatsabi.autoload(address, {
				provider: client,
				followProxies: true,
				abiLoader: new loaders.MultiABILoader([
					new loaders.SourcifyABILoader({
						chainId: client.chain.id,
					}),
					new loaders.EtherscanABILoader({
						baseURL: l2scanApiUrl,
					}),
					new loaders.EtherscanABILoader({
						baseURL:
							(etherscanApiUrls as any)[client.chain.id] || etherscanApiUrls[1],
					}),
				]),
			})
			if (!result.abi.some((item) => (item as { name?: string }).name))
				return null
			return result.abi || null
		},
	})
}

export function useAutoloadAbi(args: AutoloadAbiParameters) {
	const queryOptions = useAutoloadAbiQueryOptions(args)
	return useQuery(queryOptions)
}
