import { loaders } from '@shazow/whatsabi'
//! FIXME: after upgrade trpc and trpc-openapi to v11, we can use react-query v5, and use that directly
import { queryOptions, useQuery } from '@tanstack/react-queryv5'
import { type Client, type Hex } from 'viem'

import { createQueryKey } from '@/lib/react-query'

import { useClient } from './use-client'

type LookupSignatureParameters = {
	enabled?: boolean
	selector?: Hex
}

export const lookupSignatureQueryKey = createQueryKey<
	'lookup-signature',
	[key: Client['key'], selector: Hex]
>('lookup-signature')

export function useLookupSignatureQueryOptions({
	enabled,
	selector,
}: LookupSignatureParameters) {
	const client = useClient()
	return queryOptions({
		enabled: enabled && Boolean(selector),
		gcTime: Infinity,
		staleTime: Infinity,
		queryKey: lookupSignatureQueryKey([client.key, selector!]),
		async queryFn() {
			if (!selector) throw new Error('selector is required')
			if (!client) throw new Error('client is required')
			const signature =
				selector.length === 10
					? await loaders.defaultSignatureLookup.loadFunctions(selector)
					: await loaders.defaultSignatureLookup.loadEvents(selector)
			return signature[0] ?? null
		},
	})
}

export function useLookupSignature(args: LookupSignatureParameters) {
	const queryOptions = useLookupSignatureQueryOptions(args)
	return useQuery(queryOptions)
}
