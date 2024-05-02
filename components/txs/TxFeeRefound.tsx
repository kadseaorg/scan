import { useMemo, useState } from 'react'

import { ExternalLink } from 'lucide-react'

import Link, { TokenLink } from '@/components/common/link'
import SimpleTooltip from '@/components/common/simple-tooltip'
import { LinkTypeEnum } from '@/types'
import { transDisplayNum } from '@/utils'

const ZKSYNC_REFOUND_ADDRESS = '0x0000000000000000000000000000000000008001'
interface ITxFeeRefoundProps {
	txDetail: any
}

const TxFeeRefound = (props: ITxFeeRefoundProps) => {
	const { txDetail } = props
	const refundTransfers = useMemo(() => {
		if (txDetail && txDetail.token_transfers) {
			return txDetail.token_transfers.filter(
				(item: any) => item.from_address === ZKSYNC_REFOUND_ADDRESS,
			)
		}
		return []
	}, [txDetail])
	const refunded = useMemo(() => {
		return refundTransfers.reduce((acc: number, item: any) => {
			return acc + Number(item.value)
		}, 0)
	}, [refundTransfers])
	const initialFeeTransfer = useMemo(() => {
		return txDetail?.token_transfers.find(
			(item: any) => item.to_address === ZKSYNC_REFOUND_ADDRESS,
		)
	}, [txDetail])
	const content = useMemo(() => {
		if (refundTransfers.length > 0 && initialFeeTransfer) {
			return (
				<div className="card bg-light shadow-none rounded small p-2">
					<div className="flex flex-col gap-1">
						<div className="flex items-center gap-1">
							<span className="w-16 font-medium text-center">Initial:</span>
							<div className="flex items-center gap-1">
								{transDisplayNum({
									num: initialFeeTransfer.value,
									decimals: initialFeeTransfer.decimals,
								})}
							</div>
						</div>
						<div className="flex items-center gap-1">
							<span className="w-16 font-medium text-center">Refunded:</span>
							<div className="flex items-center gap-1">
								{transDisplayNum({
									num: refunded,
									decimals: initialFeeTransfer.decimals,
								})}
							</div>
						</div>
						<div className="flex gap-1">
							<span className="w-16 font-medium text-center">Refunds:</span>
							<div className="flex-column gap-1">
								{refundTransfers.map((item: any, index: number) => (
									<div key={index} className="flex items-center gap-1">
										<span className="mr-2">From</span>
										<Link
											type={LinkTypeEnum.ADDRESS}
											value={item?.from_address}
											ellipsis
											withTooltip={false}
										/>
										<span className="mx-2">To</span>
										<Link
											type={LinkTypeEnum.ADDRESS}
											value={item?.to_address}
											ellipsis
											withTooltip={false}
										/>
										<span className="mx-2">For</span>
										{transDisplayNum({
											num: item.value,
											decimals: item.decimals,
										})}
									</div>
								))}
							</div>
						</div>
						<div className="flex text-muted-foreground items-center gap-1 mt-3">
							<a
								href="https://docs.zksync.io/build/developer-reference/fee-model.html#refunds"
								target="_blank"
								rel="noreferrer"
							>
								Why am i being refounded?
							</a>
							<ExternalLink size={14} />
						</div>
					</div>
				</div>
			)
		}
		return <span>-</span>
	}, [refundTransfers, initialFeeTransfer, refunded])
	return (
		<SimpleTooltip content={content}>
			<span className="text-sm text-muted-foreground ml-2">More details</span>
		</SimpleTooltip>
	)
}

export default TxFeeRefound
