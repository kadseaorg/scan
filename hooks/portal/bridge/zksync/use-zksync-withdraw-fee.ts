import { useCallback, useState } from 'react'

import { BigNumber } from 'ethers'

import { IsZkSync } from '@/constants'
import { ETH_L1_ADDRESS, ETH_ZKSYNC_L2_ADDRESS } from '@/constants/address'
import useBridgeContext from '@/hooks/portal/bridge/use-bridge-context'
import usePortalContext from '@/hooks/portal/use-portal-context'
import { calculateFee } from '@/lib/utils'
import { usePortalStore } from '@/stores/portal'
import { useBridgeConfigStore } from '@/stores/portal/bridge/config'
import { useBridgeGasFeeStore } from '@/stores/portal/bridge/gas-fee'
import { useBridgeNetworkStore } from '@/stores/portal/bridge/network'

import { useZksyncEthersProvider } from './use-zksync-ethers'

export type FeeEstimationParams = {
	to: string
	tokenAddress: string
}

export type WithdrawFeeValues = {
	gasPrice?: BigNumber
	gasLimit?: BigNumber
}

let isFetchingGas = false

const useZksyncWithdrawFee = () => {
	const { isMainnet } = usePortalStore()
	const { walletAddress, currentChainId } = usePortalContext()
	const { isDeposit } = useBridgeContext()
	const { l2Network } = useBridgeNetworkStore()
	const { balance, selectedToken } = useBridgeConfigStore()
	const { setZksyncGasFee } = useBridgeGasFeeStore()
	const provider = useZksyncEthersProvider()

	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<any | null>(null)

	const estimateFee = useCallback(
		async (estimationParams?: FeeEstimationParams) => {
			if (
				undefined === isMainnet ||
				!IsZkSync ||
				isFetchingGas ||
				!l2Network ||
				l2Network?.id !== currentChainId ||
				isDeposit ||
				!provider ||
				(balance?.value ?? BigInt(0)) === BigInt(0)
			)
				return

			const params = estimationParams || {
				to: walletAddress,
				tokenAddress: selectedToken?.address,
			}
			const token =
				params?.tokenAddress === ETH_ZKSYNC_L2_ADDRESS
					? ETH_L1_ADDRESS
					: params?.tokenAddress
			if (!!!token) return

			isFetchingGas = true
			setError(null)
			setLoading(true)
			try {
				const [price, limit] = await Promise.all([
					provider.getGasPrice(),
					provider.estimateGasWithdraw({
						from: walletAddress,
						to: params.to,
						token,
						amount: '1',
					}),
				])

				setZksyncGasFee(isDeposit, {
					zksyncWithdrawFee: {
						gasPrice: price,
						gasLimit: limit,
					},
					zksyncTotalWithdrawFee:
						!limit || !price
							? undefined
							: calculateFee(limit, price).toString(),
				})
			} catch (err: any) {
				console.error(err)
				setError(err)
			} finally {
				setLoading(false)
				isFetchingGas = false
			}
		},
		[
			isMainnet,
			l2Network,
			currentChainId,
			isDeposit,
			provider,
			balance?.value,
			walletAddress,
			selectedToken?.address,
			setZksyncGasFee,
		],
	)

	return { loading, error, estimateFee }
}

export default useZksyncWithdrawFee
