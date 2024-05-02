/* eslint-disable @next/next/no-img-element */
import { useRouter } from 'next/router'

import { LogoIcon } from '@/components/common/svg-icon'
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import {
	CHAIN_MAP,
	CHAIN_TYPE,
	CURRENT_CHAIN_ITEM,
	ChainSwitcherList,
} from '@/constants'
import { cn } from '@/lib/utils'
import { EnumChainType } from '@/types/chain'

const ChainSwitcher: React.FC<{ className?: string }> = ({ className }) => {
	const router = useRouter()

	const currentChain = CURRENT_CHAIN_ITEM.chainType.includes('scroll')
		? EnumChainType.SCROLL
		: CURRENT_CHAIN_ITEM.chainType.includes('zksync')
		  ? EnumChainType.ZKSYNC
		  : CURRENT_CHAIN_ITEM.chainType
	return (
		<div className={className}>
			<Select
				value={currentChain}
				onValueChange={(value: EnumChainType) => {
					router.push(CHAIN_MAP[value]?.blockExplorerUrl || '')
				}}
			>
				{!ChainSwitcherList.find((it) => it === currentChain) ? (
					<div className="flex justify-start items-center">
						<LogoIcon chain={CURRENT_CHAIN_ITEM.chainType} />
						<div className="ml-[10px]">{CURRENT_CHAIN_ITEM.title}</div>
					</div>
				) : (
					<SelectTrigger className="border-none bg-transparent w-auto gap-3 sm:gap-2">
						<div className="w-[200px] flex justify-center items-center sm:w-auto">
							<LogoIcon chain={CURRENT_CHAIN_ITEM.chainType} />
							<div className="font-bold text-xl ml-[10px]">
								{CURRENT_CHAIN_ITEM?.title}
							</div>
						</div>
					</SelectTrigger>
				)}

				<SelectContent className={cn(`theme-${CHAIN_TYPE}`)}>
					<SelectGroup className="flex flex-col">
						{ChainSwitcherList.map((key) => (
							<SelectItem key={key} value={CHAIN_MAP[key]?.chainType}>
								<div className="flex justify-between items-center gap-y-1">
									<div className="w-10 h-10 flex items-center mr-[5px]">
										<LogoIcon chain={CHAIN_MAP[key].chainType} />
									</div>
									<div className="font-bold text-xl w-[130px]">
										{CHAIN_MAP[key].title}
									</div>
								</div>
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>
		</div>
	)
}

export default ChainSwitcher
