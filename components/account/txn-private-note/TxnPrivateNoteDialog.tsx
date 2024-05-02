import { UseFormReturn } from 'react-hook-form'

import { LoadingButton } from '@mui/lab'
import {
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Stack,
	Typography,
} from '@mui/material'
import { toast } from 'sonner'

import { RHFTextField } from '@/components/common/hook-form'
import FieldHeader from '@/components/common/hook-form/FieldHeader'
import { trpc } from '@/utils/trpc'

interface ITxnPrivateNoteDialog {
	open: boolean
	onClose: () => void
	isAdd?: boolean
	methods: UseFormReturn<any>
	refreshList: () => void
}

const TxnPrivateNoteAddDialog = (props: ITxnPrivateNoteDialog) => {
	const { open, onClose, isAdd, methods, refreshList } = props
	const {
		isLoading,
		mutateAsync: txNoteMutate,
		error,
	} = trpc.account.UpsertTransactionNote.useMutation()

	const { watch, handleSubmit } = methods
	const values = watch()

	async function onSubmit() {
		try {
			await txNoteMutate({ ...values, isAdd })
			refreshList()
			toast.success(
				isAdd
					? 'Successfully added new transaction private note'
					: 'Successfully updated private note',
			)
			onClose()
		} catch (error: any) {
			toast.error(error?.message || 'Failed to add new private note')
			console.error(error)
		}
	}

	return (
		<Dialog open={open} onClose={onClose}>
			<DialogTitle>{`${isAdd ? 'Add New' : 'Edit'} Private Note`}</DialogTitle>
			<DialogContent>
				<Stack spacing={2} sx={{ flex: 1 }}>
					<Stack spacing={1}>
						<FieldHeader title="Transaction Hash" necessary />
						<RHFTextField
							placeholder="Input transaction hash..."
							size="small"
							name="transaction_hash"
						></RHFTextField>
					</Stack>
					<Stack>
						<FieldHeader title="Private Note" necessary />
						<RHFTextField
							placeholder="Short description..."
							multiline
							rows={4}
							size="small"
							name="note"
							sx={{ mt: 1 }}
							inputProps={{
								maxLength: 500,
							}}
						></RHFTextField>

						<Typography
							variant="body2"
							color="text.secondary"
							sx={{ alignSelf: 'flex-end' }}
						>
							{values.note?.length} / 500
						</Typography>
						<Typography variant="caption" color="text.secondary">
							A private note (up to 500 characters) can be attached to this
							transaction. Please <span className="font-bold">DO NOT</span>{' '}
							store any passwords or private keys here.
						</Typography>
					</Stack>
				</Stack>
			</DialogContent>
			<DialogActions>
				<LoadingButton loading={isLoading} onClick={handleSubmit(onSubmit)}>
					OK
				</LoadingButton>
			</DialogActions>
		</Dialog>
	)
}

export default TxnPrivateNoteAddDialog
