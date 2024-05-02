import { useMemo, useState } from 'react'

import { MenuItem, Select } from '@mui/material'
import dayjs from 'dayjs'
import Recharts from 'echarts-for-react'

import { CHAIN_TYPE } from '@/constants'
import { EnumChainType } from '@/types/chain'
import { IDappItem } from '@/types/dapp'
import { trpc } from '@/utils/trpc'

import { EnumViewRange } from '../types'

interface IOverviewDataReportProps {
	dappDetail: IDappItem
}

const OverviewDataReport = (props: IOverviewDataReportProps) => {
	const { dappDetail } = props

	const [viewRange, setViewRange] = useState<EnumViewRange>(EnumViewRange.ALL)

	const { data: txnData } = trpc.dapp.getDappTxnsCountByRange.useQuery(
		{
			range: viewRange,
			dappId: dappDetail?.id,
		},
		{
			enabled: !!dappDetail?.id,
		},
	)
	const { data: uawData } = trpc.dapp.getDappUawDataByRange.useQuery(
		{
			range: viewRange,
			dappId: dappDetail?.id,
		},
		{
			enabled: !!dappDetail?.id,
		},
	)

	const option = useMemo(() => {
		const data = txnData?.map((item, index) => {
			const find = uawData ? uawData[index] : null
			return {
				date: dayjs(item.date).format('YYYY-MM-DD'),
				Txns: item.count,
				UAW: find ? find.count : 0,
			}
		})
		return {
			tooltip: {
				trigger: 'axis',
			},
			legend: {
				data: ['UAW', 'Txns'],
			},
			grid: {
				left: '3%',
				right: '4%',
				bottom: '3%',
				containLabel: true,
			},

			xAxis: {
				type: 'category',
				boundaryGap: false,
				data: data?.map((d) => d.date) || [],
			},
			yAxis: {
				type: 'value',
			},
			series: [
				{
					name: 'UAW',
					type: 'line',
					data: data?.map((d) => d.UAW) || [],
				},
				{
					name: 'Txns',
					type: 'line',
					data: data?.map((d) => d.Txns) || [],
				},
			].filter(
				// dont show uaw if chain is zksync
				(column) =>
					!(CHAIN_TYPE === EnumChainType.ZKSYNC && column.name === 'UAW'),
			),
		}
	}, [txnData, uawData])

	return (
		<>
			<h5 className="subtitle2">Data Report</h5>

			<div className="flex flex-col w-full ">
				<Select
					size="small"
					className="ml-auto w-[110px] h-[30px] sm:mb-[40px]"
					value={viewRange}
					onChange={(event) => {
						setViewRange(event.target.value as EnumViewRange)
					}}
				>
					{[
						{ value: EnumViewRange.ALL, label: 'all' },
						{ value: EnumViewRange.DAY30, label: '30d' },
						{ value: EnumViewRange.Day7, label: '7d' },
					].map((item) => (
						<MenuItem key={item.value} value={item.value}>
							{item.label}
						</MenuItem>
					))}
				</Select>
				{<Recharts option={option} theme={'echartsTheme'} />}
			</div>
		</>
	)
}

export default OverviewDataReport
