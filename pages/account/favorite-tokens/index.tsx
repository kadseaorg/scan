import React, { useEffect, useState } from 'react'

import { Button, Card } from '@mui/material'
import { useRouter } from 'next/router'
import { toast } from 'sonner'

import { InfiniteDataTable } from '@/components/common/data-table/infinite-data-table'
import PageTitle from '@/components/common/page-title'
import { PAGE_SIZE } from '@/constants'
import { getTokenColumns } from '@/constants/columns/tokens'
import Container from '@/layout/container'
import { TokenTypeEnum } from '@/types'
import { trpc } from '@/utils/trpc'

const FavoriteTokens: React.FC = (props) => {
	const router = useRouter()
	const { isLoading, mutateAsync: favoriteTokenMutation } =
		trpc.token.favoriteTokenMutation.useMutation()
	const fetchResult = trpc.token.getFavoriteTokenList.useInfiniteQuery(
		{ take: PAGE_SIZE },
		{
			getNextPageParam: (lastPage) => lastPage?.nextCursor,
			staleTime: 0,
			refetchOnMount: true,
		},
	)
	fetchResult.data?.pages.forEach((page, index) => {
		page.list.forEach((token, i) => {
			token.rank = index * PAGE_SIZE + i + 1
		})
	})

	const handleAddFavorite = async (address: string, isAdd: boolean) => {
		try {
			await favoriteTokenMutation({ address: address })
			fetchResult.refetch()
			toast.success(`${isAdd ? 'Add' : 'Remove'} favorite token successfully`)
		} catch (e) {
			console.error(e)
			toast.error(`${isAdd ? 'Add' : 'Remove'} favorite token failed`)
		}
	}

	const tokenColumns = getTokenColumns(TokenTypeEnum.ERC20, handleAddFavorite)

	return (
		<Container>
			<div className="relative">
				<PageTitle title="Favorite Tokens" />
				<Button
					className="bg-primary text-accent-foreground hover:bg-primary/90 px-4 py-2 h-8 sm:hidden rounded-full absolute top-0 right-0"
					onClick={() => router.push('/tokens')}
				>
					Erc20 Tokens
				</Button>
				<Card>
					<InfiniteDataTable fetchResult={fetchResult} columns={tokenColumns} />
				</Card>
			</div>
		</Container>
	)
}

export default FavoriteTokens
