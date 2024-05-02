import { createContext, useContext, useEffect, useState } from 'react'

import { providers, utils } from 'ethers'

import { CURRENT_CHAIN_ITEM } from '@/constants'
import { IMPLEMENTATION_SLOT } from '@/constants/contract'
import { ContractDetailType } from '@/types'

import { IContractTabContext } from './types'

export const ContractTabContext = createContext<IContractTabContext | null>(
	null,
)

export const useContractTabContext = () => {
	const context = useContext(ContractTabContext)
	if (!context)
		throw new Error(
			'useContractTabContext must be use inside ContractTabProvider',
		)

	return context
}

type Props = {
	children: React.ReactNode
	contractDetail: ContractDetailType | undefined
}

const ContractTabProvider = ({ children, contractDetail }: Props) => {
	const abi = contractDetail?.abi ? JSON.parse(contractDetail?.abi) : []
	const isProxyContract = abi.some((item: any) => item.name === 'Upgraded')
	const [logicAddress, setLogicAddress] = useState('')

	useEffect(() => {
		if (isProxyContract && contractDetail?.address) {
			const provider = new providers.JsonRpcProvider(CURRENT_CHAIN_ITEM.rpcUrl)

			provider
				.getStorageAt(contractDetail.address, IMPLEMENTATION_SLOT)
				.then((res) => {
					const logicAddress = utils.hexStripZeros(res)
					setLogicAddress(logicAddress)
				})
		}
	}, [isProxyContract, contractDetail])

	return (
		<ContractTabContext.Provider
			value={{ contractDetail, abi, isProxyContract, logicAddress }}
		>
			{children}
		</ContractTabContext.Provider>
	)
}
export default ContractTabProvider
