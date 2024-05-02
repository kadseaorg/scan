import { DataTable } from '@/components/common/data-table/data-table'
import { accountsColumns } from '@/constants/columns/accounts'
import { trpc } from '@/utils/trpc'

const AccountsTableCard: React.FC<{ batchNumber?: number }> = (props) => {
	const fetchResult = trpc.address.getAccountStats.useQuery({ take: 100 })

	// add rank
	fetchResult.data?.list.forEach((item, index) => {
		item.rank = index + 1
	})

	return <DataTable fetchResult={fetchResult} columns={accountsColumns} />
}

export default AccountsTableCard
