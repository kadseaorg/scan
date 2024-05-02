import { useMemo } from 'react'

import { useRouter } from 'next/router'

import InternalTxsTable from '@/components/blockchain/internal-txs-table'
import TxsTable from '@/components/blockchain/txs-table'
import { AdvertisementBannerEnum } from '@/components/common/advertisement-banner'
import Link from '@/components/common/link'
import PageTitle from '@/components/common/page-title'
import TabCard from '@/components/common/tab-card'
import { Card } from '@/components/ui/card'
import { IsZkSync } from '@/constants'
import Container from '@/layout/container'
import { LinkTypeEnum } from '@/types'

const BlockchainTxs: React.FC = () => {
	const router = useRouter()
	const search: any = router?.query

	const block = useMemo(() => search?.block, [search])
	const internalBlock = useMemo(() => search?.internalBlock, [search])
	console.log('search: ', search)

	return (
		<Container>
			<PageTitle
				title={
					<div className="flex items-end">
						<div>Transactions</div>
						{undefined !== block && (
							<div className="text-muted-foreground text-sm ml-[18px] mb-[3px]">
								For Block{' '}
								<Link
									type={LinkTypeEnum.BLOCK}
									value={block}
									className="text-primary dark:text-primary no-underline"
								/>
							</div>
						)}
					</div>
				}
				adBannerProps={{
					type: AdvertisementBannerEnum.TRANSACTION_ADDRESS,
					positionAbsolute: true,
					className: 'w-[350px] sm:w-full',
				}}
			/>
			{undefined === block && undefined === internalBlock && (
				<TabCard
					tabList={
						IsZkSync
							? [{ label: 'All', children: <TxsTable /> }]
							: [
									{ label: 'All', children: <TxsTable /> },
									// { label: 'Pending', children: <PendingTxsTable /> },
									{
										label: 'Contract Internal',
										children: <InternalTxsTable />,
									},
							  ]
					}
				/>
			)}

			{/* txs for block */}
			{undefined !== block && (
				<Card className="p-6">
					<TxsTable />
				</Card>
			)}

			{/* contract internal txs for block */}
			{undefined !== internalBlock && (
				<Card className="p-6">
					<InternalTxsTable />
				</Card>
			)}
		</Container>
	)
}

export default BlockchainTxs
