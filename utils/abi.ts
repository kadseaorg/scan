import { guessFragment } from '@openchainxyz/abi-guesser'
import type { AbiEvent } from 'abitype'
import { FunctionFragment } from 'ethersv6'
import {
	decodeEventLog,
	getAbiItem as getAbiItem_viem,
	type Abi,
	type AbiItem,
	type DecodeEventLogParameters,
	type Hex,
} from 'viem'

export function decodeEventLogs_guessed<
	const TAbiEvent extends AbiEvent,
	TTopics extends Hex[] = Hex[],
	TData extends Hex | undefined = undefined,
>({
	abiItem,
	data,
	topics,
}: { abiItem: AbiEvent } & Pick<
	DecodeEventLogParameters<[TAbiEvent], string, TTopics, TData, true>,
	'data' | 'topics'
>) {
	const indexedValues = topics.slice(1)

	for (let i = 0; i < indexedValues.length; i++) {
		const offset = indexedValues.length - i
		for (
			let j = 0;
			j < abiItem.inputs.length - indexedValues.length + 1 - i;
			j++
		) {
			const inputs = abiItem.inputs.map((input, index) => ({
				...input,
				indexed:
					index < offset - 1 ||
					index === i + j + offset - 1 ||
					index >= abiItem.inputs.length - (indexedValues.length - offset),
			}))
			const abi = [{ ...abiItem, inputs }]
			try {
				return decodeEventLog({
					abi,
					topics,
					data,
				})
			} catch {}
		}
	}
}

export function guessAbiItem(data: Hex) {
	return JSON.parse(
		FunctionFragment.from(guessFragment(data)).format('json'),
	) as AbiItem
}

export function truncate(
	str: string,
	{ start = 8, end = 6 }: { start?: number; end?: number } = {},
) {
	if (str.length <= start + end) return str
	return `${str.slice(0, start)}\u2026${str.slice(-end)}`
}

export function getAbiItem({ abi, selector }: { abi: Abi; selector: Hex }) {
	// handle viem/utils/abitype bugwhere abi is missing inputs/outputs
	for (const item of abi) {
		if (item.type === 'function' && !item.inputs) {
			item.inputs = []
		}
		if (item.type === 'function' && !item.outputs) {
			item.outputs = []
		}
	}

	const abiItem =
		(getAbiItem_viem({ abi, name: selector }) as AbiItem) ||
		abi.find((x: any) => x.name === selector) ||
		abi.find((x: any) => x.selector === selector)
	if (!abiItem) return
	return {
		outputs: [],
		inputs: [],
		...abiItem,
		// @ts-expect-error
		name: abiItem?.name || abiItem?.selector,
	} as AbiItem
}
