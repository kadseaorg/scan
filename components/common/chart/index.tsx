import { useCallback, useMemo } from 'react'

import dayjs from 'dayjs'
import {
	Area,
	AreaChart,
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts'

import useTheme from '@/hooks/common/useTheme'
import { ChartTypeEnum } from '@/pages/charts'
import { formatNumWithSymbol } from '@/utils'

type CardPropsType = {
	dataType?: ChartTypeEnum
	data: any[]
	xDataKey: string
	yDataKey: string
	xTickStyle?: any
	yTickStyle?: any
	xTickFormatter?: (value: any, index: number) => string
	yTickFormatter?: (value: any, index: number) => string
	tooltipTitle?: string
	tooltipValueFormatter?: (value: string) => any
	strokeColor?: string
	showGrid?: boolean
	gridXColor?: string
	gridDashed?: boolean
	xAngle?: number
	xPanding?: { left?: number; right?: number }
	yWidth?: number
	xUnit?: string
	yUnit?: string
	yTickCount?: number
	xInterval?: 0 | 1 | 'preserveStart' | 'preserveEnd' | 'preserveStartEnd'
	type?: 'area' | 'line'
	dot?: any
}

const Chart: React.FC<CardPropsType> = (props) => {
	const { isLight, palette } = useTheme()

	const {
		dataType,
		data,
		xDataKey,
		yDataKey,
		xTickStyle = { strokeWidth: 0.2, stroke: '#86909C' },
		yTickStyle = { strokeWidth: 0.2, stroke: '#86909C' },
		xTickFormatter = (value) =>
			value && 'auto' !== value
				? dayjs(value).format(
						dataType === ChartTypeEnum.TPS ? `MMM 'DD HH:00` : `MMM 'DD`,
				  )
				: '',
		yTickFormatter = (value) => formatNumWithSymbol(value, 3),
		tooltipTitle,
		tooltipValueFormatter,
		strokeColor = palette.primary.main,
		showGrid = true,
		gridXColor = isLight ? '#edeef0' : '#333',
		gridDashed = false,
		xAngle = 0,
		xPanding = { left: 20, right: 20 },
		yWidth = 60,
		xUnit = '',
		yUnit = '',
		yTickCount = 5,
		xInterval = 'preserveEnd',
		type = 'line',
		dot = { stroke: '#FF4D2C', strokeWidth: 1 },
	} = props

	const renderCustomTooltip = useCallback(
		(external: any) => {
			const { active, payload, label } = external

			if (active && payload && payload.length) {
				return (
					<div className="text-xs font-medium border-[0.5px] border-solid border-border rounded p-[10px] mb-[6px] bg-[#fffffffa] dark:bg-darkPage dark:border-none">
						<div className="mb-[6px]">
							{dayjs(label).format('dddd,MMMM DD,YYYY')}
						</div>
						<div className="font-normal text-[#666]">
							<div>{tooltipTitle}</div>
							<div>{payload?.[0]?.payload?.[yDataKey]}</div>
						</div>
					</div>
				)
			}

			return null
		},
		[tooltipTitle, yDataKey],
	)

	const lineAreaProps = useMemo(
		() => ({
			dataKey: yDataKey,
			stroke: strokeColor,
			strokeWidth: 1,
			dot,
			r: 1,
			activeDot: {
				stroke: '#F26412',
				strokeWidth: 1,
				r: 2,
			},
			isAnimationActive: false,
		}),
		[dot, strokeColor, yDataKey],
	)

	const yDomain = useMemo(() => {
		let max = Math.max(...(data?.map(({ count }) => Number(count)) || []))
		if (max < 0.1) {
			const factor = Math.pow(10, Math.floor(Math.log10(max)))
			max = Math.ceil(max / factor) * factor
		}
		return [0, max]
	}, [data])

	const chartContent = useMemo(
		() => (
			<>
				<defs>
					<linearGradient id="reqColor" x1="0" y1="0" x2="0" y2="1">
						<stop
							offset="33.25%"
							stopColor={palette.primary.main}
							stopOpacity={0.5}
						/>
						<stop
							offset="100%"
							stopColor={palette.primary.main}
							stopOpacity={0}
						/>
					</linearGradient>
				</defs>
				<XAxis
					unit={xUnit}
					padding={xPanding}
					fontSize={11}
					tickMargin={10}
					dataKey={xDataKey}
					axisLine={false}
					tickLine={false}
					interval={xInterval}
					angle={xAngle}
					tick={xTickStyle}
					tickFormatter={xTickFormatter}
				/>
				<YAxis
					width={yWidth}
					domain={yDomain}
					unit={yUnit}
					fontSize={11}
					tickMargin={10}
					axisLine={false}
					tickLine={false}
					tick={yTickStyle}
					tickCount={yTickCount}
					tickFormatter={yTickFormatter}
				/>
				{showGrid && (
					<CartesianGrid
						stroke={gridXColor}
						height={0.2}
						vertical={false}
						strokeDasharray={gridDashed ? '5' : 0}
					/>
				)}
				<Tooltip content={renderCustomTooltip} />
				{'line' === type && <Line type="monotone" {...lineAreaProps} />}
				{'area' === type && (
					<Area
						type="monotone"
						{...lineAreaProps}
						fillOpacity={1}
						fill="url(#reqColor)"
					/>
				)}
			</>
		),
		[
			gridDashed,
			gridXColor,
			lineAreaProps,
			palette.primary.main,
			renderCustomTooltip,
			showGrid,
			type,
			xAngle,
			xDataKey,
			xInterval,
			xPanding,
			xTickFormatter,
			xTickStyle,
			xUnit,
			yDomain,
			yTickCount,
			yTickFormatter,
			yTickStyle,
			yUnit,
			yWidth,
		],
	)

	const chartWrap = useMemo(() => {
		switch (type) {
			case 'area':
				return <AreaChart data={data}>{chartContent}</AreaChart>
			case 'line':
				return <LineChart data={data}>{chartContent}</LineChart>
			default:
				return <></>
		}
	}, [type, data, chartContent])

	return (
		<ResponsiveContainer width="100%" height="100%">
			{chartWrap}
		</ResponsiveContainer>
	)
}

export default Chart
