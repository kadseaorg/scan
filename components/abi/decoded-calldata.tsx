import { type ReactNode, useMemo } from 'react'

import type { AbiFunction } from 'abitype'
import { AlertTriangleIcon } from 'lucide-react'
import {
	type Abi,
	type Address,
	type Hex,
	decodeAbiParameters,
	parseAbiItem,
	slice,
} from 'viem'

import { LabelledContent } from '@/components/labelled-content'
import { useAutoloadAbi } from '@/hooks/use-autoload-abi'
import { useCalldataAbi } from '@/hooks/use-calldata-abi'
import useDecodeCalldata from '@/hooks/use-decode-calldata'
import { useLookupSignature } from '@/hooks/use-lookup-signature'
import { getAbiItem } from '@/utils/abi'

import { Textarea } from '../ui/textarea'
import { DecodedAbiParameters } from './decoded-abi-parameters'
import { FormattedAbiItem } from './formatted-abi-item'

export function DecodedCalldata({
	address,
	data,
	labelRight,
}: { address?: Address | null; data: Hex; labelRight?: ReactNode }) {
	const { abiItem, args, isFetched, isGuess } = useDecodeCalldata({
		address,
		data,
	})

	return (
		<div className="sm:w-full w-1/2">
			{!isFetched && <p>Loading...</p>}
			{isFetched && abiItem && (
				<>
					{isGuess && (
						<p className="text-xs px-2 text-muted-foreground/70 flex items-center gap-1">
							<AlertTriangleIcon size={14} />
							Warning: We could not accurately extract function parameters for
							this transaction. This is a best guess based on the calldata. It
							may be incorrect.
						</p>
					)}
					<LabelledContent label="Function">
						<FormattedAbiItem abiItem={abiItem} />
					</LabelledContent>
					{(args || []).length > 0 && (
						<LabelledContent label="Arguments">
							<DecodedAbiParameters
								params={abiItem?.type === 'function' ? abiItem.inputs : []}
								args={args || []}
							/>
						</LabelledContent>
					)}
				</>
			)}
			<LabelledContent label="Raw Data" labelRight={labelRight}>
				<Textarea className="text-sm bg-card">{data}</Textarea>
			</LabelledContent>
		</div>
	)
}
