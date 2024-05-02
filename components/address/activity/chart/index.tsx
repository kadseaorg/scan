import {
	CSSProperties,
	ReactNode,
	useCallback,
	useMemo,
	useRef,
	useState,
} from 'react'

import { DatePicker } from 'antd'
import BigNumber from 'bignumber.js'
import dayjs, { Dayjs } from 'dayjs'
import ReactEChartsCore from 'echarts-for-react/lib/core'
import { HeatmapChart, LineChart } from 'echarts/charts'
import {
	CalendarComponent,
	DataZoomComponent,
	DataZoomSliderComponent,
	GridComponent,
	LegendComponent,
	TooltipComponent,
	VisualMapComponent,
} from 'echarts/components'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'

import { DATE_PICKER_FORMATTER } from '@/constants'
import useEcharts from '@/hooks/common/use-echarts'
import EchartsDarkTheme from '@/theme/echarts-dark-theme.json'

export type AxisType = 'value' | 'category' | 'time' | 'log'

type XAxisType = {
	type?: AxisType
	data?: Array<string | number>
}

type YAxisType = {
	show?: boolean
	name?: string
	type?: AxisType
	formatter?: (value: string, index: number) => string | number
}

type SeriesType = {
	name?: string
	type?: string
	symbol?:
		| 'circle'
		| 'rect'
		| 'roundRect'
		| 'triangle'
		| 'diamond'
		| 'pin'
		| 'arrow'
		| 'none'
	itemStyle?: Record<string, any>
	showArea?: boolean
	yAxisIndex?: number
	data?: any[][]
}[]

echarts.use([
	DataZoomComponent,
	DataZoomSliderComponent,
	LegendComponent,
	TooltipComponent,
	GridComponent,
	LineChart,
	HeatmapChart,
	CanvasRenderer,
	CalendarComponent,
	VisualMapComponent,
])

const Chart: React.FC<{
	height?: number
	style?: CSSProperties
	className?: string
	grid?: Record<string, string | number>
	topTitle?: string
	topContent?: ReactNode
	chartTitle?: string
	showDateZoom?: boolean
	xAxis?: XAxisType
	yAxis?: YAxisType[]
	series?: SeriesType
	tooltipFormatter?: any
	showLegend?: boolean
	legendSelected?: Record<string, boolean>
	customOptions?: any
}> = ({
	height = 500,
	style = {},
	className = '',
	grid = { left: '4%', right: '10%' },
	topTitle,
	topContent,
	chartTitle,
	showDateZoom = true,
	xAxis,
	yAxis = [],
	series,
	tooltipFormatter,
	showLegend = true,
	legendSelected,
	customOptions,
}) => {
	const chartRef = useRef<any>()
	const { isLight, labelColor, lineColor, tooltipColor, legendTextColor } =
		useEcharts()

	const startDate = useMemo(() => xAxis?.data?.[0], [xAxis?.data])

	const endDate = useMemo(
		() => (xAxis?.data ? xAxis.data?.[xAxis.data.length - 1] : 0),
		[xAxis?.data],
	)

	const option = useMemo(
		() =>
			customOptions || {
				grid,
				color: [
					'#64D2FF',
					'#5470c6',
					'#91cc75',
					'#fac858',
					'#ee6666',
					'#73c0de',
					'#3ba272',
					'#fc8452',
					'#9a60b4',
					'#ea7ccc',
				],
				dataZoom: [
					{
						show: showDateZoom,
						showDetail: true,
						type: 'slider',
						startValue: startDate,
						endValue: endDate,
						labelPrecision: 0,
						xAxisIndex: [0],
						rangeMode: ['value', 'value'],
						labelFormatter: function (value: number) {
							return dayjs(value).format('YYYY')
						},
					},
				],
				xAxis: {
					type: xAxis?.type || 'time',
					show: true,
					offset: 0,
					axisLabel: {
						show: true,
						interval: 0,
						color: labelColor,
						fontSize: 10,
						formatter: function (value: number) {
							return dayjs(value).format(`MMM 'DD`)
						},
					},
					axisLine: {
						show: yAxis?.length > 1 ? false : true,
						lineStyle: { color: lineColor },
					},
					splitLine: {
						show: yAxis?.length > 1 ? true : false,
						lineStyle: { color: [lineColor], width: 1, type: 'solid' },
					},
					axisTick: { show: false },
				},
				yAxis: yAxis?.map(({ show = true, name, formatter }, index) => ({
					show,
					name: name,
					nameLocation: 'middle',
					nameRotate: 270,
					nameGap: 40,
					nameTextStyle: { color: labelColor },
					type: 'value',
					positon: !!index ? 'right' : 'left',
					offset: index > 1 ? 70 * (index - 1) : 0,
					axisLabel: { show: true, color: labelColor, fontSize: 10, formatter },
					axisLine: { show: false, lineStyle: { color: lineColor } },
					splitLine: {
						show: yAxis?.length > 1 ? false : true,
						lineStyle: { color: [lineColor], width: 1, type: 'solid' },
					},
					axisTick: { show: false },
				})),
				series: series?.map(
					(
						{
							type = 'line',
							name,
							symbol,
							showArea = false,
							data,
							yAxisIndex,
							itemStyle,
						},
						index,
					) => ({
						name,
						type,
						symbol:
							symbol ||
							[
								'circle',
								'rect',
								'roundRect',
								'triangle',
								'diamond',
								'pin',
								'arrow',
							][index],
						yAxisIndex: !!yAxisIndex ? (yAxisIndex || index) + '' : undefined,
						smooth: true,
						areaStyle: showArea
							? {
									// opacity: 0.7,
									color: {
										type: 'linear',
										x: 0,
										y: 0,
										x2: 0,
										y2: 1,
										colorStops: [
											{
												offset: 0,
												color: 'rgba(10, 132, 255, 0.5)',
											},
											{
												offset: 1,
												color: 'rgba(10, 132, 255, 0)',
											},
										],
									},
							  }
							: undefined,
						itemStyle,
						data,
					}),
				),
				tooltip: {
					trigger: 'axis',
					axisPointer: {
						axis: 'x',
						lineStyle: {
							width: 2,
							type: 'solid',
						},
					},
					formatter: tooltipFormatter,
					...tooltipColor,
				},
				legend: {
					show: showLegend,
					type: 'plain',
					top: '10',
					right: '0',
					orient: 'horizontal',
					selected: legendSelected || true,
					textStyle: { fontSize: 11, color: legendTextColor },
				},
			},
		[
			customOptions,
			grid,
			showDateZoom,
			startDate,
			endDate,
			xAxis?.type,
			labelColor,
			yAxis,
			lineColor,
			series,
			tooltipFormatter,
			tooltipColor,
			showLegend,
			legendSelected,
			legendTextColor,
		],
	)

	const [selectedDateRange, setSelectedDateRange] = useState([
		dayjs(startDate),
		dayjs(endDate),
	])

	const changeZoom = useCallback((startValue: Dayjs, endValue: Dayjs) => {
		setSelectedDateRange([startValue, endValue])

		const instance = chartRef?.current?.getEchartsInstance()
		if (!!instance) {
			instance?.setOption({
				dataZoom: [
					{
						...instance.getOption().dataZoom?.[0],
						...{
							startValue: startValue.unix() * 1000,
							endValue: endValue.unix() * 1000,
						},
					},
				],
			})
		}
	}, [])

	return (
		<>
			{!!topTitle && (
				<div className="flex justify-between items-center my-4">
					<div>{topTitle}</div>
					<div>{`${dayjs(startDate).format('ddd M, MMM YYYY')} - ${dayjs(
						endDate,
					).format('ddd M, MMM YYYY')}`}</div>
				</div>
			)}

			{!!topContent && <div className="my-6">{topContent}</div>}

			{!!chartTitle && (
				<div className="flex-center text-secondText dark:text-secondText-dark">
					{chartTitle}
				</div>
			)}

			{!!xAxis && showDateZoom && (
				<div className="flex justify-between items-center my-4">
					<div className="flex items-center space-x-2">
						{[
							{ label: '1m', monthVal: 1 },
							{ label: '6m', monthVal: 6 },
							{ label: '1y', monthVal: 12 },
							{ label: 'All' },
						].map(({ label, monthVal }) => (
							<div
								key={label}
								className="min-w-[36px] py-4 text-12 cursor-pointer transition-all bg-gray dark:bg-darkBorder hover:bg-main hover:text-white rounded-4 text-center"
								onClick={() => {
									changeZoom(
										!!monthVal
											? dayjs(endDate).subtract(monthVal, 'M')
											: dayjs(startDate),
										dayjs(endDate),
									)
								}}
							>
								{label}
							</div>
						))}
					</div>

					<DatePicker.RangePicker
						size="small"
						format={DATE_PICKER_FORMATTER}
						value={selectedDateRange as any}
						disabledDate={(currentDate: any) =>
							dayjs(currentDate).isBefore(dayjs(startDate)) ||
							dayjs(currentDate).isAfter(dayjs(endDate))
						}
						onChange={([start, end]: any) =>
							changeZoom(dayjs(start), dayjs(end))
						}
					/>
				</div>
			)}

			<ReactEChartsCore
				ref={chartRef}
				theme={isLight ? undefined : EchartsDarkTheme}
				style={{ ...style, ...{ height: `${height}px` } }}
				className={className}
				echarts={echarts}
				option={option}
				onChartReady={(instance) => {
					instance.on('dataZoom', function ({ start, end }: any) {
						const getTime = (time: number) =>
							new BigNumber(time)
								.multipliedBy(Number(endDate) - Number(startDate))
								.dividedBy(100)
								.plus(Number(startDate))
								.toNumber()
						setSelectedDateRange([dayjs(getTime(start)), dayjs(getTime(end))])
					})

					instance.on('legendselectchanged', function ({ selected }: any) {
						const { series, yAxis } = instance.getOption()

						if (yAxis?.length < 2) return

						yAxis.forEach((_yAxis: any, index: number) => {
							_yAxis.show = true

							if (
								series
									.filter(({ yAxisIndex }: any) => Number(yAxisIndex) === index)
									?.every(({ name }: any) => !selected[name])
							) {
								_yAxis.show = false
							}
						})
						instance.setOption({ yAxis })
					})
				}}
			/>
		</>
	)
}

export default Chart
