import { makeAutoObservable } from 'mobx'
import { makePersistable } from 'mobx-persist-store'

import { SwapSelectDirection } from '@/constants/enum'
import { iSwapToken } from '@/constants/interface/token'

export class SwapStore {
	constructor() {
		makeAutoObservable(this)
		makePersistable(this, {
			name: 'swap',
			properties: [
				'topInputValue',
				'bottomInputValue',
				'topTokenInfo',
				'bottomTokenInfo',
			],
			storage: typeof window !== 'undefined' ? window.localStorage : undefined,
		})
	}
	swapDirection: SwapSelectDirection = SwapSelectDirection.top
	setSwapDirection(val: SwapSelectDirection) {
		this.swapDirection = val
	}
	topInputValue = ''
	setTopInputValue(val: string) {
		this.topInputValue = val
	}
	topTokenInfo: iSwapToken | null = {
		iconUrl: '/imgs/logo.png',
		name: 'USDT111',
		symbol: 'USDT',
		address: '0x55d398326f99059ff775485246999027b3197955',
	}
	setTopTokenInfo(info: iSwapToken | null) {
		this.topTokenInfo = info
	}

	bottomInputValue = ''
	setBottomInputValue(val: string) {
		this.bottomInputValue = val
	}
	bottomDecimalValue = ''
	setBottomDecimalValue(val: string) {
		this.bottomDecimalValue = val
	}
	bottomTokenInfo: iSwapToken | null = null
	setBottomTokenInfo(info: iSwapToken | null) {
		this.bottomTokenInfo = info
	}
	isLoading = false
	setIsLoading(val: boolean) {
		this.isLoading = val
	}
	slippage = '0.5'
	setSlippage(val: string) {
		this.slippage = val
	}
	deadline = '20'
	setDeadline(val: string) {
		this.deadline = val
	}
	gasFee = ''
	setGasFee(val: string) {
		this.gasFee = val
	}
	encodeData = ''
	setEncodeData(val: string) {
		this.encodeData = val
	}
	gasLimit = 21000
	setGasLimit(val: number) {
		this.gasLimit = val
	}
}
