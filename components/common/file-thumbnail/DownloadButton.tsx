// @mui
import { IconButton } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { ArrowDownCircleIcon } from 'lucide-react'

import { bgBlur } from '@/utils/cssStyles'

type Props = {
	onDownload?: VoidFunction
}

export default function DownloadButton({ onDownload }: Props) {
	const theme = useTheme()

	return (
		<IconButton
			// color="inherit"
			onClick={onDownload}
			sx={{
				p: 0,
				top: 0,
				right: 0,
				width: 1,
				height: 1,
				zIndex: 9,
				opacity: 0,
				position: 'absolute',
				borderRadius: 'unset',
				// color: 'common.white',
				justifyContent: 'center',
				bgcolor: 'grey.800',
				color: 'common.white',
				transition: theme.transitions.create('opacity'),

				'&:hover': {
					opacity: 1,
					...bgBlur({
						opacity: 0.64,
						color: theme.palette.grey[900],
					}),
				},
			}}
		>
			<ArrowDownCircleIcon size={24} />
		</IconButton>
	)
}
