import { Hex, createPublicClient, createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { Chain, lineaTestnet, scrollSepolia, zkSync } from 'viem/chains'

import { CHAIN_TYPE, CURRENT_CHAIN_ITEM } from '@/constants'
import { EnumChainType } from '@/types/chain'

const PRIVATE_KEY = process.env.PRIVATE_KEY as Hex
export const RPC = process.env.RPC

let chain: Chain = scrollSepolia

if (CHAIN_TYPE === EnumChainType.ZKSYNC) {
	chain = zkSync
}
if (CHAIN_TYPE === EnumChainType.LINEA) {
	chain = lineaTestnet
}

const publicClient = createPublicClient({
	chain,
	transport: http(RPC),
})

const walletClient = createWalletClient({
	chain,
	transport: http(),
})

const account = privateKeyToAccount(PRIVATE_KEY)

export { account, publicClient, walletClient }
