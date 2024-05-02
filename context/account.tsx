import { Context, ReactNode, createContext } from 'react'

import { account_tags } from '@prisma/client'

import useTagNames from '@/hooks/account/useTagNames'

export interface AccountContextType {
	tagNames?: account_tags[]
	fetchTagNames?: () => void
}

export const AccountContext: Context<AccountContextType> = createContext({})

export const AccountProvider: React.FC<{ children: ReactNode }> = ({
	children,
}) => {
	const { tagNames = [], fetchTagNames }: AccountContextType = useTagNames()

	return (
		<AccountContext.Provider value={{ tagNames, fetchTagNames }}>
			{children}
		</AccountContext.Provider>
	)
}
