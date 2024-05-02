import { PropsWithChildren } from 'react'

import LinkableTabs from '@/components/linkable-tabs'
import WalletNetworkGroup from '@/components/portal/wallet-network-group'
import WalletAssetsTab from '@/components/portal/wallet/assets'
import WalletContactsTab from '@/components/portal/wallet/contacts'
import WalletInscriptionsTab from '@/components/portal/wallet/inscription'
import WalletTxnsTab from '@/components/portal/wallet/txs'
import { PortalProvider } from '@/context/portal'
import Container from '@/layout/container'

const WalletNetworkGroupWrapper: React.FC<
	PropsWithChildren & { showNetworkRadio?: boolean }
> = ({ children, showNetworkRadio }) => (
	<section className="w-full">
		<section className="mb-6">
			<WalletNetworkGroup showNetworkRadio={showNetworkRadio} />
		</section>

		{children}
	</section>
)

const Wallet: React.FC = () => {
	return (
		<Container>
			<PortalProvider>
				<LinkableTabs
					classNames={{
						wrapper: 'p-0',
						trigger: 'text-2xl pt-0 sm:text-xl',
						content: 'pt-4',
					}}
					tabs={[
						{
							label: 'Assets',
							value: 'assets',
							children: (
								<WalletNetworkGroupWrapper>
									<WalletAssetsTab />
								</WalletNetworkGroupWrapper>
							),
						},
						{
							label: 'Transactions',
							value: 'txns',
							children: (
								<WalletNetworkGroupWrapper>
									<WalletTxnsTab />
								</WalletNetworkGroupWrapper>
							),
						},
						{
							label: 'Contacts',
							value: 'contacts',
							children: (
								<WalletNetworkGroupWrapper>
									<WalletContactsTab />
								</WalletNetworkGroupWrapper>
							),
						},
						{
							label: 'Inscriptions',
							value: 'inscriptions',
							children: (
								<WalletNetworkGroupWrapper showNetworkRadio={false}>
									<WalletInscriptionsTab />
								</WalletNetworkGroupWrapper>
							),
						},
					]}
				/>
			</PortalProvider>
		</Container>
	)
}

export default Wallet
