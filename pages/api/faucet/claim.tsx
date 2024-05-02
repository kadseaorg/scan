import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'
import { NextApiRequest, NextApiResponse } from 'next'
import { cookies } from 'next/headers'
import { isAddress } from 'viem'

import { PRIVY_TOKEN } from '@/constants'
import { privy } from '@/server/context'
import { keyv } from '@/utils/keyv'
import transfer from '@/utils/transfer'

const allowedMethods = ['POST']
const faucetL1Fee = 0.01
const faucetL2Fee = 0.02
const cooldown = 1000 * 60 * 60 * 24 // 24 hours

const ClaimHandler = async (req: NextApiRequest, res: NextApiResponse) => {
	if (!req.method || !allowedMethods.includes(req.method)) {
		res.setHeader('Allow', allowedMethods)
		return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
	}

	// const supabase = createPagesServerClient({ req, res })
	// const {
	//   data: { session }
	// } = await supabase.auth.getSession()

	// if (!session?.user) {
	//   return res.status(403).json({ error: 'Forbidden' })
	// }

	let userClaim
	const cookieStore = cookies()
	let token
	if (cookieStore.get(PRIVY_TOKEN)) {
		token = cookieStore.get(PRIVY_TOKEN)?.value
	}
	if (!token) {
		return res.status(403).json({ error: 'Forbidden' })
	}
	try {
		userClaim = await privy.verifyAuthToken(token)
	} catch (error) {
		console.log(`Token verification failed with error ${error}.`)
		return res.status(403).json({ error: 'Forbidden' })
	}

	const { address, level } = req.body
	const amount = level === 1 ? faucetL1Fee : faucetL2Fee

	if (!isAddress(address)) {
		return res.status(400).json({ error: 'Please enter a valid Address' })
	}

	// If the last transaction was less than 15 seconds ago, disallow to prevent nonce reuse (no concurrent transactions ATM)
	const lastTx = await keyv.get('lastTx')
	if (lastTx > Date.now() - 15000) {
		const timeLeft = 15000 - (Date.now() - lastTx)
		return res.status(400).json({
			error: `Please wait 15 seconds between requests to prevent nonce issues. Try again in ${
				timeLeft / 1000
			}s.`,
		})
	}

	// check if user has requested in the last 24 hours
	const lastRequested = await keyv.get(userClaim?.userId)
	if (lastRequested) {
		if (Date.now() - lastRequested < cooldown) {
			const timeLeft = Math.floor(
				(cooldown - (Date.now() - lastRequested)) / 1000 / 60,
			)
			return res.status(400).json({
				error: `You can only request funds once every ${
					cooldown / (1000 * 60 * 60)
				} hours. Please try again in ${timeLeft} minutes.`,
			})
		}
	}

	// try to transfer funds
	try {
		const transferRes = await transfer(address, amount)
		if (transferRes.status === 'success') {
			await keyv.set(userClaim.userId, Date.now())
			await keyv.set('lastTx', Date.now())
			return res
				.status(200)
				.json({ message: 'success', hash: transferRes.message })
		} else {
			return res.status(400).json({ error: transferRes.message })
		}
	} catch (error: any) {
		console.log('error', error)
		return res.status(400).json({ error: error.message })
	}
}

export default ClaimHandler
