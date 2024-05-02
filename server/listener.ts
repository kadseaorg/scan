import { Client } from 'pg'

import { CURRENT_CHAIN_ITEM } from '@/constants'

import { getL2ExplorerUrl } from './../utils/index'
import { novu } from './novu'

export const client = new Client({
	connectionString: process.env.DATABASE_URL,
})

export default async function startListening() {
	if (process.env.NODE_ENV === 'development') {
		console.log('Listening disabled in development')
		return
	}

	await client.connect()

	await client.query('LISTEN notify')

	console.log('Listening for notifications')

	client.on('notification', async (msg: any) => {
		try {
			// console.log('Received notification:', msg)
			const payload = JSON.parse(msg.payload)

			let sendBody
			if (payload.transaction) {
				sendBody = {
					type: 'transaction',
					transaction_hash: payload.transaction.hash,
					from_address: payload.transaction.from_address,
					to_address: payload.transaction.to_address,
					block_number: payload.transaction.block_number,
					network: CURRENT_CHAIN_ITEM.title,
					explorer_url: getL2ExplorerUrl(payload.transaction.hash),
				}
			}

			if (payload.token_transfer) {
				sendBody = {
					type: 'token_transfer',
					transaction_hash: payload.token_transfer.transaction_hash,
					from_address: payload.token_transfer.from_address,
					to_address: payload.token_transfer.to_address,
					block_number: payload.token_transfer.block_number,
					network: CURRENT_CHAIN_ITEM.title,
					explorer_url: getL2ExplorerUrl(
						payload.token_transfer.transaction_hash,
					),
				}
			}

			if (!sendBody) {
				console.error('No body to send, payload:', payload)
				return
			}

			await novu.trigger('l2scan', {
				to: {
					subscriberId: payload.user_id,
					email: payload.email,
				},
				payload: sendBody,
			})
		} catch (err) {
			console.error('notification error', err)
		}
	})

	client.on('error', (err) => {
		console.error('Database error:', err)
	})
}
