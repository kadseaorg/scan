import { useMemo } from 'react'

import type { Abi, Hex } from 'viem'

import { guessAbiItem } from '@/utils/abi'

export function useCalldataAbi({ data }: { data?: Hex; enabled?: boolean }) {
	return useMemo(() => {
		if (!data) return null
		try {
			const abiItem = guessAbiItem(data)
			return [
				{
					...abiItem,
					name:
						'name' in abiItem
							? `0x${abiItem.name.replace('guessed_', '')}`
							: 'guessed',
				},
			] as Abi
		} catch {}
	}, [data])
}
