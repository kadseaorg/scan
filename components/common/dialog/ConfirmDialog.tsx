import { useState } from 'react'

import styled from '@emotion/styled'
import { LoadingButton } from '@mui/lab'
import {
	Backdrop,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
} from '@mui/material'

const MyBackdrop = styled(Backdrop)({
	backgroundColor: 'rgba(0,0,0,0.2)',
})

interface IConfirmDialogProps {
	title: string
	content: string
	children?: React.ReactNode
	open: boolean
	onClose: Function
	onConfirmClick: Function
	confirmActionText?: string
}

const ConfirmDialog = (props: IConfirmDialogProps) => {
	const {
		title,
		content,
		open,
		onClose,
		onConfirmClick,
		confirmActionText = 'Confirm',
	} = props
	const [isConfirming, setIsConfirming] = useState(false)

	return (
		<Dialog
			open={open}
			onClose={() => onClose()}
			maxWidth="sm"
			fullWidth
			BackdropComponent={MyBackdrop}
		>
			<DialogTitle>{title}</DialogTitle>
			<DialogContent sx={{ pb: 4 }}>
				<DialogContentText>{content}</DialogContentText>
			</DialogContent>
			<DialogActions>
				<Button variant="outlined" onClick={() => onClose()}>
					Cancel
				</Button>
				<LoadingButton
					variant="contained"
					loading={isConfirming}
					onClick={async () => {
						setIsConfirming(true)
						await onConfirmClick()
						setIsConfirming(false)
						onClose()
					}}
				>
					{confirmActionText}
				</LoadingButton>
			</DialogActions>
		</Dialog>
	)
}

export default ConfirmDialog
