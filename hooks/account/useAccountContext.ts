import { AccountContext, AccountContextType } from '@/context/account'
import { useContext } from 'react'

export default function useAccountContext(): AccountContextType {
	return useContext(AccountContext)
}
