import { useState } from 'react'

import { Grid, Stack } from '@mui/material'
import { Button } from '@/components/ui/button'

import { ContractSubTabEnum } from '@/types/contract'
import { trpc } from '@/utils/trpc'

import WalletConnector from '../wallet-connector'
import ContractTabCode from './ContractTabCode'
import { useContractTabContext } from './ContractTabProvider'
import ContractFunctionsPanel from './contract-functions-panel'

const CONTRACT_TAB_TEXT = {
	[ContractSubTabEnum.CODE]: 'Code',
	[ContractSubTabEnum.READ]: 'Read Contract',
	[ContractSubTabEnum.WRITE]: 'Write Contract',
	[ContractSubTabEnum.READ_AS_PROXY]: 'Read as Proxy',
	[ContractSubTabEnum.WRITE_AS_PROXY]: 'Write as Proxy',
}

const ContractTabVerified = () => {
	const { contractDetail, abi, isProxyContract, logicAddress } =
		useContractTabContext()
	const { data: logicContractDetail } =
		trpc.contract.getContractDetail.useQuery(logicAddress, {
			enabled: !!logicAddress,
		})
	const logicAbi = logicContractDetail?.abi
		? JSON.parse(logicContractDetail?.abi as string)
		: []

	const [subTab, setSubTab] = useState<ContractSubTabEnum>(
		ContractSubTabEnum.CODE,
	)

	const address = contractDetail?.address

	return (
		<Stack sx={{ mt: 2 }} spacing={2}>
			<div className="flex items-center space-x-3 sm:space-x-2">
				{[
					ContractSubTabEnum.CODE,
					ContractSubTabEnum.READ,
					ContractSubTabEnum.WRITE,
				].map((tab) => (
					<Button
						key={tab}
						onClick={() => setSubTab(tab)}
						size="default"
						variant={subTab === tab ? 'default' : 'ghost'}
					>
						{CONTRACT_TAB_TEXT[tab]}
					</Button>
				))}
				{isProxyContract &&
					[
						ContractSubTabEnum.READ_AS_PROXY,
						ContractSubTabEnum.WRITE_AS_PROXY,
					].map((tab) => (
						<Button
							key={tab}
							onClick={() => setSubTab(tab)}
							size="default"
							variant={subTab === tab ? 'default' : 'ghost'}
						>
							{CONTRACT_TAB_TEXT[tab]}
						</Button>
					))}
			</div>
			<WalletConnector />
			{subTab === ContractSubTabEnum.CODE && <ContractTabCode />}
			{subTab === ContractSubTabEnum.READ && (
				<ContractFunctionsPanel
					address={address}
					abi={abi}
					type={ContractSubTabEnum.READ}
				/>
			)}
			{subTab === ContractSubTabEnum.WRITE && (
				<ContractFunctionsPanel
					address={address}
					abi={abi}
					type={ContractSubTabEnum.WRITE}
				/>
			)}
			{subTab === ContractSubTabEnum.READ_AS_PROXY && (
				<ContractFunctionsPanel
					address={logicAddress}
					abi={logicAbi}
					type={ContractSubTabEnum.READ_AS_PROXY}
				/>
			)}
			{subTab === ContractSubTabEnum.WRITE_AS_PROXY && (
				<ContractFunctionsPanel
					address={logicAddress}
					abi={logicAbi}
					type={ContractSubTabEnum.WRITE_AS_PROXY}
				/>
			)}
		</Stack>
	)
}

export default ContractTabVerified
