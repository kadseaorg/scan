import { useCallback, useEffect, useState } from 'react'

import { prepareWriteContract } from '@wagmi/core'
import { BigNumber } from 'ethers'
import { ethers } from 'ethers'
import { usePlausible } from 'next-plausible'
import { useInterval } from 'usehooks-ts'
import { useContractRead, usePublicClient, useWalletClient } from 'wagmi'

import L1DepositAbiJson from '@/abis/portal-bridge/L2ScanEthereumBridgeV2.json'
import ScrollWithdrawAbiJson from '@/abis/portal-bridge/L2ScanScrollBridge.json'
import ZksyncWithdrawAbiJson from '@/abis/portal-bridge/L2ScanZkSyncEraBridge.json'
import { EraNetworks, IsScroll, IsZkSync, ScrollNetworks } from '@/constants'
import { getPortalBridgeContract } from '@/constants/bridge'
import { getBlockNumbers } from '@/hooks/portal/bridge/scroll/use-block-numbers'
import { useScrollProviderAndSigners } from '@/hooks/portal/bridge/scroll/use-scroll-ethers'
import useTxStore from '@/hooks/portal/bridge/scroll/use-tx-store'
import useBridgeApprove from '@/hooks/portal/bridge/use-bridge-approve'
import useBridgeContext from '@/hooks/portal/bridge/use-bridge-context'
import {
	useEthersSigner,
	useZksyncEthersProvider,
	useZksyncL1Signer,
	useZksyncL2Signer,
} from '@/hooks/portal/bridge/zksync/use-zksync-ethers'
import {
	ZksyncTxHistoryType,
	formatZksyncHistoryTxTimestamp,
} from '@/hooks/portal/bridge/zksync/use-zksync-tx-history'
import usePortalContext from '@/hooks/portal/use-portal-context'
import { decimalToBigNumber } from '@/lib/formatters'
import { EPortalNetwork, usePortalStore } from '@/stores/portal'
import { useBridgeConfigStore } from '@/stores/portal/bridge/config'
import { useBridgeGasFeeStore } from '@/stores/portal/bridge/gas-fee'
import { useBridgeNetworkStore } from '@/stores/portal/bridge/network'
import {
	TX_STATUS,
	Transaction,
	TxDirection,
	TxPosition,
} from '@/stores/portal/bridge/tx'
import {
	useZksyncNewTxStore,
	useZksyncTxStore,
} from '@/stores/portal/bridge/zksync/tx'
import { PlausibleEvents } from '@/types/events'
import { trpc } from '@/utils/trpc'

export const FEE_RATE_FACTOR = 10000
export const FALLBACK_FEE_RATE = 9970
export const TX_WAIT_TIME = 8000

const timeout = () =>
	new Promise<any>((resolve, reject) => {
		setTimeout(() => {
			resolve('')
		}, TX_WAIT_TIME)
	})
export const usePortalBridgeFeeRate = () => {
	const [feeRate, setFeeRate] = useState(0)
	const publicClient = usePublicClient()
	const { isDeposit } = useBridgeContext()
	const { isMainnet } = usePortalStore()

	const fetchFeeRate = useCallback(async () => {
		const contract = getPortalBridgeContract(!!isMainnet, isDeposit)
		if (!contract) return
		try {
			const feeRate = (await publicClient?.readContract({
				address: contract as `0x{string}`,
				abi: L1DepositAbiJson.abi,
				functionName: 'feeRate',
			})) as number
			setFeeRate(feeRate)
		} catch (e) {
			console.log(e)
		}
	}, [publicClient, isMainnet, isDeposit])

	useEffect(() => {
		fetchFeeRate()
	}, [fetchFeeRate])

	useInterval(fetchFeeRate, 10 * 1000)
	return { feeRate }
}

export default function useSendTransaction() {
	const plausible = usePlausible<PlausibleEvents>()
	const publicClient = usePublicClient()

	const { walletAddress } = usePortalContext()
	const { isMainnet, portalNetwork } = usePortalStore()
	const { isDeposit } = useBridgeContext()
	const { l1Network, l2Network, fromNetwork, toNetwork } =
		useBridgeNetworkStore()
	const { amount, formattedAmount, selectedToken } = useBridgeConfigStore()
	const {
		zksyncDepositFee,
		scrollGasPrice,
		scrollGasLimit,
		scrollTxGasLimit,
		scrollGasFee,
		totalFee,
	} = useBridgeGasFeeStore()
	const { needApproval, checkApproval, approve, approveLodaing } =
		useBridgeApprove()
	const { data: walletClient } = useWalletClient({ chainId: fromNetwork?.id })
	const { mutateAsync: collectBridgeStats } =
		trpc.stat.collectBridgeStats.useMutation()

	const [txLoading, setTxLoading] = useState(false)
	const [txData, setTxData] = useState<any>()
	const [txError, setTxError] = useState<string | undefined>()
	const [currentTx, setCurrentTx] = useState<string>()

	const { addTx } = useZksyncTxStore()
	const { addNewTx, updateNewTx } = useZksyncNewTxStore()
	const eraPrivider = useZksyncEthersProvider()
	const eraL1Signer = useZksyncL1Signer()
	const eraL2Signer = useZksyncL2Signer()

	const { feeRate } = usePortalBridgeFeeRate()

	const checkIsContract = useCallback(
		async (address: `0x{string}`) => {
			try {
				const code = await publicClient.getBytecode({ address })
				if (code !== '0x') return true
			} catch (e) {
				return false
			}
		},
		[publicClient],
	)

	// scroll
	const {
		addTransaction,
		updateTransaction,
		addEstimatedTimeMap,
		updateOrderedTxs,
		addAbnormalTransactions,
		removeFrontTransactions,
	} = useTxStore()
	const scrollProviderAndSigners = useScrollProviderAndSigners()

	useEffect(() => {
		setTxLoading(approveLodaing)
	}, [approveLodaing])

	const sendZksyncTx = useCallback(
		async (cb?: () => void) => {
			if (
				undefined === isMainnet ||
				!!!formattedAmount ||
				!!!fromNetwork ||
				!!!toNetwork ||
				!!!l1Network ||
				!!!l2Network ||
				!!!walletAddress ||
				!!!selectedToken ||
				!!!publicClient?.chain?.id
			)
				return
			const currentChainId = Number(publicClient.chain.id)
			const { address, l1Address, l2Address, l2ChainId, native } = selectedToken
			if (
				(isMainnet && l2ChainId !== EraNetworks[EPortalNetwork.MAINNET].id) ||
				(!isMainnet && l2ChainId !== EraNetworks[EPortalNetwork.TESTNET].id)
			)
				return
			if (
				!!!native &&
				((address === l1Address && l1Network.id !== currentChainId) ||
					(address === l2Address && l2Network.id !== currentChainId))
			)
				return

			if (needApproval) {
				approve()
				return
			}

			const waitTxActualHandler = async (hash: string) => {
				let result
				const tx: ZksyncTxHistoryType = {
					isDeposit,
					amount: formattedAmount || '0',
					tokenSymbol: selectedToken?.symbol,
					tokenDecimals: selectedToken?.decimals,
					portalNetwork: portalNetwork,
				}
				let time = formatZksyncHistoryTxTimestamp(Date.now())
				if (isDeposit) {
					tx.l1 = { txHash: hash, time }
				} else {
					tx.l2 = { txHash: hash, time }
				}

				addNewTx(tx, walletAddress)
				addTx(tx)
				// publicClient waitForTransactionReceipt zksync l2 error
				let pArr = []
				if (!!(fromNetwork as any)?.isL2) {
					pArr = [eraPrivider.waitForTransaction(hash), timeout()]
				} else {
					pArr = [
						publicClient.waitForTransactionReceipt({
							hash: hash as `0x${string}`,
						}),
						timeout(),
					]
				}

				result = await Promise.race(pArr)
				if (!result) {
					setTxLoading(false)
					result = !!(fromNetwork as any)?.isL2
						? await eraPrivider.waitForTransaction(hash)
						: await publicClient.waitForTransactionReceipt({
								hash: hash as `0x${string}`,
						  })
				}
				checkApproval()
				setTxData(result)

				if (!!result.blockNumber) {
					const { timestamp } = await publicClient.getBlock({
						blockNumber: BigInt(result.blockNumber),
						includeTransactions: false,
					})
					time = formatZksyncHistoryTxTimestamp(Number(timestamp) * 1000)
				} else {
					time = formatZksyncHistoryTxTimestamp(Date.now())
				}
				if (isDeposit) {
					updateNewTx({ ...tx, l1: { txHash: hash, time } }, walletAddress)
				} else {
					updateNewTx({ ...tx, l2: { txHash: hash, time } }, walletAddress)
				}

				// if (isDeposit) {
				//   tx.l1 = { txHash: hash, time }
				// } else {
				//   tx.l2 = { txHash: hash, time }
				// }

				// addTx(tx)

				await collectBridgeStats({
					type: isDeposit ? 'deposit' : 'withdraw',
					network: fromNetwork?.name ?? '',
					token_symbol: selectedToken?.symbol,
					token_address: selectedToken?.address,
					token_decimals: selectedToken?.decimals,
					transaction_hash: hash,
					transaction_status: result?.status + '',
					block_number: Number(result?.blockNumber),
					value: Number(formattedAmount ?? '0'),
				})
			}

			const waitTxHandler = async (hash: string) => {
				if (!!!hash) return

				setCurrentTx(hash)
				cb?.()
				try {
					await waitTxActualHandler(hash)
				} catch (error: any) {
					if (error?.message.includes('could not be found')) {
						//FIXME: sync tx too slow. wait again.
						try {
							await waitTxActualHandler(hash)
						} catch (e) {
							console.log(e)
							setTxError(error?.message)
						}
					} else {
						console.log(error)
						setTxError(error?.message)
					}
				} finally {
					setTxLoading(false)
				}
			}

			setTxLoading(true)
			try {
				const contract = getPortalBridgeContract(
					isMainnet,
					isDeposit,
				) as `0x{string}`
				if (!(await checkIsContract(contract))) {
					setTxError('Wrong network')
					setTxLoading(false)
					return
				}
				const GasPricePerPubdata = 800

				const actualAmount = BigNumber.from(formattedAmount)
					.mul(FEE_RATE_FACTOR)
					.div(feeRate)
					.toBigInt()
				console.log('feeRate: ', feeRate, actualAmount)

				if (isDeposit) {
					const ptx = await eraL1Signer.getDepositTx({
						to: walletAddress,
						token: selectedToken.l1Address,
						amount: actualAmount || '0',
						l2GasLimit: zksyncDepositFee?.l2GasLimit,
						overrides: {
							gasLimit: zksyncDepositFee?.l1GasLimit,
							maxFeePerGas: zksyncDepositFee?.maxFeePerGas,
							maxPriorityFeePerGas: zksyncDepositFee?.maxPriorityFeePerGas,
						},
					})
					const l2GasLimit =
						ptx.l2GasLimit?.toBigInt() || zksyncDepositFee?.l2GasLimit
					const tx: any = {
						address: contract as `0x{string}`,
						abi: L1DepositAbiJson.abi,
						functionName: selectedToken?.native
							? 'depositETHToZkSyncEra'
							: 'depositERC20ToZkSyncEra',
						args: selectedToken?.native
							? [
									walletAddress,
									actualAmount,
									'0x',
									l2GasLimit,
									GasPricePerPubdata,
									[],
									walletAddress,
							  ]
							: [
									walletAddress,
									selectedToken?.l1Address,
									actualAmount,
									l2GasLimit,
									GasPricePerPubdata,
									walletAddress,
							  ],
						account: walletAddress as `0x{string}`,
						// value: selectedToken?.native ? BigNumber.from(formattedAmount).toBigInt() + fee : fee
					}
					tx.value =
						ptx.overrides?.value?.toBigInt() || ptx.value?.toBigInt() || 0n
					tx.gasLimit =
						ptx.overrides?.gasLimit?.toBigInt() || zksyncDepositFee?.l1GasLimit
					// console.log('gasLimit: ', ptx.overrides?.gasLimit?.toBigInt(), ptx.l2GasLimit?.toBigInt())
					const hash = await walletClient?.writeContract(tx)
					!!hash && (await waitTxHandler(hash))
				} else {
					const tx = {
						address: contract as `0x{string}`,
						abi: ZksyncWithdrawAbiJson.abi,
						functionName: selectedToken?.native
							? 'withdrawETHToL1'
							: 'withdrawERC20ToL1',
						args: selectedToken?.native
							? [walletAddress]
							: [walletAddress, selectedToken.address, actualAmount],
						value: selectedToken?.native ? actualAmount : 0n,
					}
					const hash = await walletClient?.writeContract(tx)
					!!hash && (await waitTxHandler(hash))
				}
			} catch (e) {
				console.log(e)
			} finally {
				setTxLoading(false)
			}
		},
		[
			isMainnet,
			fromNetwork,
			toNetwork,
			l1Network,
			l2Network,
			walletAddress,
			selectedToken,
			publicClient,
			needApproval,
			approve,
			checkApproval,
			isDeposit,
			formattedAmount,
			addNewTx,
			collectBridgeStats,
			walletClient,
			eraPrivider,
			zksyncDepositFee,
			eraL1Signer,
			feeRate,
			checkIsContract,
			portalNetwork,
			updateNewTx,
		],
	)

	const sendScrollTx = useCallback(
		async (cb?: () => void) => {
			if (
				undefined === isMainnet ||
				!!!formattedAmount ||
				!!!fromNetwork ||
				!!!toNetwork ||
				!!!l1Network ||
				!!!l2Network ||
				!!!walletAddress ||
				!!!selectedToken ||
				!!!publicClient?.chain?.id
			)
				return
			const currentChainId = Number(publicClient.chain.id)
			const { address, l1Address, l2Address, l2ChainId, native } = selectedToken
			if (
				(isMainnet &&
					l2ChainId !== ScrollNetworks[EPortalNetwork.MAINNET].id) ||
				(!isMainnet && l2ChainId !== ScrollNetworks[EPortalNetwork.TESTNET].id)
			)
				return
			if (
				!!!native &&
				((address === l1Address && l1Network.id !== currentChainId) ||
					(address === l2Address && l2Network.id !== currentChainId))
			)
				return

			if (needApproval) {
				approve()
				return
			}
			const MAX_OFFSET_TIME = 30 * 60 * 1000
			const isValidOffsetTime = (offsetTime: number) =>
				offsetTime < MAX_OFFSET_TIME
			const txDirection = isDeposit ? TxDirection.Deposit : TxDirection.Withdraw

			const handleTransaction = (
				tx: Transaction,
				updateOpts?: { [k: string]: any },
			) => {
				if (updateOpts) {
					updateTransaction(tx.hash, updateOpts)
					return
				}

				addTransaction({
					hash: tx.hash,
					fromName: fromNetwork?.name,
					toName: toNetwork?.name,
					fromExplore: (fromNetwork as any)?.blockExplorerUrl,
					toExplore: (toNetwork as any)?.blockExplorerUrl,
					amount: decimalToBigNumber(
						amount || '0',
						selectedToken?.decimals ?? 18,
					)?.toString(),
					isL1: !!!(fromNetwork as any)?.isL2,
					tokenSymbol: selectedToken?.symbol,
					timestamp: Date.now(),
				})
			}

			const markTransactionAbnormal = (
				tx: Transaction,
				assumedStatus: string,
				errMsg: string,
			) => {
				addAbnormalTransactions(walletAddress, {
					hash: tx.hash,
					fromName: fromNetwork?.name,
					toName: toNetwork?.name,
					fromExplore: (fromNetwork as any)?.blockExplorerUrl,
					toExplore: (toNetwork as any)?.blockExplorerUrl,
					amount: decimalToBigNumber(
						amount || '0',
						selectedToken?.decimals ?? 18,
					)?.toString(),
					isL1: !!!(fromNetwork as any)?.isL2,
					tokenSymbol: selectedToken?.symbol,
					assumedStatus,
					errMsg,
				})
				removeFrontTransactions(tx.hash)
				updateTransaction(tx.hash, { assumedStatus })
			}
			const waitTxHandler = async (hash: string) => {
				try {
					let receipt = await Promise.race([
						publicClient.waitForTransactionReceipt({
							hash: hash as `0x${string}`,
						}),
						timeout(),
					])
					if (!receipt) {
						setTxLoading(false)
						receipt = await publicClient.waitForTransactionReceipt({
							hash: hash as `0x${string}`,
						})
					}
					setTxData(receipt)
					if (receipt?.status === 'success' && receipt?.blockNumber) {
						handleTransaction(tx, {
							fromBlockNumber: Number(receipt.blockNumber),
						})
						if (!(fromNetwork as any)?.isL2) {
							const estimatedOffsetTime = receipt.blockNumber
								? (Number(receipt.blockNumber) -
										(getBlockNumbers()?.[0] ?? -1)) *
								  12 *
								  1000
								: TX_WAIT_TIME
							if (isValidOffsetTime(estimatedOffsetTime)) {
								addEstimatedTimeMap(
									`from_${tx.hash}`,
									Date.now() + estimatedOffsetTime,
								)
							} else {
								addEstimatedTimeMap(`from_${tx.hash}`, 0)
							}
						}
					} else {
						setTxError(
							'due to any operation that can cause the transaction or top-level call to revert',
						)

						// Something failed in the EVM
						updateOrderedTxs(
							walletAddress,
							tx.hash,
							TxPosition.Abnormal,
							txDirection,
						)
						// EIP-658
						markTransactionAbnormal(
							tx,
							TX_STATUS.failed,
							'due to any operation that can cause the transaction or top-level call to revert',
						)
					}

					collectBridgeStats({
						type: isDeposit ? 'deposit' : 'withdraw',
						network: fromNetwork?.name,
						token_symbol: selectedToken?.symbol ?? '',
						token_address: selectedToken?.address ?? '',
						token_decimals: selectedToken?.decimals ?? 0,
						transaction_hash: tx.hash,
						transaction_status:
							receipt?.status === 'success' ? 'success' : 'failed',
						block_number: Number(receipt?.blockNumber),
						value: Number(formattedAmount ?? '0'),
					})
				} catch (error: any) {
					console.log(error)
					// TRANSACTION_REPLACED or TIMEOUT
					if (error?.code === 'TRANSACTION_REPLACED') {
						if (error.cancelled) {
							markTransactionAbnormal(
								tx,
								TX_STATUS.canceled,
								'transaction was cancelled',
							)
							updateOrderedTxs(walletAddress, tx.hash, TxPosition.Abnormal)
							setTxError('cancel')
						} else {
							const { blockNumber, hash: transactionHash } = error.receipt
							handleTransaction(tx, {
								fromBlockNumber: blockNumber,
								hash: transactionHash,
							})
							updateOrderedTxs(walletAddress, tx.hash, transactionHash)
							if (!!!(fromNetwork as any).isL2) {
								const estimatedOffsetTime =
									(blockNumber - (getBlockNumbers()?.[0] ?? -1)) * 12 * 1000
								if (isValidOffsetTime(estimatedOffsetTime)) {
									addEstimatedTimeMap(
										`from_${transactionHash}`,
										Date.now() + estimatedOffsetTime,
									)
								} else {
									addEstimatedTimeMap(`from_${transactionHash}`, 0)
								}
							}
						}
					} else {
						// when the transaction execution failed (status is 0)
						updateOrderedTxs(walletAddress, tx.hash, TxPosition.Abnormal)
						markTransactionAbnormal(tx, TX_STATUS.failed, error.message)
					}
					setTxError(error?.message)
				} finally {
					setTxLoading(false)
				}
			}
			let tx: any
			setTxLoading(true)
			try {
				const contract = getPortalBridgeContract(
					isMainnet,
					isDeposit,
				) as `0x{string}`
				if (!(await checkIsContract(contract))) {
					setTxError('Wrong network')
					setTxLoading(false)
					return
				}
				const fee = scrollGasPrice * scrollGasLimit
				const actualAmount = BigNumber.from(formattedAmount)
					.mul(FEE_RATE_FACTOR)
					.div(feeRate)
					.toBigInt()
				console.log('feeRate: ', feeRate, actualAmount)
				let hash: any
				tx = {
					fromName: fromNetwork?.name,
					toName: toNetwork?.name,
					fromExplore: (fromNetwork as any)?.blockExplorerUrl,
					toExplore: (toNetwork as any)?.blockExplorerUrl,
					amount: actualAmount,
					isL1: !!!(fromNetwork as any)?.isL2,
					tokenSymbol: selectedToken?.symbol,
					timestamp: Date.now(),
				}
				if (isDeposit) {
					hash = await walletClient?.writeContract({
						address: contract as `0x{string}`,
						abi: L1DepositAbiJson.abi,
						functionName: selectedToken?.native
							? 'depositETHToScroll'
							: 'depositERC20ToScroll',
						args: selectedToken?.native
							? [walletAddress, actualAmount, scrollGasLimit]
							: [
									selectedToken?.l1Address,
									walletAddress,
									actualAmount,
									scrollGasLimit,
							  ],
						value: selectedToken?.native ? BigInt(actualAmount) + fee : fee,
					})
				} else {
					hash = await walletClient?.writeContract({
						address: contract as `0x{string}`,
						abi: ScrollWithdrawAbiJson.abi,
						functionName: selectedToken?.native
							? 'withdrawETHToL1'
							: 'withdrawERC20ToL1',
						args: selectedToken?.native
							? [walletAddress, actualAmount, scrollGasLimit]
							: [
									selectedToken.address,
									walletAddress,
									actualAmount,
									scrollGasLimit,
							  ],
						value: selectedToken?.native ? BigInt(actualAmount) : 0n,
					})
				}
				tx.hash = hash
				setCurrentTx(tx.hash)
				cb?.()

				handleTransaction(tx)
				updateOrderedTxs(
					walletAddress,
					tx.hash,
					TxPosition.Frontend,
					txDirection,
				)
				await waitTxHandler(hash)
			} catch (e) {
				console.log(e)
			} finally {
				setTxLoading(false)
			}
		},
		[
			isMainnet,
			fromNetwork,
			toNetwork,
			l1Network,
			l2Network,
			walletAddress,
			selectedToken,
			publicClient,
			needApproval,
			approve,
			isDeposit,
			formattedAmount,
			walletClient,
			scrollGasLimit,
			scrollGasPrice,
			amount,
			addTransaction,
			updateTransaction,
			addAbnormalTransactions,
			removeFrontTransactions,
			updateOrderedTxs,
			collectBridgeStats,
			addEstimatedTimeMap,
			feeRate,
			checkIsContract,
		],
	)

	const sendTransaction = useCallback(
		(cb?: () => void) => {
			if (!!!amount) return

			plausible('Portal-Native Bridge')

			if (IsZkSync) {
				sendZksyncTx(cb)
				return
			}

			if (IsScroll) {
				sendScrollTx(cb)
				return
			}
		},
		[amount, plausible, sendScrollTx, sendZksyncTx],
	)
	const resetTxData = useCallback(() => {
		setTxData(undefined)
		setTxError(undefined)
	}, [])
	return { txLoading, sendTransaction, txData, resetTxData, txError, currentTx }
}
