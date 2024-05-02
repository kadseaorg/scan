import React, { useMemo, useState } from 'react'
import CopyToClipboard from 'react-copy-to-clipboard'

import {
	type AbiParameter,
	type AbiParameterToPrimitiveType,
	type AbiParametersToPrimitiveTypes,
} from 'abitype'
import { AlertTriangleIcon, CheckIcon, CopyIcon } from 'lucide-react'
import { type Hex, concat, decodeAbiParameters, stringify } from 'viem'

import { cn } from '@/lib/utils'
import { guessAbiItem, truncate } from '@/utils/abi'

import SimpleTooltip from '../common/simple-tooltip'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '../ui/accordion'

export function DecodedAbiParameters<TParams extends readonly AbiParameter[]>({
	expandable = true,
	params,
	args,
	level = 0,
	variant,
}: {
	expandable?: boolean
	params: TParams
	args: TParams extends readonly AbiParameter[]
		? AbiParametersToPrimitiveTypes<TParams>
		: never
	level?: number
	variant?: 'inline'
}) {
	return (
		<Accordion type="single" collapsible>
			{params.map((param, index) => (
				<DecodedAbiParameter
					key={index}
					args={args}
					expandable={expandable}
					index={index}
					level={level}
					param={param}
					variant={variant}
				/>
			))}
		</Accordion>
	)
}

export function DecodedAbiParameter<TAbiParameter extends AbiParameter>({
	args,
	expandable: expandable_,
	index = 0,
	level = 0,
	param: param_,
	variant,
}: {
	args: [AbiParameterToPrimitiveType<TAbiParameter>] | readonly unknown[]
	expandable?: boolean
	param: TAbiParameter
	level?: number
	index?: number
	variant?: 'inline'
}) {
	// TODO: Make truncate length responsive to element width.
	const truncateLength = 80

	const { guessed, param, value } = useMemo(() => {
		let guessed = false
		let param = param_
		let value = param.name
			? args[param.name as any] ?? args[index]
			: args[index]

		// It could be possible that the bytes value is ABI encoded,
		// so we will try to decode it.
		if (param_.type === 'bytes') {
			try {
				const abiItem = guessAbiItem(concat(['0xdeadbeef', value as Hex]))
				if (
					'inputs' in abiItem &&
					abiItem.inputs &&
					abiItem.inputs.length > 1
				) {
					guessed = true
					param = { ...param_, components: abiItem.inputs }
					value = decodeAbiParameters(abiItem.inputs, value as Hex)
				}
			} catch {}
		}

		return { guessed, param, value }
	}, [args, index, param_])

	const params = useMemo(() => {
		if (param.type?.includes('[') && Array.isArray(value)) {
			return value.map((_, i) => ({
				...param,
				name: i.toString(),
				internalType: param.internalType?.replace(/\[\d?\]$/, ''),
				type: param.type.replace(/\[\d?\]$/, ''),
			}))
		}
		if ('components' in param) return param.components
		return undefined
	}, [param, value])

	const isExpandableParams = Boolean(params)

	const isExpandablePrimitive = useMemo(() => {
		if (params) return false
		if ((value ?? '').toString().length <= truncateLength) return false
		return true
	}, [params, value])

	const expandable =
		expandable_ && (isExpandableParams || isExpandablePrimitive)

	if (variant === 'inline')
		return (
			<div>
				<ParameterRow level={level} value={value}>
					<div className="flex text-sm">
						<div className="flex gap-1 items-center">
							<span className="text-muted-foreground text-sm">
								{param.internalType || param.type}{' '}
							</span>
							<span>{param.name}</span>
						</div>
						{(value ?? '').toString()}
					</div>
				</ParameterRow>
			</div>
		)
	if (!expandable)
		return (
			<div>
				<ParameterRow level={level} value={value}>
					<ParameterLabel
						index={index}
						param={param}
						truncateLength={truncateLength}
					/>
					<SimpleTooltip content={(value ?? '').toString()}>
						<ParameterValue value={value} truncateLength={truncateLength} />
					</SimpleTooltip>
				</ParameterRow>
			</div>
		)
	return (
		<AccordionItem value={`${index}`}>
			<ParameterTrigger>
				<ParameterRow expandable level={level} value={value}>
					<ParameterLabel
						index={index}
						param={param}
						truncateLength={truncateLength}
					/>
					<ParameterValue value={value} truncateLength={truncateLength} />
				</ParameterRow>
			</ParameterTrigger>
			<AccordionContent>
				<div>
					{guessed && (
						<ParameterRow level={level + 1}>
							<p className="text-xs px-2 text-muted-foreground/70 flex items-center gap-1">
								<AlertTriangleIcon size={14} />
								Warning: We could not accurately extract function parameters for
								this transaction. This is a best guess based on the calldata. It
								may be incorrect.
							</p>
						</ParameterRow>
					)}
					{isExpandableParams && params && (
						<DecodedAbiParameters
							params={params}
							args={value as readonly unknown[]}
							level={level + 1}
						/>
					)}
					{isExpandablePrimitive && (
						<ParameterRow level={level + 1} value={value}>
							<div className="h-fit w-full break-all">
								{(value ?? '').toString()}
							</div>
						</ParameterRow>
					)}
				</div>
			</AccordionContent>
		</AccordionItem>
	)
}

function ParameterTrigger({
	children,
	disabled,
}: { children: React.ReactNode; disabled?: boolean }) {
	return (
		<AccordionTrigger disabled={disabled}>
			<div tabIndex={disabled ? -1 : undefined}>{children}</div>
		</AccordionTrigger>
	)
}

export function ParameterRow({
	children,
	expandable,
	level,
	value,
}: {
	children: React.ReactNode
	expandable?: boolean
	level: number
	value?: unknown
}) {
	const [copied, setCopied] = useState(false)

	return (
		<CopyToClipboard
			text={value ? stringify(value).replace(/^"|"$/g, '') : ''}
			onCopy={() => setCopied(true)}
		>
			<button
				type="button"
				className="flex items-center justify-between flex-row w-full text-xs hover:font-medium hover:bg-muted hover:text-muted-background hover:rounded-md"
			>
				<Indent level={level} />
				<div
					className={cn(
						'flex flex-row items-center justify-between p-2 w-full gap-7',
					)}
				>
					{children}
				</div>
				<div className="flex flex-row items-center justify-end">
					{expandable ? null : value ? (
						copied ? (
							<CheckIcon size={12} />
						) : (
							<CopyIcon size={12} />
						)
					) : null}
				</div>
			</button>
		</CopyToClipboard>
	)
}

export function Indent({ level }: { level: number }) {
	if (level === 0) return null
	return (
		<>
			{Array.from({ length: level }).map((_, i) => (
				<div key={i} className="w-3 flex-none">
					<div className="w-px h-full" />
				</div>
			))}
		</>
	)
}

function ParameterLabel({
	index,
	truncateLength,
	param,
}: { index: number; truncateLength: number; param: AbiParameter }) {
	const internalTypeArray = param.internalType?.split('.').join('').split(' ')
	const internalType = internalTypeArray?.[internalTypeArray.length - 1]
	const label = `${internalType || param.type} ${
		param.name || index.toString()
	}`
	return (
		<SimpleTooltip content={label}>
			<div>
				<div className="flex gap-1 items-center text-xs">
					<div className="text-muted-foreground">
						{internalType
							? truncate(internalType, {
									start: truncateLength / 2 - (param.name ? 6 : 2),
									end: truncateLength / 2 - (param.name ? 6 : 2),
							  })
							: param.type}
					</div>{' '}
					{param.name
						? truncate(param.name, {
								start: truncateLength / 2 - 4,
								end: truncateLength / 2 - 4,
						  })
						: index.toString()}
				</div>
			</div>
		</SimpleTooltip>
	)
}

function ParameterValue({
	truncateLength,
	value,
}: { truncateLength: number; value: unknown }) {
	if (Array.isArray(value))
		return <ArrayValue truncateLength={truncateLength / 2} value={value} />
	if (typeof value === 'object' && value !== null)
		return <TupleValue truncateLength={truncateLength} value={value} />
	return <PrimitiveValue truncateLength={truncateLength} value={value} />
}

function PrimitiveValue({
	truncateLength,
	value,
}: { truncateLength: number; value: unknown }) {
	return (
		<div className="break-all">
			{truncate((value ?? '').toString(), {
				start: truncateLength / 2,
				end: truncateLength / 2,
			})}
		</div>
	)
}

function ArrayValue({
	truncateLength,
	value,
}: { truncateLength: number; value: readonly unknown[] }) {
	if (!value) return null
	return (
		<span className="text-xs">
			<span className="text-muted-foreground">[</span>
			{value[0]
				? truncate(stringify(value[0]), {
						start: truncateLength / 2 - 4,
						end: truncateLength / 2 - 4,
				  })
				: ''}{' '}
			{value.length > 1 && (
				<span className="inline-block">
					, <span className="text-muted-foreground">x{value.length}</span>
				</span>
			)}
			<span className="text-muted-foreground">]</span>
		</span>
	)
}

function TupleValue({
	truncateLength,
	value,
}: { truncateLength: number; value: object }) {
	return (
		<div className="flex">
			<div>{'{'}</div>
			{truncate(stringify(value), {
				start: truncateLength / 2,
				end: truncateLength / 2,
			}).replace(/^\{|\}$/g, '')}
			<div>{'}'}</div>
		</div>
	)
}
