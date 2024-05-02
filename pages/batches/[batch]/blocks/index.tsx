import { useRouter } from 'next/router'

import BlocksTableCard from '@/components/blockchain/blocks-table-card'
import PageTitle from '@/components/common/page-title'
import Container from '@/layout/container'

const BlockchainBlocks: React.FC = () => {
	const router = useRouter()
	const { batch }: any = router?.query

	return (
		<Container>
			<PageTitle title={`Batch #${batch}`} />
			<BlocksTableCard batchNumber={Number(batch)} />
		</Container>
	)
}

export default BlockchainBlocks
