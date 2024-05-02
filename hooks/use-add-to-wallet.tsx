import { useCallback } from 'react'

import { usePlausible } from 'next-plausible'

import { CURRENT_CHAIN_ITEM } from '@/constants'
import { PlausibleEvents } from '@/types/events'
import { toast } from 'sonner'

export const useAddToWallet = () => {
	const plausible = usePlausible<PlausibleEvents>()

  const { network, rpcUrl, blockExplorerUrl, nativeCurrency } = CURRENT_CHAIN_ITEM

  const addToWallet = useCallback(async () => {
    try {
      plausible('Network-Add to Wallet')
      // ! we force add chain to metamask
      await (window as any).ethereum?.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: network.chainId,
            chainName: `${network.chainType}`,
            nativeCurrency: {
              name: nativeCurrency?.name,
              symbol: nativeCurrency?.symbol,
              decimals: nativeCurrency?.decimals
            },
            rpcUrls: [rpcUrl],
            blockExplorerUrls: [blockExplorerUrl],
            iconUrls: ['https://l2scan.co/imgs/logo.png']
          }
        ]
      })
      toast.success('Network has been added')
    } catch (error) {
      console.error('Error adding network to wallet', error)
    }
  }, [blockExplorerUrl, network.chainId, network.chainType, plausible, rpcUrl])

	return addToWallet
}
