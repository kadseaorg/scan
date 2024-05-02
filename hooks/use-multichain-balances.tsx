import { Hex } from 'viem'
import { base, linea, scroll, scrollSepolia, zkSync } from 'viem/chains'
import { useBalance } from 'wagmi'

type UseMultichainBalancesProps = {
	address: string
}

export default function useMultichainBalances({
	address,
}: UseMultichainBalancesProps) {
	const hexAddress = address as Hex

	const scrollSepoliaBalance = useBalance({
		address: hexAddress,
		chainId: scrollSepolia.id,
	})
	const scrollMainnetBalance = useBalance({
		address: hexAddress,
		chainId: scroll.id,
	})
	const lineaMainnetBalance = useBalance({
		address: hexAddress,
		chainId: linea.id,
	})
	const baseMainnetBalance = useBalance({
		address: hexAddress,
		chainId: base.id,
	})
	const zksyncMainnetBalance = useBalance({
		address: hexAddress,
		chainId: zkSync.id,
	})

	return {
		isLoading:
			scrollSepoliaBalance.isLoading ||
			scrollMainnetBalance.isLoading ||
			lineaMainnetBalance.isLoading ||
			baseMainnetBalance.isLoading ||
			zksyncMainnetBalance.isLoading,
		data: [
			{
				name: 'Scroll Mainnet',
				balance: scrollMainnetBalance.data,
				url: `https://scroll.l2scan.co/address/${address}`,
			},
			{
				name: 'Scroll Sepolia',
				balance: scrollSepoliaBalance.data,
				url: `https://scroll-sepolia.l2scan.co/address/${address}`,
			},
			{
				name: 'zkSync Era Mainnet',
				balance: zksyncMainnetBalance.data,
				url: `https://zksync-era.l2scan.co/address/${address}`,
			},
			{
				name: 'Linea Mainnet',
				balance: lineaMainnetBalance.data,
				url: `https://linea.l2scan.co/address/${address}`,
			},
			{
				name: 'Base Mainnet',
				balance: baseMainnetBalance.data,
				url: `https://base.l2scan.co/address/${address}`,
			},
		].sort((a, b) => {
			return Number(b?.balance?.value) - Number(a?.balance?.value)
		}),
	}
}
