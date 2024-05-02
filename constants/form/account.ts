import { isAddress, isHash } from 'viem'
import { z } from 'zod'

import { NotificationMethod } from '@/types'

export const nameTagAddSchema = z.object({
	tag: z.string().nonempty('Please input your tag name!'),
	note: z.string().optional(),
	address: z
		.string()
		.nonempty('Please enter the Contract Address')
		.refine(isAddress, 'Please enter the correct Contract Address'),
})

export const watchAddressSchema = z.object({
	address: z
		.string()
		.nonempty('Please input your address!')
		.refine(isAddress, 'The input is not valid address!'),
	email: z
		.string()
		.email('The input is not valid E-mail!')
		.nonempty('Please input your E-mail!'),
	notify_method: z.enum(Object.values(NotificationMethod)),
	notifyTransferTypes: z.array(z.number()).optional(),
	description: z.string().optional(),
})

export const txnNoteSchema = z.object({
	transaction_hash: z
		.string()
		.nonempty('Please input your transaction hash!')
		.refine(isHash, 'The input is not valid transaction hash!'),
	note: z.string().optional(),
})
