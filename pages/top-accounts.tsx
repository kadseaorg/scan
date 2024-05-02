import AccountsTableCard from '@/components/blockchain/accounts-table-card'
import PageTitle from '@/components/common/page-title'
import Container from '@/layout/container'

const TopAccounts: React.FC = () => {
	return (
		<Container>
			<PageTitle title="Top Accounts" />
			<AccountsTableCard />
		</Container>
	)
}

export default TopAccounts
