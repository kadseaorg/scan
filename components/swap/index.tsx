/* eslint-disable @next/next/no-img-element */
import { memo, useEffect, useMemo, useState } from 'react'

import { useWallets } from '@privy-io/react-auth'
import { usePrivyWagmi } from '@privy-io/wagmi-connector'
import { BigNumber } from 'bignumber.js'
import { Forward } from 'lucide-react'
import { toJS } from 'mobx'
import { observer } from 'mobx-react'
import { usePlausible } from 'next-plausible'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import { useAccount } from 'wagmi'
import Web3 from 'web3'

import SwapBtnView from '@/components/common/button/swap'
import PageTitle from '@/components/common/page-title'
import SelectTokenView from '@/components/common/selectView'
import SlippageView from '@/components/swap/slippage'
import { Badge } from '@/components/ui/badge'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { CURRENT_CHAIN_ITEM } from '@/constants'
import { SwapSelectDirection } from '@/constants/enum'
import { iSwapToken } from '@/constants/interface/token'
import Container from '@/layout/container'
import { useStore } from '@/stores/useStore'
import { PlausibleEvents } from '@/types/events'
import {
	BaseChain,
	ChainId,
	amount2Decimal,
	fetchToken,
	getErc20TokenContract,
	initialChainTable,
} from '@/utils/swap/base'
import {
	QuoterSwapChainWithExactInputParams,
	getQuoterContract,
	quoterSwapChainWithExactInput,
} from '@/utils/swap/quoter'
import {
	SwapChainWithExactInputParams,
	getSwapChainWithExactInputCall,
	getSwapContract,
} from '@/utils/swap/swap'
import { trpc } from '@/utils/trpc'

let timerToTopQuery: any = null
let timerToBottomQuery: any = null
const SwapView = observer(() => {
	const plausible = usePlausible<PlausibleEvents>()
	const { data } = trpc.swap.getExternalSwaps.useQuery()
	const { wallet, setActiveWallet } = usePrivyWagmi()
	const { swapStore } = useStore()
	const { address: accountAddress } = useAccount()
	const { wallets } = useWallets()

	const getAcquire = async ({ swapJsonObj }: any) => {
		const quoterAddress = CURRENT_CHAIN_ITEM?.swap?.quoterAddress
		const swapAddress = CURRENT_CHAIN_ITEM?.swap?.swapAddress
		if (quoterAddress && swapAddress) {
			//
		} else {
			throw 'quoterAddress or swapAddress error'
		}

		if (swapJsonObj?.topTokenInfo?.address) {
			//
		} else {
			throw 'Please select pay token'
		}
		if (swapJsonObj?.bottomTokenInfo?.address) {
			//
		} else {
			throw 'Please select receive token'
		}
		const payAmount = swapJsonObj.topInputValue
		const chain: BaseChain = initialChainTable[ChainId.BSC]
		const rpc = 'https://bscrpc.com'
		console.log('rpc: ', rpc)
		const web3 = new Web3(new Web3.providers.HttpProvider(rpc))

		const account = {
			address: '0x09EA7beC864607f8beC98e56198828BB898e5FCE',
		}
		const quoterContract = getQuoterContract(quoterAddress, web3)
		console.log('quoter address: ', quoterAddress)

		const testAAddress = swapJsonObj.topTokenInfo.address
		const testBAddress = swapJsonObj.bottomTokenInfo.address

		// TokenInfoFormatted of token 'testA' and token 'testB'
		const testA = await fetchToken(testAAddress, chain, web3)
		const testB = await fetchToken(testBAddress, chain, web3)
		const fee = 2000 // 2000 means 0.2%

		const amountA = new BigNumber(payAmount).times(10 ** testA.decimal)

		const params = {
			// pay testA to buy testB
			tokenChain: [testA, testB],
			feeChain: [fee],
			inputAmount: amountA.toFixed(0),
		} as QuoterSwapChainWithExactInputParams

		const { outputAmount } = await quoterSwapChainWithExactInput(
			quoterContract,
			params,
		)

		const amountB = outputAmount
		const amountBDecimal = amount2Decimal(new BigNumber(amountB), testB)

		console.log(' amountA to pay: ', payAmount)
		console.log(' amountB to acquire: ', amountBDecimal)
		console.log('amountB= aoutputAmount second in: ', outputAmount)

		const swapContract = getSwapContract(swapAddress, web3)

		const swapParams = {
			...params,
			// slippery is 1.5%
			minOutputAmount: new BigNumber(amountB).times(0.985).toFixed(0),
		} as SwapChainWithExactInputParams

		// const gasPrice = '5000000000'
		const gasPrice = await web3.eth.getGasPrice()
		console.log('gasPrice: ', gasPrice)

		const tokenA = testA
		const tokenB = testB
		const tokenAContract = getErc20TokenContract(tokenA.address, web3)
		const tokenBContract = getErc20TokenContract(tokenB.address, web3)

		const tokenABalanceBeforeSwap = await tokenAContract.methods
			.balanceOf(account.address)
			.call()
		const tokenBBalanceBeforeSwap = await tokenBContract.methods
			.balanceOf(account.address)
			.call()

		console.log('tokenABalanceBeforeSwap: ', tokenABalanceBeforeSwap)
		console.log('tokenBBalanceBeforeSwap: ', tokenBBalanceBeforeSwap)

		const { swapCalling, options } = getSwapChainWithExactInputCall(
			swapContract,
			account.address,
			chain,
			swapParams,
			gasPrice.toString(),
		)
		console.log('options', options)
		// before estimate gas and send transaction,
		// make sure you have approve swapAddress of token testA
		const gasLimit = await swapCalling.estimateGas(options)
		console.log('gas limit: ', gasLimit)
		const estimatedFee = web3.utils.fromWei(
			(gasPrice * gasLimit).toString(),
			'ether',
		)
		const encode = swapCalling.encodeABI()
		return {
			outputAmount,
			amountBDecimal,
			estimatedFee,
			encode,
			gasLimit,
		}
	}

	useEffect(() => {
		;(async () => {
			try {
				if (
					swapStore?.topInputValue &&
					swapStore?.topTokenInfo?.address &&
					swapStore?.bottomTokenInfo?.address &&
					swapStore.swapDirection === SwapSelectDirection.top &&
					accountAddress
				) {
					if (timerToTopQuery) {
						clearTimeout(timerToTopQuery)
					}
					timerToTopQuery = setTimeout(async () => {
						swapStore.setIsLoading(true)
						if (Number(swapStore?.topInputValue) > 0) {
							const swapJsonObj = toJS(swapStore)
							const {
								outputAmount,
								amountBDecimal,
								estimatedFee,
								encode,
								gasLimit,
							} = await getAcquire({ swapJsonObj })
							if (Number(outputAmount) > 0) {
								swapStore.setBottomInputValue(String(amountBDecimal))
								swapStore.setBottomDecimalValue(String(outputAmount))
								swapStore.setGasFee(estimatedFee)
								swapStore.setEncodeData(encode)
								swapStore.setGasLimit(gasLimit)
							}
						} else {
							toast.error('Please enter a valid amount')
						}
						swapStore.setIsLoading(false)
					}, 1000)
				}
			} catch (error: any) {
				console.error(error)
				toast.error(error?.message || JSON.stringify(error))
				swapStore.setIsLoading(false)
			}
		})()
	}, [
		swapStore?.topInputValue,
		swapStore?.topTokenInfo?.address,
		swapStore?.bottomTokenInfo?.address,
		swapStore?.swapDirection,
		accountAddress,
	])

	// useEffect(() => {
	//   ;(async () => {
	//     try {
	//       if (
	//         swapStore?.bottomInputValue &&
	//         swapStore?.topTokenInfo?.address &&
	//         swapStore?.bottomTokenInfo?.address &&
	//         swapStore.swapDirection === SwapSelectDirection.bottom &&
	//         accountAddress
	//       ) {
	//         if (timerToBottomQuery) {
	//           clearTimeout(timerToBottomQuery)
	//         }
	//         timerToBottomQuery = setTimeout(async () => {
	//           swapStore.setIsLoading(true)
	//           if (Number(swapStore?.bottomInputValue) > 0) {
	// const swapJsonObj = toJS(swapStore)
	//             const { outputAmount, amountBDecimal, estimatedFee } = await getAcquire({swapJsonObj})
	//             if (Number(outputAmount) > 0) {
	//               swapStore.setBottomInputValue(String(amountBDecimal))
	//               swapStore.setBottomDecimalValue(String(outputAmount))
	//               swapStore.setGasFee(estimatedFee)
	//             }
	//           } else {
	//             toast.error('Please enter a valid amount')
	//           }
	//           swapStore.setIsLoading(false)
	//         }, 1000)
	//       }
	//     } catch (error: any) {
	//       console.error(error)
	//       toast.error(error?.message || JSON.stringify(error))
	//       swapStore.setIsLoading(false)
	//     }
	//   })()
	// }, [swapStore?.bottomInputValue, swapStore?.topTokenInfo?.address, swapStore?.bottomTokenInfo?.address, swapStore, swapStore?.swapDirection, accountAddress])

	const changeDirection = async () => {
		swapStore.setSwapDirection(SwapSelectDirection.change)
		const tempTopTokenInfo = toJS(swapStore.topTokenInfo)
		const tempTopInputValue = toJS(swapStore.topInputValue)
		const tempBottomTokenInfo = toJS(swapStore.bottomTokenInfo)
		const tempBottomInputValue = toJS(swapStore.bottomInputValue)

		swapStore.setTopTokenInfo(tempBottomTokenInfo)
		swapStore.setTopInputValue(tempBottomInputValue)
		swapStore.setBottomTokenInfo(tempTopTokenInfo)
		swapStore.setBottomInputValue(tempTopInputValue)
	}
	return (
		<Container>
			<PageTitle title={'Swap'} />
			<div className="flex flex-col">
				<div className="grid grid-cols-2 gap-4 sm:grid-cols-1">
					{data?.map(
						(
							{
								name,
								logo,
								introduction: description,
								tags = [],
								external_link,
							},
							index,
						) => (
							<Link
								key={index}
								href={external_link}
								target="_blank"
								onClick={() =>
									plausible('Portal-Bridge Name', {
										props: { BridgeName: name },
									})
								}
							>
								<Card className="w-full h-full cursor-pointer transition-all duration-300 hover:opacity-80 flex flex-col justify-between">
									<CardHeader>
										<CardTitle className="mb-4">
											<div className="flex items-center justify-between">
												<div className="flex gap-4 items-center">
													{!!logo && (
														<Image
															className="rounded-full"
															width={56}
															height={56}
															src={logo}
															alt="logo"
														/>
													)}
													{name}
												</div>
												<Forward />
											</div>
										</CardTitle>
										<CardDescription>{description}</CardDescription>
									</CardHeader>
									<CardContent className="space-x-4">
										{tags?.map((tag, index) => (
											<Badge key={index} variant="secondary">
												{tag}
											</Badge>
										))}
									</CardContent>
								</Card>
							</Link>
						),
					)}
				</div>
			</div>
			<div className="bg-[#151516] w-[600px] m-auto px-[30px] py-[20px] mt-[50px] rounded-[10px]">
				<div className="flex justify-between items-center mb-[20px]">
					<div className="">
						<div className="bg-[#222222] py-[8px] px-[20px] rounded-[20px]">
							Swap
						</div>
					</div>
					<SlippageView></SlippageView>
				</div>
				<div className="mb-[10px] bg-[#100101] px-[35px] py-[22px] rounded-[20px]">
					<div className="mb-[10px] text-[#7d7d7d]">You pay</div>
					<div className="flex justify-between items-center">
						<input
							autoFocus
							className="bg-transparent outline-none text-[25px] font-[500]"
							type="text"
							placeholder="0"
							value={swapStore?.topInputValue}
							onChange={(e) => {
								swapStore.setTopInputValue(e.target.value)
								swapStore.setSwapDirection(SwapSelectDirection.top)
							}}
						/>
						<SelectTokenView
							onClick={() => {
								swapStore.setSwapDirection(SwapSelectDirection.top)
							}}
							selectToken={(item: iSwapToken) => {
								if (
									item?.address?.length > 20 &&
									item?.address?.toLocaleLowerCase() ===
										swapStore?.bottomTokenInfo?.address?.toLocaleLowerCase()
								) {
									// swapStore.setTopTokenInfo(item)
									// swapStore.setBottomTokenInfo(null)
								}
								swapStore.setTopTokenInfo(item)
							}}
							curToken={swapStore?.topTokenInfo}
						/>
					</div>
				</div>
				<div className="flex justify-center items-center px-[10px]">
					<img
						className="w-[18px] h-auto ml-[-17px] cursor-pointer select-none"
						src="/imgs/swap/arrowDown.png"
						alt=""
						onClick={changeDirection}
					/>
				</div>
				<div className="mt-[10px] bg-[#100101] px-[35px] py-[22px] rounded-[20px] mb-[20px]">
					<div className="mb-[10px] text-[#7d7d7d]">You get</div>
					<div className="flex justify-between items-center">
						<input
							autoFocus
							className="bg-transparent outline-none text-[25px] font-[500]"
							type="text"
							placeholder="0"
							value={swapStore?.bottomInputValue}
							onChange={(e) => {
								swapStore?.setBottomInputValue(e.target.value)
								swapStore.setSwapDirection(SwapSelectDirection.bottom)
							}}
						/>
						<SelectTokenView
							onClick={() => {
								swapStore.setSwapDirection(SwapSelectDirection.bottom)
							}}
							selectToken={(item: iSwapToken) => {
								if (
									item?.address?.length > 20 &&
									item?.address?.toLocaleLowerCase() ===
										swapStore?.topTokenInfo?.address?.toLocaleLowerCase()
								) {
									// swapStore.setTopTokenInfo(null)
									// swapStore.setBottomTokenInfo(item)
								}
								swapStore.setBottomTokenInfo(item)
							}}
							curToken={swapStore?.bottomTokenInfo}
						/>
					</div>
				</div>
				<SwapBtnView></SwapBtnView>
			</div>
		</Container>
	)
})

export default memo(SwapView)
