import {
	Box,
	Card,
	CardContent,
	CardHeader,
	Stack,
	Typography,
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'

import Link from '@/components/common/link'
import Loading from '@/components/common/loading'
import { CHAIN_TOKEN_NAME, TABLE_CONFIG } from '@/constants'
import { LinkTypeEnum } from '@/types'
import { transDisplayNum } from '@/utils'
import { trpc } from '@/utils/trpc'

import DailyBridgeChart from './DailyBridgeChart'

const DataCard = (props: { title: string; value: string }) => {
	const { title, value } = props
	return (
		<Card
			className="flex flex-col items-center"
			sx={{
				p: 3,
				bgcolor: 'background.neutral',
			}}
		>
			<Typography variant="subtitle1" color={'text.secondary'}>
				{title}
			</Typography>
			<Typography variant="h5" sx={{ mt: 2 }}>
				{value}
			</Typography>
		</Card>
	)
}

const BridgeOverview = () => {
	const {
		data: overview,
		isFetching,
		error,
	} = trpc.bridge.getBridgeOverview.useQuery()
	const {
		data: topAccounts,
		isFetching: isFetchingTopAccounts,
		error: errorTopAccounts,
	} = trpc.bridge.getTopBridgeAccounts.useQuery()
	const cardList = [
		{
			title: 'Bridge User',
			value: overview?.user_count,
		},
		{
			title: 'Total Bridge Txns',
			value: overview?.tx_count,
		},
		{
			title: 'Bridge TVL',
			value: transDisplayNum({ num: overview?.tvl, suffix: CHAIN_TOKEN_NAME }),
		},
		{
			title: 'Total Deposit',
			value: overview?.deposit_count,
		},
	]
	let rows = topAccounts?.map((account, index) => ({
		id: index + 1,
		account: account.address,
		value: transDisplayNum({
			num: account.total_value,
			suffix: CHAIN_TOKEN_NAME,
			fixedNum: 2,
		}),
		txn_count: account.txn_count,
	}))

	let columns = [
		{ field: 'id', headerName: 'ID', width: 100 },
		{
			field: 'account',
			headerName: 'Account',
			flex: 1,
			renderCell: (params: any) => (
				<Link
					type={LinkTypeEnum.ADDRESS}
					value={params.value}
					width={TABLE_CONFIG.COL_WIDHT.TXHASH}
					ellipsis
					target="_blank"
				/>
			),
		},
		{ field: 'value', headerName: 'Value', flex: 1 },
		{ field: 'txn_count', headerName: 'Txns', flex: 1 },
	]

	if (isFetching || isFetchingTopAccounts) {
		return <Loading />
	}

	return (
		<Stack gap={2}>
			<Box
				gap={3}
				display="grid"
				gridTemplateColumns={{
					xs: 'repeat(1, 1fr)',
					sm: 'repeat(2, 1fr)',
					md: 'repeat(4, 1fr)',
				}}
			>
				{cardList.map((card) => {
					const { title, value } = card
					return <DataCard key={title} title={title} value={value} />
				})}
			</Box>
			<DailyBridgeChart />
			<Card sx={{ bgcolor: 'background.neutral' }}>
				<CardHeader title="Top Bridge Accounts" />
				<CardContent>
					<DataGrid rows={rows ?? []} columns={columns} />
				</CardContent>
			</Card>
		</Stack>
	)
}

export default BridgeOverview
