import { useCallback } from 'react'

import BigNumber from 'bignumber.js'

import { trpc } from '@/utils/trpc'

export default function useUsdExchangeRates(initFetch = true) {
	const {
		data: usdExchangeRates,
		isLoading: isFetching,
		refetch: refreshPrice,
	} = trpc.util.getUsdExchangeRates.useQuery(undefined, {
		enabled: !!initFetch,
		refetchInterval: 60 * 60 * 1000,
	})

	const convertToUsdPrice = useCallback(
		(
			value?: string | number,
			options?: { showPreffix?: boolean; symbol?: string; fixedNum?: number },
		) => {
			const showPrefix =
				undefined === options?.showPreffix ? true : options?.showPreffix
			const symbol = options?.symbol
			const fixedNum = options?.fixedNum || 2

			if (!usdExchangeRates || !symbol) return undefined

			const rate = usdExchangeRates?.[symbol]

			if (!rate) return undefined

			return `${showPrefix ? '$' : ''}${BigNumber(
				BigNumber(value ?? 0)
					.div(rate ?? 1)
					.toFixed(fixedNum),
			).toFixed()}`
		},
		[usdExchangeRates],
	)

	return {
		isFetching: !!initFetch ? isFetching : false,
		usdExchangeRates,
		convertToUsdPrice,
		refreshPrice,
	}
}
