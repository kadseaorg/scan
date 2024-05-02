import { useMemo } from 'react'

import { Grid, Stack, Tooltip } from '@mui/material'
import { HelpCircle } from 'lucide-react'
import { useRouter } from 'next/router'

import { InfiniteDataTable } from '@/components/common/data-table/infinite-data-table'
import Link, { getLinkRoute } from '@/components/common/link'
import Loading from '@/components/common/loading'
import PageTitle from '@/components/common/page-title'
import TabCard from '@/components/common/tab-card'
import { Card } from '@/components/ui/card'
import { holderColumns, txColumns } from '@/constants/columns/inscription'
import Container from '@/layout/container'
import { LinkTypeEnum } from '@/types'
import {
	convertGwei,
	convertNum,
	formatAddressName,
	formatNum,
	stringifyQueryUrl,
	transDisplayNum,
	transDisplayTime,
	transDisplayTimeAgo,
} from '@/utils'
import { trpc } from '@/utils/trpc'

const PAGE_SIZE = 10
const InscriptionOverview = ({ tick }: { tick: string }) => {
	const { isLoading, data } = trpc.inscription.getInscriptionDetail.useQuery(
		{ tick },
		{ enabled: !!tick },
	)
	const cellContent = useMemo(
		() => [
			{
				label: 'Supply',
				tooltip: 'The total number of this inscription',
				value: formatNum(data?.max_supply),
			},
			{
				label: 'Minted',
				tooltip: 'The total number of this inscription that has been minted',
				value: formatNum(Math.min(data?.minted_count, data?.max_supply)),
			},
			{
				label: 'Limit per mint',
				tooltip: 'The number of inscriptions for each mint',
				value: formatNum(data?.limit_per_mint),
			},
			{
				label: 'Holders',
				tooltip: 'The number of addresses that hold this inscription',
				value: formatNum(data?.holder_count),
			},
			{
				label: 'Total Transactions',
				tooltip: 'The number of transactions that involve this inscription',
				value: formatNum(data?.tx_count),
			},
			{
				label: 'Deploy',
				tooltip: 'The deploy transaction hash of this inscription',
				value: (
					<Link type={LinkTypeEnum.TX} value={data?.deploy_txhash}>
						<span> {data?.deploy_txhash}</span>
					</Link>
				),
			},
			{
				label: 'Deploy Time',
				tooltip: 'The deploy time of this inscription',
				value: transDisplayTime(data?.deploy_time),
			},
		],
		[data],
	)

	return (
		<Grid container spacing={4}>
			{isLoading && <Loading />}
			{cellContent?.map(
				({ label, tooltip, value, xs = 12, sm = 12, colSpan = 6 }) => (
					<Grid
						item
						key={label}
						xs={xs ?? colSpan}
						sm={sm ?? colSpan}
						md={colSpan}
					>
						<div className="flex items-center mb-[6px] gap-2">
							<div className="text-muted-foreground">{label}:</div>
							{!!tooltip && (
								<Tooltip title={tooltip}>
									<HelpCircle
										className="cursor-pointer text-muted-foreground"
										size={14}
									/>
								</Tooltip>
							)}
						</div>
						<div className="text-foreground font-medium break-words whitespace-normal leading-7">
							{value}
						</div>
					</Grid>
				),
			)}
		</Grid>
	)
}

const HoldersTable = ({ tick }: { tick: string }) => {
	const fetchResult = trpc.inscription.getInscriptionHolders.useInfiniteQuery(
		{ tick, take: PAGE_SIZE },
		{
			getNextPageParam: (lastPage) => lastPage?.nextCursor,
		},
	)
	return <InfiniteDataTable fetchResult={fetchResult} columns={holderColumns} />
}

const TxTable = ({ tick }: { tick: string }) => {
	const fetchResult = trpc.inscription.getInscriptionTxs.useInfiniteQuery(
		{ tick, take: PAGE_SIZE },
		{
			getNextPageParam: (lastPage) => lastPage?.nextCursor,
		},
	)
	return <InfiniteDataTable fetchResult={fetchResult} columns={txColumns} />
}

const InscriptionDetail = () => {
	const router = useRouter()
	const { tick } = router.query as { tick: string }
	console.log('tick: ', tick)
	return (
		<Container>
			<PageTitle title={tick} showBack backUrl="/inscriptions" />
			<Card className="flex flex-col">
				<TabCard
					tabList={[
						{
							label: 'Overview',
							children: <InscriptionOverview tick={tick} />,
						},
						{
							label: 'Holders',
							children: <HoldersTable tick={tick} />,
						},
						{
							label: 'Transactions',
							children: <TxTable tick={tick} />,
						},
					]}
				></TabCard>
			</Card>
		</Container>
	)
}
export default InscriptionDetail
