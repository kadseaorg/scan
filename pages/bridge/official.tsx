import LinkableTabs from '@/components/linkable-tabs'
import BridgeExternal from '@/components/portal/bridge/bridge-external'
import BridgeForm from '@/components/portal/bridge/bridge-form'
import BridgeTxHistory from '@/components/portal/bridge/bridge-tx-history'
import WalletNetworkGroup from '@/components/portal/wallet-network-group'
import { BridgeProvider } from '@/context/bridge'
import { PortalProvider } from '@/context/portal'
import Container from '@/layout/container'

const NativeBridgeContent = () => (
	<PortalProvider>
		<BridgeProvider>
			<section className="w-full">
				<WalletNetworkGroup />
				<div className="flex flow-row sm:flex-col sm:items-center gap-3 items-start justify-center mt-6 flex-wrap">
					<BridgeForm />
					<BridgeTxHistory />
				</div>
			</section>
		</BridgeProvider>
	</PortalProvider>
)

const NativeBridge = () => (
	<Container>
		<LinkableTabs
			classNames={{
				wrapper: 'p-0',
				trigger: 'text-2xl pt-0 sm:text-xl',
				content: 'pt-4',
			}}
			tabs={[
				{
					label: 'Explorer Bridge',
					value: 'official',
					children: <NativeBridgeContent />,
				},
				{
					label: 'Third Party Bridge',
					value: 'external',
					children: <BridgeExternal />,
				},
			]}
		/>
	</Container>
)

export default NativeBridge
