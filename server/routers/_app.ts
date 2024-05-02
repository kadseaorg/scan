import { mergeRouters } from '../trpc'
import { internalRouter } from './internal/_internal'
import { publicRouter } from './public/public'

export const appRouter = mergeRouters(internalRouter, publicRouter)

// export type definition of API
export type AppRouter = typeof appRouter
