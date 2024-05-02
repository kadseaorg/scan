import Image from 'next/image'

import useTheme from '@/hooks/common/useTheme'
import { EnumChainType } from '@/types/chain'

export const LogoIcon = (props: { small?: boolean; chain: EnumChainType }) => {
	const { small = false, chain } = props
	const { themeMode } = useTheme()
	return (
		<>
			{(chain === EnumChainType.SCROLL_SEPOLIA ||
				chain === EnumChainType.SCROLL) && (
				<Image
					src="/svgs/logo/scroll.svg"
					alt="scroll"
					width={small ? 32 : 44}
					height={small ? 32 : 44}
				/>
			)}
			{(chain === EnumChainType.ZKSYNC ||
				chain === EnumChainType.ZKSYNC_TESTNET ||
				chain === EnumChainType.ZKSYNC_SEPOLIA) && (
				<Image
					src={`/svgs/logo/${
						themeMode === 'light' ? 'zksync-era.svg' : 'zksync-era_white.svg'
					}`}
					alt="zksync"
					width={small ? 24 : 44}
					height={small ? 24 : 44}
				/>
			)}
			{chain === EnumChainType.LINEA && (
				<Image
					className="ml-2 mt-1"
					src={`/svgs/logo/${
						themeMode === 'light' ? 'linea.svg' : 'linea_white.svg'
					}`}
					alt="linea"
					width={small ? 24 : 24}
					height={small ? 24 : 24}
				/>
			)}
			{chain === EnumChainType.BASE && (
				<Image
					src="/svgs/logo/base.svg"
					alt="base"
					width={small ? 24 : 32}
					height={small ? 24 : 32}
				/>
			)}
			{chain === EnumChainType.ARB && (
				<Image
					src="/svgs/logo/arb-one.svg"
					alt="base"
					width={small ? 24 : 32}
					height={small ? 24 : 32}
				/>
			)}
			{chain === EnumChainType.BSQUARED_TESTNET && (
				<Image
					src="/svgs/logo/bsquared-testnet.svg"
					alt="bsquared"
					width={small ? 24 : 32}
					height={small ? 24 : 32}
				/>
			)}
			{(chain === EnumChainType.MANTA ||
				chain === EnumChainType.MANTA_TESTNET) && (
				<Image
					src="/svgs/logo/manta-pacific.svg"
					alt="manta"
					width={40}
					height={40}
				/>
			)}
			{(chain === EnumChainType.KADSEA ||
				chain === EnumChainType.KADSEA_TESTNET) && (
				<Image
					src="/svgs/logo/kadsea.png"
					alt="kadsea"
					width={40}
					height={40}
				/>
			)}
			{chain === EnumChainType.OKX1_TESTNET && (
				<Image
					src="/svgs/logo/okx1.png"
					width={small ? 24 : 32}
					height={small ? 24 : 32}
					alt="x1"
				/>
			)}
			{chain === EnumChainType.ORO_TESTNET && (
				<Image
					src="/svgs/logo/oro.svg"
					width={small ? 24 : 32}
					height={small ? 24 : 32}
					alt="oro"
				/>
			)}
		</>
	)
}
