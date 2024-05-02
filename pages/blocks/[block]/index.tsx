import { useCallback, useMemo } from 'react'

import { Stack } from '@mui/material'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/router'

import AISummaryCard from '@/components/ai-summary-card'
import Link, { getLinkRoute } from '@/components/common/link'
import Loading from '@/components/common/loading'
import {
	OverviewCards,
	OverviewCellContent,
} from '@/components/common/overview-content'
import PageTitle from '@/components/common/page-title'
import TabCard from '@/components/common/tab-card'
import TxsInfoStatus from '@/components/txs/TxsInfoStatus'
import { BLOCK_INTERVAL, IsKadsea, IsZkSync } from '@/constants'
import Container from '@/layout/container'
import { cn } from '@/lib/utils'
import { LinkTypeEnum } from '@/types'
import {
	convertNum,
	formatNum,
	transDisplayNum,
	transDisplayTime,
	transDisplayTimeAgo,
} from '@/utils'
import { trpc } from '@/utils/trpc'

import style from './index.module.scss'

const BlockchainBlockDetail: React.FC = () => {
	const router = useRouter()
	const search: any = router?.query
	const { block } = search

	const blockHeight = trpc.block.getBlockHeight.useQuery()
	const { isLoading, data } = trpc.block.getBlockDetail.useQuery(
		{ identity: block },
		{ enabled: !!block },
	)

	const leftArrowBtnDisabled = useMemo(
		() => [0, undefined].includes(data?.number),
		[data?.number],
	)

	const rightArrowBtnDisabled = useMemo(
		() =>
			undefined === data?.number ||
			undefined === blockHeight ||
			blockHeight === data?.number,
		[blockHeight, data?.number],
	)

	const goBlockDetail = useCallback(
		(disabled: boolean, num = 1) => {
			if (disabled) return

			router.push(
				getLinkRoute(LinkTypeEnum.BLOCK, (Number(data?.number) ?? 0) + num),
			)
		},
		[data?.number, router],
	)

	const overviewContent = useMemo(
		() => [
			{
				colSpan: 3,
				img: 'fee',
				content: [
					{
						label: 'Transactions',
						value:
							(data?.transaction_count ?? 0) > 0 ? (
								<Link
									type={LinkTypeEnum.BLOCKS}
									value={convertNum(data?.number)}
								>
									<span> {convertNum(data?.transaction_count)}</span>
								</Link>
							) : (
								0
							),
					},
					IsZkSync
						? {}
						: {
								tooltip:
									'The number of transactions in the block. Internal transaction is transactions as a result of contract execution that involves Ether value.',
								label: 'Contract Internal',
								value:
									(data?.internal_transaction_count ?? 0) > 0 ? (
										<Link
											type={LinkTypeEnum.CONTRACT_INTERNAL_TXS}
											value={convertNum(data?.number)}
										>
											<span>
												{' '}
												{convertNum(data?.internal_transaction_count)}
											</span>
										</Link>
									) : (
										0
									),
						  },
				],
			},
			{
				img: 'value',
				content: [
					{
						tooltip:
							'User-defined tips sent to validator for transation priority/inclusion.',
						label: 'Block Reward',
						value: transDisplayNum({ num: data?.reward, fixedNum: 6 }),
					},
				],
			},
			{
				colSpan: 3,
				img: 'size',
				content: [
					{
						tooltip: `The block size is actually determined by the block's gas limit.`,
						label: 'Size（bytes）',
						value: formatNum(data?.size ?? 0),
					},
				],
			},
			{
				img: 'gas_used',
				content: [
					{
						tooltip:
							'The total gas used in the block and its percentage of gas filled in the block.',
						label: 'Gas Used',
						value: formatNum(data?.gas_used ?? 0),
					},
				],
			},
		],
		[
			data?.number,
			data?.size,
			data?.gas_used,
			data?.internal_transaction_count,
			data?.transaction_count,
			data?.reward,
		],
	)

	const cellContent = useMemo(
		() =>
			[
				{
					label: 'Batch',
					tooltip: 'The batch index where this transaction is submitted to L1.',
					value:
						undefined === data?.l1_batch_number ? (
							'-'
						) : (
							<Link
								type={LinkTypeEnum.BATCH}
								value={convertNum(data?.l1_batch_number)}
							/>
						),
				},
				{
					label: 'Total Difficulty',
					tooltip: 'Total difficulty of the chain until this block.',
					value: formatNum(data?.total_difficulty ?? 0),
				},
				{
					label: 'Gas Limit',
					tooltip: 'Total gas limit provided by all transactions in the block.',
					value: formatNum(data?.gas_limit ?? 0),
				},
				{
					label: 'Hash',
					tooltip: 'The hash of the block header of the current block.',
					value: data?.hash,
				},
				{
					label: 'Parent Hash',
					tooltip:
						'The hash of the block from which this block was generated, also known as its parent block.',
					value: (
						<Link type={LinkTypeEnum.BLOCK} value={data?.parent_hash || ''} />
					),
				},
				{
					label: 'Nonce',
					tooltip:
						'Block nonce is a value used during mining to demonstrate proof of work for a block.',
					value: data?.nonce,
				},
				{
					label: 'Extra Data',
					tooltip: 'Any data that can be included by the miner in the block.',
					value: data?.extra_data,
				},
			].filter((item) => {
				return IsKadsea ? item.label !== 'Batch' : true
			}),
		[
			data?.l1_batch_number,
			data?.total_difficulty,
			data?.gas_limit,
			data?.hash,
			data?.parent_hash,
			data?.nonce,
			data?.extra_data,
		],
	)

	if (isLoading)
		return (
			<Container>
				<Loading />
			</Container>
		)

	return (
		<Container>
			<PageTitle
				title={
					<div className="flex items-center flex-wrap">
						<div>Block </div>
						<div className="ml-[20px] mr-3">#{convertNum(data?.number)}</div>
						<div className="flex items-center">
							<Stack flexDirection={'row'} gap={1}>
								<div
									className={cn(
										'w-5 h-5 flex-center text-xs text-foreground bg-secondary cursor-pointer transition-all rounded hover:bg-primary',
										leftArrowBtnDisabled && style.disabled,
									)}
									onClick={() => goBlockDetail(leftArrowBtnDisabled, -1)}
								>
									<ChevronLeft />
								</div>
								<div
									className={cn(
										'w-5 h-5 flex-center text-xs text-foreground bg-secondary cursor-pointer transition-all rounded hover:bg-primary',
										rightArrowBtnDisabled && style.disabled,
									)}
									onClick={() => goBlockDetail(rightArrowBtnDisabled)}
								>
									<ChevronRight />
								</div>
							</Stack>
						</div>
					</div>
				}
			/>
			<AISummaryCard type="block" content={data} />
			<TabCard
				tabList={[
					{
						label: 'Overview',
						children: (
							<>
								<OverviewCards className="mb-6" data={overviewContent} />
								<div className="w-full border-[1px] border-solid border-border rounded">
									<div className="p-6 border-b-[1px] border-solid border-border">
										<div className="flex items-center mb-3 sm:flex-col sm:items-start">
											<div className="text-[20px] font-medium mr-6 sm:mb-3">
												{convertNum(data?.number)}
											</div>
											<TxsInfoStatus l1Status={data?.l1_status} />
										</div>
										<div className="flex items-center sm:flex-col sm:items-start">
											<div>
												{transDisplayTimeAgo(data?.timestamp)} (
												{transDisplayTime(data?.timestamp)})
											</div>
											<div className="flex-center gap-1 ml-6 sm:items-start sm:flex-col sm:ml-0 sm:mt-3">
												<div>Validated by</div>
												<Link
													className="sm:break-all mx-3"
													type={LinkTypeEnum.ADDRESS}
													value={data?.validator || ''}
												/>
												<div>in {BLOCK_INTERVAL} secs</div>
											</div>
										</div>
									</div>
									<div className="p-6">
										<OverviewCellContent data={cellContent} />
									</div>
								</div>
							</>
						),
					},
				]}
			/>
		</Container>
	)
}

export default BlockchainBlockDetail
