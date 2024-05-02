import { Stack, SxProps, Theme, Typography } from '@mui/material'

interface IFieldHeaderProps {
	title: string
	sx?: SxProps<Theme>
	necessary?: boolean
}

const FieldHeader = (props: IFieldHeaderProps) => {
	const { necessary, title } = props
	return (
		<Stack flexDirection={'row'}>
			{necessary && (
				<Typography color={'error'} sx={{ mr: 1 }}>
					*
				</Typography>
			)}

			<Typography variant="subtitle2">{title}</Typography>
		</Stack>
	)
}

export default FieldHeader
