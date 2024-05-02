import ContractTabProvider from './ContractTabProvider'
import ContractTabUnverified from './ContractTabUnverified'
import ContractTabVerified from './ContractTabVerified'
import { ContractTabPropsType } from './types'

const ContractTab: React.FC<ContractTabPropsType> = ({ contractDetail }) => {
	return (
		<ContractTabProvider contractDetail={contractDetail}>
			{contractDetail?.is_verified ? (
				<ContractTabVerified />
			) : (
				<ContractTabUnverified />
			)}
		</ContractTabProvider>
	)
}

export default ContractTab
