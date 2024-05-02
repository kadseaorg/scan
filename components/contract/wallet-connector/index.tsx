import { WalletOutlined } from '@ant-design/icons'
import { LoadingButton } from '@mui/lab'
import { Badge, Typography } from '@mui/material'
import { useAccount, useEnsName } from 'wagmi'

import { shortAddress } from '@/utils'
import { useConnectModal } from '@rainbow-me/rainbowkit'

export default function WalletConnector() {
	const { address, isConnected } = useAccount()
	const { data: ensName } = useEnsName({ address })
	const { openConnectModal } = useConnectModal()

	return (
		<div className="mt-5">
			{isConnected ? (
				<Badge variant="dot" color="success">
					<Typography variant="body2">
						{`Connected - ${ensName || shortAddress(address)}`}
					</Typography>
				</Badge>
			) : (
				openConnectModal && (
					<LoadingButton
						variant="outlined"
						startIcon={<WalletOutlined />}
						onClick={openConnectModal}
					>
						Connect Wallet
					</LoadingButton>
				)
			)}
		</div>
	)
}
