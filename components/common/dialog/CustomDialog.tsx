import { Dialog, styled } from '@mui/material'

const CustomDialog = styled(Dialog)(({ theme }) => ({
	'& .MuiBackdrop-root': {
		// backgroundColor: 'red'
		// backgroundColor: 'rgba(0, 0, 0, 0.5)',
	},
}))

export default CustomDialog
