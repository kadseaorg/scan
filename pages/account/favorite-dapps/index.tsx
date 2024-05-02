import React, { useEffect, useState } from 'react'

import { Card } from '@mui/material'
import { usePlausible } from 'next-plausible'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { toast } from 'sonner'

import AddFavoriteIcon from '@/components/common/add-favorite-icon'
import PageTitle from '@/components/common/page-title'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Container from '@/layout/container'
import { PlausibleEvents } from '@/types/events'
import { trpc } from '@/utils/trpc'

const FavoriteDapps: React.FC = (props) => {
	const router = useRouter()
	const { mutateAsync: favoriteDappMutation } =
		trpc.dapp.favoriteDappMutation.useMutation()
	const { data, refetch } = trpc.dapp.getFavoriteDappList.useQuery(
		{},
		{ staleTime: 0, refetchOnMount: true },
	)
	const plausible = usePlausible<PlausibleEvents>()

	const handleAddFavorite = async (id: number, isAdd: boolean) => {
		try {
			await favoriteDappMutation({ id })
			refetch()
			toast.success(`${isAdd ? 'Add' : 'Remove'} favorite dapp successfully`)
		} catch (e) {
			console.error(e)
			toast.error(`${isAdd ? 'Add' : 'Remove'} favorite dapp failed`)
		}
	}

	return (
		<Container>
			<div className="relative">
				<PageTitle title="Favorite Dapps" />
				<Button
					className="bg-primary text-accent-foreground hover:bg-primary/90 px-4 py-2 h-8 sm:hidden rounded-full absolute top-0 right-0"
					onClick={() => router.push('/dapps')}
				>
					Dapps Ranking
				</Button>

				<div className="grid grid-cols-2 gap-4 sm:grid-cols-1 lg:grid-cols-4">
					{data?.list?.map(
						({
							id,
							logo,
							name,
							categoryRankings,
							description,
							website,
							is_favorite,
						}: any) => (
							<Card
								key={name}
								className="relative px-4 py-4 py-4border-[1px] border-solid border-border rounded-lg dark:border-none dark:bg-darkGray-600"
							>
								<div className="absolute top-4 right-4 z-10">
									<AddFavoriteIcon
										is_favorite={is_favorite}
										removeText="Remove from favorite dapps"
										addText="Add to favorite dapps"
										onClick={() => handleAddFavorite(id, !is_favorite)}
									/>
								</div>

								<div className="relative z-[1] w-full flex flex-col gap-3">
									{logo && (
										<Image
											className="rounded-full sm:w-[52px] sm:h-[52px]"
											alt=""
											width={84}
											height={84}
											src={logo}
										/>
									)}

									<div className="flex items-center mt-4 sm:flex-col gap-2">
										<div className="text-2xl font-bold">{name}</div>
										<div className="flex flex-row gap-2 flex-wrap">
											{categoryRankings?.map((item) => (
												<Badge key={item} variant="secondary">
													{item.category.toLocaleUpperCase()} #
													{item.total_ranking}
												</Badge>
											))}
										</div>
									</div>
									<div className="mt-2 text-muted-foreground">
										{description}
									</div>

									<Button
										className="w-fit mt-4 rounded-xl"
										size="sm"
										onClick={() => {
											router.push(`/dapp/${id}`)
										}}
									>
										Learn More
									</Button>
								</div>
							</Card>
						),
					)}
				</div>
			</div>
		</Container>
	)
}

export default FavoriteDapps
