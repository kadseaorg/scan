import { useEffect, useState } from 'react'

import { Divider, Tooltip, Typography } from '@mui/material'
import { DatePicker } from 'antd'
import dayjs from 'dayjs'
import Decimal from 'decimal.js'
import { useRouter } from 'next/router'

import Chart from '@/components/common/chart'
import Loading from '@/components/common/loading'
import PageTitle from '@/components/common/page-title'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Container from '@/layout/container'
import {
	ChartTypeEnum,
	chartConfig,
	chartTitle,
	defaultTimeQuery,
	last24HourQuery,
} from '@/pages/charts'
import { StatisticsTimeQueryType, TokenTypeEnum } from '@/types'
import { formatNumberIntl } from '@/utils'
import { trpc } from '@/utils/trpc'

const disabledDate = (currentDate: any) => dayjs().isBefore(dayjs(currentDate))

const ChartDetail: React.FC = () => {
	const router = useRouter()
	const search: any = router?.query
	const { chart } = search

	const [datePickerValue, setDatePickerValue] = useState()
	const [timeRange, setTimeRange] =
		useState<StatisticsTimeQueryType>(defaultTimeQuery)
	const { isFetching: dailyTxCountFetching, data: dailyTxCount } =
		trpc.stat.getDailyTxCount.useQuery(timeRange, {
			enabled:
				!!timeRange &&
				(chart === ChartTypeEnum.TX || chart === ChartTypeEnum.TPS),
		})

	useEffect(() => {
		setTimeRange(
			chart === ChartTypeEnum.TPS ? last24HourQuery : defaultTimeQuery,
		)
	}, [chart])

	const {
		isFetching: dailyTokenTransferCountFetching,
		data: dailyTokenTransferCount,
	} = trpc.stat.getDailyTokenTransferCount.useQuery(
		{
			...timeRange,
			tokenType: TokenTypeEnum.ERC20,
		},
		{ enabled: !!timeRange && chart === ChartTypeEnum.ERC2ETXNS },
	)

	const {
		isFetching: uniqueAddressesCountFetching,
		data: uniqueAddressesCount,
	} = trpc.stat.getUniqueAddressesCount.useQuery(timeRange, {
		enabled: !!timeRange && chart === ChartTypeEnum.ADDRESS,
	})

	const { isFetching: dailyGasUsedFetching, data: dailyGasUsed } =
		trpc.stat.getDailyGasUsed.useQuery(timeRange, {
			enabled: !!timeRange && chart === ChartTypeEnum.DailyGasUsed,
		})

	const { isFetching: dailyTxFeeFetching, data: dailyTxFee } =
		trpc.stat.getDailyTxFee.useQuery(timeRange, {
			enabled: !!timeRange && chart === ChartTypeEnum.DailyTxFee,
		})

	const { isFetching: avgTxsFeesFetching, data: avgTxsFees } =
		trpc.stat.getAvgTxsFees.useQuery(timeRange, {
			enabled: !!timeRange && chart === ChartTypeEnum.AverageTxsFees,
		})

	const { isFetching: dailyBatchesFetching, data: dailyBatches } =
		trpc.stat.getDailyBatches.useQuery(timeRange, {
			enabled: !!timeRange && chart === ChartTypeEnum.DailyBatches,
		})

	const { isFetching: hourlyTpsFetching, data: hourlyTps } =
		trpc.stat.getHourlyTps.useQuery(timeRange, {
			enabled: !!timeRange && chart === ChartTypeEnum.TPS,
		})

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

	const total =
		chart === ChartTypeEnum.TPS
			? dailyTxCount?.[0]?.count || 0
			: getChartData(chart)?.reduce(
					(acc: any, cur: any) => acc + new Decimal(cur.count).toNumber(),
					0,
			  )

	if (
		dailyTxCountFetching ||
		dailyTokenTransferCountFetching ||
		uniqueAddressesCountFetching ||
		dailyGasUsedFetching ||
		dailyTxFeeFetching ||
		avgTxsFeesFetching ||
		dailyBatchesFetching ||
		hourlyTpsFetching
	) {
		return (
			<Container>
				<PageTitle title={chartTitle?.[chart]?.title} showBack />
				<Loading />
			</Container>
		)
	}

	return (
		<Container>
			<PageTitle title={chartTitle?.[chart]?.title} showBack />
			<Card className="h-[calc(100vh-152px)] min-h-[500px]">
				<CardHeader>
					<CardTitle className="text-md leading-7 font-normal break-words whitespace-normal">
						{chartTitle?.[chart]?.tip}
					</CardTitle>
				</CardHeader>
				<Divider />
				<CardContent className="h-[calc(100%-72px)] sm:h-[calc(100%-85px)]">
					<div className="relative z-[100] w-full flex justify-between mb-3 sm:flex-wrap">
						<Tooltip
							className="text-[#999] leading-[22px] font-normal ml-4 sm:w-full sm:ml-0 sm:!my-[8px]"
							title={total?.toString()}
						>
							<Typography variant="subtitle1">
								{' '}
								Total: {formatNumberIntl(total)}
							</Typography>
						</Tooltip>
						{chart !== ChartTypeEnum.TPS && (
							<DatePicker.RangePicker
								className="border border-primary"
								size="middle"
								disabledDate={disabledDate}
								allowClear
								value={datePickerValue}
								onChange={(dates: any) => {
									setDatePickerValue(dates)
									setTimeRange({
										timeStart: dates?.[0]
											? dayjs(dates?.[0]).unix()
											: defaultTimeQuery.timeStart,
										timeEnd: dates?.[1]
											? dayjs(dates?.[1]).unix()
											: defaultTimeQuery.timeEnd,
									})
								}}
							/>
						)}
						{chart === ChartTypeEnum.TPS && (
							<DatePicker
								className="border border-primary"
								size="middle"
								value={datePickerValue}
								onChange={(date: any) => {
									date && setDatePickerValue(date)
									if (date) {
										setTimeRange({
											timeStart: dayjs(date).startOf('day').unix(),
											timeEnd: dayjs(date).endOf('day').unix(),
										})
									}
								}}
							></DatePicker>
						)}
					</div>
					<div className="relative z-[1] w-full h-[calc(100%-72px)] sm:h-[calc(100%-85px)] overflow-x-auto">
						<div className="w-full min-w-[500px] h-full">
							<Chart
								dataType={chart}
								type={chartConfig?.[chart]?.chartType}
								xDataKey="date"
								yDataKey="count"
								data={getChartData(chart) || []}
								tooltipTitle={chartConfig?.[chart]?.chartTooltipTitle}
							/>
						</div>
					</div>
				</CardContent>
			</Card>
		</Container>
	)
}

export default ChartDetail
