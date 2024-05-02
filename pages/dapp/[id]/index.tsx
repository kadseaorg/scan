import { useEffect } from 'react'

import { Stack } from '@mui/material'
import { usePlausible } from 'next-plausible'
import Image from 'next/image'
import { useRouter } from 'next/router'

import Loading from '@/components/common/loading'
import PageTitle from '@/components/common/page-title'
import SocialIcon, {
	SocialIconName,
} from '@/components/common/svg-icon/social-icon'
import TabCardV2 from '@/components/common/tab-card/tab-card-v2'
import DappAddressTable from '@/components/dapp/addresses-table'
import DappDetailOverview from '@/components/dapp/detail/DappDetailOverview'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Container from '@/layout/container'
import { PlausibleEvents } from '@/types/events'
import { trpc } from '@/utils/trpc'

const DappDetail = () => {
	const plausible = usePlausible<PlausibleEvents>()
	const router = useRouter()
	const { id } = router.query
	const { data, isLoading } = trpc.dapp.getDappDetail.useQuery(Number(id), {
		enabled: !!id,
	})

	useEffect(() => {
		plausible('Dapp-Project Name', { props: { Name: data?.name } })
	}, [data?.name, plausible])

	if (isLoading) {
		return (
			<Container>
				<Loading />
			</Container>
		)
	}

	return (
		<Container>
			<PageTitle
				title={data?.name || 'Dapp Detail'}
				showBack
				backUrl="/dapps"
			/>

			<Card className="flex flex-row justify-between p-12 sm:p-6 sm:flex-col">
				<div className="flex-1 sm:flex sm:flex-col sm:items-center">
					{data?.logo && (
						<Image
							className="rounded-full sm:w-[52px] sm:h-[52px]"
							alt=""
							width={104}
							height={104}
							src={data.logo}
						/>
					)}

					<div className="flex items-center mt-4 sm:flex-col gap-2">
						<div className="text-2xl font-bold">{data?.name}</div>
						<div className="flex flex-row gap-2 flex-wrap">
							{data?.categoryRankings?.map((item) => (
								<Badge key={item} variant="secondary">
									{item.category.toLocaleUpperCase()} #{item.total_ranking}
								</Badge>
							))}
						</div>
					</div>

					<div className="mt-2 text-muted-foreground">{data?.description}</div>

					<Button
						className="w-fit mt-4 rounded-xl"
						size="sm"
						onClick={() => {
							plausible('Dapp-Try Now', {
								props: { DappNameJumpto: data?.name },
							})
							window.open(data?.website || '', '_blank')
						}}
					>
						Try Now
					</Button>
				</div>

				<div>
					<div className="flex justify-end sm:justify-center gap-2 my-[20px]">
						{data?.twitter && (
							<SocialIcon name={SocialIconName.twitter} link={data.twitter} />
						)}
						{data?.discord && (
							<SocialIcon name={SocialIconName.discord} link={data.discord} />
						)}
						{data?.telegram && (
							<SocialIcon name={SocialIconName.telegram} link={data.telegram} />
						)}
						{data?.youtube && (
							<SocialIcon name={SocialIconName.youtube} link={data.youtube} />
						)}
					</div>

					<Stack>
						{data?.media_url && (
							<Image
								className="rounded-xl object-cover"
								alt=""
								width={400}
								height={225}
								src={data.media_url}
							/>
						)}
					</Stack>
				</div>
			</Card>

			<TabCardV2
				className="mt-4 pt-3"
				tabList={[
					{
						label: 'Overview',
						children: <DappDetailOverview dappDetail={data} />,
					},
					{
						label: 'Addresses',
						children: <DappAddressTable id={data?.id} />,
					},
				]}
			/>
		</Container>
	)
}

export default DappDetail
