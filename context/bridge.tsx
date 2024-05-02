import {
	Context,
	PropsWithChildren,
	createContext,
	useEffect,
	useMemo,
	useState,
} from 'react'

import { useBalance } from 'wagmi'

import usePortalContext from '@/hooks/portal/use-portal-context'
import { usePortalStore } from '@/stores/portal'
import { useBridgeConfigStore } from '@/stores/portal/bridge/config'
import { useBridgeGasFeeStore } from '@/stores/portal/bridge/gas-fee'
import { useBridgeNetworkStore } from '@/stores/portal/bridge/network'
import { BridgeTxTypeEnum } from '@/types/bridge'

export type BridgeContextType = {
	isDeposit: boolean
	txType: BridgeTxTypeEnum
	setTxType: (txType: BridgeTxTypeEnum) => void
}

const defaultBridgeContext = {
	isDeposit: true,
	txType: BridgeTxTypeEnum.DEPOSIT,
	setTxType: (txType: BridgeTxTypeEnum) => {},
}

export const BridgeContext: Context<BridgeContextType> =
	createContext(defaultBridgeContext)

export const BridgeProvider: React.FC<PropsWithChildren> = ({ children }) => {
	const { walletAddress, currentChainId } = usePortalContext()
	const { isMainnet } = usePortalStore()

	const [txType, setTxType] = useState<BridgeTxTypeEnum>(
		BridgeTxTypeEnum.DEPOSIT,
	)
	const isDeposit = useMemo(() => txType === BridgeTxTypeEnum.DEPOSIT, [txType])

	const { isCorrectNetworkSet, fromNetwork, setNetwork } =
		useBridgeNetworkStore()
	const { setBalance, nativeToken, selectedToken } = useBridgeConfigStore()
	const { resetFee } = useBridgeGasFeeStore()

	useEffect(() => {
		resetFee()
	}, [resetFee, currentChainId])

	useEffect(() => {
		setNetwork(isDeposit, currentChainId)
	}, [isDeposit, currentChainId, setNetwork, isMainnet])

	const { data: balance } = useBalance({
		watch: true,
		enabled:
			isCorrectNetworkSet &&
			!!walletAddress &&
			!!selectedToken &&
			!!fromNetwork?.id,
		address: walletAddress as `0x${string}`,
		chainId: fromNetwork?.id,
		token:
			!!selectedToken && nativeToken?.address === selectedToken?.address
				? undefined
				: (((fromNetwork as any)?.isL2
						? selectedToken?.l2Address
						: selectedToken?.l1Address) as `0x${string}`),
	})

	useEffect(() => {
		setBalance(balance)
	}, [balance, setBalance])

	return (
		<BridgeContext.Provider
			value={{
				txType,
				setTxType,
				isDeposit,
			}}
		>
			{children}
		</BridgeContext.Provider>
	)
}
