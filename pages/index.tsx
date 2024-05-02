import { IsKadsea } from '@/constants'
import dynamic from 'next/dynamic'
const Container = dynamic(() => import('@/layout/container'), { ssr: false })
const HomePage = dynamic(() => import('@/pages/home'), { ssr: false })

export default function Home() {
	return (
		<Container contentClassName="px-0 pb-0" showFooter={!IsKadsea}>
			<HomePage />
		</Container>
	)
}
