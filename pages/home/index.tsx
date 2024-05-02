import { useCallback, useEffect, useMemo, useState } from 'react'
import { Scrollbars } from 'react-custom-scrollbars'

import {
	Box,
	CardContent,
	Grid,
	Stack,
	Tooltip,
	Typography,
} from '@mui/material'
import classNames from 'classnames'
import dayjs from 'dayjs'
import Image from 'next/image'

import AdvertisementBanner, {
	AdvertisementBannerEnum,
} from '@/components/common/advertisement-banner'
import Chart from '@/components/common/chart'
import Link from '@/components/common/link'
import Loading from '@/components/common/loading'
import { DataIndicatorIcon } from '@/components/common/svg-icon/home'
import { L1StatusLabel } from '@/components/common/table-col-components'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import {
	BLOCK_INTERVAL,
	BROWSER_TITLE,
	CHAIN_TYPE,
	CURRENT_CHAIN_ITEM,
	IsKadsea,
} from '@/constants'
import ROUTES from '@/constants/routes'
import { BlockType, LinkTypeEnum, TxType } from '@/types'
import { EnumChainType } from '@/types/chain'
import {
	displayGasPriceInGwei,
	formatNum,
	formatNumWithSymbol,
	getThemeImgSrc,
	transDisplayNum,
	transDisplayTime,
	transDisplayTimeAgo,
} from '@/utils'
import { trpc } from '@/utils/trpc'

import style from './index.module.scss'

const HOME_LIST_SIZE = 10

const Home: React.FC = (props) => {
	const [walletCount, setWalletCount] = useState(0)
	const { data: l2Tps } = trpc.summary.getAvgTps24h.useQuery()
	const { data: l2AvgGasPrice } = trpc.summary.getAvgPrice5min.useQuery()
	const { data: finalizedBlockHeight } =
		trpc.block.getFinalizedBlockHeight.useQuery()
	const { data: txCount } = trpc.transaction.getTransactionCount.useQuery()
	const { data: walletCountFromRPC } =
		trpc.address.getUniqueWalletCount.useQuery(undefined, {
			enabled: CHAIN_TYPE !== EnumChainType.ZKSYNC,
		})
	const { data: averageBlockTime } = trpc.block.getAverageBlockTime.useQuery()
	const [
		last14DaysTxCountStatisticsCountMem,
		setLast14DaysTxCountStatisticsCountMem,
	] = useState<any>()

	const { data: last14DaysTxCountStatisticsCount } =
		trpc.stat.getDailyTxCount.useQuery({
			timeStart: dayjs().subtract(15, 'day').unix(),
			timeEnd: dayjs().subtract(1, 'day').unix(),
		})

	useEffect(() => {
		;(async () => {
			if (CHAIN_TYPE === EnumChainType.ZKSYNC) {
				const response = await fetch(
					'https://zksync.blockscout.com/api/v2/stats',
				)
				const { total_addresses } = await response.json()
				setWalletCount(total_addresses)
			} else {
				setWalletCount(walletCountFromRPC)
			}
		})()
	}, [walletCountFromRPC])

	useMemo(() => {
		if (last14DaysTxCountStatisticsCount) {
			setLast14DaysTxCountStatisticsCountMem(last14DaysTxCountStatisticsCount)
		}
	}, [last14DaysTxCountStatisticsCount])

	const { isLoading: blockLoading, data: blockData } =
		trpc.block.getBlocks.useQuery(
			{ take: HOME_LIST_SIZE },
			{ refetchInterval: BLOCK_INTERVAL * 1000 },
		)
	const { isLoading: txDataLoading, data: txData } =
		trpc.transaction.getTransactions.useQuery(
			{ take: HOME_LIST_SIZE, showPublicTag: false },
			{ refetchInterval: BLOCK_INTERVAL * 1000 },
		)
	const lastBlockNumber = blockData?.list?.[0]?.number

	const iconRender = useCallback(
		({ iconName, title, content, tooltip }: any) => {
			return (
				<Card>
					<CardContent>
						<div className="h-[60px] flex items-center">
							<div className="flex-1">
								<Tooltip title={tooltip}>
									<span className="font-semibold text-muted-foreground cursor-default">
										{title}
									</span>
								</Tooltip>
								<div className="font-bold text-base mt-[6px]">{content}</div>
							</div>
							<div className="w-[48px] h-[48px] flex-center rounded-full ml-20px">
								<DataIndicatorIcon name={iconName} />
							</div>
						</div>
					</CardContent>
				</Card>
			)
		},
		[],
	)

	const cellRender = useCallback(
		({
			type = 'block',
			blockInfo,
			txInfo,
		}: { type: 'block' | 'trans'; blockInfo?: BlockType; txInfo?: TxType }) => {
			const isBlock = 'block' === type

			const key = isBlock ? blockInfo?.hash : txInfo?.hash
			return (
				<Grid key={key} container spacing={2} className={style.cell}>
					<Grid item sm={12} md={4}>
						<div className="flex items-center text-xs">
							<div className="w-8 h-8 flex-shrink-0 font-medium flex-center rounded-full bg-primary text-muted mr-3 relative sm:!hidden">
								{isBlock ? 'Bk' : 'Tx'}
							</div>
							<div className="sm:flex sm:items-center">
								<Link
									className="mb-[5px] sm:mb-0"
									type={isBlock ? LinkTypeEnum.BLOCK : LinkTypeEnum.TX}
									value={isBlock ? blockInfo?.number : txInfo?.hash}
									width={80}
									ellipsis
								/>
								<div className="text-xs text-muted-foreground">
									{
										<Tooltip
											title={transDisplayTime(
												isBlock ? blockInfo?.timestamp : txInfo?.timestamp,
											)}
										>
											<Typography variant="body2">
												{transDisplayTimeAgo(
													isBlock ? blockInfo?.timestamp : txInfo?.timestamp,
												)}
											</Typography>
										</Tooltip>
									}
								</div>
							</div>
						</div>
					</Grid>
					<Grid item sm={12} md={4}>
						<div className="flex-1 text-xs">
							<div className="flex items-center">
								<Typography
									variant="caption"
									className="pr-1"
									color={'text.secondary'}
								>
									{isBlock ? 'Validated By' : 'From'}
								</Typography>

								<Link
									type={LinkTypeEnum.ADDRESS}
									value={isBlock ? blockInfo?.validator : txInfo?.from_address}
									width={isBlock ? 80 : 120}
									ellipsis
								/>
							</div>
							<div className="flex items-center">
								<div className="mr-[4px] text-muted-foreground dark:text-muted-foreground-dark">
									{isBlock ? (
										<Link
											type={LinkTypeEnum.BLOCKS}
											value={blockInfo?.number}
											width="fit-content"
											ellipsis
										>
											{blockInfo?.transaction_count} txns
										</Link>
									) : (
										'To'
									)}
								</div>
								{isBlock ? (
									<Typography variant="caption" color={'text.secondary'}>
										in {BLOCK_INTERVAL} secs
									</Typography>
								) : (
									<Link
										type={LinkTypeEnum.ADDRESS}
										value={txInfo?.to_address}
										width={isBlock ? 80 : 120}
										ellipsis
									/>
								)}
							</div>
						</div>
					</Grid>
					{!IsKadsea && (
						<Grid
							item
							sm={6}
							md={2}
							className="flex-center sm:justify-start sm:text-left"
						>
							<L1StatusLabel
								l1Status={blockInfo?.l1_status ?? txInfo?.l1_status}
								showIcon={false}
								showBg={false}
							/>
						</Grid>
					)}

					<Grid
						item
						sm={6}
						md={2}
						className="flex justify-end text-xs text-muted-foreground dark:text-muted-foreground-dark"
					>
						<div>
							{transDisplayNum({
								num: isBlock ? (blockInfo as any)?.reward : txInfo?.value,
								fixedNum: 5,
							})}
						</div>
					</Grid>
				</Grid>
			)
		},
		[],
	)

	const { description } = CURRENT_CHAIN_ITEM

	return (
		<div className="px-6">
			{(txDataLoading || blockLoading) && <Loading />}
			<div className="flex items-center gap-3 sm:flex-col sm:gap-0">
				<div
					className={classNames(
						style.searchWrap,
						'flex items-center h-[170px] col-span-2 sm:h-fit',
					)}
				>
					<div className="sm:w-full">
						<div className="text-[24px] mb-[8px] sm:text-[20px] text-foreground relative z-50">
							The {BROWSER_TITLE} Blockchain Explorer
						</div>
						<span className="text-sm text-foreground/70 relative z-50">
							{description}
						</span>
						<Image
							className="absolute right-[10px] bottom-0 w-[400px] z-0 opacity-50 sm:hidden"
							width={400}
							src={getThemeImgSrc('home_header_bg')}
							alt=""
						/>
					</div>
				</div>

				{!IsKadsea && (
					<AdvertisementBanner
						className="w-[510px] sm:w-full sm:mt-3"
						type={AdvertisementBannerEnum.HOME}
						height={170}
					/>
				)}
			</div>

			<Box
				gap={2}
				display="grid"
				gridTemplateColumns={{
					xs: 'repeat(1, 1fr)',
					sm: 'repeat(2, 1fr)',
					md: 'repeat(3, 1fr)',
				}}
				sx={{ mt: 2 }}
			>
				{iconRender({
					iconName: 'block_time_icon',
					title: 'AVERAGE BLOCK TIME',
					tooltip: 'Average block time in the last 5 minutes',
					content: (
						<span>
							{averageBlockTime ? Number(averageBlockTime).toFixed(2) : '-'}{' '}
							Seconds
						</span>
					),
				})}
				{iconRender({
					iconName: 'trans_icon',
					title: 'TRANSACTIONS',
					tooltip: 'Total transactions count',
					content: <span>{formatNumWithSymbol(txCount)}</span>,
				})}
				{iconRender({
					iconName: 'gwei_icon',
					title: 'L2 AVG GAS PRICE',
					tooltip: 'Average 5-minute gas price',
					content: <span>{displayGasPriceInGwei(l2AvgGasPrice ?? 0)}</span>,
				})}
				{!IsKadsea &&
					iconRender({
						iconName: 'block_icon',
						title: 'LAST FINALIZED BLOCK',
						tooltip: 'Last finalized block on layer2 network',
						content: (
							<Link type={LinkTypeEnum.BLOCK} value={finalizedBlockHeight}>
								{formatNum(finalizedBlockHeight || 0)}
							</Link>
						),
					})}
				{IsKadsea &&
					iconRender({
						iconName: 'block_icon',
						title: 'LAST BLOCK',
						tooltip: 'Last layer2 block',
						content: (
							<Link type={LinkTypeEnum.BLOCK} value={lastBlockNumber}>
								{formatNum(lastBlockNumber || 0)}
							</Link>
						),
					})}
				{iconRender({
					iconName: 'address_icon',
					title: 'WALLET ADDRESSES',
					tooltip: 'Total wallet addresses count',
					content: <span>{formatNum(walletCount ?? 0)}</span>,
				})}
				{!IsKadsea &&
					iconRender({
						iconName: 'tps_icon',
						title: 'L2 TPS',
						tooltip: 'Average 24-hour TPS',
						content: <span>{l2Tps ?? 0}</span>,
					})}
			</Box>

			<Grid
				// container
				spacing={2}
				sx={{ my: 2 }}
			>
				{/* <Grid item xs={12} lg={3}>
          <Card sx={{ p: 3, height: 264 }}>
            <div className="mb-[16px]">
              <Typography variant="subtitle2" color={'text.secondary'}>
                Low Gas Tracker
              </Typography>
              <div className="font-bold text-base mt-[8px]">0.001 Gwei </div>
            </div>
            <div className="mb-[16px]">
              <Typography variant="subtitle2" color={'text.secondary'}>
                Average Gas Tracker
              </Typography>
              <div className="font-bold text-base mt-[8px]">0.001 Gwei </div>
            </div>
            <div className="mb-[16px]">
              <Typography variant="subtitle2" color={'text.secondary'}>
                High Gas Tracker
              </Typography>
              <div className="font-bold text-base mt-[8px]">0.001 Gwei </div>
            </div>
          </Card>
        </Grid> */}
				<Card className="h-78 p-3">
					<p className="mb-12 font-semibold">TRANSACTION HISTORY IN 14 DAYS</p>

					<div className="w-full h-72 ">
						<Chart
							xDataKey="date"
							yDataKey="count"
							xPanding={{ left: 0, right: 0 }}
							yWidth={60}
							data={last14DaysTxCountStatisticsCountMem || []}
							tooltipTitle="Transactions"
							dot={false}
							showGrid={true}
						/>
					</div>
				</Card>
			</Grid>

			<Grid container spacing={2} className="pb-2">
				{[
					{
						title: 'Blocks',
						type: 'block',
						href: ROUTES.BLOCK_CHAIN.BLOCKS,
						listData: blockData?.list,
					},
					{
						title: 'Transactions',
						type: 'trans',
						href: ROUTES.BLOCK_CHAIN.TXNS,
						listData: txData?.list,
					},
				].map(({ title, type, href, listData }: any, index) => (
					<Grid key={type} item xs={12} md={6}>
						<Card className="min-h-[404px] h-[calc(100vh-536px)] overflow-hidden">
							<CardHeader>
								<CardTitle>
									<div className="flex justify-between items-center">
										<span className="text-muted-foreground text-xl">
											Latest {title}
										</span>
										<a
											className="text-sm font-semibold text-accent"
											href={href}
										>
											View all
										</a>
									</div>
								</CardTitle>
							</CardHeader>
							<Stack className={style.listWrap}>
								<Scrollbars universal={true} autoHide>
									{listData?.map((data: any) =>
										cellRender({
											type,
											blockInfo: 'block' === type ? data : undefined,
											txInfo: 'block' === type ? undefined : data,
										}),
									)}
								</Scrollbars>
							</Stack>
						</Card>
					</Grid>
				))}
			</Grid>
		</div>
	)
}

export default Home
