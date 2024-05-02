import { useCallback, useEffect, useMemo, useState } from 'react'

import { BigNumber } from 'ethers'
import { parseEther } from 'ethers/lib/utils'
import { toast } from 'sonner'
import { Hash } from 'viem'
import { useContractRead, usePublicClient, useWalletClient } from 'wagmi'
import { Provider, Wallet } from 'zksync-web3'
import ZkSyncL1BridgeInterface from 'zksync-web3/abi/IL1Bridge.json'
import ZkSyncContractInterface from 'zksync-web3/abi/IZkSync.json'

import { ETH_ZKSYNC_L2_ADDRESS, isSameAddress } from '@/constants/address'
import {
	useEraProvider,
	useEthersSigner,
	useZksyncEthersProvider,
	useZksyncL1Signer,
	useZksyncL2Signer,
} from '@/hooks/portal/bridge/zksync/use-zksync-ethers'
import useZksyncTxHistory, {
	ZksyncTxHistoryStatusType,
	ZksyncTxHistoryType,
} from '@/hooks/portal/bridge/zksync/use-zksync-tx-history'
import usePortalContext from '@/hooks/portal/use-portal-context'
import { EPortalNetwork, usePortalStore } from '@/stores/portal'
import { useBridgeNetworkStore } from '@/stores/portal/bridge/network'
import {
	ZksyncClaimTxType,
	useZksyncWithdrawClaimTxStore,
} from '@/stores/portal/bridge/zksync/tx'

export type FinalizeWithdrawalParams = {
	l1BatchNumber: unknown
	l2MessageIndex: unknown
	l2TxNumberInBlock: unknown
	message: unknown
	proof: unknown
}

export default function useZksyncWithdrawFinalize() {
	const { walletAddress } = usePortalContext()
	const { isMainnet, portalNetwork } = usePortalStore()
	const publicClient = usePublicClient()
	// const eraProvider = useZksyncEthersProvider()
	const { l1Network, l2Network, fromNetwork, toNetwork } =
		useBridgeNetworkStore()
	const [txLoading, setTxLoading] = useState(false)
	const { data: walletClient } = useWalletClient({ chainId: fromNetwork?.id })
	const eraProvider = useEraProvider({ chainId: l2Network?.id })
	const ethProvider = useZksyncEthersProvider()
	const { addClaimedTx } = useZksyncWithdrawClaimTxStore()
	const eraL1Signer = useZksyncL1Signer()

	const getWithdrawalStatus = useCallback(
		async (txhash: string) => {
			try {
				if (eraProvider.connection.url.includes('localhost')) {
					return [txhash, false]
				}
				const transactionDetails =
					await eraProvider.getTransactionDetails(txhash)
				return [txhash, transactionDetails?.status === 'verified']
			} catch (e) {
				console.log(e)
				return [txhash, false]
			}
		},
		[eraProvider],
	)

	const getFinalizationParams = useCallback(
		async (txhash: string) => {
			const wallet = new Wallet(
				// random private key cause we don't care about actual signer
				// finalizeWithdrawalParams only exists on Wallet class
				'0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110',
				eraProvider,
			)
			const {
				l1BatchNumber,
				l2MessageIndex,
				l2TxNumberInBlock,
				message,
				proof,
			} = await wallet.finalizeWithdrawalParams(txhash)
			return {
				l1BatchNumber,
				l2MessageIndex,
				l2TxNumberInBlock,
				message,
				proof,
			}
		},
		[eraProvider],
	)

	const getTransactionParams = useCallback(
		async (txhash: string, usingMainContract = true) => {
			const finalizeWithdrawalParams = await getFinalizationParams(txhash)
			if (usingMainContract) {
				const address = await eraProvider.getMainContractAddress()
				return {
					address: address as Hash,
					abi: ZkSyncContractInterface.abi,
					account: walletAddress! as Hash,
					functionName: 'finalizeEthWithdrawal',
					args: Object.values(finalizeWithdrawalParams!),
				}
			} else {
				const address = await eraProvider.getMainContractAddress()
				return {
					address: address as Hash,
					abi: ZkSyncL1BridgeInterface.abi,
					account: walletAddress! as Hash,
					functionName: 'finalizeWithdrawal',
					args: Object.values(finalizeWithdrawalParams!),
				}
			}
		},
		[getFinalizationParams, walletAddress, eraProvider],
	)

	const estimateFee = async (txhash: string) => {
		const transactionParams = await getTransactionParams(txhash)
		const [price, limit] = await Promise.all([
			ethProvider.getGasPrice(),
			publicClient.estimateContractGas({
				...transactionParams,
			}),
		])

		return {
			transactionParams,
			gasPrice: price as any,
			gasLimit: BigNumber.from(limit).toString() as any,
		}
	}

	const sendFinalzeTx = useCallback(
		async (txhash: string) => {
			try {
				setTxLoading(true)
				//check if alradey finalized
				const finalized = await eraL1Signer.isWithdrawalFinalized(txhash)
				console.log('finalized: ', finalized)
				if (finalized) {
					toast.info('This withdrawal is already finalized')
					const claimedTx = {
						l1_tx_hash: '', //not known for now
						l2_tx_hash: txhash,
						portalNetwork: portalNetwork,
						timestamp: Date.now(),
					}
					addClaimedTx(claimedTx, walletAddress!)
					return
				}
				const { transactionParams, gasLimit, gasPrice } = (await estimateFee(
					txhash,
				))!
				const hash = (await walletClient?.writeContract({
					...transactionParams,
					gasPrice: BigInt(gasPrice.toString()),
					gas: BigInt(gasLimit.toString()),
				})) as Hash
				const result = await publicClient.waitForTransactionReceipt({
					hash: hash as `0x${string}`,
				})
				console.log('[finalize withdraw res]: ', result)
				const claimTx: ZksyncClaimTxType = {
					l1_tx_hash: result.transactionHash,
					l2_tx_hash: txhash,
					portalNetwork: portalNetwork,
					timestamp: Date.now(),
				}
				addClaimedTx(claimTx, walletAddress!)
				//TODO show toast about tx pending
			} catch (e) {
				console.log(e)
				if (JSON.stringify(e).includes('TransactionNotFoundError')) {
					// tx still pending
					const claimTx: ZksyncClaimTxType = {
						l1_tx_hash: '',
						l2_tx_hash: txhash,
						portalNetwork: portalNetwork,
						timestamp: Date.now(),
					}
					addClaimedTx(claimTx, walletAddress!)
					//TODO show toast about tx pending
					return
				} else {
					//TODO show toast about tx failed
				}
			} finally {
				setTxLoading(false)
			}
		},
		[estimateFee, walletClient, eraProvider, walletAddress, eraL1Signer],
	)

	const isWithdrawalManualFinalizationRequired = (
		tokenAddress: string,
		amount: string | number,
	) => {
		return (
			(tokenAddress === 'ETH' ||
				isSameAddress(tokenAddress, ETH_ZKSYNC_L2_ADDRESS)) &&
			BigNumber.from(amount).lt(parseEther('0.01'))
		)
	}

	return {
		getWithdrawalStatus,
		sendFinalzeTx,
		txLoading,
		isWithdrawalManualFinalizationRequired,
		eraProvider,
	}
}
