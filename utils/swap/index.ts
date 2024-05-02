import Web3 from 'web3'

import {
	BaseChain,
	ChainId,
	TokenInfoFormatted,
	initialChainTable,
} from './base'
import BigNumber from 'bignumber.js'

let web3Client: any = null
export const getWeb3Client = () => {
	if (web3Client) {
		return web3Client
	}
	const chain: BaseChain = initialChainTable[ChainId.BSC]
	const rpc = 'https://bscrpc.com'
	console.log('rpc: ', rpc)
	const web3 = new Web3(new Web3.providers.HttpProvider(rpc))
	web3Client = web3
	return web3Client
}

export const amount2Decimal = (
	amount: BigNumber,
	token: TokenInfoFormatted,
): number => {
	return Number(amount.div(10 ** token.decimal))
}
