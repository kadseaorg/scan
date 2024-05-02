import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'
import { uniqBy } from 'lodash-es'
import { z } from 'zod'

import { EnumViewRange } from '@/components/dapp/detail/types'

import prisma, { getDappTxnStats, getDappUAWStats } from '../../prisma'
import sharePrisma from '../../share_prisma'
import { internalProcedure, router } from '../../trpc'
import { getUserIdFromSupabaseAndPrivy } from './account'
import { IsZkSync } from '@/constants'

const dappTypes = ['games', 'defi', 'dex', 'datasource', 'social']

export const dappRouter = router({
	getDapps: internalProcedure.query(async ({ input, ctx }) => {
		const [userId, privyId] = await getUserIdFromSupabaseAndPrivy(ctx)
		const dapps =
			(await prisma.$queryRaw`SELECT id, name, team, logo, description, contract, categories, website, discord, media_url, telegram, twitter, youtube, addresses FROM dapps`) as any[]

		const uawPromises = dapps.map((dapp) => getDappUAWStats(dapp.id))
		const txnPromises = dapps.map((dapp) => getDappTxnStats(dapp.id))

		const uawObjList = await Promise.all(uawPromises) // it's empty for zksync
		const txnObjList = await Promise.all(txnPromises)

		const list = []
		for (let i = 0; i < txnObjList.length; i++) {
			list.push({
				...dapps[i],
				uaw_count: uawObjList[i].total_count,
				uaw_growth_percentage: uawObjList[i].growth_percentage,
				txn_count: txnObjList[i].total_count,
				txn_growth_percentage: txnObjList[i].growth_percentage,
			})
		}
		if (userId || privyId) {
			const favoriteDapps = await prisma.dapp_watch_list.findMany({
				where: {
					user_id: { in: [userId, privyId].filter((item) => !!item) },
				},
			})
			if (favoriteDapps?.length > 0) {
				list.forEach((dapp) => {
					if (
						favoriteDapps.find(
							(favoriteDapp) => favoriteDapp.dapp_id === dapp.id,
						)
					) {
						dapp.is_favorite = true
					}
				})
			}
		}
		// sort by txn count desc
		list.sort((a, b) => b.txn_count - a.txn_count)

		return {
			list,
		}
	}),
	getFavoriteDappList: internalProcedure
		.meta({ authRequired: true })
		.input(
			z.object({
				take: z.number().int().max(50).default(20).optional(),
				cursor: z.number().nullish(),
				desc: z.boolean().default(true),
			}),
		)
		.query(async ({ input, ctx }) => {
			const { take, cursor, desc } = input
			const [userId, privyId] = await getUserIdFromSupabaseAndPrivy(ctx)

			const favoriteDapps = uniqBy(
				(await prisma.$queryRawUnsafe(`
      SELECT dapps.*
      FROM dapp_watch_list AS wl
      JOIN dapps ON wl.dapp_id = dapps.id
      WHERE wl.user_id in ('${[userId, privyId]
				.filter((item) => !!item)
				.join(`', '`)}');
  `)) as any[],
				'id',
			)
			return {
				list: favoriteDapps.map((dapp) => ({
					...dapp,
					is_favorite: true,
				})),
				nextCursor:
					favoriteDapps.length > 0 && favoriteDapps.length === take
						? (cursor || 0) + (take || 0)
						: null,
			}
		}),
	favoriteDappMutation: internalProcedure
		.meta({ authRequired: true })
		.input(
			z.object({
				id: z.number(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const [userId, privyId] = await getUserIdFromSupabaseAndPrivy(ctx)
			const watchDapp = userId
				? await prisma.dapp_watch_list.findUnique({
						where: { user_id_dapp_id: { user_id: userId, dapp_id: input.id } },
				  })
				: null
			const watchDappByPrivyId = privyId
				? await prisma.dapp_watch_list.findUnique({
						where: { user_id_dapp_id: { user_id: privyId, dapp_id: input.id } },
				  })
				: null
			if (watchDapp || watchDappByPrivyId) {
				await prisma.dapp_watch_list
					.delete({
						where: { user_id_dapp_id: { user_id: userId, dapp_id: input.id } },
					})
					.catch((e) => {
						console.log(e) //not exist
					})
				await prisma.dapp_watch_list
					.delete({
						where: { user_id_dapp_id: { user_id: privyId, dapp_id: input.id } },
					})
					.catch((e) => {
						console.log(e) //not exist
					})
			} else {
				await prisma.dapp_watch_list.create({
					data: { user_id: privyId, dapp_id: input.id },
				})
			}
			return { message: 'success' }
		}),
	getDappDetail: internalProcedure
		.input(z.number())
		.query(async ({ input, ctx }) => {
			const [userId, privyId] = await getUserIdFromSupabaseAndPrivy(ctx)

			// Fetch basic dapp data.
			const dappDetail = await prisma.dapps.findUnique({
				where: {
					id: input,
				},
			})
			let is_favorite = false
			if ((userId || privyId) && dappDetail) {
				const favoriteDapp = await prisma.dapp_watch_list.findFirst({
					where: {
						dapp_id: input,
						user_id: { in: [userId, privyId].filter((item) => !!item) },
					},
				})
				if (favoriteDapp) {
					is_favorite = true
				}
			}

			if (!dappDetail) {
				return null
			}

			// Fetch category rankings for the dapp.
			const categoryRankings = !IsZkSync
				? ((await prisma.$queryRaw`
          SELECT category, total_ranking
          FROM mv_dapp_category_total_uaw_ranking
          WHERE dapp_id = ${input}
      `) as any[])
				: []

			return {
				...dappDetail,
				is_favorite,
				categoryRankings,
			}
		}),
	getDappAddressInfos: internalProcedure
		.input(z.number())
		.query(async ({ input }) => {
			const addresses = await prisma.dapps.findUnique({
				where: { id: input },
				select: { addresses: true },
			})
			if (!addresses) {
				return null
			}

			const data = await Promise.all(
				addresses.addresses.map((address) =>
					sharePrisma.public_tags.findUnique({
						where: {
							address: address.toLowerCase(),
							chain_name: process.env.NEXT_PUBLIC_CHAIN,
						},
					}),
				),
			)
			const list =
				addresses.addresses.map((address, index) => {
					return { address, ...(data[index] || {}) }
				}) || []

			return { list }
		}),
	getDappTxnsCountByRange: internalProcedure
		.input(
			z.object({
				range: z.enum([
					EnumViewRange.ALL,
					EnumViewRange.DAY30,
					EnumViewRange.Day7,
				]),
				dappId: z.number(),
			}),
		)
		.query(async ({ input }) => {
			let dateCondition = ''
			switch (input.range) {
				case '7d':
					dateCondition = "AND date >= CURRENT_DATE - INTERVAL '7 days'"
					break
				case '30d':
					dateCondition = "AND date >= CURRENT_DATE - INTERVAL '30 days'"
					break
				case 'all':
				default:
					dateCondition = ''
			}

			const sql = `
      SELECT dapp_id, date, count
      FROM mv_dapp_daily_transactions
      WHERE dapp_id = ${input.dappId}
      ${dateCondition}
      ORDER BY date ASC
      `

			const result = (await prisma.$queryRawUnsafe(sql)) as any[]
			return result
		}),
	getDappUawDataByRange: internalProcedure
		.input(
			z.object({
				range: z.string(),
				dappId: z.number(),
			}),
		)
		.query(async ({ input }) => {
			let dateCondition = ''
			switch (input.range) {
				case '7d':
					dateCondition = "AND date >= CURRENT_DATE - INTERVAL '7 days'"
					break
				case '30d':
					dateCondition = "AND date >= CURRENT_DATE - INTERVAL '30 days'"
					break
				case 'all':
				default:
					dateCondition = ''
			}

			const sql = `
      SELECT dapp_id, date, count
      FROM mv_dapp_daily_unique_active_addresses
      WHERE dapp_id = ${input.dappId}
      ${dateCondition}
      ORDER BY date ASC
      `

			const result = !IsZkSync
				? ((await prisma.$queryRawUnsafe(sql)) as any[])
				: []

			return result
		}),
	getDappRecommended: internalProcedure
		.input(
			z.object({
				categray: z.string(),
			}),
		)
		.query(async ({ input }) => {
			const tagDapps = await prisma.dapps.findMany({
				where: {
					categories: {
						has: input.categray,
					},
				},
				take: 3,
			})

			return tagDapps
		}),
})
