import { InfiniteDataTable } from '@/components/common/data-table/infinite-data-table'
import { PAGE_SIZE } from '@/constants'
import { txColumns } from '@/constants/columns/inscription'
import { trpc } from '@/utils/trpc'

const TxsTable = () => {
	const fetchResult = trpc.inscription.getTransactions.useInfiniteQuery(
		{ take: PAGE_SIZE },
		{
			getNextPageParam: (lastPage) => lastPage?.nextCursor,
		},
	)
	return <InfiniteDataTable fetchResult={fetchResult} columns={txColumns} />
}

export default TxsTable
