import { UseTRPCQueryResult } from '@trpc/react-query/shared'

import { DataTable } from '@/components/common/data-table/data-table'
import { getDappTableColumns } from '@/constants/columns/dapps'

const DappTable: React.FC<{
	type: string
	fetchResult: UseTRPCQueryResult<any, any>
	handleAddFavorite: (id: number, isAdd: boolean) => void
}> = (props) => {
	const { type, fetchResult, handleAddFavorite } = props

	const filteredList = fetchResult.data?.list.filter(
		(item: any) => type === 'all' || item.categories?.includes(type),
	)

	const filteredFetchResult = {
		...fetchResult,
		data: {
			...fetchResult.data,
			list: filteredList,
		},
	}

	const columns = getDappTableColumns(handleAddFavorite)
	return <DataTable fetchResult={filteredFetchResult} columns={columns} />
}

export default DappTable
