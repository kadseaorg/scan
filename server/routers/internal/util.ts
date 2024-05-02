import { isHexString } from '@ethersproject/bytes'
import { z } from 'zod'

import getExchangeRates from '@/lib/exchange-rates'
import { isPositiveInteger } from '@/utils'

import prisma from '../../prisma'
import sharePrisma from '../../share_prisma'
import { internalProcedure, router } from '../../trpc'

async function search({ input }: { input: string }) {
	const inputTrimmed = input.trim().toLowerCase()
	const inputLength = inputTrimmed.length

	// maybe block height
	if (isPositiveInteger(inputTrimmed)) {
		const blockCount = await prisma.blocks.count({
			where: {
				number: parseInt(inputTrimmed),
			},
		})
		if (blockCount > 0) {
			return { result: 'block' }
		}
		return { result: null }
	}

	// maybe block hash or tx hash or user address or contract address
	if (isHexString(inputTrimmed)) {
		if (inputLength === 42) {
			// maybe address-contract
			const contractCount = await prisma.contracts.count({
				where: { address: inputTrimmed },
			})
			if (contractCount > 0) {
				return { result: 'address-contract' }
			}

			// maybe token
			const tokenCount = await prisma.tokens.count({
				where: { address: inputTrimmed },
			})
			if (tokenCount > 0) {
				return { result: 'token' }
			}

			// maybe address-user (from transaction)
			return { result: 'address-user' }
		}
		if (inputLength === 66) {
			// maybe block hash
			const blockCount = await prisma.blocks.count({
				where: { hash: inputTrimmed },
			})
			if (blockCount > 0) {
				return { result: 'block' }
			}

			// maybe tx hash
			const transactionCount = await prisma.transactions.count({
				where: { hash: inputTrimmed },
			})
			if (transactionCount > 0) {
				return { result: 'transaction' }
			}

			// not match
			return { result: null }
		}
		return { result: null }
	}

	// maybe fts (full text search) for tokens/contracts/dapps
	const results = (await prisma.$queryRaw`
                (SELECT name, address as value, 'token' as type, NULL as logo, token_type FROM tokens WHERE to_tsvector('english', name) @@ plainto_tsquery('english', ${inputTrimmed}))
                UNION ALL
                (SELECT name, address as value, 'address-contract' as type, NULL as logo, NULL as token_type FROM contracts WHERE to_tsvector('english', name) @@ plainto_tsquery('english', ${inputTrimmed}))
                UNION ALL
                (SELECT name, id::text as value, 'dapp' as type, logo, NULL as token_type FROM dapps WHERE to_tsvector('english', name) @@ plainto_tsquery('english', ${inputTrimmed}));
              `) as {
		name: string
		value: string
		type: string
		token_type: string
		logo: string
	}[]

	return { result: results && results.length > 0 ? results : null }
}

export const utilRouter = router({
	search: internalProcedure.input(z.string()).query(search),
	searchMutation: internalProcedure.input(z.string()).mutation(search),
	getUsdExchangeRates: internalProcedure.query(async () => {
		const res = await getExchangeRates()
		return res
	}),
	//type: 'HOME'-home 'TRANSACTION_ADDRESS'-transaction list/transaction detail 'DAPP'-dapp
	getAds: internalProcedure
		.input(z.object({ type: z.enum(['HOME', 'TRANSACTION_ADDRESS', 'DAPP']) }))
		.query(async ({ input }) => {
			const advertisementList = await sharePrisma.advertisements.findMany({
				where: {
					chain: process.env.NEXT_PUBLIC_CHAIN,
					type: input.type,
					status: 1,
				},
				orderBy: {
					inserted_at: 'asc',
				},
			})

			return advertisementList
		}),
})
