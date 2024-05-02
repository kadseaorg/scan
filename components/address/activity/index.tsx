import { ReactNode, useCallback, useMemo, useState } from 'react'

import dayjs from 'dayjs'
import {
	ArrowRightLeft,
	BarChartBig,
	CalendarDays,
	Loader2,
	Share2,
	Sparkle,
	Spline,
} from 'lucide-react'
import Image from 'next/image'

import Chart from '@/components/address/activity/chart'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import useEcharts from '@/hooks/common/use-echarts'
import { cn } from '@/lib/utils'
import { formatNum, formatNumWithSymbol, getImgSrc } from '@/utils'
import { trpc } from '@/utils/trpc'

const iconClassName = 'stroke-primary w-8 h-8'

const Grid3x3: React.FC = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		className="lucide lucide-grid-3x3 stroke-primary w-8 h-8"
	>
		<rect width="18" height="18" x="3" y="3" rx="2" />
		<path d="M3 9h18" />
		<path d="M3 15h18" />
		<path d="M9 3v18" />
		<path d="M15 3v18" />
	</svg>
)

const Heatmap: React.FC<{ address: string }> = ({ address }) => {
	const { isLight, labelColor, tooltipColor } = useEcharts()

	const { data } = trpc.addressStats.getAddressDailyTxVolume.useQuery(address, {
		enabled: !!address,
	})

	const endDate = useMemo(() => dayjs().startOf('day').unix() * 1000, [])

	const startDate = useMemo(
		() => dayjs(endDate).subtract(1, 'year').unix() * 1000,
		[endDate],
	)

	const customOptions = useMemo(
		() => ({
			visualMap: {
				top: 0,
				right: 0,
				orient: 'horizontal',
				inRange: {
					color: ['#c5ecb2', '#56c364', '#11865b'],
				},
				min: 0,
				max: Math.max(
					...(data?.map(({ totalVolumeUsd }) => totalVolumeUsd ?? 0) || [0]),
				),
				textStyle: { color: labelColor },
			},
			calendar: {
				left: 40,
				right: '10%',
				cellSize: [25, 25],
				range: [
					dayjs(startDate).format('YYYY-MM-DD'),
					dayjs(endDate).format('YYYY-MM-DD'),
				],
				dayLabel: {
					color: labelColor,
					nameMap: ['Sun', '', 'Tue', '', 'Thu', '', 'Sat'],
				},
				monthLabel: { color: labelColor, position: 'end', nameMap: 'EN' },
				yearLabel: { show: false },
				itemStyle: {
					color: '#5973930a',
					borderWidth: 4,
					borderColor: isLight ? '#fff' : '#1f1e1e',
					boderCap: 'round',
					borderJoin: 'round',
					borderRadius: 10,
				},
				// splitLine: { lineStyle: { width: 10, color: isLight ? '#fff' : '#1f1e1e', cap: 'round', join: 'round' } }
				splitLine: { show: false },
			},
			series: {
				type: 'heatmap',
				coordinateSystem: 'calendar',
				data: data?.map(({ date, totalVolumeUsd }) => [
					dayjs(dayjs(date).format('YYYY-MM-DD')).unix() * 1000,
					totalVolumeUsd,
				]),
				itemStyle: { borderRadius: 5 },
				gridSize: 30,
			},
			tooltip: {
				show: true,
				formatter: ({ data }: any) =>
					`<div>
            <div style="font-weight: bold;">${dayjs(data?.[0]).format(
							'ddd DD, MMM YYYY',
						)}</div>
            <div>
              <span style="margin-right: 6px">Transactions volume: </span>
              <span>${formatNumWithSymbol(Number(data?.[1] ?? 0), 0)}</span>
            </div>
          </div>`,
				...tooltipColor,
			},
		}),
		[data, startDate, endDate, labelColor, isLight, tooltipColor],
	)

	return (
		<ScrollArea className="w-full h-[300px]">
			<Chart
				className="w-[1500px]"
				height={300}
				customOptions={customOptions}
			/>
			<ScrollBar orientation="horizontal" />
		</ScrollArea>
	)
}

enum ActiveChartType {
	TXN = 'txn',
	VOLUME = 'volume',
	BRIDGE_TXN = 'bridgeTxn',
	BRIDGE_VOLUME = 'bridgeVolume',
}

enum DateRangeType {
	D_7 = '7d',
	D_30 = '30d',
	ALL = 'all',
}

const valFormatter = {
	TXN: (value: any) => formatNumWithSymbol(Number(value ?? 0), 0),
	VOLUME: (value: any) => formatNum(Number(value ?? 0).toFixed(2), '$'),
}

const activeChartTypeConfig: Record<
	ActiveChartType,
	{
		title: string
		valueKey: string
		valFormatter: (value: any) => string
	}
> = {
	[ActiveChartType.TXN]: {
		title: 'Transactions',
		valueKey: 'totalTransactions',
		valFormatter: valFormatter.TXN,
	},
	[ActiveChartType.VOLUME]: {
		title: 'Transactions Value',
		valueKey: 'totalVolumeUsd',
		valFormatter: valFormatter.VOLUME,
	},
	[ActiveChartType.BRIDGE_TXN]: {
		title: 'Bridges',
		valueKey: 'totalTransactions',
		valFormatter: valFormatter.TXN,
	},
	[ActiveChartType.BRIDGE_VOLUME]: {
		title: 'Bridges Value',
		valueKey: 'totalVolumeUsd',
		valFormatter: valFormatter.VOLUME,
	},
}

const StatisticalGraph: React.FC<{
	address: string
	activeChartType: ActiveChartType
	dateRangeType: DateRangeType
}> = ({ address, activeChartType, dateRangeType }) => {
	const activeChartItem = useMemo(
		() => activeChartTypeConfig[activeChartType],
		[activeChartType],
	)
	const { data } = trpc.addressStats.getAddressStatisticChartData.useQuery(
		{
			address,
			timeRange: dateRangeType,
			type: [ActiveChartType.TXN, ActiveChartType.VOLUME].includes(
				activeChartType,
			)
				? 'tx'
				: 'bridge',
		},
		{ enabled: !!address },
	)

	const startDate = useMemo(
		() => (!!data ? data?.[data?.length - 1]?.date : undefined),
		[data],
	)

	const endDate = useMemo(() => (!!data ? data?.[0]?.date : undefined), [data])

	const chartData = useMemo(() => {
		if (!!!data?.length) return undefined

		const dateArray = [
			...Array(dayjs(endDate).diff(dayjs(startDate), 'day') + 1),
		].map((_, index) => ({
			date: dayjs(startDate).add(index, 'day').unix() * 1000,
			totalTransactions: 0,
			totalVolumeWei: 0,
			totalVolumeUsd: 0,
		}))

		return dateArray.map((dateData) => {
			let _data = { ...dateData }
			for (let index = 0; index < data.length; index++) {
				const d = data[index]
				d.date = dayjs(d.date).unix() * 1000
				if (d.date === dateData.date) {
					d.date = dayjs(dayjs(d.date).format('YYYY-MM-DD')).unix() * 1000
					_data = d
					continue
				}
			}

			return _data
		})
	}, [data, endDate, startDate])

	const xAxis = useMemo(
		() => ({ data: chartData?.map(({ date }) => date) }),
		[chartData],
	)

	const series = useMemo(
		() => [
			{
				name: activeChartItem.title,
				showArea: true,
				data: chartData?.map((_data) => [
					dayjs(_data?.date).unix() * 1000,
					_data?.[
						activeChartItem?.valueKey as 'totalTransactions' | 'totalVolumeUsd'
					] ?? 0,
				]),
			},
		],
		[activeChartItem.title, activeChartItem?.valueKey, chartData],
	)

	const yAxis = useMemo(
		() => [
			{
				name: activeChartItem.title,
				formatter: (value: any) => formatNumWithSymbol(Number(value ?? 0), 0),
			},
		],
		[activeChartItem.title],
	)

	const tooltipFormatter = useCallback(
		(params: any) =>
			`<div>
        <div style="font-weight: bold;">${dayjs(params?.[0]?.axisValue).format(
					'ddd D, MMM YYYY',
				)}</div>
        <div>
          <span style="margin-right: 6px">${params?.[0]?.seriesName}: </span>
          <span>${activeChartItem.valFormatter(params?.[0]?.value?.[1])}</span>
        </div>
      </div>`,
		[activeChartItem],
	)

	return (
		<div className="w-full overflow-x-auto">
			<Chart
				className="min-w-[600px]"
				grid={{ left: '6%', right: '1%' }}
				xAxis={xAxis}
				series={series}
				yAxis={yAxis}
				tooltipFormatter={tooltipFormatter}
				showLegend={false}
				showDateZoom={false}
			/>
		</div>
	)
}

const AddressActivity: React.FC<{ address: string }> = ({ address }) => {
	const { data: activityLevel, isLoading: activityLevelLodaing } =
		trpc.addressStats.getAddressActivityLevel.useQuery(address, {
			enabled: !!address,
		})
	const {
		data: addressTransactionOverTime,
		isLoading: addressTransactionOverTimeLodaing,
	} = trpc.addressStats.getAddressTransactionOverTime.useQuery(address, {
		enabled: !!address,
	})
	const {
		data: addressTransactionStatistic,
		isLoading: addressTransactionStatisticLodaing,
	} = trpc.addressStats.getAddressTransactionStatistic.useQuery(address, {
		enabled: !!address,
	})
	const {
		data: addressBridgeStatistic,
		isLoading: addressBridgeStatisticLodaing,
	} = trpc.addressStats.getAddressBridgeStatistic.useQuery(address, {
		enabled: !!address,
	})

	const renderItemTitle = useCallback(
		(icon: ReactNode, title: ReactNode, subTitle?: ReactNode) => (
			<div className="flex-center justify-between">
				<div className="flex items-center text-lg">
					<div className="mr-2">{icon}</div>
					<div>{title}</div>
				</div>

				{subTitle}
			</div>
		),
		[],
	)

	const renderItemLabelContent = useCallback(
		(content: { label: string; value: ReactNode }[]) => (
			<>
				{content.map(({ label, value }) => (
					<div className="w-full flex items-center" key={label}>
						<div className="w-1/3">{label}</div>
						<div className="ml-4 w-2/3 flex-center">{value}</div>
					</div>
				))}
			</>
		),
		[],
	)

	const renderValue = useCallback(
		(loading: boolean, value: ReactNode) =>
			loading ? <Skeleton className="h-4 w-[200px]" /> : value,
		[],
	)

	const topContent = useMemo(
		() => [
			{
				icon: <Sparkle className={iconClassName} />,
				title: 'Activity Level',
				children: activityLevelLodaing ? (
					<Loader2 size={24} className="animate-spin" />
				) : (
					<div className="flex items-center space-x-2">
						{[...Array(5)].map((_, index) => (
							<Image
								key={index}
								width={44}
								height={44}
								src={getImgSrc(
									index < (activityLevel?.level ?? 0) ? 'star_filled' : 'star',
								)}
								alt=""
							/>
						))}
					</div>
				),
			},
			{
				icon: <CalendarDays className={iconClassName} />,
				title: 'Transactions Over Time',
				items: [
					{
						label: 'Initial Time',
						value: renderValue(
							addressTransactionOverTimeLodaing,
							addressTransactionOverTime?.initialTimestamp
								? dayjs(
										addressTransactionOverTime?.initialTimestamp * 1000,
								  )?.format('YYYY/MM/DD')
								: '-',
						),
					},
					{
						label: 'Distinct Months',
						value: renderValue(
							addressTransactionOverTimeLodaing,
							addressTransactionOverTime?.distinctMonths ?? '-',
						),
					},
				],
			},
			{
				icon: <ArrowRightLeft className={iconClassName} />,
				title: 'Transactions Statistic',
				items: [
					{
						label: 'Interactions',
						value: renderValue(
							addressTransactionStatisticLodaing,
							valFormatter.TXN(
								addressTransactionStatistic?.totalTransactions ?? 0,
							),
						),
					},
					{
						label: 'Volume',
						value: renderValue(
							addressTransactionStatisticLodaing,
							valFormatter.VOLUME(
								addressTransactionStatistic?.totalVolumeUsd ?? 0,
							),
						),
					},
				],
			},
			{
				icon: <Spline className={iconClassName} />,
				title: 'Bridge Statistics',
				items: [
					{
						label: 'Interactions',
						value: renderValue(
							addressBridgeStatisticLodaing,
							valFormatter.TXN(addressBridgeStatistic?.totalTransactions ?? 0),
						),
					},
					{
						label: 'Volume',
						value: renderValue(
							addressBridgeStatisticLodaing,
							valFormatter.VOLUME(addressBridgeStatistic?.totalVolumeUsd ?? 0),
						),
					},
				],
			},
		],
		[
			activityLevel?.level,
			activityLevelLodaing,
			addressBridgeStatistic,
			addressBridgeStatisticLodaing,
			addressTransactionOverTime,
			addressTransactionOverTimeLodaing,
			addressTransactionStatistic,
			addressTransactionStatisticLodaing,
			renderValue,
		],
	)

	const [dateRangeType, setDateRangeType] = useState<DateRangeType>(
		DateRangeType.ALL,
	)
	const [activeChartType, setActiveChartType] = useState<ActiveChartType>(
		ActiveChartType.TXN,
	)

	const [shareLoading, setShareLoading] = useState(false)

	const share = useCallback(async () => {
		window.open(
			encodeURI(`https://twitter.com/intent/tweet?text=Check out my Scroll/zKsync/Linea/Base activity on @l2scan
Join the l2scan community and explore L2 ecosystem together! 
&hashtags=l2scan&url=${location.origin}/address/${address}?tab=activity`),
		)

		// try {
		//   const el = document.getElementById('addressActivity')
		//   if (!el || shareLoading) return

		//   setShareLoading(true)

		//   const canvas = await html2canvas(el, {
		//     useCORS: true
		//   })

		//   saveAs(canvas.toDataURL('image/png'), `${address}_activity.png`)
		//   setShareLoading(false)
		// } catch (error) {
		//   setShareLoading(false)
		//   console.error(error)
		// }
	}, [address])

	return (
		<section className="relative">
			<div className="absolute top-5 right-5 cursor-pointer transition-all hover:opacity-80">
				{shareLoading ? (
					<Loader2 className="w-8 h-8 animate-spin" />
				) : (
					<Share2 className="w-8 h-8" onClick={share} />
				)}
			</div>

			<Card id="addressActivity">
				<CardContent className="pt-6">
					<section className="grid grid-rows-2 grid-cols-2 sm:grid-rows-1 sm:grid-cols-1 gap-10">
						{topContent.map(({ icon, title, children, items }) => (
							<div key={title}>
								<div className="mb-6">{renderItemTitle(icon, title)}</div>
								<div className="pl-10 space-y-4">
									{children || renderItemLabelContent(items)}
								</div>
							</div>
						))}
					</section>

					<div className="mt-12 mb-8">
						{renderItemTitle(<Grid3x3 />, 'Heat Map')}
						<Heatmap address={address} />
					</div>
					{renderItemTitle(
						<BarChartBig className={iconClassName} />,
						'Statistical Graph',
						<Select
							value={dateRangeType}
							onValueChange={(value) =>
								setDateRangeType(value as DateRangeType)
							}
						>
							<SelectTrigger className="w-[180px]">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									{Object.keys(DateRangeType).map((key) => (
										<SelectItem
											key={key}
											value={DateRangeType[key as keyof typeof DateRangeType]}
										>
											{DateRangeType[key as keyof typeof DateRangeType]}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>,
					)}
					<div className="flex items-center mt-4 flex-wrap gap-4">
						{Object.keys(activeChartTypeConfig).map((key) => (
							<div
								className={cn(
									'w-36 py-1.5 text-sm rounded-full text-center transition-all duration-300 hover:bg-secondary hover:text-primary cursor-pointer whitespace-nowrap',
									key === activeChartType && 'bg-secondary text-primary',
								)}
								key={key}
								onClick={() => setActiveChartType(key as ActiveChartType)}
							>
								{activeChartTypeConfig[key as ActiveChartType].title}
							</div>
						))}
					</div>
					<StatisticalGraph
						address={address}
						activeChartType={activeChartType}
						dateRangeType={dateRangeType}
					/>
				</CardContent>
			</Card>
		</section>
	)
}

export default AddressActivity
