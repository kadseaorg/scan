import { z } from 'zod'

import { internalProcedure, router } from '../../trpc'

export const faucetRouter = router({
	verifyTweet: internalProcedure
		.input(z.string())
		.mutation(async ({ input }) => {
			try {
				const response = await fetch(
					`https://publish.twitter.com/oembed?url=${encodeURIComponent(input)}`,
				)
				const data = await response.json()
				// 3. Check if the tweet content contains the "l2scan" string
				if (data.html.includes('l2scan')) {
					return {
						ok: true,
					}
				} else {
					return {
						ok: false,
						error:
							'Sorry, the tweet content is not verified. Please share the correct tweet.',
					}
				}
			} catch (error: any) {
				return {
					ok: false,
					error: error?.message,
				}
			}
		}),
})
