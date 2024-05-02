import VerifiedContractTable from '@/components/blockchain/verified-contract-table'
import PageTitle from '@/components/common/page-title'
import Container from '@/layout/container'

const VerifiedContract: React.FC = () => {
	return (
		<Container>
			<PageTitle title="Verified Contracts" />
			<VerifiedContractTable />
		</Container>
	)
}

export default VerifiedContract
