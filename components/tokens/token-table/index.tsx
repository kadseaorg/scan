import { useState } from 'react'

import { useLogin, usePrivy } from '@privy-io/react-auth'
import { SortingState } from '@tanstack/react-table'
import Router, { useRouter } from 'next/router'
import { toast } from 'sonner'

import { InfiniteDataTable } from '@/components/common/data-table/infinite-data-table'
import { PAGE_SIZE } from '@/constants'
import { getTokenColumns } from '@/constants/columns/tokens'
import { TokenTypeEnum } from '@/types'
import { trpc } from '@/utils/trpc'

const TokenTable: React.FC<{ type: TokenTypeEnum }> = ({ type }) => {
	const { ready, authenticated, user } = usePrivy()

	const router = useRouter()
	const [sorting, setSorting] = useState<SortingState>([])
	const { isLoading, mutateAsync: favoriteTokenMutation } =
		trpc.token.favoriteTokenMutation.useMutation()
	const fetchResult = trpc.token.getTokenList.useInfiniteQuery(
		{ tokenType: type, take: PAGE_SIZE, desc: sorting[0]?.desc },
		{
			getNextPageParam: (lastPage) => lastPage?.nextCursor,
			staleTime: 0,
			refetchOnMount: true,
		},
	)

	const { login } = useLogin()

	const handleAddFavorite = async (address: string, isAdd: boolean) => {
		if (!(ready && authenticated)) {
			login()
		} else {
			try {
				await favoriteTokenMutation({ address: address })
				fetchResult.refetch()
				toast.success(`${isAdd ? 'Add' : 'Remove'} favorite token successfully`)
			} catch (e) {
				console.error(e)
				toast.error(`${isAdd ? 'Add' : 'Remove'} favorite token failed`)
			}
		}
	}

	const tokenColumns = getTokenColumns(type, handleAddFavorite)
	// 333333
	// if(fetchResult?.data){
	//   console.log('fetchResult',fetchResult)
	// }
	// add rank
	fetchResult.data?.pages.forEach((page, index) => {
		page.list.forEach((token, i) => {
			token.name = token?.name?.replace(/&#39;/g, `'`) || token?.name
			token.rank = index * PAGE_SIZE + i + 1
		})
	})

	return (
		<InfiniteDataTable
			fetchResult={fetchResult}
			columns={tokenColumns}
			sorting={sorting}
			setSorting={setSorting}
		/>
	)
}

export default TokenTable
