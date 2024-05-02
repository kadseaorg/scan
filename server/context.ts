import { PrivyClient } from '@privy-io/server-auth'
import { AuthTokenClaims } from '@privy-io/server-auth'
import { Session } from '@supabase/supabase-js'
import * as trpc from '@trpc/server'
import * as trpcNext from '@trpc/server/adapters/next'
import { cookies } from 'next/headers'

import { PRIVY_TOKEN } from '@/constants'
import { cookieGetter } from '@/lib/utils'

export const privy = new PrivyClient(
	process.env.NEXT_PUBLIC_PRIVY_APP_ID || '',
	process.env.NEXT_PUBLIC_PRIVY_APP_SECRET || '',
)

interface CreateContextOptions {
	// session: Session | null
}

/**
 * Inner function for `createContext` where we create the context.
 * This is useful for testing when we don't want to mock Next.js' request/response
 */
export async function createContextInner(_opts: CreateContextOptions) {
	return {}
}

export type Context = trpc.inferAsyncReturnType<typeof createContext>

/**
 * Creates context for an incoming request
 * @link https://trpc.io/docs/context
 */
export async function createContext(
	opts: trpcNext.CreateNextContextOptions,
): Promise<
	trpcNext.CreateNextContextOptions & {
		session?: Session
		userClaim?: AuthTokenClaims
	}
> {
	// for API-response caching see https://trpc.io/docs/caching

	const { req } = opts
	const cookieStore = req.cookies
	// const authToken = req.headers?.authorization?.replace('Bearer ', '')
	let authToken
	if (cookieStore && cookieStore[PRIVY_TOKEN]) {
		authToken = cookieStore[PRIVY_TOKEN]
	}
	let userClaim: AuthTokenClaims | undefined

	if (authToken) {
		try {
			userClaim = await privy.verifyAuthToken(authToken)
			// the claim contains all details about the validated privy token and can be passed
			// via the context for use in all server routes
			// if you want to pull additional details about the user via your api / db, such as whether the user is an
			// admin, here's your chance!
		} catch (_) {
			// this is an expected error for tRPC procedures that don't need to be authenticated
			// if privy is expected, we will throw a 403 at the middleware level, shown in the next step
		}
	}
	return {
		...opts,
		userClaim,
	}
	// return opts
}
