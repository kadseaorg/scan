import dynamic from 'next/dynamic'

import Container from '@/layout/container'
import { TokenTypeEnum } from '@/types'

const TokenPage = dynamic(() => import('@/components/tokens/token-page'), {
	ssr: false,
})

const TopTokens: React.FC = () => {
	return (
		<Container>
			<TokenPage type={TokenTypeEnum.ERC20} />
		</Container>
	)
}

export default TopTokens
