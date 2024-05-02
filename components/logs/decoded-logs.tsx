import { useMemo } from 'react'

import type { AbiEvent } from 'abitype'
import { FileTextIcon } from 'lucide-react'
import {
	DecodeLogTopicsMismatch,
	type Log,
	decodeEventLog,
	getAbiItem,
	parseAbiItem,
} from 'viem'

import {
	DecodedAbiParameters,
	ParameterRow,
} from '@/components/abi/decoded-abi-parameters'
import { FormattedAbiItem } from '@/components/abi/formatted-abi-item'
import { LabelledContent } from '@/components/labelled-content'
import { useAutoloadAbi } from '@/hooks/use-autoload-abi'
import { useLookupSignature } from '@/hooks/use-lookup-signature'
import { LinkTypeEnum } from '@/types'
import '@/utils/abi'
import { decodeEventLogs_guessed, truncate } from '@/utils/abi'

import Link from '../common/link'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '../ui/accordion'

export function DecodedLogs({
	logs,
}: { logs: Log<bigint, number, boolean, AbiEvent>[] }) {
	return (
		<>
			<div className="flex items-center gap-1 text-muted-foreground text-sm">
				<FileTextIcon size={14} /> Transaction Receipt Event Logs
			</div>
			<Accordion type="multiple">
				{logs.map((log, i) => (
					<LogRow key={log.logIndex} index={i} log={log} />
				))}
			</Accordion>
		</>
	)
}

function LogRow({ index, log }: { index: number; log: Log }) {
	const selector = log.topics[0]

	// Try extract ABI from whatsabi autoloading.
	const { data: abi } = useAutoloadAbi({
		address: log.address,
		enabled: Boolean(log.address),
	})
	const autoloadAbiItem = useMemo(() => {
		if (abi && selector) {
			const eventAbiItems = abi.filter((item) => item.type === 'event')
			return eventAbiItems.length > 0
				? (getAbiItem({ abi: eventAbiItems, name: selector }) as AbiEvent)
				: null
		}
		return null
	}, [abi, selector])
	// Extract signature from selector (for fall back).
	const { data: signature } = useLookupSignature({ selector })
	const signatureAbiItem = useMemo(
		() => (signature ? (parseAbiItem(`event ${signature}`) as AbiEvent) : null),
		[signature],
	)

	const abiItem = autoloadAbiItem || signatureAbiItem

	const args = useMemo(() => {
		if (!abiItem) return undefined

		try {
			// Try decode with provided indexed parameters.
			return decodeEventLog({
				abi: [abiItem],
				topics: log.topics,
				data: log.data,
			}).args
		} catch (err) {
			if (err instanceof DecodeLogTopicsMismatch) throw err

			// If decoding with given indexed parameters fail, try to guess the
			// positions of the indexed parameters
			return decodeEventLogs_guessed({
				abiItem,
				topics: log.topics,
				data: log.data,
			})?.args
		}
	}, [abiItem, log.data, log.topics])

	return (
		<AccordionItem
			key={index}
			value={log.logIndex?.toString() ?? index.toString()}
		>
			<AccordionTrigger>
				<div className="flex gap-3 sm:flex-col sm:items-start items-center justify-between font-medium text-xs whitespace-nowrap">
					<p className="w-10">{log.logIndex?.toString()}</p>
					<p className="w-32">{truncate(log.address)}</p>
					<p>
						{abiItem ? (
							<FormattedAbiItem
								abiItem={abiItem}
								compact
								showIndexed={false}
								showParameterNames={false}
								showType={false}
							/>
						) : (
							log.topics[0]
						)}
					</p>
				</div>
			</AccordionTrigger>
			<AccordionContent>
				<div className="p-2">
					<div>
						<LabelledContent label="Address">
							<Link
								type={LinkTypeEnum.ADDRESS}
								value={log.address}
								className="text-xs"
							>
								{log.address}
							</Link>
						</LabelledContent>
						{!abiItem && (
							<p className="text-xs">
								Event was unable to be decoded. The contract's ABI or event
								signature was not found in the database.
							</p>
						)}
						<LabelledContent label={`Event ${!abiItem ? 'Signature' : ''}`}>
							{abiItem ? (
								<FormattedAbiItem abiItem={abiItem} />
							) : (
								<p className="font-mono text-xs">{log.topics[0]}</p>
							)}
						</LabelledContent>
						{args && (
							<div>
								<LabelledContent label="Arguments">
									<div>
										<DecodedAbiParameters
											expandable={false}
											params={abiItem?.type === 'event' ? abiItem.inputs : []}
											args={(args || []) as any}
										/>
									</div>
								</LabelledContent>
							</div>
						)}
						{!abiItem && (
							<LabelledContent label="Topics">
								<div>
									{log.topics.map((topic, i) => (
										<ParameterRow key={i} level={0} value={topic}>
											<p className="text-xs">
												<span className="text-text/tertiary">
													{i.toString()}:
												</span>{' '}
												{truncate(topic, { start: 16, end: 16 })}
											</p>
										</ParameterRow>
									))}
								</div>
							</LabelledContent>
						)}
						{!abiItem && (
							<LabelledContent label="Data">
								<p className="font-mono text-xs">{log.data}</p>
							</LabelledContent>
						)}
					</div>
				</div>
			</AccordionContent>
		</AccordionItem>
	)
}
