import react, { useEffect } from 'react'

import { usePrivy, useWallets } from '@privy-io/react-auth'
import { toJS } from 'mobx'
import { observer } from 'mobx-react'
import { useAccount, useBalance } from 'wagmi'

import { CURRENT_CHAIN_ITEM } from '@/constants'
import { useStore } from '@/stores/useStore'
import { toast } from 'sonner'

const SwapBtnView = observer(() => {
	const { swapStore } = useStore()
	const { wallets } = useWallets()
	const { authenticated } = usePrivy()
	const { address: accountAddress } = useAccount()
	const { data: acccoutBalance } = useBalance({
		address: accountAddress,
	})

	const swapHandle = async () => {
		try {
			const swapJsonObj = toJS(swapStore)
			const swapAddress = CURRENT_CHAIN_ITEM?.swap?.swapAddress
			if (swapAddress) {
				//
			} else {
				throw 'quoterAddress or swapAddress error'
			}
			if (swapJsonObj?.encodeData?.length > 10) {
				//
			} else {
				throw `encodeData is not valid`
			}
			const provider = await wallets[wallets?.length - 1]?.getEthereumProvider()
			const gasLimit = swapJsonObj?.gasLimit
			const transactionHash = await provider.request({
				method: 'eth_sendTransaction',
				params: [
					{
						from: accountAddress,
						to: swapAddress,
						data: swapJsonObj?.encodeData,
						value: '0x0',
						gasLimit: `0x${Number(gasLimit).toString(16)}`,
					},
				],
			})
		} catch (error: any) {
			console.error(error)
			toast.error(error?.message || JSON.stringify(error))
		}
	}
	return (
		<>
			<div className="mb-[20px] px-[10px] text-[14px] font-[600]">
				<div className="flex justify-between items-center mb-[10px]">
					<span className="">Max. slippage</span>
					<span className="">{swapStore?.slippage}</span>
				</div>
				<div className="flex justify-between items-center">
					<span className="">Fee</span>
					<span className="">
						{swapStore?.gasFee} {CURRENT_CHAIN_ITEM?.nativeCurrency?.symbol}
					</span>
				</div>
			</div>
			<div className="bg-primary text-white text-[20px] py-[12px] text-center rounded-[10px]">
				{authenticated && wallets?.[wallets?.length - 1]?.address ? (
					Number(swapStore?.topInputValue) > 0 ? (
						// Number(acccoutBalance?.formatted)
						Number(swapStore?.topInputValue) < 100 ? (
							swapStore?.isLoading ? (
								<div className="">loading...</div>
							) : (
								<div
									className="cursor-pointer select-none"
									onClick={swapHandle}
								>
									swap
								</div>
							)
						) : (
							<div className="">Insufficient WBNB balance</div>
						)
					) : (
						<div className="">Enter an amount</div>
					)
				) : (
					<span className="">Connect Wallet</span>
				)}
			</div>
		</>
	)
})
export default SwapBtnView
