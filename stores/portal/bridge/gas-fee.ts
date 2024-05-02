import { create } from 'zustand'

import { IsScroll, IsZkSync } from '@/constants'
import { DepositFeeValues } from '@/hooks/portal/bridge/zksync/use-zksync-deposit-fee'
import { WithdrawFeeValues } from '@/hooks/portal/bridge/zksync/use-zksync-withdraw-fee'

export type BridgeGasFeeStore = {
	totalFee?: string

	scrollGasPrice: bigint
	scrollGasLimit: bigint
	scrollGasFee: bigint
	scrollWithdrawDataFee: bigint
	scrollTxGasLimit: bigint

	zksyncDepositFee?: DepositFeeValues
	zksyncTotalDepositFee?: string
	zksyncWithdrawFee?: WithdrawFeeValues
	zksyncTotalWithdrawFee?: string

	resetFee: () => void
	setTotalFee: (
		isDeposit: boolean,
		gasFee: {
			scrollGasPrice?: BridgeGasFeeStore['scrollGasPrice']
			scrollGasLimit?: BridgeGasFeeStore['scrollGasLimit']
			scrollGasFee?: BridgeGasFeeStore['scrollGasFee']
			scrollWithdrawDataFee?: BridgeGasFeeStore['scrollWithdrawDataFee']
			zksyncTotalDepositFee?: BridgeGasFeeStore['zksyncTotalDepositFee']
			zksyncWithdrawFee?: BridgeGasFeeStore['zksyncWithdrawFee']
			zksyncTotalWithdrawFee?: BridgeGasFeeStore['zksyncTotalWithdrawFee']
		},
	) => void
	setScrollGasFee: (
		isDeposit: boolean,
		gasFee: {
			scrollGasPrice?: BridgeGasFeeStore['scrollGasPrice']
			scrollGasLimit?: BridgeGasFeeStore['scrollGasLimit']
			scrollGasFee?: BridgeGasFeeStore['scrollGasFee']
			scrollWithdrawDataFee?: BridgeGasFeeStore['scrollWithdrawDataFee']
			scrollTxGasLimit?: BridgeGasFeeStore['scrollTxGasLimit']
		},
	) => void
	setZksyncGasFee: (
		isDeposit: boolean,
		gasFee: {
			zksyncDepositFee?: BridgeGasFeeStore['zksyncDepositFee']
			zksyncTotalDepositFee?: BridgeGasFeeStore['zksyncTotalDepositFee']
			zksyncWithdrawFee?: BridgeGasFeeStore['zksyncWithdrawFee']
			zksyncTotalWithdrawFee?: BridgeGasFeeStore['zksyncTotalWithdrawFee']
		},
	) => void
}

const defautValue = {
	scrollGasPrice: BigInt(0),
	scrollGasLimit: BigInt(0),
	scrollGasFee: BigInt(0),
	scrollWithdrawDataFee: BigInt(0),
	scrollTxGasLimit: BigInt(0),
}

export const useBridgeGasFeeStore = create<BridgeGasFeeStore>()((set, get) => ({
	...defautValue,
	resetFee: () => set({ ...defautValue }),
	setTotalFee: (
		isDeposit,
		{
			scrollGasFee = get().scrollGasFee,
			scrollGasLimit = get().scrollGasLimit,
			scrollGasPrice = get().scrollGasPrice,
			scrollWithdrawDataFee = get().scrollWithdrawDataFee,
			zksyncTotalDepositFee = get().zksyncTotalDepositFee,
			zksyncTotalWithdrawFee = get().zksyncTotalWithdrawFee,
		},
	) => {
		let totalFee

		if (IsScroll) {
			totalFee = (
				scrollGasFee +
				scrollGasLimit * scrollGasPrice +
				scrollWithdrawDataFee
			).toString()
		}

		if (IsZkSync) {
			totalFee = isDeposit ? zksyncTotalDepositFee : zksyncTotalWithdrawFee
		}

		set({ totalFee })
	},
	setScrollGasFee: (isDeposit, gasFee = {}) => {
		set({ ...gasFee })
		get().setTotalFee(isDeposit, gasFee)
	},
	setZksyncGasFee: (isDeposit, gasFee = {}) => {
		set({ ...gasFee })
		get().setTotalFee(isDeposit, gasFee)
	},
}))
