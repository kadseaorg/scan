import { useCallback, useEffect, useState } from 'react'

import { usePlausible } from 'next-plausible'
import { usePublicClient } from 'wagmi'
import { Provider } from 'zksync-web3'

import { EraNetworks, IsScroll, IsZkSync, ScrollNetworks } from '@/constants'
import { ETH_L1_ADDRESS, ETH_ZKSYNC_L2_ADDRESS } from '@/constants/address'
import { getBlockNumbers } from '@/hooks/portal/bridge/scroll/use-block-numbers'
import { useScrollProviderAndSigners } from '@/hooks/portal/bridge/scroll/use-scroll-ethers'
import useTxStore from '@/hooks/portal/bridge/scroll/use-tx-store'
import useBridgeApprove from '@/hooks/portal/bridge/use-bridge-approve'
import useBridgeContext from '@/hooks/portal/bridge/use-bridge-context'
import {
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
import { useZksyncTxStore } from '@/stores/portal/bridge/zksync/tx'
import { PlausibleEvents } from '@/types/events'
import { trpc } from '@/utils/trpc'

export default function useSendTransaction() {
	const plausible = usePlausible<PlausibleEvents>()
	const publicClient = usePublicClient()
	const { walletAddress } = usePortalContext()
	const { isMainnet } = usePortalStore()
	const { isDeposit } = useBridgeContext()
	const { l1Network, l2Network, fromNetwork, toNetwork } =
		useBridgeNetworkStore()
	const { amount, formattedAmount, selectedToken } = useBridgeConfigStore()
	const { zksyncDepositFee, scrollGasPrice, scrollGasLimit, scrollTxGasLimit } =
		useBridgeGasFeeStore()
	const { needApproval, checkApproval, approve, approveLodaing } =
		useBridgeApprove()

	const { mutateAsync: collectBridgeStats } =
		trpc.stat.collectBridgeStats.useMutation()

	const [txLoading, setTxLoading] = useState(false)
	const [txData, setTxData] = useState<any>()
	const [txError, setTxError] = useState<string | undefined>()
	const [currentTx, setCurrentTx] = useState<string>()

	useEffect(() => {
		setTxLoading(approveLodaing)
	}, [approveLodaing])

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

			const depositETH = async () => {
				const fee = scrollGasPrice * scrollGasLimit
				return scrollProviderAndSigners?.[l1Network?.id].gateway[
					'depositETH(uint256,uint256)'
				](formattedAmount, scrollGasLimit, {
					value: BigInt(formattedAmount) + fee,
				})
			}

			const depositERC20 = async () => {
				const fee = scrollGasPrice * scrollGasLimit
				return scrollProviderAndSigners?.[l1Network?.id].gateway[
					'depositERC20(address,uint256,uint256)'
				](selectedToken?.address, formattedAmount, scrollGasLimit, {
					value: fee,
				})
			}

			const withdrawETH = async () => {
				return scrollProviderAndSigners?.[l2Network?.id].gateway[
					'withdrawETH(uint256,uint256)'
				](formattedAmount, 0, {
					value: formattedAmount,
					gasLimit: scrollTxGasLimit,
				})
			}

			const withdrawERC20 = async () => {
				return scrollProviderAndSigners?.[l2Network?.id].gateway[
					'withdrawERC20(address,uint256,uint256)'
				](selectedToken?.address, formattedAmount, 0)
			}

			const sendl1ToL2 = () =>
				selectedToken?.native ? depositETH() : depositERC20()

			const sendl2ToL1 = () =>
				selectedToken?.native ? withdrawETH() : withdrawERC20()

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

			let tx: any
			setTxLoading(true)

			try {
				if (!(fromNetwork as any)?.isL2) {
					tx = await sendl1ToL2()
				} else if (!!(fromNetwork as any)?.isL2 && !(toNetwork as any)?.isL2) {
					tx = await sendl2ToL1()
				}

				setCurrentTx(tx.hash)
				cb?.()
				const MAX_OFFSET_TIME = 30 * 60 * 1000
				const isValidOffsetTime = (offsetTime: number) =>
					offsetTime < MAX_OFFSET_TIME
				const txDirection = isDeposit
					? TxDirection.Deposit
					: TxDirection.Withdraw

				handleTransaction(tx)
				updateOrderedTxs(
					walletAddress,
					tx.hash,
					TxPosition.Frontend,
					txDirection,
				)

				tx.wait()
					.then((receipt: any) => {
						checkApproval()
						setTxData(receipt)

						if (receipt?.status === 1) {
							handleTransaction(tx, {
								fromBlockNumber: receipt.blockNumber,
							})
							if (!(fromNetwork as any)?.isL2) {
								const estimatedOffsetTime =
									(receipt.blockNumber - (getBlockNumbers()?.[0] ?? -1)) *
									12 *
									1000
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
							transaction_status: receipt?.status === 1 ? 'success' : 'failed',
							block_number: receipt?.blockNumber,
							value: Number(formattedAmount ?? '0'),
						})
					})
					.catch((error: any) => {
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
					})
					.finally(() => {
						setTxLoading(false)
					})
			} catch (error: any) {
				setTxLoading(false)
				console.error(error?.message)
			}
		},
		[
			formattedAmount,
			fromNetwork,
			toNetwork,
			l1Network,
			l2Network,
			walletAddress,
			needApproval,
			isMainnet,
			selectedToken,
			publicClient,
			approve,
			scrollGasPrice,
			scrollGasLimit,
			scrollProviderAndSigners,
			scrollTxGasLimit,
			addTransaction,
			amount,
			updateTransaction,
			addAbnormalTransactions,
			removeFrontTransactions,
			isDeposit,
			updateOrderedTxs,
			checkApproval,
			collectBridgeStats,
			addEstimatedTimeMap,
		],
	)

	// zksync
	const { addTx } = useZksyncTxStore()
	const eraPrivider = useZksyncEthersProvider()
	const eraL1Signer = useZksyncL1Signer()
	const eraL2Signer = useZksyncL2Signer()

	const sendZksyncTx = useCallback(
		async (cb?: () => void) => {
			if (
				undefined === isMainnet ||
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

			const waitTxHandler = async (hash: string) => {
				if (!!!hash) return

				setCurrentTx(hash)
				cb?.()

				try {
					let result

					// publicClient waitForTransactionReceipt zksync l2 error
					if (!!(fromNetwork as any)?.isL2) {
						result = await eraPrivider.waitForTransaction(hash)
					} else {
						result = await publicClient.waitForTransactionReceipt({
							hash: hash as `0x${string}`,
						})
					}

					checkApproval()
					setTxData(result)

					const tx: ZksyncTxHistoryType = {
						isDeposit,
						amount: formattedAmount || '0',
						tokenSymbol: selectedToken?.symbol,
						tokenDecimals: selectedToken?.decimals,
					}

					if (!!result.blockNumber) {
						const { timestamp } = await publicClient.getBlock({
							blockNumber: BigInt(result.blockNumber),
							includeTransactions: false,
						})
						const time = formatZksyncHistoryTxTimestamp(
							Number(timestamp) * 1000,
						)
						if (isDeposit) {
							tx.l1 = { txHash: hash, time }
						} else {
							tx.l2 = { txHash: hash, time }
						}
					}

					addTx(tx)

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
				} catch (error: any) {
					setTxError(error?.message)
				} finally {
					setTxLoading(false)
				}
			}

			setTxLoading(true)

			try {
				if (isDeposit) {
					if (
						!!zksyncDepositFee &&
						!!eraL1Signer &&
						!!selectedToken.l1Address
					) {
						const depositResponse = await eraL1Signer.deposit({
							to: walletAddress,
							token: selectedToken.l1Address,
							amount: formattedAmount || '0',
							l2GasLimit: zksyncDepositFee?.l2GasLimit,
							overrides: {
								gasLimit: zksyncDepositFee?.l1GasLimit,
								maxFeePerGas: zksyncDepositFee?.maxFeePerGas,
								maxPriorityFeePerGas: zksyncDepositFee?.maxPriorityFeePerGas,
							},
						})

						await waitTxHandler(depositResponse.hash)
					}
				} else {
					if (!!eraL2Signer) {
						const getRequiredBridgeAddress = async () => {
							if (selectedToken?.address === ETH_ZKSYNC_L2_ADDRESS)
								return undefined
							const bridgeAddresses =
								await eraPrivider?.getDefaultBridgeAddresses()
							return bridgeAddresses.erc20L2
						}

						const withdrawRes = await eraL2Signer.withdraw({
							to: walletAddress,
							amount: decimalToBigNumber(
								amount || '0',
								selectedToken.decimals,
							).toString(),
							token:
								selectedToken?.address === ETH_ZKSYNC_L2_ADDRESS
									? ETH_L1_ADDRESS
									: selectedToken?.address,
							bridgeAddress: await getRequiredBridgeAddress(),
						})

						await waitTxHandler(withdrawRes.hash)
					}
				}
			} catch (error) {
				throw error
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
			addTx,
			collectBridgeStats,
			zksyncDepositFee,
			eraL1Signer,
			eraL2Signer,
			amount,
			eraPrivider,
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
