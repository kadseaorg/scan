import dynamic from 'next/dynamic'

import { IsKadsea } from '@/constants'
import Container from '@/layout/container'

const SwapView = dynamic(() => import('@/components/swap'), { ssr: false })

const SwapPage = () => {
	return false && IsKadsea ? (
		<SwapView></SwapView>
	) : (
		<Container contentClassName="px-0 pb-0">
			<div className="ml-[30px]">coming soon</div>
		</Container>
	)
}
export default SwapPage
