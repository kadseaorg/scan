import { Skeleton, Stack } from '@mui/material'

const SkeletonDappListItem = () => {
	return (
		<Stack
			className={`h-[72px]`}
			flexDirection={'row'}
			alignItems={'center'}
			gap={2}
		>
			<Skeleton variant="circular" width={40} height={40} />
			<Skeleton variant="rounded" width={120} height={20} />
			<Stack
				flexDirection={'row'}
				alignItems={'center'}
				gap={1}
				sx={{ ml: 'auto' }}
			>
				<Skeleton variant="rounded" width={40} />
				<Skeleton variant="rounded" width={40} />
			</Stack>
		</Stack>
	)
}

export default SkeletonDappListItem
