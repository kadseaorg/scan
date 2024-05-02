import {
	Dialog,
	IconButton,
	DialogTitle as MUIDialogTitle,
	Modal,
	Stack,
} from '@mui/material'
import { XIcon } from 'lucide-react'

interface IDialogTitleProps {
	title?: string
	onClose: () => void
}

const DialogTitle = (props: IDialogTitleProps) => {
	const { title, onClose } = props
	return (
		<MUIDialogTitle>
			<Stack flexDirection={'row'} alignItems={'center'}>
				<>{title}</>
				<IconButton onClick={onClose} sx={{ ml: 'auto' }}>
					<XIcon size={20} />
				</IconButton>
			</Stack>
		</MUIDialogTitle>
	)
}

export default DialogTitle
