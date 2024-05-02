import { useCallback, useState } from 'react'

import { BigNumber } from 'ethers'
import { L1Signer } from 'zksync-web3'
import { L1_RECOMMENDED_MIN_ERC20_DEPOSIT_GAS_LIMIT } from 'zksync-web3/build/src/utils'

import L1DepositAbiJson from '@/abis/portal-bridge/L2ScanEthereumBridge.json'
import { IsZkSync } from '@/constants'
import { ETH_L1_ADDRESS } from '@/constants/address'
import { getPortalBridgeContract } from '@/constants/bridge'
import useBridgeContext from '@/hooks/portal/bridge/use-bridge-context'
import usePortalContext from '@/hooks/portal/use-portal-context'
import { calculateFee, retry } from '@/lib/utils'
import { usePortalStore } from '@/stores/portal'
import { useBridgeConfigStore } from '@/stores/portal/bridge/config'
import { useBridgeGasFeeStore } from '@/stores/portal/bridge/gas-fee'
import { useBridgeNetworkStore } from '@/stores/portal/bridge/network'

import { useZksyncEthersProvider, useZksyncL1Signer } from './use-zksync-ethers'

export type DepositFeeValues = {
	maxFeePerGas?: BigNumber
	maxPriorityFeePerGas?: BigNumber
	gasPrice?: BigNumber
	baseCost?: BigNumber
	l1GasLimit: BigNumber
	l2GasLimit?: BigNumber
}

export type DepositFeeParams = {
	to: string
	tokenAddress: string
}

let isFetchingGas = false

const useZksyncDepositFee = () => {
	const { isMainnet } = usePortalStore()
	const { walletAddress, currentChainId } = usePortalContext()
	const { isDeposit } = useBridgeContext()
	const { l1Network } = useBridgeNetworkStore()
	const { balance, nativeToken, selectedToken } = useBridgeConfigStore()
	const { setZksyncGasFee } = useBridgeGasFeeStore()

	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<any>()

	const provider = useZksyncEthersProvider()
	const l1Signer = useZksyncL1Signer() as L1Signer

	const estimateFee = useCallback(
		async (customParams?: DepositFeeParams) => {
			if (
				undefined === isMainnet ||
				!IsZkSync ||
				isFetchingGas ||
				!l1Network ||
				l1Network?.id !== currentChainId ||
				!isDeposit ||
				!provider ||
				!l1Signer ||
				(balance?.value ?? BigInt(0)) === BigInt(0)
			)
				return

			const finalParams = customParams || {
				to: walletAddress,
				tokenAddress: selectedToken?.address,
			}
			if (!finalParams || !nativeToken) return

			isFetchingGas = true
			setError(null) // Reset the error state each time
			setLoading(true)

			try {
				let feeData: DepositFeeValues
				if (finalParams.tokenAddress === nativeToken.address) {
					// getEthTransactionFee
					// TODO this request always fail on testnet
					feeData = await l1Signer?.getFullRequiredDepositFee({
						token: ETH_L1_ADDRESS,
						to: finalParams.to,
						// bridgeAddress: getPortalBridgeContract(isMainnet, true)
					})
					// const contract = getPortalBridgeContract(isMainnet, isDeposit)
					// const fakeTx = {
					//   address: contract,
					//   abi: L1DepositAbiJson.abi,
					//   functionName: selectedToken?.native ? 'depositETHToZkSyncEra' : 'depositERC20ToZkSyncEra',
					//   account: walletAddress
					// }
					// const _gasLimit = await provider.estimateGas(fakeTx)
					// feeData = {
					//   l1GasLimit: BigNumber.from(_gasLimit)
					// }
				} else {
					// getERC20TransactionFee
					feeData = await l1Signer?.getFullRequiredDepositFee({
						token: selectedToken!.address,
						to: finalParams.to,
						// bridgeAddress: getPortalBridgeContract(isMainnet, true)
					})
					// feeData = {
					//   l1GasLimit: BigNumber.from(L1_RECOMMENDED_MIN_ERC20_DEPOSIT_GAS_LIMIT)
					// }
				}

				if (feeData && !feeData.maxFeePerGas) {
					feeData = {
						...feeData,
						gasPrice: await retry(() => provider.getGasPrice()),
					}
				}

				let totalFee = undefined

				if (
					feeData?.l1GasLimit &&
					feeData?.maxFeePerGas &&
					feeData?.maxPriorityFeePerGas
				) {
					totalFee = feeData.l1GasLimit
						.mul(feeData.maxFeePerGas)
						.add(feeData.baseCost || '0')
						.toString()
				} else if (feeData?.l1GasLimit && feeData?.gasPrice) {
					totalFee = calculateFee(
						feeData.l1GasLimit,
						feeData.gasPrice,
					).toString()
				}

				setZksyncGasFee(isDeposit, {
					zksyncDepositFee: feeData,
					zksyncTotalDepositFee: totalFee,
				})
			} catch (err) {
				console.error(err)
				setError(err)
			} finally {
				setLoading(false)
				isFetchingGas = false
			}
		},
		[
			isMainnet,
			l1Network,
			currentChainId,
			isDeposit,
			provider,
			l1Signer,
			balance?.value,
			walletAddress,
			selectedToken?.address,
			nativeToken,
			setZksyncGasFee,
		],
	)

	return { loading, error, estimateFee }
}

export default useZksyncDepositFee
