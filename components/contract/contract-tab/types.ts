import { ContractDetailType } from '@/types'

export type ContractTabPropsType = {
	contractDetail: ContractDetailType | undefined
}

export type IContractTabContext = {
	contractDetail: ContractDetailType | undefined
	abi: any[]
	isProxyContract: boolean
	logicAddress: string
}
