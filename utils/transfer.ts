/* eslint-disable no-inline-comments */
import { Hex, formatEther, parseEther } from 'viem'

import { account, publicClient, walletClient } from './viem-client'

interface TransferResult {
	status: 'success' | 'error'
	message: string
}

const FROM_ADDRESS = process.env.FROM_ADDRESS as Hex
const PRIVATE_KEY = process.env.PRIVATE_KEY

const transfer = async (
	toAddress: string,
	amount: number,
): Promise<TransferResult> => {
	console.log('Received new request from ', toAddress, 'for', amount)
	if (!PRIVATE_KEY || !FROM_ADDRESS) {
		return {
			status: 'error',
			message:
				'Missing environment variables, please ask admin to set them up.',
		}
	}
	try {
		const balance = formatEther(
			await publicClient.getBalance({ address: FROM_ADDRESS }),
		)
		if (Number(balance) < amount) {
			throw new Error(`I'm out of funds! Please donate: ${FROM_ADDRESS}`)
		}

		const hash = await walletClient.sendTransaction({
			account,
			to: toAddress as Hex,
			value: parseEther(`${amount}`),
		})
		if (hash) {
			console.log('Tx created: https://scroll.l2scan.co/tx/' + hash)
			return { status: 'success', message: hash }
		} else {
			console.log('Error creating tx')
			throw new Error(
				'Something went wrong. Error not found, please check logs',
			)
		}
	} catch (error: any) {
		console.log(error)
		return {
			status: 'error',
			message: 'Unable send funds. Error: ' + error?.message,
		}
	}
}

export default transfer
