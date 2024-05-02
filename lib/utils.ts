import { type ClassValue, clsx } from 'clsx'
import type { BigNumberish } from 'ethers'
import { BigNumber } from 'ethers'
import { customAlphabet } from 'nanoid'
import { twMerge } from 'tailwind-merge'
import { formatEther } from 'viem'

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export const nanoid = customAlphabet(
	'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
	7,
) // 7-character random string

export function calculateFee(gasLimit: BigNumberish, gasPrice: BigNumberish) {
	return BigNumber.from(gasLimit).mul(gasPrice)
}

interface RetryOptions {
	retries?: number
}
const DEFAULT_RETRY_OPTIONS: RetryOptions = {
	retries: 2,
}

export async function retry<T>(
	func: () => Promise<T>,
	options: RetryOptions = {},
): Promise<T> {
	const { retries } = Object.assign({}, DEFAULT_RETRY_OPTIONS, options)
	try {
		return await func()
	} catch (error) {
		if (retries && retries > 0) {
			return retry(func, { retries: retries - 1 })
		} else {
			throw error
		}
	}
}

export function convertTokenToUsd(baseUnit: number, tokenRate: string) {
	return baseUnit / parseFloat(tokenRate)
}

export function convertWeiToUsd(
	wei: bigint | number | string,
	ethRate: string,
) {
	const ether = formatEther(wei instanceof BigInt ? wei : BigInt(Number(wei)))
	return parseFloat(ether) / parseFloat(ethRate)
}

export function isJson(str: any): boolean {
	if (typeof str !== 'string') {
		return false
	}

	try {
		const result = JSON.parse(str)
		const type = Object.prototype.toString.call(result)
		return type === '[object Object]' || type === '[object Array]'
	} catch (e) {
		return false
	}
}

export const cookieGetter = (cookie: string, name: string) => {
	const value = `; ${cookie}`
	const parts = value.split(`; ${name}=`)
	if (parts.length === 2) return parts.pop()?.split(';').shift()
}

// TODO: Release types for WalletType
export const getHumanReadableWalletType = (
	walletType:
		| 'metamask'
		| 'coinbase_wallet'
		| 'wallet_connect'
		| 'phantom'
		| 'embedded'
		| undefined,
) => {
	switch (walletType) {
		case 'metamask':
			return 'MetaMask'
		case 'coinbase_wallet':
			return 'Coinbase Wallet'
		case 'wallet_connect':
			return 'WalletConnect'
		case 'phantom':
			return 'Phantom'
		case 'embedded':
			return 'Privy'
		default:
			return 'Unknown Wallet'
	}
}

export const formatWallet = (address: string | undefined): string => {
	if (!address) {
		return ''
	}
	const first = address.slice(0, 5)
	const last = address.slice(address.length - 3, address.length)
	return `${first}...${last}`
}

export const isEmpty = (value: any) => {
	return (
		value == null || (typeof value === 'string' && value.trim().length === 0)
	)
}

export function parseQAbotMessages(data: string): any[] {
	// Split the data into separate objects using a regular expression
	const objects = data.split(/}\s*{/)

	// Array to hold the parsed JSON objects
	const parsedObjects: any[] = []

	objects.forEach((obj, index) => {
		// Add missing curly braces if they were removed during the split
		if (!obj.startsWith('{')) obj = '{' + obj
		if (!obj.endsWith('}')) obj = obj + '}'

		try {
			// Parse the JSON object and add it to the array
			parsedObjects.push(JSON.parse(obj))
		} catch (e) {
			console.error('Error parsing object at index ' + index + ': ', e)
		}
	})

	return parsedObjects
}
