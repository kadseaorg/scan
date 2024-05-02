import { router } from '../../trpc'
import { contractRouter } from './contract'
import { galxeRouter } from './galxe'
import { transactionRouter } from './transaction'
import { tokenRouter } from './token'

export const publicRouter = router({
	publicContract: contractRouter,
	publicTransactions: transactionRouter,
	publicGalxe: galxeRouter,
	publicToken: tokenRouter,
})
