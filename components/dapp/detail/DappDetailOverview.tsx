import { CardContent, Typography } from '@mui/material'
import { usePlausible } from 'next-plausible'
import Image from 'next/image'
import { useRouter } from 'next/router'

import { Card } from '@/components/ui/card'
import { PlausibleEvents } from '@/types/events'
import { trpc } from '@/utils/trpc'

import OverviewDataReport from './overview/OverviewDataReport'

const DappDetailOverview = ({ dappDetail }: any) => {
	const plausible = usePlausible<PlausibleEvents>()
	const router = useRouter()
	const { data } = trpc.dapp.getDappRecommended.useQuery(
		{
			categray: dappDetail?.categories[0],
		},
		{ enabled: !!dappDetail },
	)

	return (
		<Card>
			<CardContent>
				<OverviewDataReport dappDetail={dappDetail} />

				<Typography variant="subtitle1" sx={{ mt: 4 }}>
					Recommendation
				</Typography>
				<div className="mt-4 grid grid-cols-3 gap-4 sm:grid-cols-1">
					{data?.map((item) => {
						const { id, name, logo, description, categories } = item
						return (
							<div
								key={id}
								className="
                cursor-pointer
                flex items-center rounded-lg p-[24px] border-1-solid border-gray-400 dark:border-muted-foreground sm:flex-col-reverse"
								onClick={() => {
									plausible('Dapp-Recommend', {
										props: {
											DappNameRecommend: name,
										},
									})
									router.push(`/dapp/${id}`)
								}}
							>
								<div className="h-full">
									<div className="flex items-center gap-2 sm:justify-center sm:flex-wrap">
										<h5 className="font-bold text-base sm:text-center">
											{name}
										</h5>
										<div className="caption py-[4px] px-[12px] flex-center w-fit h-[24px] rounded-2xl border-1-solid border-primary dark:border-primary text-primary dark:text-primary sm:text-center">
											{categories[0]}
										</div>
									</div>
									<span className="mt-1 body2 theme-text-secondary line-clamp-3">
										{description}
									</span>
								</div>
								<Image
									className="rounded-xl ml-auto sm:mb-4 sm:mx-auto"
									alt=""
									width={60}
									height={60}
									src={logo || ''}
								/>
							</div>
						)
					})}
				</div>
			</CardContent>
		</Card>
	)
}

export default DappDetailOverview
