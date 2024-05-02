import { useCallback, useEffect, useMemo, useState } from 'react'

import { formatEther } from 'viem'
import { useBalance, usePublicClient, useSwitchNetwork } from 'wagmi'

import { IsScroll, IsZkSync } from '@/constants'
import {
	IsBsquaredTestnet,
	IsKadsea,
	IsOKX1,
	_scroll,
	_scrollSepolia,
	_zkSync,
	_zkSyncTestnet,
	bsquaredTestnet,
	kadsea,
	x1Testnet,
} from '@/constants/chain'
import usePortalContext from '@/hooks/portal/use-portal-context'
import { usePortalStore } from '@/stores/portal'
import { usePortalWalletSendStore } from '@/stores/portal/wallet/send'

export function useWalletSendNetwork() {
	const { isMainnet } = usePortalStore()
	const { switchNetwork, isLoading: isSwitchingNetwork } = useSwitchNetwork()
	const { currentChainId } = usePortalContext()
	const { sendToken } = usePortalWalletSendStore()

	const correctNetwork = useMemo(() => {
		if (IsScroll) {
			return isMainnet ? _scroll : _scrollSepolia
		}
		if (IsZkSync) {
			return isMainnet ? _zkSync : _zkSyncTestnet
		}
		if (IsBsquaredTestnet) {
			return bsquaredTestnet
		}
		if (IsKadsea) {
			return kadsea
		}

		if (IsOKX1) {
			return x1Testnet
		}
	}, [isMainnet])

	const isCorrectNetworkSet = useMemo(() => {
		if (!!!currentChainId || !!!correctNetwork || !!!sendToken) return false

		return (
			correctNetwork.id === currentChainId &&
			correctNetwork.id === sendToken.chainId &&
			currentChainId === sendToken.chainId
		)
	}, [correctNetwork, currentChainId, sendToken])

	const onSwitchNetwork = useCallback(() => {
		if (!!!switchNetwork || !!!correctNetwork || isSwitchingNetwork) return
		switchNetwork(correctNetwork.id)
	}, [correctNetwork, isSwitchingNetwork, switchNetwork])

	return {
		isMainnet,
		onSwitchNetwork,
		isSwitchingNetwork,
		correctNetwork,
		isCorrectNetworkSet,
	}
}

let loading = false

export function useWalletSendGasFee() {
	const publicClient = usePublicClient()
	const { walletAddress } = usePortalContext()
	const { sendTo, sendToken } = usePortalWalletSendStore()
	const { isCorrectNetworkSet } = useWalletSendNetwork()

	const enabled = useMemo(
		() => !!walletAddress && !!sendTo && !!sendToken && isCorrectNetworkSet,
		[isCorrectNetworkSet, sendTo, sendToken, walletAddress],
	)

	const { data: balance } = useBalance({
		watch: true,
		enabled,
		address: walletAddress as `0x${string}`,
		token: undefined,
	})

	const [isFetchingGas, setIsFetchingGas] = useState(false)
	const [gasEstimate, setGasEstimate] = useState<string>()

	const onEstimateGas = useCallback(async () => {
		if (
			!enabled ||
			!publicClient ||
			(balance?.value ?? BigInt(0)) === BigInt(0) ||
			loading
		)
			return
		loading = true
		setIsFetchingGas(true)

		try {
			const gasEstimate = await publicClient.estimateGas({
				account: walletAddress as `0x${string}`,
				to: sendTo as `0x${string}`,
				value: BigInt(1),
			})
			const gasPrice = await publicClient.getGasPrice()
			setGasEstimate(formatEther(gasEstimate * gasPrice, 'wei'))
		} catch (error) {
			console.error(error)
		} finally {
			loading = false
			setIsFetchingGas(false)
		}
	}, [balance?.value, enabled, publicClient, sendTo, walletAddress])

	useEffect(() => {
		onEstimateGas()
	}, [onEstimateGas])

	return { isFetchingGas, gasEstimate, onEstimateGas }
}
