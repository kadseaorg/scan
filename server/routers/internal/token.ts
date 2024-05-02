import { isAddress } from '@ethersproject/address'
import {
	createPagesServerClient,
	createRouteHandlerClient,
} from '@supabase/auth-helpers-nextjs'
import { uniqBy } from 'lodash-es'
import { cookies } from 'next/headers'
import { z } from 'zod'

import { TokenTypeEnum } from '@/types'

import prisma, { wrapMethodNames } from '../../prisma'
import { internalProcedure, router } from '../../trpc'
import { getUserIdFromSupabaseAndPrivy } from './account'

type CMCMarketCapRes = {
	id: number
	name: string
	symbol: string
	slug: string
	num_market_pairs: 132
	date_added: string
	tags: string[]
	max_supply: number | null
	circulating_supply: number
	total_supply: number
	platform?: {
		id: number
		name: string
		symbol: string
		slug: string
		token_address: string
	}
	infinite_supply: true
	cmc_rank: number
	self_reported_circulating_supply: number
	self_reported_market_cap: number
	tvl_ratio: null
	last_updated: string
	quote: Record<
		'USD' | 'ETH' | 'KAD',
		{
			price: number
			volume_24h: number
			volume_change_24h: number
			percent_change_1h: number
			percent_change_24h: number
			percent_change_7d: number
			market_cap: number
			market_cap_dominance: number
			fully_diluted_market_cap: number
			last_updated: string
		}
	>
}

let CMCMarketCapData: CMCMarketCapRes[]

async function fetchCMCMarketCap(): Promise<CMCMarketCapRes[]> {
	try {
		if (!!CMCMarketCapData) return Promise.resolve(CMCMarketCapData)

		async function fetchData() {
			try {
				const response = await fetch(
					'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=5000',
					{
						headers: {
							'Content-Type': 'application/json',
							'X-CMC_PRO_API_KEY': '770104e8-5953-4fb4-910b-c90a55180891',
						},
					},
				)
				const { data } = await response.json()
				CMCMarketCapData = data
			} catch (error) {
				console.log('fetchData cmc error')
				console.log(error)
			}
		}

		await fetchData()

		setInterval(fetchData, 24 * 60 * 60 * 1000)

		return Promise.resolve(CMCMarketCapData)
	} catch (error) {
		// return Promise.reject(error) //for test
		return []
	}
}

export const tokenRouter = router({
	hasToken: internalProcedure.input(z.string()).query(async ({ input }) => {
		const address = input.trim().toLowerCase()
		const token = await prisma.tokens.findUnique({
			where: {
				address: address,
			},
		})
		if (!token) {
			return false
		}
		return true
	}),
	getTokenDetail: internalProcedure
		.input(z.string())
		.query(async ({ input }) => {
			const address = input.trim().toLowerCase()
			const [contract, accountBalanceCount] = await Promise.all([
				prisma.$queryRaw<
					[
						| {
								name: string
								symbol: string
								address: string
								decimals: number
								total_supply: string
								token_type: string
						  }
						| undefined,
					]
				>`
            SELECT name, symbol, address, decimals, total_supply, token_type
            FROM tokens
            WHERE tokens.address = ${address}
        `,
				prisma.$queryRaw<[{ holders: number } | undefined]>`
            SELECT holders FROM mv_token_list
            WHERE address = ${address};
            `,
			])
			if (!contract[0]) {
				return null
			}

			const token = {
				...contract[0],
				holders: accountBalanceCount[0]?.holders || 0,
			}
			return token
		}),
	getTokenHolders: internalProcedure
		.input(
			z.object({
				address: z.string(),
				take: z.number().int().max(50).default(20).optional(),
				cursor: z.number().nullish(),
				desc: z.boolean().default(false),
			}),
		)
		.query(async ({ input }) => {
			const address = input.address.toLowerCase()
			const { take, cursor, desc } = input
			const holders = (await prisma.$queryRawUnsafe(`
        SELECT
            rank,
            address,
            quantity,
            percentage
        FROM
            mv_token_balances_summary
        WHERE
            token_address = '${address}'
        AND quantity > 0
        ORDER BY rank ${desc ? 'DESC' : 'ASC'}
        LIMIT ${take} OFFSET ${cursor ? cursor : 0};
    `)) as any[]

			return {
				list: holders,
				nextCursor:
					holders.length > 0 && holders.length == take
						? (cursor || 0) + (take || 0)
						: null,
			}
		}),
	getTokenList: internalProcedure
		.input(
			z.object({
				take: z.number().int().max(50).default(20).optional(),
				cursor: z.number().nullish(),
				desc: z.boolean().default(true),
				tokenType: z.string().default(TokenTypeEnum.ERC20),
			}),
		)
		.query(async ({ input, ctx }) => {
			// const supabase2 = createPagesServerClient({ req: ctx.req, res: ctx.res })
			// const { data } = await supabase2.auth.getSession()
			// const user_id = data.session?.user?.id
			const [userId, privyId] = await getUserIdFromSupabaseAndPrivy(ctx)
			const _CMCMarketCapData = await fetchCMCMarketCap()
			const { take, cursor, desc, tokenType } = input
			const tokensCountPromise = prisma.$queryRaw`
            SELECT COUNT(*) FROM mv_token_list WHERE token_type = ${tokenType}
      `
			// if erc20, return erc20 list order by holders
			if (tokenType == TokenTypeEnum.ERC20) {
				const tokensPromise = prisma.$queryRawUnsafe(`
            SELECT * FROM mv_token_list
            WHERE token_type = '${tokenType}'
            ORDER BY holders DESC
            LIMIT ${take} OFFSET ${cursor ? cursor : 0};
        `)
				const [tokensCount, tokens] = await Promise.all([
					tokensCountPromise,
					tokensPromise,
				])
				const count = tokensCount as any[]
				const tokenList = tokens as any[]
				if (userId || privyId) {
					const favoriteTokens = await prisma.token_watch_list.findMany({
						where: {
							user_id: { in: [userId, privyId].filter((item) => !!item) },
						},
					})
					console.log('favoriteTokens:', favoriteTokens)
					if (favoriteTokens?.length > 0) {
						tokenList.forEach((token) => {
							if (
								favoriteTokens.find(
									(favoriteToken) => favoriteToken.address === token.address,
								)
							) {
								token.is_favorite = true
							}
						})
					}
				}
				return {
					count: count[0].count,
					list: tokenList?.map((token) => {
						const cmcData = _CMCMarketCapData?.filter(
							({ symbol }) => symbol === token.symbol,
						)?.[0]
						const usdData = cmcData?.quote?.USD

						return {
							...token,
							...{
								price: usdData?.price?.toFixed(2) ?? 0,
								marketCap: usdData?.market_cap?.toFixed(2) ?? 0,
								volume24h: usdData?.volume_24h?.toFixed(2) ?? 0,
								percentChange24h: usdData?.percent_change_24h?.toFixed(2) ?? 0,
							},
						}
					}),
					nextCursor:
						tokenList.length > 0 && tokenList.length === take
							? (cursor || 0) + (take || 0)
							: null,
				}
			}
			// if erc721/erc1155, return erc721/erc1155 list order by trans24h
			if (
				[TokenTypeEnum.ERC721, TokenTypeEnum.ERC1155].includes(
					tokenType as TokenTypeEnum,
				)
			) {
				const sql = `
            SELECT * FROM mv_token_list
            WHERE token_type = '${tokenType}'
            ORDER BY trans24h DESC
            LIMIT ${take} OFFSET ${cursor ? cursor : 0};
        `
				const tokensPromise = prisma.$queryRawUnsafe(sql)
				const [tokensCount, tokens] = await Promise.all([
					tokensCountPromise,
					tokensPromise,
				])
				const count = tokensCount as any[]
				const tokenList = tokens as any[]
				return {
					count: count[0].count,
					list: tokenList,
					// ! we need a better way to handle cursor
					nextCursor:
						tokenList.length > 0 && tokenList.length === take
							? (cursor || 0) + (take || 0)
							: null,
				}
			}

			return {
				count: 0,
				list: [],
				nextCursor: null,
			}
		}),
	favoriteTokenMutation: internalProcedure
		.meta({ authRequired: true })
		.input(
			z.object({
				address: z.string().refine(isAddress, { message: 'invalid address!' }),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			// const user_id = ctx!.session!.user!.id
			const [userId, privyId] = await getUserIdFromSupabaseAndPrivy(ctx)
			const watchToken = userId
				? await prisma.token_watch_list.findUnique({
						where: {
							user_id_address: {
								user_id: userId,
								address: input.address.toLowerCase(),
							},
						},
				  })
				: null
			const watchTokenByPrivyId = privyId
				? await prisma.token_watch_list.findUnique({
						where: {
							user_id_address: {
								user_id: privyId,
								address: input.address.toLowerCase(),
							},
						},
				  })
				: null
			if (watchToken || watchTokenByPrivyId) {
				await prisma.token_watch_list
					.delete({
						where: {
							user_id_address: {
								user_id: userId,
								address: input.address.toLowerCase(),
							},
						},
					})
					.catch((e) => {
						console.log(e) //not exist
					})
				await prisma.token_watch_list
					.delete({
						where: {
							user_id_address: {
								user_id: privyId,
								address: input.address.toLowerCase(),
							},
						},
					})
					.catch((e) => {
						console.log(e) //not exist
					})
			} else {
				await prisma.token_watch_list.create({
					data: { user_id: privyId, address: input.address.toLowerCase() },
				})
			}
			return { message: 'success' }
		}),
	getFavoriteTokenList: internalProcedure
		.meta({ authRequired: true })
		.input(
			z.object({
				take: z.number().int().max(50).default(20).optional(),
				cursor: z.number().nullish(),
				desc: z.boolean().default(true),
				tokenType: z.string().default(TokenTypeEnum.ERC20),
			}),
		)
		.query(async ({ input, ctx }) => {
			const { take, cursor, desc, tokenType } = input
			// const user_id = ctx!.session!.user!.id
			const [userId, privyId] = await getUserIdFromSupabaseAndPrivy(ctx)
			// const [userId, privyId] = ['e2e85064-3ca2-433a-9645-fce612840042', 'did:privy:cls9w97d800jxicx7jb3ryx9q']
			const _CMCMarketCapData = await fetchCMCMarketCap()
			const sql = `SELECT mtl.*
      FROM token_watch_list AS wl
      JOIN mv_token_list mtl  ON wl.address = mtl.address
      WHERE wl.user_id in ('${[userId, privyId]
				.filter((item) => !!item)
				.join(`', '`)}')
      ORDER BY holders DESC
      LIMIT ${take} OFFSET ${cursor ? cursor : 0};`
			const favoriteTokens = uniqBy(
				(await prisma.$queryRawUnsafe(sql)) as any[],
				'address',
			)
			return {
				list: favoriteTokens?.map((token) => {
					const cmcData = _CMCMarketCapData?.filter(
						({ symbol }) => symbol === token.symbol,
					)?.[0]
					const usdData = cmcData?.quote?.USD

					return {
						...token,
						is_favorite: true,
						...{
							price: usdData?.price?.toFixed(2) ?? 0,
							marketCap: usdData?.market_cap?.toFixed(2) ?? 0,
							volume24h: usdData?.volume_24h?.toFixed(2) ?? 0,
							percentChange24h: usdData?.percent_change_24h?.toFixed(2) ?? 0,
						},
					}
				}),
				nextCursor:
					favoriteTokens.length > 0 && favoriteTokens.length === take
						? (cursor || 0) + (take || 0)
						: null,
			}
		}),
	getTokenTxsCount: internalProcedure
		.input(z.string())
		.query(async ({ input }) => {
			const address = input.toLowerCase()
			const transCount = (await prisma.$queryRawUnsafe(`
      SELECT COUNT(*)
      FROM token_transfers
      WHERE token_transfers.token_address = '${address}'
    `)) as any[]

			return transCount[0].count
		}),

	getTokenTxs: internalProcedure
		.input(
			z.object({
				address: z.string().optional(),
				tokenType: z.string().default(TokenTypeEnum.ERC20),
				take: z.number().int().max(50).default(20).optional(),
				cursor: z.number().nullish(),
				desc: z.boolean().default(true),
			}),
		)
		.query(async ({ input }) => {
			const address = input.address?.toLowerCase()
			const { take, cursor, desc, tokenType } = input

			const queryAddressFilter = address
				? `AND token_transfers.token_address = '${address}'`
				: ''

			let txs = (await prisma.$queryRawUnsafe(`
            WITH filtered_data AS (
                SELECT *
                FROM token_transfers
                WHERE token_type = '${tokenType}'
                ${queryAddressFilter}
                ${
									cursor
										? `AND token_transfers.id ${desc ? '<' : '>'} ${cursor}`
										: ''
								}
                ORDER BY token_transfers.id ${desc ? 'DESC' : 'ASC'}
                LIMIT ${take}
            )
            SELECT filtered_data.*, tokens.name, tokens.symbol, tokens.decimals
            FROM filtered_data
            INNER JOIN tokens ON filtered_data.token_address = tokens.address
            ORDER BY timestamp DESC
        `)) as any[]
			const wrappedTxs = await wrapMethodNames(txs)

			return {
				list: wrappedTxs,
				nextCursor:
					txs.length > 0 && txs.length == take ? txs[txs.length - 1].id : null,
			}
		}),
})
