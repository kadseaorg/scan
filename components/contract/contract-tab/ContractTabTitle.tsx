import Image from 'next/image'

import { getImgSrc } from '@/utils'

import { ContractTabPropsType } from './types'

export const ContractTabTitle: React.FC<ContractTabPropsType> = ({
	contractDetail,
}) =>
	contractDetail?.is_verified ? (
		<div className="flex items-center">
			<span>Contract</span>
			<Image
				className="ml-[8px]"
				width={16}
				src={getImgSrc('contract/right')}
				alt=""
			/>
		</div>
	) : (
		<>Contract</>
	)

export default ContractTabTitle
