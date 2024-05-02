import { useMemo } from 'react'

import { LoadingOutlined } from '@ant-design/icons'
import { getAddress, isAddress } from '@ethersproject/address'
import { Stack } from '@mui/material'
import Image from 'next/image'
import { useRouter } from 'next/router'

import AISummaryCard from '@/components/ai-summary-card'
import Link from '@/components/common/link'
import { OverviewCards } from '@/components/common/overview-content'
import PageTitle from '@/components/common/page-title'
import TabCard from '@/components/common/tab-card'
import ContractTab from '@/components/contract/contract-tab'
import ContractTabTitle from '@/components/contract/contract-tab/ContractTabTitle'
import AddTokenButton from '@/components/tokens/add-token-button'
import TokenDetailHoldersTable from '@/components/tokens/token-detail-holders-table'
import TokenDetailTxsTable from '@/components/tokens/token-detail-txs-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Container from '@/layout/container'
import { ContractDetailType, LinkTypeEnum } from '@/types'
import { formatNum, transDisplayNum } from '@/utils'
import { trpc } from '@/utils/trpc'

const BlockchainTokenDetail: React.FC = () => {
	const router = useRouter()
	const search: any = router?.query
	const token = isAddress(search?.token)
		? getAddress(search?.token)
		: search?.token
	const { data: tokenDetail } = trpc.token.getTokenDetail.useQuery(token, {
		enabled: !!token,
	})
	const { data: contractDetail } = trpc.contract.getContractDetail.useQuery(
		token,
		{ enabled: !!token },
	)
	const { data: tokenTxsCount } = trpc.token.getTokenTxsCount.useQuery(token, {
		enabled: !!token,
	})
	const rawTokenSummaryContent = useMemo(() => {
		if (!tokenDetail || !tokenTxsCount) return null
		return {
			...tokenDetail,
			transfer_count: tokenTxsCount,
		}
	}, [tokenDetail, tokenTxsCount])

	const overviewContent = useMemo(
		() => [
			{
				img: 'supply',
				content: [
					{
						label: 'Max Total Supply',
						value: tokenDetail ? (
							transDisplayNum({
								num: Number(tokenDetail?.total_supply) ?? 0,
								decimals: tokenDetail?.decimals,
								suffix: '',
							})
						) : (
							<LoadingOutlined />
						),
					},
				],
			},
			{
				img: 'holders',
				content: [
					{
						label: 'Holders',
						value: tokenDetail ? (
							formatNum(tokenDetail?.holders)
						) : (
							<LoadingOutlined />
						),
					},
				],
			},
			{
				img: 'fee',
				content: [
					{
						label: 'Transfers',
						value: tokenTxsCount ? (
							formatNum(tokenTxsCount)
						) : (
							<LoadingOutlined />
						),
					},
				],
			},
			...(!!tokenDetail?.decimals
				? [
						{
							img: 'decimals',
							content: [{ label: 'Decimals', value: tokenDetail.decimals }],
						},
				  ]
				: []),
		],
		[tokenDetail, tokenTxsCount],
	)

	return (
		<Container>
			<PageTitle
				title={
					<div className="flex items-center flex-wrap">
						{!!tokenDetail?.logo_path && (
							<div className="mr-[8px]">
								<Image
									width={28}
									height={28}
									src={tokenDetail?.logo_path}
									alt=""
								/>
							</div>
						)}
						<div>Token </div>
						<div
							className="text-muted-foreground text-base font-normal ml-[10px] pb-1px mb-[-4px]"
							dangerouslySetInnerHTML={{
								__html: `<span>${
									tokenDetail?.name || tokenDetail?.contractAddress
								}</span>`,
							}}
						></div>
					</div>
				}
				showBack
			/>
			<AISummaryCard type="token" content={rawTokenSummaryContent} />
			<Card>
				<CardHeader>
					<CardTitle className="text-xl">Overview</CardTitle>
				</CardHeader>
				<CardContent>
					<Stack flexDirection={'row'} alignItems={'center'} sx={{ mb: 3 }}>
						<div className="w-fit flex items-center py-[4px] rounded">
							<div className="break-all">
								<span className="text-muted-foreground dark:text-muted-foreground-dark font-medium mr-[10px]">
									Contract
								</span>
								<Link type={LinkTypeEnum.ADDRESS} value={token} />
							</div>
							<AddTokenButton tokenDetail={tokenDetail} />
						</div>
					</Stack>
					<OverviewCards data={overviewContent} />
				</CardContent>
			</Card>
			<TabCard
				tabList={[
					{
						label: 'Transfers',
						children: (
							<TokenDetailTxsTable
								tokenAddress={token}
								type={tokenDetail?.token_type}
							/>
						),
					},
					{
						label: 'Holders',
						children: (
							<TokenDetailHoldersTable
								tokenAddress={token}
								type={tokenDetail?.token_type}
							/>
						),
					},
					{
						label: (
							<ContractTabTitle
								contractDetail={contractDetail as ContractDetailType}
							/>
						),
						children: (
							<ContractTab
								contractDetail={contractDetail as ContractDetailType}
							/>
						),
					},
				]}
			/>
		</Container>
	)
}

export default BlockchainTokenDetail
