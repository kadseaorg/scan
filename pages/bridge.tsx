import BridgeTxsTable from '@/components/blockchain/bridge-txs-table'
import PageTitle from '@/components/common/page-title'
import TabCard from '@/components/common/tab-card'
import Container from '@/layout/container'

const BridgeTxns: React.FC = () => {
	return (
		<Container>
			<PageTitle
				title={
					<div className="flex items-end">
						<div>Bridge</div>
					</div>
				}
			/>
			<TabCard
				tabList={[
					// {
					//   label: 'Overview',
					//   children: <BridgeOverview />
					// },
					{
						label: 'Transactions',
						children: <BridgeTxsTable />,
					},
					// {
					//   label: 'L2->L1 Transaction',
					//   children: <BridgeTxsTable />
					// }
				]}
			/>
		</Container>
	)
}

export default BridgeTxns
