import BigNumber from 'bignumber.js'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { stringifyUrl } from 'query-string'
import { format } from 'timeago.js'

import {
	CHAIN_MAP,
	CHAIN_TOKEN,
	CHAIN_TYPE,
	IsKadsea,
	TIME_FORMATTER,
} from '@/constants'
import { ApiPaginationParams } from '@/types'
import { EnumChainType } from '@/types/chain'

export const getImgSrc = (path: string, isSvg = false) => {
	const suffix = isSvg ? '.svg' : '.png'
	return require(`../public/imgs/${path}${suffix}`)
}

export const getThemeImgSrc = (path: string) => {
	const basePath = CHAIN_TYPE
	if (basePath === EnumChainType.SCROLL_SEPOLIA) {
		return require(`../public/imgsInTheme/scroll/${path}.png`)
	}
	if (
		basePath === EnumChainType.ZKSYNC_TESTNET ||
		basePath === EnumChainType.ZKSYNC_SEPOLIA
	) {
		return require(`../public/imgsInTheme/zksync-era/${path}.png`)
	}
	if (basePath === EnumChainType.OKX1_TESTNET) {
		return require(`../public/imgsInTheme/okx1/${path}.png`)
	}
	if (IsKadsea) {
		return require(`../public/imgsInTheme/kadsea/${path}.png`)
	}

	if (basePath === EnumChainType.ORO_TESTNET) {
		return require(`../public/imgsInTheme/oro/${path}.png`)
	}

	if (basePath) {
		return require(`../public/imgsInTheme/${basePath}/${path}.png`)
	}
	return require(`../public/imgs/${path}.png`)
}

export const convertNum = (num: number | bigint | string) => {
	if (typeof num === 'string') {
		return num
	}
	if (typeof num === 'bigint') {
		return num.toString()
	}
	return num
}

export const formatNum = (num: number | string, preffix = '', suffix = '') => {
	if (undefined === num || null === num || '' === num) return '-'

	const suf = suffix ? ` ${suffix}` : ''
	const str = num.toString()
	if (str.length <= 3) return preffix + str + suf
	let integer: any = []
	let floater: any = []
	if (!str.includes('.')) {
		integer = str.split('')
	} else {
		const ary = str.split('.')
		integer = ary[0].split('')
		floater = ary[1]
	}
	let count = 0
	integer.length % 3 === 0
		? (count = integer.length / 3 - 1)
		: (count = Math.floor(integer.length / 3))
	for (let i = 0; i < count; i++) {
		integer.splice(integer.length - (i + 1) * 3 - i, 0, ',')
	}
	let finalStr = ''
	floater.length == 0
		? (finalStr = integer.join(''))
		: (finalStr = integer.join('') + '.' + floater)
	return preffix + finalStr + suf
}

export const formatNumberIntl = (num: number | bigint | undefined) => {
	if (!!!num) return '-'

	const format = new Intl.NumberFormat('en-US', {
		notation: 'compact',
		compactDisplay: 'short',
	})
	return format.format(num)
}

export const formatNumWithSymbol = (num = 0, digits = 2) => {
	const si = [
		{ value: 1, symbol: '' },
		{ value: 1e3, symbol: 'K' },
		{ value: 1e6, symbol: 'M' },
		{ value: 1e9, symbol: 'G' },
		{ value: 1e12, symbol: 'T' },
		{ value: 1e15, symbol: 'P' },
		{ value: 1e18, symbol: 'E' },
	]

	const rx = /\.0+$|(\.[0-9]*[1-9])0+$/
	let i
	for (i = si.length - 1; i > 0; i--) {
		if (num >= si[i].value) {
			break
		}
	}
	return `${formatNum((num / si[i].value).toFixed(digits).replace(rx, '$1'))}${
		si[i].symbol
	}`
}

export const convertBalance = ({
	balance,
	decimals = 18,
}: { balance: any; decimals?: number }) =>
	new BigNumber(balance.toString())
		.div(new BigNumber(10).pow(decimals))
		.toString()

export const convertGwei = (num: string | number | undefined) =>
	new BigNumber(
		new BigNumber(num ?? 0)
			.div(new BigNumber(10).pow(9))
			.toFixed(8, BigNumber.ROUND_FLOOR),
	).toFixed() + ' Gwei'

export const displayGasPriceInGwei = (
	weiPrice: string | number | undefined,
): string => {
	const gweiPrice = new BigNumber(weiPrice ?? 0)
		.div(new BigNumber(10).pow(9))
		.toFixed(8, BigNumber.ROUND_FLOOR)

	if (new BigNumber(gweiPrice).isLessThan(0.15)) {
		return '< 0.15 Gwei'
	}
	return `${gweiPrice} Gwei`
}

export const transDisplayNum = ({
	num,
	fixedNum = 6,
	preffix = '',
	suffix = CHAIN_TOKEN,
	decimals = 18,
}: {
	num: string | number | BigNumber | null | undefined
	fixedNum?: number
	preffix?: string
	suffix?: string
	decimals?: number
}): string => {
	if (!!!Number(num)) return `${preffix}0${suffix ? ` ${suffix}` : ''}`

	return formatNum(
		new BigNumber(
			new BigNumber(
				convertBalance({
					balance: num,
					decimals: null === decimals ? 0 : decimals,
				}),
			).toFixed(fixedNum, BigNumber.ROUND_FLOOR),
		).toFixed(),
		preffix,
		suffix,
	)
}

export const transDisplayTime = (time?: number | bigint | null) => {
	if (!!!time) return '-'

	dayjs.extend(utc)
	return dayjs(Number(time) * 1000)
		.utc()
		.format(TIME_FORMATTER)
}

export const transDisplayTimeAgo = (time?: number | bigint | null) => {
	if (!!!time) return '-'

	return format(Number(time) * 1000)
}

export const transApiPaginationParams = ({
	page = 1,
	limit,
	...data
}: ApiPaginationParams) => ({ offset: limit * (page - 1), limit, ...data })

export const transBlockListApiPaginationParams = ({
	page = 1,
	limit,
	...data
}: ApiPaginationParams) => {
	return { page, limit, ...data }
}

export const getPaginationConfig: any = ({
	current,
	pageSize,
	total,
	totalLabel = 'transactions',
	setCurrent,
	setPageSize,
}: any) => ({
	size: 'small',
	position: ['topRight', 'bottomRight'],
	current,
	pageSize,
	total,
	showTotal: (total: number) =>
		`A total of ${formatNum(total)} ${totalLabel} found`,
	onChange: (page: number, pageSize: number) => {
		setCurrent(page)
		setPageSize(pageSize)
	},
})

export const getTxsPaginationConfig: any = ({
	current,
	pageSize,
	total,
	totalLimit = 500000,
	totalLabel = 'transactions',
	setCurrent,
	setPageSize,
}: any) => ({
	size: 'small',
	position: ['topRight', 'bottomRight'],
	current,
	pageSize,
	total: total < totalLimit ? total : totalLimit,
	showTotal: () => `A total of ${formatNum(total)} ${totalLabel} found`,
	onChange: (page: number, pageSize: number) => {
		setCurrent(page)
		setPageSize(pageSize)
	},
})

export const stringifyQueryUrl = (url: string, query: any) =>
	stringifyUrl({ url, query })
export const getL1ExplorerUrl = (tx: string) =>
	`${CHAIN_MAP[CHAIN_TYPE].l1ExplorerUrl}/tx/${tx}`
export const getL2ExplorerUrl = (tx: string) =>
	`${CHAIN_MAP[CHAIN_TYPE].blockExplorerUrl}/tx/${tx}`

export const expandLeft0x = (param: string) =>
	param.slice(0, 2).toLowerCase() !== '0x' ? `0x${param}` : param

export const generateUid = (address: string): string => {
	const timestamp = Math.floor(Date.now() / 1000)
		.toString(16)
		.toLowerCase()

	return address + timestamp
}

export const isPositiveInteger = (str: string) => {
	const n = Math.floor(Number(str))
	return n !== Infinity && String(n) === str && n >= 0
}

export const shortAddress = (address: string | undefined, length = 6) => {
	if (!address) return ''

	return `${address.slice(0, length)}...${address.slice(-length)}`
}

export const formatAddressName = (
	address: string | undefined,
	name?: string,
) => {
	if (!!!name) return address

	const _address = shortAddress(address)

	return `${name}${!!_address ? ` (${_address})` : ''}`
}

export const shortString = (str: string | undefined, length = 6) => {
	if (!str) return ''

	if (str.length <= length) return str

	return `${str.slice(0, length)}...`
}
