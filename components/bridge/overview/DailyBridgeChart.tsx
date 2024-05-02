import { Card, CardHeader } from '@mui/material'
import Recharts from 'echarts-for-react'

import { transDisplayNum } from '@/utils'
import { trpc } from '@/utils/trpc'
import { CHAIN_TOKEN_NAME } from '@/constants'

const DailyBridgeChart = () => {
	const { data, isFetching, error } = trpc.bridge.getBridgeStats.useQuery()

	// Preprocess total_value data
	const processedTotalValue = data?.total_value.map((value) =>
		transDisplayNum({ num: value, suffix: '', fixedNum: 2 }),
	)

	const option = {
		tooltip: {
			trigger: 'axis',
			axisPointer: {
				type: 'cross',
				crossStyle: {
					color: '#999',
				},
			},
		},
		legend: {
			data: ['Wallets', CHAIN_TOKEN_NAME],
		},
		xAxis: [
			{
				type: 'category',
				data: data?.date,
				axisPointer: {
					type: 'shadow',
				},
			},
		],
		yAxis: [
			{
				type: 'value',
				name: 'Wallets',
			},
			{
				type: 'value',
				name: CHAIN_TOKEN_NAME,
			},
		],
		series: [
			{
				name: 'Wallets',
				type: 'bar',
				data: data?.unique_address_count,
			},
			{
				name: CHAIN_TOKEN_NAME,
				type: 'line',
				data: processedTotalValue,
			},
		],
	}

	return (
		<Card
			sx={{
				px: 3,
				bgcolor: 'background.neutral',
			}}
		>
			<CardHeader title="Daily Bridge" />
			<Recharts option={option} theme={'echartsTheme'} />
		</Card>
	)
}

export default DailyBridgeChart
