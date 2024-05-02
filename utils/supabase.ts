import { Session, createPagesServerClient } from '@supabase/auth-helpers-nextjs'
import { NextApiRequest, NextApiResponse } from 'next/types'

export async function getSupabaseAuthSession({
	req,
	res,
}: { req: NextApiRequest; res: NextApiResponse }): Promise<Session> {
	try {
		if (!!!req || !!!res) return Promise.reject('invalid params!')

		const supabaseServerClient = createPagesServerClient({ req, res })
		const {
			data: { session },
			error,
		} = await supabaseServerClient.auth.getSession()

		if (!!error) return Promise.reject(error)
		if (!!!session) return Promise.reject('no session!')

		return Promise.resolve(session)
	} catch (error) {
		return Promise.reject(error)
	}
}
