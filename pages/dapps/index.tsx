import { generatePath } from 'react-router-dom'

import { Box, Stack } from '@mui/material'
import { useLogin, usePrivy } from '@privy-io/react-auth'
import { Star } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { toast } from 'sonner'

import AdvertisementBanner, {
	AdvertisementBannerEnum,
} from '@/components/common/advertisement-banner'
import PageTitle from '@/components/common/page-title'
import SimpleTooltip from '@/components/common/simple-tooltip'
import TabCardV2 from '@/components/common/tab-card/tab-card-v2'
import ValueFluctuation from '@/components/common/value/ValueFluctuation'
import SkeletonDappListItem from '@/components/dapp/skeleton/SkeletonDappListItem'
import DappTable from '@/components/dapp/table/DappTable'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { IsKadsea } from '@/constants'
import ROUTES from '@/constants/routes'
import Container from '@/layout/container'
import { GLE_FOMRS } from '@/layout/menu/config'
import { cn } from '@/lib/utils'
import { formatNumWithSymbol } from '@/utils'
import { trpc } from '@/utils/trpc'

const Dapps = () => {
	const { ready, authenticated, user } = usePrivy()

	const router = useRouter()
	const fetchResult = trpc.dapp.getDapps.useQuery(undefined, {
		staleTime: 0,
		refetchOnMount: true,
	})
	const { data, isLoading, refetch } = fetchResult
	const topDeFiList = data?.list
		.filter((item) => item.categories?.includes('defi'))
		.slice(0, 5)
	const topBridgeList = data?.list
		.filter((item) => item.categories?.includes('bridge'))
		.slice(0, 5)
	const { mutateAsync: favoriteDappMutation } =
		trpc.dapp.favoriteDappMutation.useMutation()

	const { login } = useLogin()

	const handleAddFavorite = async (id: number, isAdd: boolean) => {
		if (!(ready && authenticated)) {
			login()
		} else {
			try {
				await favoriteDappMutation({ id })
				refetch()
				toast.success(`${isAdd ? 'Add' : 'Remove'} favorite dapp successfully`)
			} catch (e) {
				console.error(e)
				toast.error(`${isAdd ? 'Add' : 'Remove'} favorite dapp failed`)
			}
		}
	}
	return (
		<Container>
			{!IsKadsea && (
				<AdvertisementBanner
					className="mb-4"
					type={AdvertisementBannerEnum.DAPP}
					height={100}
					ratio={10}
					isSlotMobile={false}
				/>
			)}
			<div className="flex justify-between">
				<PageTitle title="Dapps Ranking" />
				<Button
					className="rounded-full"
					size="sm"
					onClick={() => {
						if (IsKadsea) {
							window.open(GLE_FOMRS?.PROJECT?.route || '', '_blank')
						} else {
							window.open('https://forms.gle/dNJL1oJEu77AJEgq8', '_blank')
						}
					}}
				>
					Project Submission
				</Button>
			</div>

			<div className="grid grid-cols-2 gap-4 sm:grid-cols-1">
				<Card>
					<CardHeader>
						<CardTitle className="flex">
							<Image
								src="/svgs/common/fire.svg"
								alt=""
								width={20}
								height={20}
							/>
							{/* <Typography sx={{ ml: 1 }} variant="subtitle1">
                Top DeFi
              </Typography> */}
							<div className="ml-[0.5rem] text-[1rem] flex items-center font-[600] text-[#DCDCDC]">
								Top DeFi
							</div>
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-8">
						{isLoading
							? [...Array(4)].map((item, index) => (
									<SkeletonDappListItem key={index} />
							  ))
							: topDeFiList?.map((item, i) => {
									const {
										id,
										name,
										logo,
										txn_count,
										txn_growth_percentage,
										is_favorite,
									} = item
									return (
										<Box
											key={id}
											className={cn(
												'w-full flex items-center min-h-[72px] justify-between flex-wrap sm:flex-col',
												topDeFiList?.length - 1 !== i &&
													'border-b border-solid',
											)}
										>
											<div
												className="flex items-center cursor-pointer sm:w-full"
												onClick={() => {
													router.push(
														generatePath(ROUTES.DAPPS.DETAIL.DAPP, { id }),
													)
												}}
											>
												{logo && (
													<Image
														className="rounded-lg sm:w-[24px] sm:h-[24px]"
														alt=""
														width={40}
														height={40}
														src={logo}
													/>
												)}
												{/* <Typography sx={{ ml: 2 }} variant="subtitle2">
                          {name}
                        </Typography> */}
												<div className="ml-[1rem] text-[0.9rem] flex items-center font-[600] text-[#DCDCDC]">
													{name}
												</div>
											</div>

											<div className="min-w-1/3 flex justify-between space-x-3 sm:w-full sm:my-4 sm:text-xs">
												<div className="flex space-x-2">
													<span className="text-muted-foreground">TXN</span>
													<span className="font-bold">
														{formatNumWithSymbol(txn_count)}
													</span>
												</div>
												<div>
													{
														<ValueFluctuation
															value={txn_growth_percentage}
															isPercentage={true}
														/>
													}
												</div>
												<SimpleTooltip
													content={
														is_favorite
															? 'Remove from favorite dapps'
															: 'Add to favorite dapps'
													}
												>
													<Star
														className="cursor-pointer"
														size={16}
														fill={is_favorite ? 'yellow' : undefined}
														onClick={() => handleAddFavorite(id, !is_favorite)}
													/>
												</SimpleTooltip>
											</div>
										</Box>
									)
							  })}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex">
							<Image
								src="/svgs/common/fire.svg"
								alt=""
								width={20}
								height={20}
							/>
							{/* <Typography sx={{ ml: 1 }} variant="subtitle1">
                Top Bridges
              </Typography> */}
							<div className="ml-[0.5rem] text-[1rem] flex items-center font-[600] text-[#DCDCDC]">
								Top Bridges
							</div>
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-8">
						{isLoading
							? [1, 2, 3, 4].map((item) => <SkeletonDappListItem key={item} />)
							: topBridgeList?.map(
									(
										{
											id,
											name,
											logo,
											txn_count,
											txn_growth_percentage,
											is_favorite,
										},
										i,
									) => (
										<Box
											key={id}
											className={cn(
												'w-full flex items-center min-h-[72px] justify-between flex-wrap sm:flex-col',
												topBridgeList?.length - 1 !== i &&
													'border-b border-solid',
											)}
										>
											<Stack
												flexDirection="row"
												alignItems="center"
												className="cursor-pointer sm:w-full"
												onClick={() => {
													router.push(
														generatePath(ROUTES.DAPPS.DETAIL.DAPP, { id }),
													)
												}}
											>
												{logo && (
													<Image
														className="rounded-lg sm:w-[24px] sm:h-[24px]"
														alt=""
														width={40}
														height={40}
														src={logo}
													/>
												)}
												{/* <Typography sx={{ ml: 2 }} variant="subtitle2">
                        {name}
                      </Typography> */}
												<div className="ml-[1rem] text-[0.9rem] flex items-center font-[600] text-[#DCDCDC]">
													{name}
												</div>
											</Stack>

											<div className="min-w-1/3 flex justify-between space-x-3 sm:w-full sm:my-4 sm:text-xs">
												<div className="flex space-x-2">
													<span className="dark:text-darkGray-200 ">TXN</span>
													<span className="font-bold dark:text-darkGray-50 ">
														{formatNumWithSymbol(txn_count)}
													</span>
												</div>
												<div>
													{
														<ValueFluctuation
															value={txn_growth_percentage}
															isPercentage={true}
														/>
													}
												</div>
												<SimpleTooltip
													content={
														is_favorite
															? 'Remove from favorite dapps'
															: 'Add to favorite dapps'
													}
												>
													<Star
														className="cursor-pointer"
														size={16}
														fill={is_favorite ? 'yellow' : undefined}
														onClick={() => handleAddFavorite(id, !is_favorite)}
													/>
												</SimpleTooltip>
											</div>
										</Box>
									),
							  )}
					</CardContent>
				</Card>
			</div>

			<TabCardV2
				className="pt-7 mt-7"
				tabList={[
					{
						label: 'All Categories',
						children: (
							<DappTable
								type="all"
								fetchResult={fetchResult}
								handleAddFavorite={handleAddFavorite}
							/>
						),
					},
					{
						label: 'Bridge',
						children: (
							<DappTable
								type="bridge"
								fetchResult={fetchResult}
								handleAddFavorite={handleAddFavorite}
							/>
						),
					},
					{
						label: 'Wallet',
						children: (
							<DappTable
								type="wallet"
								fetchResult={fetchResult}
								handleAddFavorite={handleAddFavorite}
							/>
						),
					},
					{
						label: 'DEX',
						children: (
							<DappTable
								type="dex"
								fetchResult={fetchResult}
								handleAddFavorite={handleAddFavorite}
							/>
						),
					},
					{
						label: 'DeFi',
						children: (
							<DappTable
								type="defi"
								fetchResult={fetchResult}
								handleAddFavorite={handleAddFavorite}
							/>
						),
					},
					{
						label: 'Social',
						children: (
							<DappTable
								type="social"
								fetchResult={fetchResult}
								handleAddFavorite={handleAddFavorite}
							/>
						),
					},
					{
						label: 'NFT',
						children: (
							<DappTable
								type="nft"
								fetchResult={fetchResult}
								handleAddFavorite={handleAddFavorite}
							/>
						),
					},
					{
						label: 'Identity',
						children: (
							<DappTable
								type="identity"
								fetchResult={fetchResult}
								handleAddFavorite={handleAddFavorite}
							/>
						),
					},
					{
						label: 'Games',
						children: (
							<DappTable
								type="game"
								fetchResult={fetchResult}
								handleAddFavorite={handleAddFavorite}
							/>
						),
					},
					{
						label: 'Data Source',
						children: (
							<DappTable
								type="datasource"
								fetchResult={fetchResult}
								handleAddFavorite={handleAddFavorite}
							/>
						),
					},
					{
						label: 'Others',
						children: (
							<DappTable
								type="others"
								fetchResult={fetchResult}
								handleAddFavorite={handleAddFavorite}
							/>
						),
					},
				]}
			/>
		</Container>
	)
}

export default Dapps
