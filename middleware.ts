import { PrivyClient } from '@privy-io/server-auth'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { PRIVY_TOKEN } from '@/constants'
import ROUTES from '@/constants/routes'

const privy = new PrivyClient(
	process.env.NEXT_PUBLIC_PRIVY_APP_ID || '',
	process.env.PRIVY_APP_SECRET || '',
)

export async function middleware(req: NextRequest) {
	// const res = NextResponse.next()
	// const supabase = createMiddlewareClient({ req, res })
	// const {
	//   data: { session }
	// } = await supabase.auth.getSession()
	// if (!!!session && req.nextUrl.pathname.startsWith('/account')) {
	//   return NextResponse.redirect(new URL(ROUTES.LOGIN, req.url))
	// }
	// return res
	const cookieStore = cookies()
	const res = NextResponse.next()
	// const authToken = await req.headers.get('authorization')?.replace('Bearer ', '') // authrozaiton not working.
	let token
	if (cookieStore.get(PRIVY_TOKEN)) {
		token = cookieStore.get(PRIVY_TOKEN)?.value
	}
	if (req.nextUrl.pathname.startsWith('/account')) {
		if (!token) {
			console.log('req.nextUrl: ', req.nextUrl, req.url)
			return NextResponse.redirect(new URL(ROUTES.LOGIN, req.url))
		} else {
			try {
				const verifiedClaims = await privy.verifyAuthToken(token)
			} catch (error) {
				console.log(`Token verification failed with error ${error}.`)
				console.log('req.nextUrl: ', req.nextUrl, req.url)
				return NextResponse.redirect(new URL(ROUTES.LOGIN, req.url))
			}
		}
	}

	return res
}
