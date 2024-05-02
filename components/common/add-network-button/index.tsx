import { CSSProperties } from 'react'

import { Button } from '@/components/ui/button'
import { useAddToWallet } from '@/hooks/use-add-to-wallet'
import { cn } from '@/lib/utils'

const AddNetworkButton: React.FC<{
	style?: CSSProperties
	className?: string
}> = ({ style, className }) => {
	const addToWallet = useAddToWallet()

	return (
		<Button
			style={style}
			className={cn('h-8', className)}
			onClick={addToWallet}
		>
			Add To Wallet
		</Button>
	)
}

export default AddNetworkButton
