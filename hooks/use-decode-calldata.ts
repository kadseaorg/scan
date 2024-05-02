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
import { useLookupSignature } from '@/hooks/use-lookup-signature'
import { getAbiItem } from '@/utils/abi'

const useDecodeCalldata = ({
	address,
	data,
}: { address?: Address | null; data: Hex }) => {
	const selector = slice(data, 0, 4)

	// Try extract ABI from whatsabi autoloading (etherscan, 4byte dbs, etc)
	const { data: autoloadAbi } = useAutoloadAbi({
		address,
		enabled: data && data !== '0x',
	})

	const { data: signature, isFetched } = useLookupSignature({
		selector,
	})
	const signatureAbi = useMemo(() => {
		if (!signature) return
		return [parseAbiItem(`function ${signature}`) as AbiFunction] as const
	}, [signature])

	// If extraction fails, fall back to guessing ABI from calldata.
	const calldataAbi = useCalldataAbi({
		data,
	})

	const [abiItem, isGuess] = useMemo(() => {
		const autoloadAbiItem =
			autoloadAbi &&
			(getAbiItem({
				abi: autoloadAbi as unknown as Abi,
				selector,
			}) as AbiFunction)
		const signatureAbiItem =
			signatureAbi &&
			(getAbiItem({ abi: signatureAbi, selector }) as AbiFunction)
		const calldataAbiItem =
			calldataAbi && (getAbiItem({ abi: calldataAbi, selector }) as AbiFunction)

		if (autoloadAbiItem) {
			if (
				(signatureAbiItem?.inputs?.length || 0) >
				(autoloadAbiItem?.inputs?.length || 0)
			)
				return [signatureAbiItem, false]
			if (
				(calldataAbiItem?.inputs?.length || 0) >
				(autoloadAbiItem?.inputs?.length || 0)
			)
				return [calldataAbiItem, true]
			return [autoloadAbiItem, false]
		}
		if (signatureAbiItem) return [signatureAbiItem, false]
		return [calldataAbiItem, true]
	}, [autoloadAbi, signatureAbi, calldataAbi, selector])

	const rawArgs = abiItem && data.length > 10 ? slice(data, 4) : undefined
	const { args } = useMemo(() => {
		if (abiItem && rawArgs && 'name' in abiItem && 'inputs' in abiItem) {
			try {
				return {
					functionName: abiItem?.name,
					args: decodeAbiParameters(abiItem?.inputs, rawArgs),
				}
			} catch {}
		}
		return { args: undefined, functionName: undefined }
	}, [abiItem, rawArgs])

	return {
		abiItem,
		args,
		isFetched,
		isGuess,
	}
}

export default useDecodeCalldata
