import { useContext } from 'react'
import { storeContext } from './context'
export const useStore = () => useContext(storeContext)
