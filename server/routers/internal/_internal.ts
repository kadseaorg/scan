import { router } from '../../trpc'
import { accountRouter } from './account'
import { addressRouter } from './address'
import { addressStatsRouter } from './address-stats'
import { batchRouter } from './batch'
import { blockRouter } from './block'
import { bridgeRouter } from './bridge'
import { castRouter } from './cast'
import { contractRouter } from './contract'
import { dappRouter } from './dapp'
import { faucetRouter } from './faucet'
import { healthcheckRouter } from './healthcheck'
import { labelRouter } from './label'
import { statRouter } from './stat'
import { summaryRouter } from './summary'
import { swapRouter } from './swap'
import { tokenRouter } from './token'
import { transactionRouter } from './transaction'
import { utilRouter } from './util'
import { inscriptionRouter } from './inscription'
export const internalRouter = router({
	healthcheck: healthcheckRouter,
	block: blockRouter,
	transaction: transactionRouter,
	batch: batchRouter,
	token: tokenRouter,
	address: addressRouter,
	addressStats: addressStatsRouter,
	contract: contractRouter,
	util: utilRouter,
	summary: summaryRouter,
	stat: statRouter,
	account: accountRouter,
	label: labelRouter,
	faucet: faucetRouter,
	cast: castRouter,
	dapp: dappRouter,
	bridge: bridgeRouter,
	swap: swapRouter,
	inscription: inscriptionRouter,
})
