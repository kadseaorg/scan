import React, { useMemo } from 'react'

import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Stack,
	Typography,
} from '@mui/material'
import { ChevronRightIcon, LayersIcon } from 'lucide-react'

import Link from '@/components/common/link'
import { LinkTypeEnum } from '@/types'
import { ContractSubTabEnum } from '@/types/contract'

import { InteractiveAbiFunction } from './contract-function'

interface ContractFunctionsPanelProps {
	address: string
	abi: any
	type: ContractSubTabEnum
}

const ContractFunctionsPanel: React.FC<ContractFunctionsPanelProps> = ({
	address,
	abi,
	type,
}) => {
	const fns = abi?.filter((item: any) => item.type === 'function')
	const writeFunctions = useMemo(() => {
		return fns?.filter(
			(fn: any) =>
				fn.stateMutability !== 'pure' &&
				fn.stateMutability !== 'view' &&
				'stateMutability' in fn,
		)
	}, [fns])
	const viewFunctions = useMemo(() => {
		return fns?.filter(
			(fn: any) =>
				fn.stateMutability === 'pure' || fn.stateMutability === 'view',
		)
	}, [fns])
	if (!fns) {
		return null
	}

	const isProxyType = [
		ContractSubTabEnum.READ_AS_PROXY,
		ContractSubTabEnum.WRITE_AS_PROXY,
	].includes(type)

	return (
		<>
			{isProxyType && (
				<Stack
					flexDirection={'row'}
					gap={1}
					alignItems={'center'}
					sx={{ my: 2 }}
				>
					<LayersIcon size={18} />
					<Typography variant="subtitle1">
						ABI for the implementation contract at
						<Link type={LinkTypeEnum.CONTRACT} value={address} className="mx-4">
							{address}
						</Link>
						, using the{' '}
						<Link
							type={LinkTypeEnum.URL}
							value={'https://eips.ethereum.org/EIPS/eip-1967'}
							className="mx-4"
						>
							EIP-1967 Transparent Proxy
						</Link>{' '}
						pattern.
					</Typography>
				</Stack>
			)}

			{type === ContractSubTabEnum.READ
				? viewFunctions.map((fn: any, index: number) => (
						<Accordion className="my-6 shadow-none" key={index}>
							<AccordionSummary
								className="mb-3 shadow-sm"
								expandIcon={<ChevronRightIcon />}
							>
								<Typography variant="subtitle1">{`${index + 1}. ${
									fn.name
								}`}</Typography>
							</AccordionSummary>
							<AccordionDetails>
								<InteractiveAbiFunction
									abiFunction={fn}
									address={address}
									abi={abi}
									type={type}
								/>
							</AccordionDetails>
						</Accordion>
				  ))
				: writeFunctions.map((fn: any, index: number) => (
						<Accordion className="my-6 shadow-none" key={index}>
							<AccordionSummary
								className="mb-3 shadow-sm"
								expandIcon={<ChevronRightIcon />}
							>
								<Typography variant="subtitle1">{`${index + 1}. ${
									fn.name
								}`}</Typography>
							</AccordionSummary>
							<AccordionDetails>
								<InteractiveAbiFunction
									abiFunction={fn}
									address={address}
									abi={abi}
									type={type}
								/>
							</AccordionDetails>
						</Accordion>
				  ))}
		</>
	)
}

export default ContractFunctionsPanel
