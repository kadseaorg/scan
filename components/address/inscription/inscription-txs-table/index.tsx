import { InfiniteDataTable } from '@/components/common/data-table/infinite-data-table'
import { txColumns } from '@/constants/columns/inscription'
import { trpc } from '@/utils/trpc'

const PAGE_SIZE = 10
const TxTable = ({ address }: { address: string }) => {
	const fetchResult = trpc.inscription.getTxsForAddress.useInfiniteQuery(
		{ address, take: PAGE_SIZE },
		{
			getNextPageParam: (lastPage) => lastPage?.nextCursor,
		},
	)
	return <InfiniteDataTable fetchResult={fetchResult} columns={txColumns} />
}

export default TxTable
