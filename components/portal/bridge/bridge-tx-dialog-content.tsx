import { useMemo } from 'react'

import { ArrowRight, CornerRightUp, Minus, Plus } from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'
import { CHAIN_TOKEN } from '@/constants'
import useBridgeContext from '@/hooks/portal/bridge/use-bridge-context'
import { useBridgeConfigStore } from '@/stores/portal/bridge/config'
import { useBridgeNetworkStore } from '@/stores/portal/bridge/network'
import { shortAddress, transDisplayNum } from '@/utils'

export type BridgeTxItem = {
	transactionHash: string
}

const BridgeTxDialogContent: React.FC<BridgeTxItem> = ({ transactionHash }) => {
	const { isDeposit } = useBridgeContext()
	const { formattedAmount, selectedToken } = useBridgeConfigStore()

	const { l2Network } = useBridgeNetworkStore()

	const nameFrom = useMemo(
		() =>
			isDeposit
				? (l2Network as any)?.l1Network?.name
				: (l2Network as any)?.name,
		[isDeposit, l2Network],
	)

	const nameTo = useMemo(
		() =>
			isDeposit
				? (l2Network as any)?.name
				: (l2Network as any)?.l1Network?.name,
		[isDeposit, l2Network],
	)

	return (
		<div
			className="w-full flex-center flex-col mx-auto py-3 bg-background cursor-pointer hover:bg-muted rounded-md shadow-md max-h-24 text-muted-foreground/90 px-2 gap-3 text-sm"
			onClick={() => {
				!!transactionHash &&
					window.open(
						`${
							isDeposit
								? l2Network?.l1Network?.blockExplorers?.default.url
								: l2Network?.blockExplorerUrl
						}/tx/${transactionHash}`,
						'_blank',
					)
			}}
		>
			<div className="w-full flex-center">
				<div className="flex items-center bg-muted rounded-full w-6 h-6">
					{isDeposit ? (
						<Plus className="w-4 h-4 mx-auto" />
					) : (
						<Minus className="w-4 h-4 mx-auto" />
					)}
				</div>

				<div className="w-1/3" title={nameFrom}>
					<div className="ellipsis">{nameFrom}</div>

					<div className="text-muted-foreground text-sm">
						{transDisplayNum({
							num: formattedAmount,
							decimals: selectedToken?.decimals,
							suffix: selectedToken?.symbol || CHAIN_TOKEN,
						})}
					</div>
				</div>
				<div className="flex-center w-6 h-6 rounded-full bg-background">
					<ArrowRight size={16} />
				</div>
				<div className="w-1/3 ellipsis" title={nameTo}>
					<div className="ellipsis">{nameTo}</div>
				</div>
			</div>
			<div className="w-full flex-center">
				<div className="mr-3">
					{!!transactionHash ? (
						<div>{shortAddress(transactionHash)}</div>
					) : (
						<Skeleton className="h-4 w-[120px]" />
					)}
				</div>
				<CornerRightUp size={14} />
			</div>
		</div>
	)
}
export default BridgeTxDialogContent
