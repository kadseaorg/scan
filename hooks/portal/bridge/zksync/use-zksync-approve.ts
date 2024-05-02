import { useCallback, useMemo, useState } from 'react'

import { MaxUint256 } from '@ethersproject/constants'
import type { Hash } from '@wagmi/core'
import { BigNumber } from 'ethers'
import { usePublicClient, useWalletClient } from 'wagmi'
import IERC20 from 'zksync-web3/abi/IERC20.json'

import { getPortalBridgeContract } from '@/constants/bridge'
import { useEraProvider } from '@/hooks/portal/bridge/zksync/use-zksync-ethers'
import usePortalContext from '@/hooks/portal/use-portal-context'
import { decimalToBigNumber } from '@/lib/formatters'
import { usePortalStore } from '@/stores/portal'
import { useBridgeConfigStore } from '@/stores/portal/bridge/config'
import { useBridgeNetworkStore } from '@/stores/portal/bridge/network'

export default function useZksyncApprove() {
	const { isMainnet } = usePortalStore()
	const { walletAddress } = usePortalContext()
	const { amount, setNeedApproval, selectedToken } = useBridgeConfigStore()
	const eraProvider = useEraProvider()
	const publicClient = usePublicClient()
	const { data: walletClient } = useWalletClient()
	const { isCorrectNetworkSet, fromNetwork } = useBridgeNetworkStore()

	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<Error | undefined>()

	const contractAddress = useMemo(() => {
		const isFromNetworkL2 = !!(fromNetwork as any)?.isL2
		const contractAddress = getPortalBridgeContract(
			!!isMainnet,
			isFromNetworkL2 ? false : true,
		)
		return contractAddress
	}, [fromNetwork, isMainnet])

	const checkApproval = useCallback(async () => {
		try {
			if (
				undefined === isMainnet ||
				!!!amount ||
				!!!selectedToken ||
				selectedToken?.native
			) {
				setNeedApproval(false)
				return
			}

			if (!walletAddress) throw new Error('Account address is not available')

			// const contractAddress = (await eraProvider?.getDefaultBridgeAddresses()).erc20L1
			// if (!contractAddress) throw new Error('Contract address is not available')

			const allowance = (await publicClient.readContract({
				address: selectedToken?.address as Hash,
				abi: IERC20.abi,
				functionName: 'allowance',
				args: [walletAddress, contractAddress],
			})) as unknown as bigint

			if (
				BigNumber.from(allowance)?.gte(
					decimalToBigNumber(amount, selectedToken?.decimals ?? 18),
				)
			) {
				setNeedApproval(false)
				return
			}

			setNeedApproval(true)
		} catch (_error: any) {
			console.error(_error)
			setError(_error)
			return Promise.reject(_error)
		}
	}, [
		isMainnet,
		amount,
		selectedToken,
		walletAddress,
		publicClient,
		setNeedApproval,
		contractAddress,
	])

	const approve = useCallback(async () => {
		if (!walletAddress) throw new Error('Account address is not available')

		try {
			setLoading(true)

			// const contractAddress = (await eraProvider?.getDefaultBridgeAddresses()).erc20L1
			// if (!contractAddress) throw new Error('Contract address is not available')

			const hash = await walletClient?.writeContract({
				address: selectedToken?.address as Hash,
				abi: IERC20.abi,
				functionName: 'approve',
				args: [contractAddress, MaxUint256],
			})

			!!hash && (await publicClient.waitForTransactionReceipt({ hash }))

			setLoading(false)
			checkApproval()
		} catch (_error: any) {
			setLoading(false)
			console.error(_error)
			setError(_error)
		}
	}, [
		walletAddress,
		walletClient,
		selectedToken?.address,
		publicClient,
		checkApproval,
		contractAddress,
	])

	return {
		loading,
		error,
		checkApproval,
		approve,
	}
}
