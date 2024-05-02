import { useCallback, useMemo, useState } from 'react'

import { AbiCoder } from '@ethersproject/abi'
import { MaxUint256 } from '@ethersproject/constants'
import { getPublicClient } from '@wagmi/core'
import BigNumber from 'bignumber.js'
import { ethers, utils } from 'ethers'

import L1GasPriceOracleAbi from '@/abis/scroll-bridge/L1GasPriceOracle.json'
import L1_GATEWAY_ROUTER_PROXY_ADDR from '@/abis/scroll-bridge/L1_GATEWAY_ROUTER_PROXY_ADDR.json'
import L2ETHGatewayAbi from '@/abis/scroll-bridge/L2ETHGateway.json'
import L2GasPriceOracleAbi from '@/abis/scroll-bridge/L2GasPriceOracle.json'
import L2ScrollMessengerAbi from '@/abis/scroll-bridge/L2ScrollMessenger.json'
import L2StandardERC20GatewayAbi from '@/abis/scroll-bridge/L2StandardERC20Gateway.json'
import L2StandardERC20Gateway from '@/abis/scroll-bridge/L2StandardERC20Gateway.json'
import L2WETHGatewayAbi from '@/abis/scroll-bridge/L2WETHGateway.json'
import { ETH_SYMBOL, IsScroll } from '@/constants'
import { useScrollProviderAndSigners } from '@/hooks/portal/bridge/scroll/use-scroll-ethers'
import useBridgeContext from '@/hooks/portal/bridge/use-bridge-context'
import usePortalContext from '@/hooks/portal/use-portal-context'
import { decimalToBigNumber } from '@/lib/formatters'
import { usePortalStore } from '@/stores/portal'
import { useBridgeConfigStore } from '@/stores/portal/bridge/config'
import { useBridgeGasFeeStore } from '@/stores/portal/bridge/gas-fee'
import { useBridgeNetworkStore } from '@/stores/portal/bridge/network'

enum GatewayType {
	ETH_GATEWAY = 'ETH_GATEWAY',
	WETH_GATEWAY = 'WETH_GATEWAY',
	STANDARD_ERC20_GATEWAY = 'STANDARD_ERC20_GATEWAY',
	CUSTOM_ERC20_GATEWAY = 'CUSTOM_ERC20_GATEWAY',
	USDC_GATEWAY = 'USDC_GATEWAY',
	DAI_GATEWAY = 'DAI_GATEWAY',
	LIDO_GATEWAY = 'LIDO_GATEWAY',
}

const L2_CONTRACTS = {
	[GatewayType.ETH_GATEWAY]: {
		abi: L2ETHGatewayAbi,
		l1Env: 'L1_ETH_GATEWAY_PROXY_ADDR',
		env: 'L2_ETH_GATEWAY_PROXY_ADDR',
	},
	[GatewayType.WETH_GATEWAY]: {
		abi: L2WETHGatewayAbi,
		l1Env: 'L1_ETH_GATEWAY_PROXY_ADDR',
		env: 'L2_WETH_GATEWAY_PROXY_ADDR',
	},
	[GatewayType.STANDARD_ERC20_GATEWAY]: {
		abi: L2StandardERC20GatewayAbi,
		env: 'L2_STANDARD_ERC20_GATEWAY_PROXY_ADDR',
	},
	[GatewayType.CUSTOM_ERC20_GATEWAY]: {
		abi: L2StandardERC20Gateway,
		env: 'L2_CUSTOM_ERC20_GATEWAY_PROXY_ADDR',
	},
	[GatewayType.USDC_GATEWAY]: {
		abi: L2StandardERC20Gateway,
		env: 'L2_USDC_GATEWAY_PROXY_ADDR',
	},
	[GatewayType.DAI_GATEWAY]: {
		abi: L2StandardERC20Gateway,
		env: 'L2_DAI_GATEWAY_PROXY_ADDR',
	},
	[GatewayType.LIDO_GATEWAY]: {
		abi: L2StandardERC20Gateway,
		env: 'L2_LIDO_GATEWAY_PROXY_ADDR',
	},
	SCROLL_MESSENGER: {
		abi: L2ScrollMessengerAbi,
		env: 'L2_SCROLL_MESSENGER',
	},
	L1_GAS_PRICE_ORACLE: {
		abi: L1GasPriceOracleAbi,
		env: 'L1_GAS_PRICE_ORACLE',
	},
	L2_GAS_PRICE_ORACLE: {
		abi: L2GasPriceOracleAbi,
		env: 'L2_GAS_PRICE_ORACLE',
	},
	L1_GATEWAY_ROUTER_PROXY: {
		abi: L1_GATEWAY_ROUTER_PROXY_ADDR,
		env: 'L1_GATEWAY_ROUTER_PROXY_ADDR',
	},
}

const OFFSET = '0x1111000000000000000000000000000000001111'
const AMOUNT = BigInt(1)
enum MIN_GASLIMIT {
	ETH_GATEWAY = 14e4,
	WETH_GATEWAY = 17e4,
	STANDARD_ERC20_GATEWAY = 15e4,
	CUSTOM_ERC20_GATEWAY = 15e4,
	USDC_GATEWAY = 16e4,
	DAI_GATEWAY = 15e4,
	LIDO_GATEWAY = 15e4,
}
let isFetchingScrollPriceFee = false
export function useScrollPriceFee() {
	const { currentChainId, walletAddress } = usePortalContext()
	const { isDeposit } = useBridgeContext()
	const { l1Network, l2Network, fromNetwork, isCorrectNetworkSet } =
		useBridgeNetworkStore()
	const { balance, amount, selectedToken, needApproval } =
		useBridgeConfigStore()
	const { scrollTxGasLimit, setScrollGasFee } = useBridgeGasFeeStore()

	const [loading, setLoading] = useState(false)

	const scrollProviderAndSigners = useScrollProviderAndSigners()
	const l1Provider = useMemo(
		() =>
			!!l1Network?.id
				? scrollProviderAndSigners?.[l1Network?.id]?.provider
				: undefined,
		[l1Network?.id, scrollProviderAndSigners],
	)
	const l1Contract = useMemo(
		() =>
			!!l1Network?.id
				? scrollProviderAndSigners?.[l1Network?.id]?.contracts
				: undefined,
		[l1Network?.id, scrollProviderAndSigners],
	)
	const l2Provider = useMemo(
		() =>
			!!l2Network?.id
				? scrollProviderAndSigners?.[l2Network?.id]?.provider
				: undefined,
		[l2Network?.id, scrollProviderAndSigners],
	)
	const l2Contract = useMemo(
		() =>
			!!l2Network?.id
				? scrollProviderAndSigners?.[l2Network?.id]?.contracts
				: undefined,
		[l2Network?.id, scrollProviderAndSigners],
	)

	const getContract = useCallback(
		(contractName: string, providerOrSigner: any, contract: any) => {
			const _l2Contract = (L2_CONTRACTS as any)[contractName]
			if (!!!contractName || !!!_l2Contract) return
			const { env, abi } = _l2Contract

			return new ethers.Contract(contract[env], abi, providerOrSigner)
		},
		[],
	)

	const getGasPrice = useCallback(async () => {
		if (!l1Network?.id) return

		const signer = scrollProviderAndSigners?.[l1Network?.id]?.signer
		const contract = scrollProviderAndSigners?.[l1Network?.id]?.contracts

		if (!signer || !contract) return

		try {
			const L2GasPriceOracleContract = getContract(
				'L2_GAS_PRICE_ORACLE',
				signer,
				contract,
			)
			const gasPrice = await L2GasPriceOracleContract?.l2BaseFee()

			return gasPrice?.toBigInt() ?? BigInt(0)
		} catch (err: any) {
			throw new Error(err?.message)
		}
	}, [getContract, l1Network?.id, scrollProviderAndSigners])

	// For USDC, Lido, and DAI, can use the STANDARD_ERC20_GATEWAY
	const getAddress2GatewayType = useCallback(() => {
		if (!l1Contract) return {}

		return {
			[l1Contract.L1_ETH_GATEWAY_PROXY_ADDR]: GatewayType.ETH_GATEWAY,
			[l1Contract.L1_WETH_GATEWAY_PROXY_ADDR]: GatewayType.WETH_GATEWAY,
			[l1Contract.L1_CUSTOM_ERC20_GATEWAY_PROXY_ADDR]:
				GatewayType.CUSTOM_ERC20_GATEWAY,
			[l1Contract.L1_STANDARD_ERC20_GATEWAY_PROXY_ADDR]:
				GatewayType.STANDARD_ERC20_GATEWAY,
			[l1Contract.L1_USDC_GATEWAY_PROXY_ADDR]: GatewayType.USDC_GATEWAY,
			[l1Contract.L1_DAI_GATEWAY_PROXY_ADDR]: GatewayType.DAI_GATEWAY,
			[l1Contract.L1_LIDO_GATEWAY_PROXY_ADDR]: GatewayType.LIDO_GATEWAY,
		}
	}, [l1Contract])

	const messageDataGeneric = useCallback(
		(gatewayAddress: string) => {
			let finalizeDepositParams: any = []
			let finalizeDepositMethod = 'finalizeDepositERC20'

			const gatewayType = getAddress2GatewayType()[gatewayAddress]
			// if (!gatewayType) return { finalizeDepositMethod: undefined, finalizeDepositParams: undefined }

			if (gatewayType === GatewayType.ETH_GATEWAY) {
				finalizeDepositParams = [walletAddress, walletAddress, AMOUNT, '0x']
				finalizeDepositMethod = 'finalizeDepositETH'
			} else if (gatewayType === GatewayType.WETH_GATEWAY) {
				finalizeDepositParams = [
					selectedToken?.l1Address,
					selectedToken?.l2Address,
					walletAddress,
					walletAddress,
					AMOUNT,
					'0x',
				]
			} else if (gatewayType === GatewayType.CUSTOM_ERC20_GATEWAY) {
				finalizeDepositParams = [
					selectedToken?.l1Address,
					selectedToken?.l2Address,
					walletAddress,
					walletAddress,
					0,
					'0x',
				]
			} else {
				finalizeDepositParams = [
					selectedToken?.l1Address,
					selectedToken?.l2Address,
					walletAddress,
					walletAddress,
					AMOUNT,
					new AbiCoder().encode(
						['bool', 'bytes'],
						[
							true,
							new AbiCoder().encode(
								['bytes', 'bytes'],
								[
									'0x',
									new AbiCoder().encode(
										['string', 'string', 'uint8'],
										[
											selectedToken?.symbol,
											selectedToken?.name,
											selectedToken?.decimals,
										],
									),
								],
							),
						],
					),
				]
			}

			return { finalizeDepositParams, finalizeDepositMethod }
		},
		[
			getAddress2GatewayType,
			walletAddress,
			selectedToken?.l1Address,
			selectedToken?.l2Address,
			selectedToken?.symbol,
			selectedToken?.name,
			selectedToken?.decimals,
		],
	)

	const getGasLimitGeneric = useCallback(
		async (l1GatewayAddress: any) => {
			const gatewayType = getAddress2GatewayType()[l1GatewayAddress]
			// if (!l1Provider || !l2Provider || !l2Contract || !gatewayType) return BigInt(0)

			const gateway = getContract(gatewayType, l2Provider, l2Contract)
			const l2messenger = getContract(
				'SCROLL_MESSENGER',
				l2Provider,
				l2Contract,
			)

			const { finalizeDepositMethod, finalizeDepositParams } =
				messageDataGeneric(l1GatewayAddress)

			if (!finalizeDepositMethod || !finalizeDepositParams) return

			const message = gateway?.interface?.encodeFunctionData(
				finalizeDepositMethod,
				finalizeDepositParams,
			)

			const l1Gateway = new ethers.Contract(
				l1GatewayAddress,
				L2_CONTRACTS[gatewayType].abi,
				l1Provider,
			)
			const l2GatewayAddress = await l1Gateway.counterpart()
			const calldata = l2messenger?.interface?.encodeFunctionData(
				'relayMessage',
				[
					l1GatewayAddress, // l1 gateway
					l2GatewayAddress, // l2 gateway
					[GatewayType.ETH_GATEWAY, GatewayType.WETH_GATEWAY].includes(
						gatewayType,
					)
						? AMOUNT
						: 0,
					MaxUint256,
					message,
				],
			)

			try {
				const gaslimit = await l2Provider?.estimateGas({
					from:
						'0x' +
						(
							BigInt(l2Contract?.L1_SCROLL_MESSENGER ?? 0) +
							(BigInt(OFFSET) % BigInt(Math.pow(2, 160)))
						).toString(16),
					to: (l2Contract as any)[L2_CONTRACTS.SCROLL_MESSENGER.env],
					data: calldata,
				})

				return (
					(BigInt(
						Math.max(
							gaslimit?.toNumber() ?? 0,
							MIN_GASLIMIT[gatewayType] as any,
						),
					) *
						BigInt(120)) /
					BigInt(100)
				)
			} catch (error: any) {
				throw new Error(error?.message)
			}
		},
		[
			l1Provider,
			l2Provider,
			l2Contract,
			getAddress2GatewayType,
			getContract,
			messageDataGeneric,
		],
	)

	const buildUnsignedSerializedTransaction = useCallback(() => {
		if (!selectedToken || !l2Network) return

		const _amount = BigNumber((amount ?? '0')?.toString()).isZero()
			? BigInt(1)
			: decimalToBigNumber(amount ?? '0', selectedToken?.decimals ?? 18)
		const gateway = scrollProviderAndSigners?.[l2Network?.id]?.gateway
		if (!!selectedToken?.native) {
			const data = gateway.interface.encodeFunctionData(
				'withdrawETH(uint256,uint256)',
				[_amount, 0],
			)
			return utils.serializeTransaction({
				to: walletAddress,
				data,
				value: _amount,
				gasLimit: scrollTxGasLimit,
			})
		}

		const data = gateway.interface.encodeFunctionData(
			'withdrawERC20(address,uint256,uint256)',
			[selectedToken?.address, _amount, 0],
		)
		return utils.serializeTransaction({
			to: walletAddress,
			data,
			gasLimit: scrollTxGasLimit,
		})
	}, [
		amount,
		l2Network,
		scrollTxGasLimit,
		scrollProviderAndSigners,
		selectedToken,
		walletAddress,
	])

	// L1 Data Fee on L2
	const getL1DataFee = useCallback(async () => {
		const tx = buildUnsignedSerializedTransaction()

		const L1GasPriceOracleContract = getContract(
			'L1_GAS_PRICE_ORACLE',
			l2Provider,
			l2Contract,
		)
		const l1DateFee = await L1GasPriceOracleContract?.getL1Fee(tx)
		setScrollGasFee(isDeposit, {
			scrollWithdrawDataFee: l1DateFee?.toBigInt() ?? BigInt(0),
		})
	}, [
		buildUnsignedSerializedTransaction,
		getContract,
		isDeposit,
		l2Contract,
		l2Provider,
		setScrollGasFee,
	])

	const getGasLimit = useCallback(async () => {
		if (!l2Contract) return

		if (
			!!selectedToken &&
			selectedToken?.symbol !== ETH_SYMBOL &&
			!!l2Provider
		) {
			const code = await l2Provider.getCode(selectedToken?.l2Address || '')
			// This address does not have a contract deployed.
			if (code === '0x') {
				return BigInt(7e5)
			}
		}
		if (selectedToken?.symbol === ETH_SYMBOL) {
			return await getGasLimitGeneric(l2Contract.L1_ETH_GATEWAY_PROXY_ADDR)
		} else {
			// fetch gateway address from router.getERC20Gateway((l1Token as ERC20Token).address)
			const gatewayRouter = getContract(
				'L1_GATEWAY_ROUTER_PROXY',
				l1Provider,
				l1Contract,
			)
			const gatewayAddress = await gatewayRouter?.getERC20Gateway(
				selectedToken?.l1Address,
			)
			return await getGasLimitGeneric(gatewayAddress)
		}
	}, [
		getContract,
		getGasLimitGeneric,
		l1Contract,
		l1Provider,
		l2Contract,
		l2Provider,
		selectedToken,
	])

	const calculatePriceFee = useCallback(async () => {
		if (
			IsScroll &&
			!isFetchingScrollPriceFee &&
			!needApproval &&
			!!l2Provider &&
			!!selectedToken &&
			!!fromNetwork &&
			!!walletAddress &&
			fromNetwork?.id === currentChainId &&
			isCorrectNetworkSet &&
			(!!selectedToken?.native || balance?.symbol === selectedToken?.symbol) &&
			(balance?.value ?? BigInt(0)) !== BigInt(0)
		) {
			try {
				setLoading(true)
				isFetchingScrollPriceFee = true

				!isDeposit &&
					!BigNumber(scrollTxGasLimit.toString()).isZero() &&
					getL1DataFee()

				if (!(fromNetwork as any)?.isL2) {
					const scrollGasPrice = await getGasPrice()
					const scrollGasLimit = await getGasLimit()

					setScrollGasFee(isDeposit, { scrollGasPrice, scrollGasLimit })
				} else {
					//  Currently, the computation required for proof generation is done and subsidized by Scroll.
					setScrollGasFee(isDeposit, {
						scrollGasPrice: BigInt(0),
						scrollGasLimit: BigInt(0),
					})
				}
			} catch (error: any) {
				setScrollGasFee(isDeposit, {
					scrollGasPrice: BigInt(0),
					scrollGasLimit: BigInt(0),
				})

				throw new Error(error?.message)
			} finally {
				setLoading(false)
				isFetchingScrollPriceFee = false
			}
		}
	}, [
		needApproval,
		l2Provider,
		selectedToken,
		fromNetwork,
		walletAddress,
		currentChainId,
		isCorrectNetworkSet,
		balance?.symbol,
		balance?.value,
		isDeposit,
		scrollTxGasLimit,
		getL1DataFee,
		getGasPrice,
		getGasLimit,
		setScrollGasFee,
	])

	return { loading, calculatePriceFee }
}

export function useEstimateSendTransaction() {
	const { isMainnet } = usePortalStore()
	const { walletAddress, currentChainId } = usePortalContext()
	const { isDeposit } = useBridgeContext()
	const { fromNetwork, isCorrectNetworkSet } = useBridgeNetworkStore()
	const { balance, selectedToken } = useBridgeConfigStore()
	const scrollProviderAndSigners = useScrollProviderAndSigners()
	const { scrollGasLimit, scrollGasPrice } = useBridgeGasFeeStore()

	const provider = useMemo(
		() =>
			fromNetwork?.id
				? scrollProviderAndSigners?.[fromNetwork.id]?.provider
				: undefined,
		[fromNetwork?.id, scrollProviderAndSigners],
	)

	const minimumAmount = BigInt(1)

	const instance = useMemo(
		() =>
			!!fromNetwork?.id
				? scrollProviderAndSigners?.[fromNetwork?.id]?.gateway
				: undefined,
		[fromNetwork?.id, scrollProviderAndSigners],
	)

	const depositETH = useCallback(async () => {
		if (scrollGasLimit === BigInt(0) || scrollGasPrice === BigInt(0)) return

		const fee = scrollGasPrice * scrollGasLimit
		return instance?.estimateGas?.['depositETH(uint256,uint256)']?.(
			minimumAmount,
			scrollGasLimit,
			{
				value: fee + minimumAmount, // value should larger than the estimated gas fee
			},
		)
	}, [scrollGasLimit, scrollGasPrice, instance, minimumAmount])

	const depositERC20 = useCallback(async () => {
		if (scrollGasLimit === BigInt(0) || scrollGasPrice === BigInt(0)) return

		const fee = scrollGasPrice * scrollGasLimit
		return instance?.estimateGas?.['depositERC20(address,uint256,uint256)']?.(
			selectedToken?.address,
			minimumAmount,
			scrollGasLimit,
			{
				value: fee,
			},
		)
	}, [
		scrollGasLimit,
		scrollGasPrice,
		instance?.estimateGas,
		selectedToken?.address,
		minimumAmount,
	])

	const withdrawETH = useCallback(async () => {
		return instance?.estimateGas?.['withdrawETH(uint256,uint256)']?.(
			minimumAmount,
			0,
			{
				value: minimumAmount,
			},
		)
	}, [instance?.estimateGas, minimumAmount])

	const withdrawERC20 = useCallback(async () => {
		return instance?.estimateGas?.['withdrawERC20(address,uint256,uint256)']?.(
			selectedToken?.address,
			minimumAmount,
			0,
		)
	}, [instance?.estimateGas, minimumAmount, selectedToken?.address])

	const estimateSend = useCallback(async () => {
		if (
			undefined === isMainnet ||
			!isCorrectNetworkSet ||
			!instance ||
			!provider ||
			!walletAddress ||
			!selectedToken ||
			(!!!selectedToken?.native && balance?.symbol !== selectedToken?.symbol) ||
			(balance?.symbol === selectedToken?.symbol &&
				(balance?.value ?? BigInt(0)) === BigInt(0))
		)
			return

		const nativeTokenBalance = await provider.getBalance(walletAddress)
		if ((nativeTokenBalance?.toBigInt() || BigInt(0)) === BigInt(0)) {
			return undefined
		}

		if (isDeposit) {
			return selectedToken?.native ? await depositETH() : await depositERC20()
		}

		return selectedToken?.native ? await withdrawETH() : await withdrawERC20()
	}, [
		balance,
		depositERC20,
		depositETH,
		instance,
		isCorrectNetworkSet,
		isDeposit,
		isMainnet,
		provider,
		selectedToken,
		walletAddress,
		withdrawERC20,
		withdrawETH,
	])

	return { estimateSend }
}

let isFetchingScrollGasFee = false
export function useScrollGasFee() {
	const { isMainnet } = usePortalStore()
	const { currentChainId } = usePortalContext()
	const { isDeposit } = useBridgeContext()
	const { fromNetwork, isCorrectNetworkSet } = useBridgeNetworkStore()
	const { needApproval, balance, selectedToken } = useBridgeConfigStore()
	const { setScrollGasFee } = useBridgeGasFeeStore()
	const scrollProviderAndSigners = useScrollProviderAndSigners()
	const { estimateSend } = useEstimateSendTransaction()

	const [loading, setLoading] = useState(false)

	const provider = useMemo(
		() =>
			fromNetwork?.id
				? scrollProviderAndSigners?.[fromNetwork.id]?.provider
				: undefined,
		[fromNetwork?.id, scrollProviderAndSigners],
	)

	const calculateGasFee = useCallback(async () => {
		if (
			undefined === isMainnet ||
			!IsScroll ||
			isFetchingScrollGasFee ||
			needApproval ||
			!!!provider ||
			!isCorrectNetworkSet ||
			!fromNetwork ||
			fromNetwork?.id !== currentChainId ||
			!selectedToken ||
			(!!!selectedToken?.native && balance?.symbol !== selectedToken?.symbol) ||
			(balance?.symbol === selectedToken?.symbol &&
				(balance?.value ?? BigInt(0)) === BigInt(0))
		)
			return

		try {
			setLoading(true)
			isFetchingScrollGasFee = true

			let gasPrice
			let priorityFee

			if (!(fromNetwork as any)?.isL2) {
				const { maxFeePerGas, maxPriorityFeePerGas } = await getPublicClient({
					chainId: fromNetwork.id,
				}).estimateFeesPerGas()
				gasPrice = maxFeePerGas as bigint
				priorityFee = maxPriorityFeePerGas as bigint
			} else {
				const { gasPrice: legacyGasPrice } = await getPublicClient({
					chainId: fromNetwork.id,
				}).estimateFeesPerGas({ type: 'legacy' })
				gasPrice = legacyGasPrice as bigint
				priorityFee = null
			}
			const gas = await estimateSend()
			const limit = ((gas?.toBigInt() ?? BigInt(0)) * BigInt(120)) / BigInt(100)
			const estimatedGasCost = BigInt(limit) * BigInt(gasPrice || 1e9)

			setScrollGasFee(isDeposit, {
				scrollGasFee: estimatedGasCost,
				scrollTxGasLimit: limit ?? BigInt(0),
			})
		} catch (error: any) {
			setScrollGasFee(isDeposit, {
				scrollGasFee: BigInt(0),
				scrollTxGasLimit: BigInt(0),
			})
			throw new Error(error?.message)
		} finally {
			setLoading(false)
			isFetchingScrollGasFee = false
		}
	}, [
		isMainnet,
		needApproval,
		provider,
		isCorrectNetworkSet,
		fromNetwork,
		currentChainId,
		selectedToken,
		balance?.symbol,
		balance?.value,
		estimateSend,
		setScrollGasFee,
		isDeposit,
	])

	return { loading, calculateGasFee }
}
