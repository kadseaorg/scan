/* eslint-disable react-hooks/exhaustive-deps */
import { memo, useEffect, useState } from 'react'

import _ from 'lodash'
import { formatEther } from 'viem'

import Link from '@/components/common/link'
import LoadingView from '@/components/loadingView'
import { CHAIN_TOKEN_SYMBOL } from '@/constants'
import { LinkTypeEnum } from '@/types'
import { trpc } from '@/utils/trpc'

interface iToTransferView {
	tx: string
}
const ToTransferView = ({ tx }: iToTransferView) => {
	const {
		isLoading,
		data: txDetail,
		error: errorTrace,
	} = trpc.transaction.getInternalTrace.useQuery(
		{ parent_transaction_hash: tx },
		{
			enabled: !!tx,
		},
	)

	const [dataArr, setdataArr] = useState<any[]>([])
	useEffect(() => {
		if (txDetail?.list) {
			const filteredData = _.uniqBy(
				txDetail?.list,
				(item) =>
					`${item?.type}-${item?.from_address}-${item?.to_address}-${item?.value}`,
			)
			setdataArr(filteredData)
		}
	}, [txDetail])

	return (
		<div className="">
			{isLoading && <LoadingView />}
			{dataArr?.map((item: any, index: number) => (
				<div
					className="flex flex-wrap justify-start items-center text-gray-500 text-[12px]"
					key={index}
				>
					<span>TRANSFER</span>
					<span className="mx-[4px]">
						{item?.value && formatEther(BigInt(item.value))}
					</span>
					<span className="">{CHAIN_TOKEN_SYMBOL}</span>
					<span className="mx-[4px]">From</span>
					<Link
						type={LinkTypeEnum.ADDRESS}
						value={item?.from_address}
						ellipsis
					/>{' '}
					<span className="ml-[4px] mr-[6px]">To</span>
					<Link
						type={LinkTypeEnum.ADDRESS}
						value={item?.to_address}
						ellipsis
					/>{' '}
				</div>
			))}
		</div>
	)
}
export default memo(ToTransferView)
