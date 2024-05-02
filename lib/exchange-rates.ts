let timer: any
let isFetching = false
let rates: Record<string, string>

async function fetchExchangeRates() {
	try {
		const { data } = await fetch(
			'https://api.coinbase.com/v2/exchange-rates?currency=USD',
		).then((res) => res.json())
		rates = data.rates

		return Promise.resolve()
	} catch (error) {
		console.log('fetchExchangeRates: ', error)
		return Promise.reject(error) //FIXME: for test
		// rates = { ETC: '0.036757948906451', ETH: '0.0003415312210766', 2747: '0.05', MERK: '0.003433', WETH: '0.0003415312210766' } //FIXME: FOR TEST
	}
}

export default async function getExchangeRates() {
	if (isFetching) return rates

	try {
		if (!!!rates) {
			isFetching = true
			await fetchExchangeRates()
			!!!timer && (timer = setInterval(fetchExchangeRates, 60 * 60 * 1000))
		}

		return rates
	} catch (error) {
		console.log(error)
		throw error
	} finally {
		isFetching = false
	}
}
