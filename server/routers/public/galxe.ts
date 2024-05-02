import { privy } from '@/server/context'
import { isAddress } from 'viem'
import { z } from 'zod'

import { publicApiBasePath } from '@/constants/api'
import prisma from '../../prisma'
import { noAuthPublicProcedure, router } from '../../trpc'

export const galxeRouter = router({
	checkAddressSignedIn: noAuthPublicProcedure
		.meta({
			openapi: {
				method: 'GET',
				path: `${publicApiBasePath}/galxe/check_address_signed_in/{address}`,
				tags: ['Beta | Galxe'],
				summary: 'Check if address has logged in',
				protect: true,
			},
		})
		.input(
			z.object({
				address: z
					.string()
					.refine(isAddress, { message: 'invalid address' })
					.transform((v) => v.trim().toLowerCase()),
			}),
		)
		.output(
			z.object({
				is_ok: z.boolean(),
			}),
		)
		.query(async ({ input }) => {
			const { address } = input
			const user = await privy.getUserByWalletAddress(address)
			return { is_ok: !!user }
		}),
	checkAddressHasFavoriteDapps: noAuthPublicProcedure
		.meta({
			openapi: {
				method: 'GET',
				path: `${publicApiBasePath}/galxe/check_address_has_favorite_dapps/{address}`,
				tags: ['Beta | Galxe'],
				summary: 'Check if address has favorite dapps',
				protect: true,
			},
		})
		.input(
			z.object({
				address: z
					.string()
					.refine(isAddress, { message: 'invalid address' })
					.transform((v) => v.trim().toLowerCase()),
			}),
		)
		.output(
			z.object({
				is_ok: z.boolean(),
			}),
		)
		.query(async ({ input }) => {
			const { address } = input
			const user = await privy.getUserByWalletAddress(address)
			if (!user) {
				return { is_ok: false }
			}

			const { id } = user

			const favoriteDapps = await prisma.dapp_watch_list.findMany({
				where: {
					user_id: id,
				},
			})
			return { is_ok: favoriteDapps && favoriteDapps.length > 0 ? true : false }
		}),
	checkAddressHasFavoriteWatchlist: noAuthPublicProcedure
		.meta({
			openapi: {
				method: 'GET',
				path: `${publicApiBasePath}/galxe/check_address_has_favorite_watchlist/{address}`,
				tags: ['Beta | Galxe'],
				summary: 'Check if address has favorite watchlist',
				protect: true,
			},
		})
		.input(
			z.object({
				address: z
					.string()
					.refine(isAddress, { message: 'invalid address' })
					.transform((v) => v.trim().toLowerCase()),
			}),
		)
		.output(
			z.object({
				is_ok: z.boolean(),
			}),
		)
		.query(async ({ input }) => {
			const { address } = input
			const user = await privy.getUserByWalletAddress(address)
			if (!user) {
				return { is_ok: false }
			}

			const { id } = user

			const favoriteWatchlist = await prisma.account_watch_list.findMany({
				where: {
					user_id: id,
				},
			})
			return {
				is_ok: favoriteWatchlist && favoriteWatchlist.length > 0 ? true : false,
			}
		}),
})
