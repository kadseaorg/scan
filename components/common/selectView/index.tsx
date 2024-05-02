import { useEffect, useState } from 'react'

import { observer } from 'mobx-react'

import { iSwapToken } from '@/constants/interface/token'
import { useStore } from '@/stores/useStore'
import { CURRENT_CHAIN_ITEM } from '@/constants'

/* eslint-disable @next/next/no-img-element */

interface iSelectTokenView {
	curToken: iSwapToken | null
	onClick: () => void
	selectToken: (token: iSwapToken) => void
}
const SelectTokenView = observer(
	({ curToken, onClick, selectToken }: iSelectTokenView) => {
		const { swapStore } = useStore()
		const [showModal, setshowModal] = useState(false)

		return (
			<div>
				<div
					className="flex justify-start items-center font-[600] text-[18px] cursor-pointer select-none"
					onClick={() => {
						setshowModal(true)
					}}
				>
					{curToken?.symbol ? (
						<>
							{' '}
							<img className="w-[24px] h-auto" src={curToken?.iconUrl} alt="" />
							<span className="mx-[10px]">{curToken?.symbol}</span>
							<svg
								viewBox="0 0 12 7"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								className="w-[12px] h-auto"
							>
								<path d="M0.97168 1L6.20532 6L11.439 1" stroke="#AEAEAE"></path>
							</svg>
						</>
					) : (
						<>
							<span className="mx-[10px]">Select token</span>
							<svg
								viewBox="0 0 12 7"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								className="w-[12px] h-auto"
							>
								<path d="M0.97168 1L6.20532 6L11.439 1" stroke="#AEAEAE"></path>
							</svg>
						</>
					)}
				</div>
				{showModal && (
					<div
						className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-black/30 z-50"
						onClick={() => {
							setshowModal(false)
							onClick && onClick()
						}}
					>
						<div
							className="rounded-[10px] w-[500px] p-[30px] bg-[#151516] text-[16px] font-[500] text-white"
							onClick={(e) => {
								e.preventDefault()
								e.stopPropagation()
							}}
						>
							<div className="mb-[10px]">Select a token</div>
							<div className="searchView px-[22px] py-[15px] bg-[#ffffff] rounded-[15px] flex justify-start items-center mb-[49px]">
								<img
									className="w-[24px] h-auto mr-[17px]"
									src="/imgs/logo.png"
									alt=""
								/>
								<input
									className="bg-transparent grow text-secondary text-[16px] font-[500] outline-none"
									type="text"
									placeholder="Search name or paste address"
								/>
							</div>
							<div className="text-[20px] font-[500] mb-[21px]">
								Popular Tokens
							</div>
							<div className="">
								{CURRENT_CHAIN_ITEM?.swap?.tokens?.map(
									(item: iSwapToken, index: number) => (
										<div
											className="flex justify-start items-center hover:bg-[#ffffff]/30 mb-[10px] rounded-[10px] px-[25px] py-[10px] cursor-pointer select-none"
											key={index}
											onClick={(e) => {
												selectToken && selectToken(item)
												setshowModal(false)
											}}
										>
											<img
												className="w-[24px] h-auto mr-[17px]"
												src={item?.iconUrl}
												alt=""
											/>
											<div className="">
												<div className="text-[18px]">{item?.symbol}</div>
												<div className="text-[14px] font-[400]">
													{item?.name}
												</div>
											</div>
										</div>
									),
								)}
							</div>
						</div>
					</div>
				)}
			</div>
		)
	},
)
export default SelectTokenView
