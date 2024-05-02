import { transactions } from '@/lib/generated/prisma/main'
import { Prisma, PrismaClient } from '@/lib/generated/prisma/shared'

import { CHAIN_TYPE } from '@/constants'

declare global {
	var sharePrisma:
		| PrismaClient<
				Prisma.PrismaClientOptions,
				'query' | 'info' | 'warn' | 'error'
		  >
		| undefined
}

const sharePrisma =
	global.sharePrisma ||
	new PrismaClient({
		log: [
			{
				emit: 'event',
				level: 'query',
			},
			{
				emit: 'stdout',
				level: 'error',
			},
			{
				emit: 'stdout',
				level: 'info',
			},
			{
				emit: 'stdout',
				level: 'warn',
			},
		],
	})

if (process.env.NODE_ENV === 'development') global.sharePrisma = sharePrisma

export default sharePrisma

type wrapTxAddressPublicTag = transactions & {
	from_address_public_tag?: string
	to_address_public_tag?: string
}

export const wrapTxAddressOnPublicTag = async (txs: transactions[]) => {
	const data = []
	try {
		const fromAddresses = txs
			.map((item) => item.from_address)
			.filter((address) => !!address) as string[]
		const toAddresses = txs
			.map((item) => item.to_address)
			.filter((address) => !!address) as string[]
		const fromRes = sharePrisma.public_tags.findMany({
			where: {
				address: {
					in: fromAddresses,
				},
				chain_name: CHAIN_TYPE,
			},
		})
		const toRes = sharePrisma.public_tags.findMany({
			where: {
				address: {
					in: toAddresses,
				},
				chain_name: CHAIN_TYPE,
			},
		})
		const [fromResult, toResult] = await Promise.all([fromRes, toRes])

		for (const tx of txs) {
			const _tx = { ...tx } as wrapTxAddressPublicTag
			const fromTag = fromResult.find(
				(item) => item.address === tx.from_address,
			)
			const toTag = toResult.find((item) => item.address === tx.to_address)
			_tx.from_address_public_tag = fromTag?.tags
				? JSON.parse(fromTag?.tags)[0]
				: ''
			_tx.to_address_public_tag = toTag?.tags ? JSON.parse(toTag.tags)[0] : ''
			data.push(_tx)
		}
		return data
	} catch (e) {
		console.log(e)
		return txs
	}
}
