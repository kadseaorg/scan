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
import { usePlausible } from 'next-plausible'
import { toast } from 'sonner'

import { RHFTextField } from '@/components/common/hook-form'
import FieldHeader from '@/components/common/hook-form/FieldHeader'
import { PlausibleEvents } from '@/types/events'
import { trpc } from '@/utils/trpc'

interface INameTagAddDialogProps {
	open: boolean
	onClose: () => void
	isAdd?: boolean
	methods: UseFormReturn<any>
	refreshList?: () => void
}

const NameTagAddDialog = (props: INameTagAddDialogProps) => {
	const { open, onClose, isAdd, methods, refreshList } = props
	const {
		isLoading,
		mutateAsync: addressTagMutation,
		error,
	} = trpc.account.createAddressTag.useMutation()
	const plausible = usePlausible<PlausibleEvents>()

	const { watch, handleSubmit } = methods
	const values = watch()

	async function onSubmit() {
		try {
			plausible('Account-Private Tag')
			await addressTagMutation({ ...values, isAdd })
			refreshList?.()
			toast.success(
				isAdd
					? 'Successfully added new address private name tag'
					: 'Successfully updated address tag',
			)
			onClose()
		} catch (error: any) {
			toast.error(
				error?.message || 'Failed to add new address private name tag',
			)
			console.error(error)
		}
	}

	return (
		<Dialog open={open} onClose={onClose}>
			<DialogTitle>{`${
				isAdd ? 'Add New' : 'Edit'
			} Private Name Tag`}</DialogTitle>
			<DialogContent>
				<Stack spacing={2} sx={{ flex: 1 }}>
					<Stack spacing={1}>
						<FieldHeader title="Ethereum Address" necessary />
						<RHFTextField
							placeholder="Input your address..."
							size="small"
							name="address"
						></RHFTextField>
					</Stack>
					<Stack>
						<FieldHeader title="Private Name Tag" necessary />
						<RHFTextField
							placeholder="e.g. Donate Address..."
							multiline
							rows={2}
							size="small"
							name="tag"
							sx={{ mt: 1 }}
							inputProps={{
								maxLength: 35,
							}}
						></RHFTextField>

						<Typography
							variant="body2"
							color="text.secondary"
							sx={{ alignSelf: 'flex-end' }}
						>
							{values.tag.length} / 35
						</Typography>
						<Typography variant="caption" color="text.secondary">
							Private Name Tags (up to 35 characters) can be used for easy
							identification of addresses
						</Typography>
					</Stack>
					<Stack>
						<FieldHeader title="Private Note (Optional)" />
						<RHFTextField
							placeholder="Short description..."
							multiline
							rows={4}
							size="small"
							name="description"
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
							address. Please <span className="font-bold">DO NOT</span> store
							any passwords or private keys here.
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

export default NameTagAddDialog
