import { useRouter } from 'next/router'

export const useSelectedLayoutSegment = () => {
	const router = useRouter()
	const routePath = router.route
	const segment = routePath.split('/')[2]
	return segment
}
