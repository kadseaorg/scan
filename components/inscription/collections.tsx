import { InfiniteDataTable } from '@/components/common/data-table/infinite-data-table'
import { PAGE_SIZE } from '@/constants'
import { inscriptionColumns } from '@/constants/columns/inscription'
import { trpc } from '@/utils/trpc'

const InscriptionTable = () => {
	const fetchResult = trpc.inscription.getInscriptionList.useInfiniteQuery(
		{ take: PAGE_SIZE },
		{
			getNextPageParam: (lastPage) => lastPage?.nextCursor,
		},
	)
	return (
		<InfiniteDataTable fetchResult={fetchResult} columns={inscriptionColumns} />
	)
}

export default InscriptionTable
