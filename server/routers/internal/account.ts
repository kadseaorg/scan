import { getAddress, isAddress } from '@ethersproject/address'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'

import { MAX_TAG_LIMIT } from '@/constants'
import { MAX_WATCH_LIMIT } from '@/pages/account/watch-list'
import { privy } from '@/server/context'
import { ContractTypeEnum, NotificationMethod } from '@/types'

import prisma from '../../prisma'
import sharePrisma from '../../share_prisma'
import { internalProcedure, router } from '../../trpc'

export const getUserIdFromSupabaseAndPrivy = async (ctx: any) => {
	const privyId = ctx.userClaim?.userId
	let supabseId = ''
	let user
	if (privyId) {
		try {
			user = await privy.getUser(privyId)
		} catch (e) {
			console.log(e)
		}
	}

	if (user) {
		const email =
			user.email?.address || user.google?.email || user.github?.email
		try {
			const supabaseUser = (await sharePrisma.$queryRawUnsafe(`
    select * from auth.users where email = '${email}';
    `)) as any[]
			if (supabaseUser[0]) {
				supabseId = supabaseUser[0].id
			}
		} catch (e) {
			console.log(e)
		}
	}
	return [supabseId, privyId]
}

export const accountRouter = router({
	getWatchList: internalProcedure
		.meta({ authRequired: true })
		.query(async ({ input, ctx }) => {
			// const userId = ctx!.session!.user!.id
			const [userId, privyId] = await getUserIdFromSupabaseAndPrivy(ctx)

			const queryOptions: any = {
				where: { user_id: { in: [userId, privyId] } },
			}

			const watchList = await prisma.account_watch_list.findMany(queryOptions)

			const count = await prisma.account_watch_list.count({
				where: { user_id: { in: [userId, privyId].filter((item) => !!item) } },
			})

			return {
				count,
				list: watchList?.map((data) => {
					data.address = getAddress(data.address as string)
					const notifyTransferTypes: number[] = []

					if (!!data?.track_erc20)
						notifyTransferTypes.push(ContractTypeEnum.ERC20)
					if (!!data?.track_erc721)
						notifyTransferTypes.push(ContractTypeEnum.ERC721)
					if (!!data?.track_erc1155)
						notifyTransferTypes.push(ContractTypeEnum.ERC1155)

					return { ...data, notifyTransferTypes }
				}),
			}
		}),
	watchAddressMutation: internalProcedure
		.meta({ authRequired: true })
		.input(
			z.object({
				isAdd: z.boolean().optional(),
				address: z.string().refine(isAddress, { message: 'invalid address!' }),
				email: z.string().email().optional().nullable(),
				description: z.string().max(300).optional().nullable(),
				notify_method: z.nativeEnum(NotificationMethod).optional(),
				notifyTransferTypes: z.array(z.nativeEnum(ContractTypeEnum)).optional(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const {
				isAdd = true,
				address,
				email,
				description,
				notify_method,
				notifyTransferTypes = [],
			} = input
			// const userId = ctx!.session!.user!.id
			const [userId, privyId] = await getUserIdFromSupabaseAndPrivy(ctx)
			const watchData = userId
				? await prisma.account_watch_list.findUnique({
						where: {
							user_id_address: {
								user_id: userId,
								address: address.toLowerCase(),
							},
						},
				  })
				: null
			const watchDataByPrivyId = privyId
				? await prisma.account_watch_list.findUnique({
						where: {
							user_id_address: {
								user_id: privyId,
								address: address.toLowerCase(),
							},
						},
				  })
				: null

			if (
				isAdd &&
				((!!watchData && !!userId) || (!!watchDataByPrivyId && privyId))
			)
				throw Error('Address has already been added to the list!')

			if (isAdd) {
				const count = await prisma.account_watch_list.count({
					where: {
						user_id: { in: [userId, privyId].filter((item) => !!item) },
					},
				})

				if (count === MAX_WATCH_LIMIT) throw Error('Maximum limit exceeded!')
			}

			const data: any = {
				email,
				notification_method: notify_method,
				track_erc20: notifyTransferTypes?.includes(ContractTypeEnum.ERC20),
				track_erc721: notifyTransferTypes?.includes(ContractTypeEnum.ERC721),
				track_erc1155: notifyTransferTypes?.includes(ContractTypeEnum.ERC1155),
				description,
			}

			if (userId && watchData) {
				await prisma.account_watch_list.upsert({
					where: {
						user_id_address: {
							user_id: userId,
							address: address.toLowerCase(),
						},
					},
					create: { user_id: privyId, address: address.toLowerCase(), ...data },
					update: { user_id: privyId, ...data },
				})
			} else {
				await prisma.account_watch_list.upsert({
					where: {
						user_id_address: {
							user_id: privyId,
							address: address.toLowerCase(),
						},
					},
					create: { user_id: privyId, address: address.toLowerCase(), ...data },
					update: { ...data },
				})
			}

			return { message: 'success' }
		}),
	deleteWatchAddress: internalProcedure
		.meta({ authRequired: true })
		.input(z.string().refine(isAddress, { message: 'invalid address!' }))
		.mutation(async ({ input, ctx }) => {
			// const userId = ctx!.session!.user!.id
			const [userId, privyId] = await getUserIdFromSupabaseAndPrivy(ctx)
			if (userId) {
				await prisma.account_watch_list
					.delete({
						where: {
							user_id_address: {
								user_id: userId,
								address: input.toLowerCase(),
							},
						},
					})
					.catch((e) => {
						console.log(e) //not exist
					})
			}
			await prisma.account_watch_list
				.delete({
					where: {
						user_id_address: { user_id: privyId, address: input.toLowerCase() },
					},
				})
				.catch((e) => {
					console.log(e) //not exist
				})

			return { message: 'success' }
		}),
	getTags: internalProcedure
		.meta({ authRequired: true })
		.query(async ({ ctx }) => {
			// const userId = ctx!.session!.user!.id
			const [userId, privyId] = await getUserIdFromSupabaseAndPrivy(ctx)
			const tagList =
				(await sharePrisma.account_tags.findMany({
					where: {
						user_id: { in: [userId, privyId].filter((item) => !!item) },
						address: { not: null },
						tag: { not: null },
					},
					orderBy: { updated_at: 'desc' },
				})) || []

			const count = await sharePrisma.account_tags.count({
				where: {
					user_id: { in: [userId, privyId].filter((item) => !!item) },
					address: { not: null },
					tag: { not: null },
				},
			})

			return {
				count,
				list: tagList,
			}
		}),
	getAllAddressTagList: internalProcedure
		.meta({ authRequired: true })
		.query(async ({ ctx }) => {
			// const userId = ctx!.session!.user!.id
			const [userId, privyId] = await getUserIdFromSupabaseAndPrivy(ctx)

			const tagList =
				(await sharePrisma.account_tags.findMany({
					where: {
						user_id: { in: [userId, privyId].filter((item) => !!item) },
					},
					orderBy: { updated_at: 'asc' },
				})) || []

			return tagList
		}),
	createAddressTag: internalProcedure
		.meta({ authRequired: true })
		.input(
			z.object({
				isAdd: z.boolean().optional(),
				address: z.string().refine(isAddress, { message: 'invalid address!' }),
				tag: z.string().max(35).optional(),
				note: z.string().max(500).optional().nullable(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const { isAdd = true, address, tag, note } = input
			// const userId = ctx!.session!.user!.id
			const [userId, privyId] = await getUserIdFromSupabaseAndPrivy(ctx)
			const tagData = userId
				? await sharePrisma.account_tags.findUnique({
						where: {
							user_id_address: {
								user_id: userId,
								address: address.toLowerCase(),
							},
						},
				  })
				: null
			const tagDataByPrivyId = await sharePrisma.account_tags.findUnique({
				where: {
					user_id_address: { user_id: privyId, address: address.toLowerCase() },
				},
			})

			if (isAdd && ((!!tagData && userId) || (!!tagDataByPrivyId && privyId)))
				throw Error('Address has already been added to the list!')

			if (isAdd) {
				const count = await sharePrisma.account_tags.count({
					where: {
						user_id: { in: [userId, privyId].filter((item) => !!item) },
					},
				})

				if (count === MAX_TAG_LIMIT) throw Error('Maximum limit exceeded!')
			}

			const data = {
				tag,
				note,
			}
			if (tagData && userId) {
				await sharePrisma.account_tags.upsert({
					where: {
						user_id_address: {
							user_id: userId,
							address: address.toLowerCase(),
						},
					},
					create: { user_id: privyId, address: address.toLowerCase(), ...data },
					update: { user_id: privyId, ...data },
				})
			} else {
				await sharePrisma.account_tags.upsert({
					where: {
						user_id_address: {
							user_id: privyId,
							address: address.toLowerCase(),
						},
					},
					create: { user_id: privyId, address: address.toLowerCase(), ...data },
					update: { ...data },
				})
			}

			return { message: 'success' }
		}),
	deleteAddressTag: internalProcedure
		.meta({ authRequired: true })
		.input(z.string().refine(isAddress, { message: 'invalid address!' }))
		.mutation(async ({ input, ctx }) => {
			// const userId = ctx!.session!.user!.id
			const [userId, privyId] = await getUserIdFromSupabaseAndPrivy(ctx)

			if (userId) {
				await sharePrisma.account_tags
					.delete({
						where: {
							user_id_address: {
								user_id: userId,
								address: input.toLowerCase(),
							},
						},
					})
					.catch((e) => {
						console.log(e) //not exist
					})
			}
			await sharePrisma.account_tags
				.delete({
					where: {
						user_id_address: { user_id: privyId, address: input.toLowerCase() },
					},
				})
				.catch((e) => {
					console.log(e) //not exist
				})

			return { message: 'success' }
		}),
	getTransactionNotes: internalProcedure
		.meta({ authRequired: true })
		.query(async ({ ctx }) => {
			// const userId = ctx!.session!.user!.id
			const [userId, privyId] = await getUserIdFromSupabaseAndPrivy(ctx)
			const tagList =
				(await sharePrisma.account_tags.findMany({
					where: {
						user_id: { in: [userId, privyId].filter((item) => !!item) },
						transaction_hash: { not: null },
						note: { not: null },
					},
					orderBy: { updated_at: 'desc' },
				})) || []

			const count = await sharePrisma.account_tags.count({
				where: {
					user_id: { in: [userId, privyId].filter((item) => !!item) },
					transaction_hash: { not: null },
					note: { not: null },
				},
			})

			return {
				count,
				list: tagList,
			}
		}),
	getTransactionNote: internalProcedure
		.meta({ authRequired: true })
		.input(z.string())
		.query(async ({ input, ctx }) => {
			// const userId = ctx!.session!.user!.id
			const [userId, privyId] = await getUserIdFromSupabaseAndPrivy(ctx)

			const noteData = userId
				? await sharePrisma.account_tags.findUnique({
						where: {
							user_id_transaction_hash: {
								user_id: userId,
								transaction_hash: input.toLowerCase(),
							},
						},
				  })
				: null

			const noteDataByPrivyId = privyId
				? await sharePrisma.account_tags.findUnique({
						where: {
							user_id_transaction_hash: {
								user_id: privyId,
								transaction_hash: input.toLowerCase(),
							},
						},
				  })
				: null

			return noteData || noteDataByPrivyId
		}),
	UpsertTransactionNote: internalProcedure
		.meta({ authRequired: true })
		.input(
			z.object({
				transaction_hash: z.string(),
				note: z.string().max(500),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const { transaction_hash, note } = input
			// const userId = ctx!.session!.user!.id
			const [userId, privyId] = await getUserIdFromSupabaseAndPrivy(ctx)

			const data = { note }

			const noteData = userId
				? await sharePrisma.account_tags.findUnique({
						where: {
							user_id_transaction_hash: {
								user_id: userId,
								transaction_hash: transaction_hash.toLowerCase(),
							},
						},
				  })
				: null
			if (userId && noteData) {
				await sharePrisma.account_tags.upsert({
					where: {
						user_id_transaction_hash: {
							user_id: userId,
							transaction_hash: transaction_hash.toLowerCase(),
						},
					},
					create: {
						user_id: privyId,
						transaction_hash: transaction_hash.toLowerCase(),
						...data,
					},
					update: { user_id: privyId, ...data },
				})
			} else {
				await sharePrisma.account_tags.upsert({
					where: {
						user_id_transaction_hash: {
							user_id: privyId,
							transaction_hash: transaction_hash.toLowerCase(),
						},
					},
					create: {
						user_id: privyId,
						transaction_hash: transaction_hash.toLowerCase(),
						...data,
					},
					update: { ...data },
				})
			}

			return { message: 'success' }
		}),
	deleteTransactionTag: internalProcedure
		.meta({ authRequired: true })
		.input(z.string())
		.mutation(async ({ input, ctx }) => {
			// const userId = ctx!.session!.user!.id
			const [userId, privyId] = await getUserIdFromSupabaseAndPrivy(ctx)
			if (userId) {
				await sharePrisma.account_tags
					.delete({
						where: {
							user_id_transaction_hash: {
								user_id: userId,
								transaction_hash: input.toLowerCase(),
							},
						},
					})
					.catch((e) => {
						console.log(e) //not exist
					})
			}
			await sharePrisma.account_tags
				.delete({
					where: {
						user_id_transaction_hash: {
							user_id: privyId,
							transaction_hash: input.toLowerCase(),
						},
					},
				})
				.catch((e) => {
					console.log(e) //not exist
				})
			return { message: 'success' }
		}),

	getOrApplyForApiKey: internalProcedure
		.meta({ authRequired: true })
		.query(async ({ ctx }) => {
			// const userId = ctx!.session!.user!.id
			const [userId, privyId] = await getUserIdFromSupabaseAndPrivy(ctx)
			const res = userId
				? await sharePrisma.api_keys.findUnique({
						where: { user_id: userId },
						select: { api_key: true },
				  })
				: null

			const resByPrivyId = await sharePrisma.api_keys.findUnique({
				where: { user_id: privyId },
				select: { api_key: true },
			})

			if (!res?.api_key && !resByPrivyId?.api_key) {
				const apiKey = uuidv4()
				await sharePrisma.api_keys.create({
					data: { user_id: privyId, api_key: apiKey },
				})
				return apiKey
			}

			return res?.api_key || resByPrivyId?.api_key
		}),
	resetApiKey: internalProcedure
		.meta({ authRequired: true })
		.mutation(async ({ ctx }) => {
			// const userId = ctx!.session!.user!.id
			const [userId, privyId] = await getUserIdFromSupabaseAndPrivy(ctx)
			const apiKey = uuidv4()
			const res = userId
				? await sharePrisma.api_keys.findUnique({
						where: { user_id: userId },
						select: { api_key: true },
				  })
				: null
			if (userId && res?.api_key) {
				await sharePrisma.api_keys.upsert({
					where: { user_id: userId },
					create: { user_id: privyId, api_key: apiKey },
					update: { user_id: privyId, api_key: apiKey },
				})
			} else {
				await sharePrisma.api_keys.upsert({
					where: { user_id: privyId },
					create: { user_id: privyId, api_key: apiKey },
					update: { api_key: apiKey },
				})
			}

			return apiKey
		}),
	getMyAccountsList: internalProcedure
		.meta({ authRequired: true })
		.query(async ({ ctx }) => {
			// const userId = ctx!.session!.user!.id
			const [userId, privyId] = await getUserIdFromSupabaseAndPrivy(ctx)

			const accountsList = userId
				? await sharePrisma.accounts_list.findUnique({
						where: { user_id: userId },
				  })
				: null
			const accountsListByPrivyId = privyId
				? await sharePrisma.accounts_list.findUnique({
						where: { user_id: privyId },
				  })
				: null

			if (userId && accountsList?.address_list) {
				return {
					list: JSON.parse(accountsList?.address_list || '[]')?.map(
						(address: string) => getAddress(address),
					) as string[],
				}
			} else {
				return {
					list: JSON.parse(accountsListByPrivyId?.address_list || '[]')?.map(
						(address: string) => getAddress(address),
					) as string[],
				}
			}
		}),
	addMyAccountsList: internalProcedure
		.meta({ authRequired: true })
		.input(z.string().refine(isAddress, { message: 'invalid address!' }))
		.mutation(async ({ input, ctx }) => {
			// const userId = ctx!.session!.user!.id
			const [userId, privyId] = await getUserIdFromSupabaseAndPrivy(ctx)
			const address = input.toLowerCase()

			const accountsList = userId
				? await sharePrisma.accounts_list.findUnique({
						where: { user_id: userId },
				  })
				: null
			const accountsListByPrivyId = await sharePrisma.accounts_list.findUnique({
				where: { user_id: privyId },
			})
			if (userId && accountsList?.address_list) {
				const listArray = JSON.parse(accountsList?.address_list || '[]')
				if (!!!listArray.length) {
					await sharePrisma.accounts_list.create({
						data: { user_id: privyId, address_list: JSON.stringify([address]) },
					})
				} else {
					if (listArray.includes(address)) {
						await sharePrisma.accounts_list.update({
							where: { user_id: userId },
							data: {
								user_id: privyId,
								address_list: JSON.stringify(listArray),
							},
						})
						throw Error('Address has already been added to the list!')
					}

					listArray.push(address)
					await sharePrisma.accounts_list.update({
						where: { user_id: userId },
						data: { user_id: privyId, address_list: JSON.stringify(listArray) },
					})
				}
			} else {
				const listArray = JSON.parse(
					accountsListByPrivyId?.address_list || '[]',
				)
				if (!!!listArray.length) {
					await sharePrisma.accounts_list.create({
						data: { user_id: privyId, address_list: JSON.stringify([address]) },
					})
				} else {
					if (listArray.includes(address)) {
						throw Error('Address has already been added to the list!')
					}

					listArray.push(address)
					await sharePrisma.accounts_list.update({
						where: { user_id: privyId },
						data: { address_list: JSON.stringify(listArray) },
					})
				}
			}

			return { message: 'success' }
		}),
	deleteMyAccountsList: internalProcedure
		.meta({ authRequired: true })
		.input(z.string().refine(isAddress, { message: 'invalid address!' }))
		.mutation(async ({ input, ctx }) => {
			// const userId = ctx!.session!.user!.id
			const [userId, privyId] = await getUserIdFromSupabaseAndPrivy(ctx)
			const address = input.toLowerCase()

			const accountsList = userId
				? await sharePrisma.accounts_list.findUnique({
						where: { user_id: userId },
				  })
				: null
			const accountsListByPrivyId = await sharePrisma.accounts_list.findUnique({
				where: { user_id: privyId },
			})

			if (userId && accountsList?.address_list) {
				const leftAddress = JSON.parse(
					accountsList?.address_list || '[]',
				).filter((_address: string) => _address !== address)

				if (!!!leftAddress?.length) {
					await sharePrisma.accounts_list
						.delete({ where: { user_id: userId } })
						.catch((e) => {
							console.log(e) //not exist
						})
				} else {
					await sharePrisma.accounts_list.update({
						where: { user_id: userId },
						data: {
							user_id: privyId,
							address_list: JSON.stringify(leftAddress),
						},
					})
				}
			} else {
				const leftAddress = JSON.parse(
					accountsListByPrivyId?.address_list || '[]',
				).filter((_address: string) => _address !== address)

				if (!!!leftAddress?.length) {
					await sharePrisma.accounts_list
						.delete({ where: { user_id: privyId } })
						.catch((e) => {
							console.log(e) //not exist
						})
				} else {
					await sharePrisma.accounts_list.update({
						where: { user_id: privyId },
						data: { address_list: JSON.stringify(leftAddress) },
					})
				}
			}

			return { message: 'success' }
		}),
	deleteAccount: internalProcedure
		.meta({ authRequired: true })
		.mutation(async ({ input, ctx }) => {
			try {
				const privyId = ctx.userClaim?.userId
				await privy.deleteUser(privyId!)
				return { message: 'success' }
			} catch (e) {
				console.log(e)
			}
		}),
})
