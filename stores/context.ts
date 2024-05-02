import { createContext } from 'react'
import { SwapStore } from './swap'

export const storeContext = createContext({
	swapStore: new SwapStore(),
})
