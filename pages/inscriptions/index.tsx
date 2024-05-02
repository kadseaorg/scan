import { useMemo } from 'react'
import { AdvertisementBannerEnum } from '@/components/common/advertisement-banner'
import Link from '@/components/common/link'
import PageTitle from '@/components/common/page-title'
import TabCard from '@/components/common/tab-card'
import CollectionTable from '@/components/inscription/collections'
import TopAccountsTable from '@/components/inscription/topAccounts'
import TxTable from '@/components/inscription/transactions'
import { Card } from '@/components/ui/card'
import { IsZkSync } from '@/constants'
import Container from '@/layout/container'
import { LinkTypeEnum } from '@/types'

const Inscription: React.FC = () => {
	return (
		<Container>
			<PageTitle
				title={
					<div className="flex items-end">
						<div>Inscriptions</div>
					</div>
				}
				adBannerProps={{
					type: AdvertisementBannerEnum.TRANSACTION_ADDRESS,
					positionAbsolute: true,
				}}
			/>

			<TabCard
				tabList={[
					{ label: 'Collections', children: <CollectionTable /> },
					{ label: 'Transactions', children: <TxTable /> },
					// { label: 'Top Accounts', children: <TopAccountsTable /> }
				]}
			/>
		</Container>
	)
}

export default Inscription
