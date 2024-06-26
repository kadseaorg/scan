import { getAccessToken } from '@privy-io/react-auth'
import { httpLink, loggerLink } from '@trpc/client'
import { createTRPCNext } from '@trpc/next'
import { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import { NextPageContext } from 'next'

// ℹ️ Type-only import:
// https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html#type-only-imports-and-export
import type { AppRouter } from '../server/routers/_app'
import { transformer } from './transformer'

function getBaseUrl() {
	if (typeof window !== 'undefined') {
		return ''
	}
	// reference for vercel.com
	if (process.env.VERCEL_URL) {
		return `https://${process.env.VERCEL_URL}`
	}

	// reference for render.com
	if (process.env.RENDER_INTERNAL_HOSTNAME) {
		return `http://${process.env.RENDER_INTERNAL_HOSTNAME}:${process.env.PORT}`
	}

	// assume localhost
	return `http:/localhost:${process.env.PORT ?? 3000}`
}

/**
 * Extend `NextPageContext` with meta data that can be picked up by `responseMeta()` when server-side rendering
 */
export interface SSRContext extends NextPageContext {
	/**
	 * Set HTTP Status code
	 * @example
	 * const utils = trpc.useContext();
	 * if (utils.ssrContext) {
	 *   utils.ssrContext.status = 404;
	 * }
	 */
	status?: number
}

/**
 * A set of strongly-typed React hooks from your `AppRouter` type signature with `createReactQueryHooks`.
 * @link https://trpc.io/docs/react#3-create-trpc-hooks
 */
export const trpc = createTRPCNext<AppRouter, SSRContext>({
	config({ ctx }) {
		/**
		 * If you want to use SSR, you need to use the server's full URL
		 * @link https://trpc.io/docs/ssr
		 */
		return {
			/**
			 * @link https://trpc.io/docs/data-transformers
			 */
			transformer,
			/**
			 * @link https://trpc.io/docs/links
			 */
			links: [
				// adds pretty logs to your console in development and logs errors in production
				loggerLink({
					enabled: (opts) =>
						process.env.NODE_ENV === 'development' ||
						(opts.direction === 'down' && opts.result instanceof Error),
				}),

				// httpBatchLink({
				httpLink({
					url: `${getBaseUrl()}/api/trpc`,
					/**
					 * Set custom request headers on every request from tRPC
					 * @link https://trpc.io/docs/ssr
					 */
					async headers() {
						if (!ctx?.req?.headers) {
							return {}
						}
						// To use SSR properly, you need to forward the client's headers to the server
						// This is so you can pass through things like cookies when we're server-side rendering

						const {
							// If you're using Node 18 before 18.15.0, omit the "connection" header
							connection: _connection,
							...headers
						} = ctx.req.headers
						return {
							...headers,
							Authorization: `Bearer ${(await getAccessToken()) || ''}`, // not working
						}
					},
				}),
			],
			/**
			 * @link https://tanstack.com/query/v4/docs/react/reference/QueryClient
			 */
			// queryClientConfig: { defaultOptions: { queries: { staleTime: 60 } } },
			// Change options globally
			queryClientConfig: {
				defaultOptions: {
					queries: {
						refetchOnMount: false,
						refetchOnWindowFocus: false,
					},
				},
			},
		}
	},
	/**
	 * @link https://trpc.io/docs/ssr
	 */
	ssr: false,
})

export type RouterInput = inferRouterInputs<AppRouter>
export type RouterOutput = inferRouterOutputs<AppRouter>
