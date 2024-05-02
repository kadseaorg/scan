import { useEffect, useMemo } from 'react'

import { IsScroll, IsZkSync } from '@/constants'
import useScrollApprove from '@/hooks/portal/bridge/scroll/use-scroll-approve'
import useZksyncApprove from '@/hooks/portal/bridge/zksync/use-zksync-approve'
import { useBridgeConfigStore } from '@/stores/portal/bridge/config'

export default function useBridgeApprove() {
	const { amount, needApproval, selectedToken } = useBridgeConfigStore()

	const {
		checkApproval: checkScrollApproval,
		approve: scrollApprove,
		loading: scrollApproveLoading,
	} = useScrollApprove()
	const {
		checkApproval: checkZksyncApproval,
		approve: zkSyncApprove,
		loading: zkSyncApproveLoading,
	} = useZksyncApprove()

	useEffect(() => {
		IsScroll && checkScrollApproval()
		IsZkSync && checkZksyncApproval()
	}, [amount, checkScrollApproval, checkZksyncApproval, selectedToken])

	const checkApproval = useMemo(
		() =>
			IsScroll
				? checkScrollApproval
				: IsZkSync
				  ? checkZksyncApproval
				  : () => {},
		[checkScrollApproval, checkZksyncApproval],
	)

	const approve = useMemo(
		() => (IsScroll ? scrollApprove : IsZkSync ? zkSyncApprove : () => {}),
		[scrollApprove, zkSyncApprove],
	)

	const approveLodaing = useMemo(
		() =>
			IsScroll ? scrollApproveLoading : IsZkSync ? zkSyncApproveLoading : false,
		[scrollApproveLoading, zkSyncApproveLoading],
	)

	return { needApproval, checkApproval, approve, approveLodaing }
}
