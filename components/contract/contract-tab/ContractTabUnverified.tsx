import { Button } from '@mui/material'
import { InfoIcon } from 'lucide-react'
import { usePlausible } from 'next-plausible'
import { useRouter } from 'next/router'

import { TextAreaRow } from '@/components/common/table-col-components'
import ROUTES from '@/constants/routes'
import { PlausibleEvents } from '@/types/events'
import { stringifyQueryUrl } from '@/utils'

import { useContractTabContext } from './ContractTabProvider'

const ContractTabUnverified = () => {
	const plausible = usePlausible<PlausibleEvents>()
	const { contractDetail } = useContractTabContext()
	const router = useRouter()

	if (contractDetail?.bytecode) {
		return (
			<div className="flex items-center my-3 flex-wrap space-y-3">
				<span className="font-medium">Bytecode</span>
				<TextAreaRow className="w-full mb-3" value={contractDetail?.bytecode} />
			</div>
		)
	}

	return (
		<>
			<div className="flex justify-between items-center my-3 flex-wrap">
				<div className="flex-center sm:mb-[4px] space-x-2">
					<InfoIcon width={16} height={16} />
					<span>
						{' '}
						Are you the contract creator? Verify and Publish your contract
						source code today!
					</span>
				</div>
				<Button
					onClick={() => {
						plausible('Contract-Verify Contract', {
							props: {
								Address: contractDetail?.address,
							},
						})
						router.push(
							stringifyQueryUrl(ROUTES.CONTRACT.VERIFY, {
								contractAddress: contractDetail?.address,
							}),
						)
					}}
				>
					Verify Contract
				</Button>
			</div>
			<div className="flex items-center my-3 flex-wrap space-y-3">
				<span className="font-medium">Creation Bytecode</span>
				<TextAreaRow
					className="w-full mb-3"
					value={contractDetail?.creation_bytecode}
				/>
			</div>
			<div className="flex items-center my-3 flex-wrap space-y-3">
				<span className="font-medium">Deployed Bytecode</span>
				<TextAreaRow
					className="w-full mb-3"
					value={contractDetail?.deployed_bytecode}
				/>
			</div>
		</>
	)
}

export default ContractTabUnverified
