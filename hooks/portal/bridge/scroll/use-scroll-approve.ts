import { useCallback, useMemo, useState } from 'react'

import { MaxUint256 } from '@ethersproject/constants'
import { ethers } from 'ethers'

import L1_erc20ABI from '@/abis/scroll-bridge/L1_erc20ABI.json'
import { IsScroll, USDC_SYMBOL, WETH_SYMBOL } from '@/constants'
import { getPortalBridgeContract } from '@/constants/bridge'
import { useScrollProviderAndSigners } from '@/hooks/portal/bridge/scroll/use-scroll-ethers'
import usePortalContext from '@/hooks/portal/use-portal-context'
import { decimalToBigNumber } from '@/lib/formatters'
import { usePortalStore } from '@/stores/portal'
import { useBridgeConfigStore } from '@/stores/portal/bridge/config'
import { useBridgeNetworkStore } from '@/stores/portal/bridge/network'

export default function useScrollApprove() {
	const { isMainnet } = usePortalStore()
	const { walletAddress, currentChainId } = usePortalContext()
	const { isCorrectNetworkSet, fromNetwork } = useBridgeNetworkStore()
	const { amount, needApproval, setNeedApproval, selectedToken } =
		useBridgeConfigStore()
	const scrollProviderAndSigners = useScrollProviderAndSigners()

	const [loading, setLoading] = useState(false)
	const [error, setError] = useState(null)
	const [approvedContracts, setApprovedContracts] = useState<string[]>([])

	const approveAddress = useMemo(() => {
		if (!IsScroll || !!!currentChainId || !isCorrectNetworkSet) return

		const contract = scrollProviderAndSigners?.[currentChainId]?.contracts

		const isFromNetworkL2 = !!(fromNetwork as any)?.isL2

		let nativeBridgeContract

		if (isFromNetworkL2 && selectedToken?.symbol === WETH_SYMBOL) {
			nativeBridgeContract =
				contract[
					isFromNetworkL2
						? 'L2_WETH_GATEWAY_PROXY_ADDR'
						: 'L1_WETH_GATEWAY_PROXY_ADDR'
				]
		} else if (isFromNetworkL2 && selectedToken?.symbol === USDC_SYMBOL)
			nativeBridgeContract =
				contract[
					isFromNetworkL2
						? 'L2_USDC_GATEWAY_PROXY_ADDR'
						: 'L1_USDC_GATEWAY_PROXY_ADDR'
				]
		else {
			nativeBridgeContract =
				contract?.[
					isFromNetworkL2
						? 'L2_GATEWAY_ROUTER_PROXY_ADDR'
						: 'L1_GATEWAY_ROUTER_PROXY_ADDR'
				]
		}
		const portaBridgeContract = getPortalBridgeContract(
			!!isMainnet,
			isFromNetworkL2 ? false : true,
		)
		// ETH & L2 ERC20(except WETH and USDC) don't need approval
		if (selectedToken?.native) return
		const isL2Erc20 =
			!!(fromNetwork as any)?.isL2 &&
			selectedToken?.symbol !== WETH_SYMBOL &&
			selectedToken?.symbol !== USDC_SYMBOL
		if (isL2Erc20) {
			return [portaBridgeContract]
		} else {
			return [nativeBridgeContract, portaBridgeContract]
		}
	}, [
		isMainnet,
		fromNetwork,
		currentChainId,
		isCorrectNetworkSet,
		scrollProviderAndSigners,
		selectedToken,
	])

	const tokenInstance = useMemo(() => {
		// ETH & L2 ERC20(except WETH and USDC) don't need approval
		if (!IsScroll || !!!currentChainId || !!!selectedToken) return

		const signer = scrollProviderAndSigners?.[currentChainId]?.signer
		const isL2Erc20 =
			!!(fromNetwork as any)?.isL2 &&
			selectedToken?.symbol !== WETH_SYMBOL &&
			selectedToken?.symbol !== USDC_SYMBOL
		if (!!signer && !!!selectedToken?.native)
			return new ethers.Contract(selectedToken?.address, L1_erc20ABI, signer)

		return null
	}, [currentChainId, fromNetwork, scrollProviderAndSigners, selectedToken])

	const checkApproval = useCallback(async () => {
		if (!approveAddress) return
		console.log('selectedToken: ', selectedToken)
		if (
			undefined === isMainnet ||
			!!!amount ||
			!!!selectedToken ||
			selectedToken?.native ||
			!tokenInstance
		) {
			setNeedApproval(false)
			return
		}

		try {
			if (!tokenInstance) {
				setNeedApproval(false)
				return
			}
			let _approvedContracts = []
			const approvedAmounts = (await Promise.all(
				approveAddress?.map((item) =>
					tokenInstance.allowance(walletAddress, item),
				),
			)) as any[]
			for (let i = 0; i < approvedAmounts.length; i++) {
				const approvedAmount = approvedAmounts[i]
				if (
					approvedAmount?.gte(
						decimalToBigNumber(amount, selectedToken?.decimals ?? 18),
					)
				) {
					_approvedContracts.push(approveAddress[i])
				}
			}

			setApprovedContracts(_approvedContracts)
			setNeedApproval(
				_approvedContracts.length === approveAddress.length ? false : true,
			)
		} catch (err) {
			setNeedApproval(false)
		}
	}, [
		isMainnet,
		amount,
		selectedToken,
		tokenInstance,
		setNeedApproval,
		walletAddress,
		approveAddress,
	])

	const approve = useCallback(async () => {
		if (!approveAddress) return
		if (!tokenInstance || !!!selectedToken || !!!amount) return

		setLoading(true)

		try {
			const contracts = approveAddress.filter(
				(item) => !approvedContracts.includes(item),
			)
			for (const contract of contracts) {
				const tx = await tokenInstance.approve(contract, MaxUint256)
				await tx?.wait()
				await checkApproval()
			}
		} catch (error: any) {
			setError(error)
		} finally {
			setLoading(false)
		}
	}, [
		amount,
		approveAddress,
		checkApproval,
		selectedToken,
		tokenInstance,
		approvedContracts,
	])

	return { checkApproval, approve, needApproval, loading, error }
}
