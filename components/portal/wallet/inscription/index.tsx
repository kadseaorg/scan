import InscriptionBalance from '@/components/address/inscription/inscription-balance'
import InscriptionTxTable from '@/components/address/inscription/inscription-txs-table'
import { Card } from '@/components/ui/card'
import usePortalContext from '@/hooks/portal/use-portal-context'
import { usePortalStore } from '@/stores/portal'

const WalletInscriptionTab = () => {
	const { walletAddress } = usePortalContext()
	if (!walletAddress)
		return (
			<div className="w-full flex justify-center items-center mt-[50px]">
				Please connect your wallet first.
			</div>
		)

	return (
		<div className="w-full ">
			<Card className="w-full py-4 px-6 m-auto sm:pt-6 sm:pb-4 mb-6">
				<div className="text-xl font-medium sm:text-[20px] whitespace-nowrap mb-4">
					My Inscriptions
				</div>
				<InscriptionBalance address={walletAddress} />
			</Card>
			<Card className="w-full py-4 px-6 m-auto sm:pt-6 sm:pb-4">
				<div className="text-xl font-medium sm:text-[20px] whitespace-nowrap mb-4">
					Inscriptions Transactions
				</div>
				<InscriptionTxTable address={walletAddress} />
			</Card>
		</div>
	)
}

export default WalletInscriptionTab
