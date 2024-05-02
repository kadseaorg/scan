import { useState } from 'react'

import { SortingState } from '@tanstack/react-table'
import { toast } from 'sonner'

import { InfiniteDataTable } from '@/components/common/data-table/infinite-data-table'
import { CHAIN_TYPE, PAGE_SIZE } from '@/constants'
import { logsColumns } from '@/constants/columns/bridge-logs'
import { txColumns } from '@/constants/columns/txs'
import { EnumChainType } from '@/types/chain'
import { trpc } from '@/utils/trpc'

interface BridgeTxsTableProps {
	address?: string
}

const BridgeTxsTable: React.FC<BridgeTxsTableProps> = ({ address }) => {
	const [sorting, setSorting] = useState<SortingState>([])
	const enableLogsFetcher =
		CHAIN_TYPE == EnumChainType.SCROLL ||
		CHAIN_TYPE == EnumChainType.SCROLL_SEPOLIA ||
		CHAIN_TYPE == EnumChainType.ZKSYNC ||
		CHAIN_TYPE == EnumChainType.ZKSYNC_TESTNET ||
		CHAIN_TYPE == EnumChainType.ZKSYNC_SEPOLIA

	const fetchResultLogs = trpc.bridge.getBridgeLogs.useInfiniteQuery(
		{ address, take: PAGE_SIZE, desc: sorting[0]?.desc },
		{
			getNextPageParam: (lastPage) => lastPage.nextCursor,
			refetchOnWindowFocus: false,
			enabled: enableLogsFetcher,
		},
	)

	const fetchResultTxns = trpc.bridge.getBridgeTxs.useInfiniteQuery(
		{ address, take: PAGE_SIZE, desc: sorting[0]?.desc },
		{
			getNextPageParam: (lastPage) => lastPage.nextCursor,
			refetchOnWindowFocus: false,
			enabled: !enableLogsFetcher,
		},
	)

	const fetchResult = enableLogsFetcher ? fetchResultLogs : fetchResultTxns
	const columns = enableLogsFetcher ? logsColumns : txColumns

	if (fetchResult.error) {
		console.error(fetchResult.error)
		toast.error('Internal Server Error')
	}

	return (
		<InfiniteDataTable
			fetchResult={fetchResult}
			columns={columns}
			sorting={sorting}
			setSorting={setSorting}
		/>
	)
}

export default BridgeTxsTable
