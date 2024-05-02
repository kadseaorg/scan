import { useMemo, useState } from 'react'

import { CaretRightOutlined } from '@ant-design/icons'
import { Zap } from 'lucide-react'

import SimpleTooltip from '@/components/common/simple-tooltip'
import useDecodeCalldata from '@/hooks/use-decode-calldata'
import { LinkTypeEnum } from '@/types'

import Link, { TokenLink } from '../common/link'

interface ITxActionProps {
	txDetail: any
}
const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000'
const Badge = ({ value }: { value: string }) => (
	<div className="px-2 mx-1 border rounded-sm text-sm">{value}</div>
)
const TxAction = (props: ITxActionProps) => {
	const { txDetail } = props

	const { abiItem, isFetched } = useDecodeCalldata({
		address: txDetail.to_address,
		data: txDetail.input,
	})

	const content = useMemo(() => {
		if (abiItem) {
			if (abiItem.type === 'function') {
				if (abiItem.name === 'mint') {
					const token = txDetail.token_transfers.find(
						(item: any) => item.from_address === EMPTY_ADDRESS,
					)
					if (token) {
						return (
							<div className="flex items-center">
								<span className="mr-2">Mint {token.amount} of </span>{' '}
								<TokenLink
									name={token.name}
									symbol={token.symbol}
									tokenAddress={token.token_address}
								/>
							</div>
						)
					}
				} else {
				}
				return (
					<div className="flex items-center flex-wrap">
						Call <Badge value={abiItem.name} />{' '}
						<span className="mx-1">{'Function by '}</span>{' '}
						<Link
							type={LinkTypeEnum.ADDRESS}
							value={txDetail.from_address}
							ellipsis
						/>{' '}
						<span className="mx-1">on</span>
						<Link
							type={LinkTypeEnum.CONTRACT}
							value={txDetail.to_address}
							ellipsis
						/>{' '}
					</div>
				)
			}
		}
	}, [abiItem, txDetail])

	return (
		<div className="flex ">
			<CaretRightOutlined className="text-xs mr-[6px]" />
			{content}
		</div>
	)
}

export default TxAction
