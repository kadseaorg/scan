import { isAddress } from '@ethersproject/address'
import { z } from 'zod'

import {
	ContractCompilerTypeEnum,
	ZkSyncContractCompilerTypeEnum,
} from '@/types/contract'

import { IsZkSync } from '../chain'

export const contractVerifySchema = z.object({
	contractAddress: z
		.string()
		.nonempty('Please enter the Contract Address')
		.refine(
			(value) => isAddress(value),
			'Please enter the correct Contract Address',
		),
	contractCompilerType: z
		.enum(
			IsZkSync
				? Object.values(ZkSyncContractCompilerTypeEnum)
				: (Object.values(ContractCompilerTypeEnum) as any),
		)
		.refine(
			(value) => Object.values(ContractCompilerTypeEnum).includes(value as any),
			'Please select compiler type',
		),
	contractCompilerVersion: z
		.string()
		.nonempty('Please select Compiler Version'),
})

export const codeReaderSchema = z.object({
	api_key: z.string().nonempty('Please enter an OpenAI API Key.'),
})
