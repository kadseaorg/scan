import { useUser } from '@supabase/auth-helpers-react'
import { usePrivy } from '@privy-io/react-auth'

import { trpc } from '@/utils/trpc'

export default function useTagNames() {
	// const user = useUser()
	const { ready, authenticated, user } = usePrivy()

	const { data, refetch } = trpc.account.getAllAddressTagList.useQuery(
		undefined,
		{ enabled: !!user?.id },
	)

	return { tagNames: data, fetchTagNames: refetch }
}
