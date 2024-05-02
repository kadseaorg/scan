/**
 * This is your entry point to setup the root configuration for tRPC on the server.
 * - `initTRPC` should only be used once per app.
 * - We export only the functionality that we use so we can enforce which base procedures should be used
 *
 * Learn how to create protected base procedures and other things below:
 * @see https://trpc.io/docs/v10/router
 * @see https://trpc.io/docs/v10/procedures
 */
import { TRPCError, initTRPC } from '@trpc/server'
import { OpenApiMeta } from 'trpc-openapi'

import { getSupabaseAuthSession } from '@/utils/supabase'

import { transformer } from '../utils/transformer'
import { Context } from './context'
import { withRateLimiter } from './ratelimiter'

export const t = initTRPC
	.context<Context>()
	.meta<OpenApiMeta>()
	.create({
		/**
		 * @see https://trpc.io/docs/v10/data-transformers
		 */
		transformer,
		/**
		 * @see https://trpc.io/docs/v10/error-formatting
		 */
		errorFormatter({ shape }) {
			return shape
		},
	})

// middleware to check if user is authenticated
const isAuthed = t.middleware(async ({ meta, next, ctx }) => {
	if (meta?.authRequired) {
		try {
			const { req, res } = ctx
			const session = await getSupabaseAuthSession({ req, res })
			return next({ ctx: { ...ctx, session } })
		} catch (error) {
			throw new TRPCError({ code: 'UNAUTHORIZED' })
		}
	}

	return next()
})

// middleware to check if user is authenticated by Privy
const isPrivyAuthed = t.middleware(async ({ meta, ctx, next }) => {
	// check to make sure that the token was valid.
	// you can add further logic here, such as checking if the user is an admin,
	// if you added more user context within `createContext` above.
	if (meta?.authRequired) {
		if (!ctx.userClaim) {
			throw new TRPCError({
				code: 'UNAUTHORIZED',
				message: 'Not authenticated',
			})
		}
		return next({
			ctx,
		})
	}
	return next()
})

export const router = t.router

/**
 * Create an internal procedure
 * @see https://trpc.io/docs/v10/procedures
 **/
// export const internalProcedure = t.procedure.use(isAuthed)
export const internalProcedure = t.procedure.use(isPrivyAuthed)

/**
 * Create a public procedure
 * @see https://trpc.io/docs/v10/procedures
 **/
export const publicProcedure = t.procedure.use(t.middleware(withRateLimiter))

/**
 * Create a no auth public procedure
 * @see https://trpc.io/docs/v10/procedures
 * */
export const noAuthPublicProcedure = t.procedure

/**
 * @see https://trpc.io/docs/v10/middlewares
 */
export const middleware = t.middleware

/**
 * @see https://trpc.io/docs/v10/merging-routers
 */
export const mergeRouters = t.mergeRouters
