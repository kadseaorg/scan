import CopyToClipboard from 'react-copy-to-clipboard'

import { CopyOutlined } from '@ant-design/icons'
import { Button, Card } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { useRouter } from 'next/router'
import { toast } from 'sonner'
import { getAddress } from 'viem'

import DataGridSkeleton from '@/components/common/data-grid/DataGridSkeleton'
import Link from '@/components/common/link'
import PageTitle from '@/components/common/page-title'
import { TIPS } from '@/constants'
import Container from '@/layout/container'
import { LinkTypeEnum } from '@/types'
import { shortAddress } from '@/utils'
import { mergeDefaultColumns } from '@/utils/columns'
import { trpc } from '@/utils/trpc'

const Label: React.FC = () => {
	const router = useRouter()
	const { name } = router.query
	const { isFetching, data } = trpc.label.getLabelAddresses.useQuery(
		name as string,
		{ enabled: !!name },
	)

	const columns: GridColDef[] = mergeDefaultColumns([
		{
			headerName: 'Address',
			field: 'address',
			flex: 1,
			cell: (params) => (
				<div className="flex items-center">
					<Link
						className="mx-[6px]"
						type={LinkTypeEnum.ADDRESS}
						value={getAddress(params.value)}
					>
						{shortAddress(getAddress(params.value))}
					</Link>
					<CopyToClipboard
						text={getAddress(params.value ?? '')}
						onCopy={() => toast.success(TIPS.copied)}
					>
						<CopyOutlined />
					</CopyToClipboard>
				</div>
			),
		},
		{ headerName: 'Name Tag', field: 'name', flex: 1 },
	])
	return (
		<Container>
			<PageTitle
				title={
					<div className="flex items-center">
						<div>Label</div>
						<Button
							variant="outlined"
							size="small"
							color="secondary"
							sx={{ ml: 2, borderStyle: 'dashed' }}
						>
							{name}
						</Button>
					</div>
				}
			/>

			<Card sx={{ p: 3 }}>
				<DataGridSkeleton
					loading={isFetching}
					columns={columns}
					showHeader={true}
				>
					{data ? (
						<DataGrid
							className="mb-3"
							key="id"
							columns={columns}
							rows={data as any[]}
						/>
					) : null}
				</DataGridSkeleton>
			</Card>
		</Container>
	)
}

export default Label
