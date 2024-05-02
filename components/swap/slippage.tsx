import { useEffect, useState } from 'react'

import { observer } from 'mobx-react'

import { useStore } from '@/stores/useStore'

/* eslint-disable @next/next/no-img-element */
const SlippageView = observer(() => {
	const [showSlippage, setShowSlippage] = useState(false)
	const { swapStore } = useStore()

	useEffect(() => {
		const handleOverlayClick = (e: any) => {
			if (document.querySelector('.slippage')?.contains(e.target)) {
				//
			} else {
				setShowSlippage(false)
			}
		}
		window.addEventListener('click', handleOverlayClick)
		return () => {
			window.removeEventListener('click', handleOverlayClick)
		}
	}, [])

	return (
		<div className="relative slippage">
			<div
				className="flex justify-start items-center bg-primary/20 py-[6px] px-[12px] rounded-[10px] cursor-pointer select-none"
				onClick={(e) => {
					e.preventDefault()
					e.stopPropagation()
					setShowSlippage(!showSlippage)
				}}
			>
				<span className="">{swapStore?.slippage}% slippage</span>
				<img
					className="w-[28px] h-auto  ml-[10px]"
					src="/imgs/swap/setting.png"
					alt=""
				/>
			</div>
			{showSlippage && (
				<div className="absolute top-[50px] right-0 px-[20px] py-[20px] bg-[#151516] rounded-[10px]">
					<div className="flex justify-start items-center mb-[20px]">
						<span className="">slippage</span>
						<div className="ml-[10px] bg-white rounded-[5px]">
							<input
								className="bg-transparent text-black text-[18px] font-[600] px-[10px]"
								type="number"
								value={swapStore?.slippage}
								onChange={(e) => {
									const val = e.target.value
									if (Number(val) > 0) {
										swapStore.setSlippage(val)
									} else {
										swapStore.setSlippage('')
									}
								}}
							/>
						</div>
					</div>
					<div className="flex justify-start items-center">
						<span className="">deadline</span>
						<div className="ml-[10px] bg-white rounded-[5px]">
							<input
								className="bg-transparent text-black text-[18px] font-[600] px-[10px]"
								type="number"
								value={swapStore?.deadline}
								onChange={(e) => {
									const val = e.target.value
									if (Number(val) > 0) {
										swapStore.setDeadline(val)
									} else {
										swapStore.setDeadline('')
									}
								}}
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	)
})
export default SlippageView
