import { useCallback, useMemo } from 'react'

import { IsScroll, IsZkSync } from '@/constants'
import {
	useScrollGasFee,
	useScrollPriceFee,
} from '@/hooks/portal/bridge/scroll/use-scroll-gas'
import useBridgeContext from '@/hooks/portal/bridge/use-bridge-context'
import useZksyncDepositFee from '@/hooks/portal/bridge/zksync/use-zksync-deposit-fee'
import useZksyncWithdrawFee from '@/hooks/portal/bridge/zksync/use-zksync-withdraw-fee'
import { usePortalStore } from '@/stores/portal'

export default function useBridgeGas() {
	const { isMainnet } = usePortalStore()
	const { isDeposit } = useBridgeContext()

	const { loading: calculatePriceFeeLoading, calculatePriceFee } =
		useScrollPriceFee()
	const { loading: calculateGasFeeLoading, calculateGasFee } = useScrollGasFee()
	const {
		loading: estimateZksyncDepositFeeLoading,
		estimateFee: estimateZksyncDepositFee,
	} = useZksyncDepositFee()
	const {
		loading: estimateZksyncWithdrawFeeLoading,
		estimateFee: estimateZksyncWithdrawFee,
	} = useZksyncWithdrawFee()

	const loading = useMemo(
		() =>
			calculatePriceFeeLoading ||
			calculateGasFeeLoading ||
			estimateZksyncDepositFeeLoading ||
			calculatePriceFeeLoading ||
			estimateZksyncWithdrawFeeLoading,
		[
			calculateGasFeeLoading,
			calculatePriceFeeLoading,
			estimateZksyncDepositFeeLoading,
			estimateZksyncWithdrawFeeLoading,
		],
	)

	const calculateGas = useCallback(() => {
		if (undefined !== isMainnet) {
			if (IsScroll) {
				calculatePriceFee()
				calculateGasFee()
			}

			if (IsZkSync) {
				isDeposit ? estimateZksyncDepositFee() : estimateZksyncWithdrawFee()
			}
		}
	}, [
		calculateGasFee,
		calculatePriceFee,
		estimateZksyncDepositFee,
		estimateZksyncWithdrawFee,
		isDeposit,
		isMainnet,
	])

	return { loading, calculateGas }
}
