import { useId, useState } from 'react'
import { FormProvider, useFieldArray, useForm } from 'react-hook-form'

import { SwapRightOutlined } from '@ant-design/icons'
import { LoadingButton } from '@mui/lab'
import { TextField } from '@mui/material'
import { BigNumber } from 'ethers'
import { Hex, getAddress, hexToNumber } from 'viem'
import {
	useAccount,
	useConnect,
	useContractRead,
	useContractWrite,
} from 'wagmi'
import { InjectedConnector } from 'wagmi/connectors/injected'

import { CURRENT_CHAIN_ITEM } from '@/constants'
import { ContractSubTabEnum } from '@/types/contract'
import SuperJSON from 'superjson'

export function formatResponseData(data: unknown): string {
	if (BigNumber.isBigNumber(data)) {
		data = data.toString()
	}

	if (typeof data === 'object') {
		const receipt: any = (data as any).receipt
		if (receipt) {
			data = {
				to: receipt.to,
				from: receipt.from,
				transactionHash: receipt.transactionHash,
				events: receipt.events,
			}
		}
	}

	return SuperJSON.stringify(data)
}

export function formatError(error: Error): string {
	if ((error as any).reason) {
		return (error as any).reason
	}

	try {
		return JSON.stringify(error)
	} catch {
		return error.toString()
	}
}

function formatContractCall(
	params: {
		key: string
		value: string
		type: string
		components:
			| {
					[x: string]: any
					type: string
					name?: string
			  }[]
			| undefined
	}[],
	value?: BigNumber,
) {
	const parsedParams = params
		.map((p) =>
			p.type === 'bool' ? (p.value === 'false' ? false : true) : p.value,
		)
		.map((p) => {
			try {
				const parsed = JSON.parse(p as string)
				if (Array.isArray(parsed) || typeof parsed === 'object') {
					return parsed
				} else {
					// Return original value if its not an array or object
					return p
				}
			} catch {
				// JSON.parse on string will throw an error
				return p
			}
		})

	if (value) {
		parsedParams.push({
			value,
		})
	}

	return parsedParams
}

interface InteractiveAbiFunctionProps {
	// index: number
	abiFunction: any
	address: string
	abi: any
	type: ContractSubTabEnum
}

export const InteractiveAbiFunction: React.FC<InteractiveAbiFunctionProps> = ({
	abiFunction,
	address,
	abi,
	type,
}) => {
	const formId = useId()
	const form = useForm({
		defaultValues: {
			params:
				abiFunction?.inputs.map((i: any) => ({
					key: i.name || '<input>',
					value: '',
					type: i.type,
					components: i.components,
				})) || [],
			value: '0',
		},
	})
	const { fields } = useFieldArray({
		control: form.control,
		name: 'params',
	})
	const { isConnected } = useAccount()
	const { connect, error: connectError } = useConnect({
		connector: new InjectedConnector(),
	})

	const [readArgs, setReadArgs] = useState<string[] | undefined>(undefined)

	const {
		data: readData,
		isLoading: readLoading,
		error: readError,
	} = useContractRead({
		address: form.formState.isValid ? getAddress(address) : undefined,
		abi: abi,
		functionName: abiFunction.name,
		args: readArgs,
		enabled: !!readArgs,
		chainId: hexToNumber(CURRENT_CHAIN_ITEM.network.chainId as Hex),
		// value: Number(form.getValues('value'))
	})

	const {
		data: writeData,
		isLoading: writeLoading,
		write,
		error: writeError,
	} = useContractWrite({
		address: getAddress(address),
		abi: abi,
		functionName: abiFunction.name,
		chainId: hexToNumber(CURRENT_CHAIN_ITEM.network.chainId as Hex),
	})

	const error =
		connectError || (type === ContractSubTabEnum.READ ? readError : writeError)

	return (
		<FormProvider {...form}>
			<form
				className="flex flex-col gap-2 justify-between"
				id={formId}
				onSubmit={form.handleSubmit((d) => {
					if (d.params) {
						const formatted = formatContractCall(d.params)
						if (type === 'write') {
							isConnected ? write({ args: formatted }) : connect()
						} else {
							setReadArgs(formatted)
						}
					}
				})}
			>
				{fields.length > 0 &&
					fields.map((item: any, index: number) => {
						return (
							<div
								key={item.id}
								className={`mb-2 flex flex-col space-y-2 ${
									form.getFieldState(`params.${index}.value`, form.formState)
										.error
										? 'border-red'
										: ''
								}`}
							>
								<span className="text-sm">{`${item.key} (${item.type})`}</span>
								<TextField
									size="small"
									className="text-gray-400"
									{...form.register(`params.${index}.value`)}
									placeholder={`${item.key} (${item.type})`}
									onChange={(e) =>
										form.setValue(`params.${index}.value`, e.target.value)
									}
								/>

								<div className="text-red">
									{
										form.getFieldState(`params.${index}.value`, form.formState)
											.error?.message
									}
								</div>
							</div>
						)
					})}

				{abiFunction?.stateMutability === 'payable' && (
					<div className="mb-2">
						<div className="flex flex-col space-y-2">
							<label>Native Token Value</label>
							<TextField
								size="small"
								{...form.register('value')}
								placeholder="wei"
								onChange={(e) => form.setValue('value', e.target.value)}
							/>
						</div>
					</div>
				)}

				{type === 'read' ? (
					<LoadingButton
						disabled={!abiFunction}
						loading={readLoading}
						type="submit"
						form={formId}
						className="mr-auto mb-3"
					>
						Query
					</LoadingButton>
				) : (
					<LoadingButton
						disabled={!abiFunction}
						loading={writeLoading}
						type="submit"
						form={formId}
						className="mr-auto mb-3"
					>
						Write
					</LoadingButton>
				)}

				<div className="flex space-x-2 flex-wrap">
					{abiFunction.outputs?.map((output: any, index: number) => (
						<div className="flex space-x-0.5 text-gray-500" key={index}>
							<SwapRightOutlined />
							<span className="text-sm">{output.type}</span>
						</div>
					))}
					{error ? (
						<div>
							<code className="p-4 w-full text-red relative">
								Error: {formatError(error)}
							</code>
						</div>
					) : readData !== undefined || writeData !== undefined ? (
						<div>{formatResponseData(readData || writeData)}</div>
					) : null}
				</div>
			</form>
		</FormProvider>
	)
}
