import { IconButton, SxProps, Theme, Tooltip } from '@mui/material'
import { usePlausible } from 'next-plausible'
import Image from 'next/image'
import { toast } from 'sonner'

import { CURRENT_CHAIN_ITEM } from '@/constants'
import { useAddToWallet } from '@/hooks/use-add-to-wallet'
import { PlausibleEvents } from '@/types/events'

interface IAddTokenButtonProps {
	tokenDetail: any
	sx?: SxProps<Theme>
}

const AddTokenButton = (props: IAddTokenButtonProps) => {
	const plausible = usePlausible<PlausibleEvents>()
	const addToWallet = useAddToWallet()

	const { tokenDetail, sx = {} } = props

	const { network } = CURRENT_CHAIN_ITEM

	const addTokenToMetamask = async () => {
		const tokenAddress = tokenDetail.address
		const tokenSymbol = tokenDetail.symbol
		const tokenDecimals = tokenDetail.decimals

		try {
			plausible('Token-Add to wallet', {
				props: { TokenName: tokenSymbol, WalletName: 'Metamask' },
			})
			// switch network
			await (window as any).ethereum?.request({
				method: 'wallet_switchEthereumChain',
				params: [{ chainId: network.chainId }],
			})
			const wasAdded = await window?.ethereum.request({
				method: 'wallet_watchAsset',
				params: {
					type: 'ERC20',
					options: {
						address: tokenAddress,
						symbol: tokenSymbol,
						decimals: tokenDecimals,
					},
				},
			})

			if (wasAdded) {
				toast.success('Token added Successfully!')
			} else {
				toast.error('Failed to add the token')
			}
		} catch (error: any) {
			toast.warning(
				'Please make sure to add the network to your wallet before proceeding.',
				{
					action: {
						label: 'Add Wallet',
						onClick: () => addToWallet(),
					},
				},
			)
		}
	}

	return (
		<Tooltip title="Add Token to Metamask">
			<IconButton onClick={addTokenToMetamask} sx={{ ...sx }}>
				<Image
					src="/svgs/common/metamask.svg"
					width={20}
					height={20}
					alt="metamask"
				/>
			</IconButton>
		</Tooltip>
	)
}

export default AddTokenButton
