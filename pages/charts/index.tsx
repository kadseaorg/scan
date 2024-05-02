import { Divider } from '@mui/material'
import dayjs from 'dayjs'

import Chart from '@/components/common/chart'
import Link from '@/components/common/link'
import Loading from '@/components/common/loading'
import PageTitle from '@/components/common/page-title'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BROWSER_TITLE, CHAIN_TOKEN_NAME, IsKadsea } from '@/constants'
import Container from '@/layout/container'
import { LinkTypeEnum, TokenTypeEnum } from '@/types'
import { trpc } from '@/utils/trpc'

export enum ChartTypeEnum {
	TX = 'tx',
	ERC2ETXNS = 'erc2etxns',
	ADDRESS = 'address',
	UNISWAPROUTERV2 = 'uniswapRouterV2',
	DailyGasUsed = 'dailyGasUsed',
	DailyTxFee = 'dailyTxFee',
	AverageTxsFees = 'averageTxsFees',
	DailyBatches = 'dailyBatches',
	TPS = 'tps',
}

export const chartTitle: any = {
	[ChartTypeEnum.TX]: {
		title: 'Daily Transactions Chart',
		tip: `The chart highlights the total number of transactions on the ${BROWSER_TITLE} blockchain.`,
	},
	[ChartTypeEnum.ERC2ETXNS]: {
		title: 'ERC-20 Daily Token Transfer Chart',
		tip: 'The chart shows the number of ERC20 tokens transferred daily.',
	},
	[ChartTypeEnum.ADDRESS]: {
		title: 'Unique Addresses Chart',
		tip: `The chart shows the total distinct numbers of address on the ${BROWSER_TITLE} blockchain.`,
	},
	[ChartTypeEnum.DailyGasUsed]: {
		title: 'Daily Gas Used Chart',
		tip: `The chart shows the daily gas used on the ${BROWSER_TITLE} blockchain.`,
	},
	[ChartTypeEnum.DailyTxFee]: {
		title: 'L2 Daily Transaction Fees Chart',
		tip: `The chart shows the L2 daily transaction fees(${CHAIN_TOKEN_NAME}) on the ${BROWSER_TITLE} blockchain.`,
	},
	[ChartTypeEnum.AverageTxsFees]: {
		title: 'Daily Average Txns Fees Chart',
		tip: `The chart shows the daily average txns fees on the ${BROWSER_TITLE} blockchain.`,
	},
	[ChartTypeEnum.DailyBatches]: {
		title: 'Daily Batches Chart',
		tip: `The chart shows the daily batches on the ${BROWSER_TITLE} blockchain.`,
	},
	[ChartTypeEnum.TPS]: {
		title: 'Daily TPS Chart',
		tip: `The chart shows the daily tps on the ${BROWSER_TITLE} blockchain.`,
	},
}

export let chartConfig: any = {
	[ChartTypeEnum.TX]: {
		chartType: 'line',
		chartTooltipTitle: 'Total Transactions',
	},
	[ChartTypeEnum.ERC2ETXNS]: {
		chartType: 'line',
		chartTooltipTitle: 'Total Token Transfer',
	},
	[ChartTypeEnum.ADDRESS]: {
		chartType: 'area',
		chartTooltipTitle: 'Total Distinct Addresses',
	},
	[ChartTypeEnum.DailyGasUsed]: {
		chartType: 'line',
		chartTooltipTitle: 'Total Gas Used',
	},
	[ChartTypeEnum.DailyTxFee]: {
		chartType: 'line',
		chartTooltipTitle: `Total Transaction Fees(${CHAIN_TOKEN_NAME})`,
	},
	[ChartTypeEnum.AverageTxsFees]: {
		chartType: 'line',
		chartTooltipTitle: `Average Transaction Fees(${CHAIN_TOKEN_NAME})`,
	},
	[ChartTypeEnum.DailyBatches]: {
		chartType: 'area',
		chartTooltipTitle: 'Total Batches',
	},
	[ChartTypeEnum.TPS]: {
		chartType: 'line',
		chartTooltipTitle: 'Daily TPS',
	},
}
if(IsKadsea){
	delete chartConfig[ChartTypeEnum.DailyBatches]
}
const chartConfigArray = Object.keys(chartConfig).map((key) => ({
	key,
	...chartConfig[key],
}))

export const defaultTimeQuery = {
	timeStart: dayjs().subtract(1, 'year').unix(),
	timeEnd: dayjs().unix(),
}

export const last24HourQuery = {
	timeStart: dayjs().subtract(1, 'day').startOf('day').unix(),
	timeEnd: dayjs().subtract(1, 'day').endOf('day').unix(),
}

const Charts: React.FC = () => {
	const { isFetching: dailyTxCountFetching, data: dailyTxCount } =
		trpc.stat.getDailyTxCount.useQuery(defaultTimeQuery, {
			enabled: !!defaultTimeQuery,
		})

	const {
		isFetching: dailyTokenTransferCountFetching,
		data: dailyTokenTransferCount,
	} = trpc.stat.getDailyTokenTransferCount.useQuery(
		{
			...defaultTimeQuery,
			tokenType: TokenTypeEnum.ERC20,
		},
		{ enabled: !!defaultTimeQuery },
	)

	const {
		isFetching: uniqueAddressesCountFetching,
		data: uniqueAddressesCount,
	} = trpc.stat.getUniqueAddressesCount.useQuery(defaultTimeQuery, {
		enabled: !!defaultTimeQuery,
	})

	const { isFetching: dailyGasUsedFetching, data: dailyGasUsed } =
		trpc.stat.getDailyGasUsed.useQuery(defaultTimeQuery, {
			enabled: !!defaultTimeQuery,
		})

	const { isFetching: dailyTxFeeFetching, data: dailyTxFee } =
		trpc.stat.getDailyTxFee.useQuery(defaultTimeQuery, {
			enabled: !!defaultTimeQuery,
		})

	const { isFetching: avgTxsFeesFetching, data: avgTxsFees } =
		trpc.stat.getAvgTxsFees.useQuery(defaultTimeQuery, {
			enabled: !!defaultTimeQuery,
		})

	const { isFetching: dailyBatchesFetching, data: dailyBatches } =
		trpc.stat.getDailyBatches.useQuery(defaultTimeQuery, {
			enabled: !!defaultTimeQuery,
		})

	const { isFetching: hourlyTpsFetching, data: hourlyTps } =
		trpc.stat.getHourlyTps.useQuery(last24HourQuery, {
			enabled: !!last24HourQuery,
		})

	const loading =
		dailyTxCountFetching ||
		dailyTokenTransferCountFetching ||
		uniqueAddressesCountFetching ||
		dailyGasUsedFetching ||
		dailyTxFeeFetching ||
		avgTxsFeesFetching ||
		dailyBatchesFetching ||
		hourlyTpsFetching

	if (loading) {
		return (
			<Container>
				<Loading />
			</Container>
		)
	}

	const getChartData = (chart: ChartTypeEnum) => {
		switch (chart) {
			case ChartTypeEnum.TX:
				return dailyTxCount
			case ChartTypeEnum.ERC2ETXNS:
				return dailyTokenTransferCount
			case ChartTypeEnum.ADDRESS:
				return uniqueAddressesCount
			case ChartTypeEnum.DailyGasUsed:
				return dailyGasUsed
			case ChartTypeEnum.DailyTxFee:
				return dailyTxFee
			case ChartTypeEnum.AverageTxsFees:
				return avgTxsFees
			case ChartTypeEnum.DailyBatches:
				return dailyBatches
			case ChartTypeEnum.TPS:
				return (
					hourlyTps?.map((item) => ({ count: item.tps, date: item.hour })) || []
				)
			default:
				return []
		}
	}

	return (
		<Container>
			<PageTitle title="Resources" />
			<Card className="min-h-[calc(100vh-152px)]">
				<CardHeader>
					<CardTitle>Blockchain Data</CardTitle>
				</CardHeader>
				<Divider sx={{ mt: 2 }} />
				<CardContent>
					<div className="grid grid-cols-3 gap-4 sm:grid-cols-1">
						{chartConfigArray.map(({ type, key, chartTooltipTitle }: any) => (
							<div
								key={key}
								className="px-1 py-3.5 border-[1px] border-solid border-border cursor-pointer rounded-lg dark:border-none dark:bg-darkGray-600"
							>
								<div className="relative z-[1] w-full flex flex-col gap-3">
									<Link
										type={LinkTypeEnum.CHARTS}
										value={key}
										className="mb-1 ml-1"
									>
										{chartTooltipTitle}
									</Link>
									<div className="h-72 sm:w-full">
										<Chart
											dataType={key}
											type={type}
											xDataKey="date"
											yDataKey="count"
											data={getChartData(key) || []}
											tooltipTitle={chartTooltipTitle}
										/>
									</div>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</Container>
	)
}

export default Charts
