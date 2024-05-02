import { Fragment } from 'react'

import type { AbiParameter } from 'abitype'
import type { AbiItem } from 'viem'

export function FormattedAbiItem({
	abiItem,
	compact,
	showIndexed = true,
	showParameterNames = true,
	showStateMutability = true,
	showReturns = true,
	showType = true,
}: {
	abiItem: AbiItem
	compact?: boolean
	showIndexed?: boolean
	showParameterNames?: boolean
	showStateMutability?: boolean
	showReturns?: boolean
	showType?: boolean
}) {
	return (
		<div className="flex items-center gap-0.5 text-sm text-muted-foreground flex-wrap">
			{abiItem.type === 'function' && (
				<>
					{showType && <p>function</p>}
					{abiItem.name && <p>{abiItem.name}</p>}(
					{abiItem.inputs && (
						<FormattedAbiParameters
							params={abiItem.inputs}
							showNames={showParameterNames}
						/>
					)}
					)
					{showStateMutability &&
						abiItem.stateMutability &&
						abiItem.stateMutability !== 'nonpayable' && (
							<p> {abiItem.stateMutability} </p>
						)}
					{showReturns && abiItem.outputs?.length > 0 && (
						<>
							returns (
							<FormattedAbiParameters
								compact={compact}
								params={abiItem.outputs}
								showNames={showParameterNames}
							/>
							)
						</>
					)}
				</>
			)}
			{abiItem.type === 'event' && (
				<>
					{showType && <p>event </p>}
					{abiItem.name && <p>{abiItem.name}</p>}(
					{abiItem.inputs && (
						<FormattedAbiParameters
							compact={compact}
							params={abiItem.inputs}
							showIndexed={showIndexed}
							showNames={showParameterNames}
						/>
					)}
					)
				</>
			)}
			{abiItem.type === 'error' && (
				<>
					{showType && <p>error </p>}
					{abiItem.name && <p>{abiItem.name}</p>}((
					{abiItem.inputs && (
						<FormattedAbiParameters
							compact={compact}
							params={abiItem.inputs}
							showNames={showParameterNames}
						/>
					)}
					)
				</>
			)}
			{abiItem.type === 'constructor' && (
				<>
					<p>constructor</p>(
					{abiItem.inputs && (
						<FormattedAbiParameters
							compact={compact}
							params={abiItem.inputs}
							showNames={showParameterNames}
						/>
					)}
					){abiItem.stateMutability === 'payable' && <p> payable</p>}
				</>
			)}
			{abiItem.type === 'fallback' && (
				<>
					<p>fallback</p>()
				</>
			)}
			{abiItem.type === 'receive' && (
				<>
					<p>receive</p>() external payable
				</>
			)}
		</div>
	)
}

////////////////////////////////////////////////////////////////////////

export function FormattedAbiParameters({
	compact,
	params,
	showIndexed,
	showNames,
}: {
	compact?: boolean
	params: readonly AbiParameter[]
	showIndexed?: boolean
	showNames?: boolean
}) {
	return (
		<p className="flex">
			{params?.map((x, index) => (
				<Fragment key={index}>
					{index !== 0 ? `,${!compact ? ' ' : ''}` : ''}
					<FormattedAbiParameter
						param={x}
						showIndexed={showIndexed}
						showName={showNames}
					/>
				</Fragment>
			))}
		</p>
	)
}

export function FormattedAbiParameter({
	param,
	showIndexed = true,
	showName = true,
	showType = true,
}: {
	param: AbiParameter
	showIndexed?: boolean
	showName?: boolean
	showType?: boolean
}) {
	const { internalType, type, name } = param
	return (
		<p className="flex">
			{showType && <ParameterType type={internalType || type} />}
			{showIndexed && 'indexed' in param && param.indexed ? (
				<p> indexed</p>
			) : null}
			{showName && name ? ` ${name}` : ''}
		</p>
	)
}

export function ParameterType({ type }: { type: string }) {
	const typeArray = type?.split('.').join('').split(' ')
	const type_ = typeArray?.[typeArray.length - 1]
	return <p>{type_}</p>
}
