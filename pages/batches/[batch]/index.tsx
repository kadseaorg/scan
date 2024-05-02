import { useCallback, useMemo } from 'react'

import { CardContent, Stack, Typography } from '@mui/material'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/router'

import Link, { getLinkRoute } from '@/components/common/link'
import Loading from '@/components/common/loading'
import { OverviewCellContent } from '@/components/common/overview-content'
import PageTitle from '@/components/common/page-title'
import TabCard from '@/components/common/tab-card'
import { L1StatusLabel } from '@/components/common/table-col-components'
import { Card } from '@/components/ui/card'
import { CHAIN_TYPE } from '@/constants'
import Container from '@/layout/container'
import { cn } from '@/lib/utils'
import { LinkTypeEnum } from '@/types'
import { EnumChainType } from '@/types/chain'
import { formatNum } from '@/utils'
import { trpc } from '@/utils/trpc'

import style from './index.module.scss'

const BlockchainBatchDetail: React.FC = () => {
	const router = useRouter()
	const search: any = router?.query
	const { batch } = search

	const { isLoading, data } = trpc.batch.getBatchDetail.useQuery(
		Number(batch),
		{ enabled: !!batch },
	)

	const leftArrowBtnDisabled = useMemo(
		() => [0, undefined].includes(data?.number),
		[data?.number],
	)

	const rightArrowBtnDisabled = useMemo(
		() => undefined === data?.number,
		[data?.number],
	)

	const goBatchDetail = useCallback(
		(disabled: boolean, num = 1) => {
			if (disabled) return

			router.push(getLinkRoute(LinkTypeEnum.BATCH, (data?.number ?? 0) + num))
		},
		[data?.number, router],
	)

	const fullCellContent = useMemo(
		() => [
			{
				label: 'Blocks',
				tooltip: 'Number of blocks in the batch',
				value: (
					<Link type={LinkTypeEnum.BATCHBLOCKS} value={data?.number}>
						{formatNum(data?.l2_block_count ?? 0)}
					</Link>
				),
			},
			{
				label: 'Transactions',
				tooltip: 'Number of transactions in the batch',
				value: formatNum(data?.l2_tx_count ?? 0),
			},
			{
				label: 'Commit Tx Hash',
				tooltip: "Hash of the transaction that commits the batch's data to L1",
				value: (
					<Link
						type={LinkTypeEnum.CROSS_BROWSER_TX}
						value={data?.commit_tx_hash}
						target="_blank"
					/>
				),
			},
			{
				label: 'Commit Timestamp',
				tooltip:
					"Timestamp of the transaction that commits the batch's data to L1",
				value: data?.committed_at,
			},
			{
				label: 'Finalized Tx Hash',
				tooltip:
					"Hash of the transaction that finalizes the batch's data to L1",
				value: (
					<Link
						type={LinkTypeEnum.CROSS_BROWSER_TX}
						value={data?.prove_tx_hash}
						target="_blank"
					/>
				),
			},
			{
				label: 'Finalized Timestamp',
				tooltip:
					"Timestamp of the transaction that finalizes the batch's data to L1",
				value: data?.proven_at,
			},
			{
				label: 'Root Hash',
				tooltip:
					'Validators roll up thousands of transactions together in a single block and submit a cryptographic commitment(the root hash)',
				value: <Typography variant="body2">{data?.root_hash}</Typography>,
			},
			{
				label: 'Status',
				tooltip:
					'Pre-committed: Block included in L2 blockchain Committed: Block transaction data submitted to L1 blockchain Finalized: Validity proof submitted and verified on L1 blockchain Skipped: Validity proof was skipped due to the lack of proving power',
				value: <L1StatusLabel l1Status={data?.status} />,
			},
		],
		[
			data?.number,
			data?.l2_block_count,
			data?.l2_tx_count,
			data?.root_hash,
			data?.commit_tx_hash,
			data?.committed_at,
			data?.prove_tx_hash,
			data?.proven_at,
			data?.status,
		],
	)

	const lineaCellContent = useMemo(
		() => [
			{
				label: 'Blocks',
				tooltip: 'Number of blocks in the batch',
				value: (
					<Link type={LinkTypeEnum.BATCHBLOCKS} value={data?.number}>
						{formatNum(data?.l2_block_count ?? 0)}
					</Link>
				),
			},
			{
				label: 'Transactions',
				tooltip: 'Number of transactions in the batch',
				value: formatNum(data?.l2_tx_count ?? 0),
			},
			{
				label: 'Finalized Tx Hash',
				tooltip:
					"Hash of the transaction that finalizes the batch's data to L1",
				value: (
					<Link
						type={LinkTypeEnum.CROSS_BROWSER_TX}
						value={data?.prove_tx_hash}
						target="_blank"
					/>
				),
			},
			{
				label: 'Finalized Timestamp',
				tooltip:
					"Timestamp of the transaction that finalizes the batch's data to L1",
				value: data?.proven_at,
			},
			{
				label: 'Status',
				tooltip:
					'Pre-committed: Block included in L2 blockchain Committed: Block transaction data submitted to L1 blockchain Finalized: Validity proof submitted and verified on L1 blockchain Skipped: Validity proof was skipped due to the lack of proving power',
				value: <L1StatusLabel l1Status={data?.status} />,
			},
		],
		[
			data?.number,
			data?.l2_block_count,
			data?.l2_tx_count,
			,
			data?.prove_tx_hash,
			data?.proven_at,
			data?.status,
		],
	)

	const baseCellContent = useMemo(
		() => [
			{
				label: 'Blocks',
				tooltip: 'Number of blocks in the batch',
				value: (
					<Link type={LinkTypeEnum.BATCHBLOCKS} value={data?.number}>
						{formatNum(data?.l2_block_count ?? 0)}
					</Link>
				),
			},
			{
				label: 'Transactions',
				tooltip: 'Number of transactions in the batch',
				value: formatNum(data?.l2_tx_count ?? 0),
			},
			{
				label: 'Finalized Tx Hash',
				tooltip:
					"Hash of the transaction that finalizes the batch's data to L1",
				value: (
					<Link
						type={LinkTypeEnum.CROSS_BROWSER_TX}
						value={data?.prove_tx_hash}
						target="_blank"
					/>
				),
			},
			{
				label: 'Finalized Timestamp',
				tooltip:
					"Timestamp of the transaction that finalizes the batch's data to L1",
				value: data?.proven_at,
			},
			{
				label: 'Root Hash',
				tooltip:
					'Validators roll up thousands of transactions together in a single block and submit a cryptographic commitment(the root hash)',
				value: <Typography variant="body2">{data?.root_hash}</Typography>,
			},
			{
				label: 'Status',
				tooltip:
					'Pre-committed: Block included in L2 blockchain Committed: Block transaction data submitted to L1 blockchain Finalized: Validity proof submitted and verified on L1 blockchain Skipped: Validity proof was skipped due to the lack of proving power',
				value: <L1StatusLabel l1Status={data?.status} />,
			},
		],
		[
			data?.number,
			data?.l2_block_count,
			data?.l2_tx_count,
			data?.root_hash,
			data?.prove_tx_hash,
			data?.proven_at,
			data?.status,
		],
	)

	const cellContent = useMemo(
		() =>
			CHAIN_TYPE === EnumChainType.LINEA
				? lineaCellContent
				: EnumChainType.BASE
				  ? baseCellContent
				  : fullCellContent,
		[fullCellContent, baseCellContent, lineaCellContent],
	)

	if (isLoading) {
		return (
			<Container>
				<PageTitle title="Batch" />
				<Loading />
			</Container>
		)
	}

	return (
		<Container>
			<PageTitle
				title={
					<div className="flex items-center">
						<div>Batch</div>
						<div className="ml-[20px] mr-3">#{data?.number}</div>
						<div className="flex items-center">
							<Stack flexDirection={'row'} gap={1}>
								<div
									className={cn(
										'w-5 h-5 flex-center text-xs text-foreground bg-secondary cursor-pointer transition-all rounded hover:bg-primary',
										leftArrowBtnDisabled && style.disabled,
									)}
									onClick={() => goBatchDetail(leftArrowBtnDisabled, -1)}
								>
									<ChevronLeft />
								</div>
								<div
									className={cn(
										'w-5 h-5 flex-center text-xs text-foreground bg-secondary cursor-pointer transition-all rounded hover:bg-primary',
										rightArrowBtnDisabled && style.disabled,
									)}
									onClick={() => goBatchDetail(rightArrowBtnDisabled)}
								>
									<ChevronRight />
								</div>
							</Stack>
						</div>
					</div>
				}
			/>
			<TabCard
				tabList={[
					{
						label: 'Overview',
						children: (
							<Card>
								<CardContent>
									<OverviewCellContent data={cellContent} />
								</CardContent>
							</Card>
						),
					},
				]}
			/>
		</Container>
	)
}

export default BlockchainBatchDetail
