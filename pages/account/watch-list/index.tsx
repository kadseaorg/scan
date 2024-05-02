import React, { useEffect, useState } from 'react'
import CopyToClipboard from 'react-copy-to-clipboard'
import { useForm } from 'react-hook-form'

import { CopyOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { getAddress, isAddress } from '@ethersproject/address'
import { zodResolver } from '@hookform/resolvers/zod'
import {
	Card,
	CardContent,
	CardHeader,
	Dialog,
	IconButton,
	Stack,
	Typography,
} from '@mui/material'
import { ColumnDef } from '@tanstack/react-table'
import { XIcon } from 'lucide-react'
import { usePlausible } from 'next-plausible'
import { useRouter } from 'next/router'
import { toast } from 'sonner'

import AddressAvatar from '@/components/common/address-avatar'
import { DataTable } from '@/components/common/data-table/data-table'
import ConfirmDialog from '@/components/common/dialog/ConfirmDialog'
import {
	RHFMultiCheckbox,
	RHFRadioGroup,
	RHFTextField,
} from '@/components/common/hook-form'
import FieldHeader from '@/components/common/hook-form/FieldHeader'
import FormProvider from '@/components/common/hook-form/FormProvider'
import Link from '@/components/common/link'
import PageTitle from '@/components/common/page-title'
import { Button } from '@/components/ui/button'
import { TIPS } from '@/constants'
import { watchAddressSchema } from '@/constants/form/account'
import Container from '@/layout/container'
import { ContractTypeEnum, LinkTypeEnum, NotificationMethod } from '@/types'
import { PlausibleEvents } from '@/types/events'
import { trpc } from '@/utils/trpc'

export const MAX_WATCH_LIMIT = 50

const MyWatchList: React.FC = (props) => {
	const fetchResult = trpc.account.getWatchList.useQuery(undefined, {
		staleTime: 0,
		refetchOnMount: true,
	})
	const { isFetching, data, refetch } = fetchResult
	const { isLoading, mutateAsync: watchAddressMutation } =
		trpc.account.watchAddressMutation.useMutation()
	const {
		isLoading: deleteLoading,
		mutateAsync: deleteWatchAddress,
		error,
	} = trpc.account.deleteWatchAddress.useMutation()
	const [submitting, setSubmitting] = useState(false)
	const router = useRouter()
	const search: any = router?.query
	const address = isAddress(search?.address)
		? getAddress(search?.address)
		: search?.address

	const methods = useForm<{
		address: string
		email: string
		notifyTransferTypes: (ContractTypeEnum | undefined)[] | undefined
		notify_method: NotificationMethod | undefined
		description: string | undefined
	}>({
		resolver: zodResolver(watchAddressSchema),
		defaultValues: { address: '', description: '', notifyTransferTypes: [] },
	})
	const plausible = usePlausible<PlausibleEvents>()
	const { watch, reset, setValue, handleSubmit } = methods
	const values = watch()
	async function onSubmit() {
		setSubmitting(true)
		try {
			plausible('Account-Add to Watch List')
			await watchAddressMutation({ ...values, isAdd })
			refetch()
			toast.success(
				isAdd
					? `Successfully added new address ${values?.address} to the list`
					: 'Successfully updated address',
			)
			setShowModal(false)
		} catch (error: any) {
			toast.error(error?.message)
			console.error(error)
		}
		setSubmitting(false)
	}

	useEffect(() => {
		!!error?.message && toast.error(error?.message)
	}, [error])

	useEffect(() => {
		if (address) {
			setValue('address', address)
			setShowModal(true)
			setIsAdd(true)
		}
	}, [address, setValue])

	const [isAdd, setIsAdd] = useState(true)
	const [showModal, setShowModal] = useState(false)
	const [dialogOpen, setDialogOpen] = useState(false)

	const [deleteValues, setDeleteValues] = useState<any>()

	const columns: ColumnDef<any>[] = [
		{
			header: 'Address',
			accessorKey: 'address',
			cell: ({ row }) => (
				<div className="flex items-center gap-1">
					<AddressAvatar
						className="rounded-full"
						address={row.original.address}
						size={24}
					/>
					<Link
						className="mx-[6px] whitespace-nowrap"
						type={LinkTypeEnum.ADDRESS}
						value={row.original.address}
					/>
					<CopyToClipboard
						text={row.original.address ?? ''}
						onCopy={() => toast.success(TIPS.copied)}
					>
						<CopyOutlined />
					</CopyToClipboard>
				</div>
			),
		},
		{
			header: 'Email',
			accessorKey: 'email',
			cell: ({ row }) => <span>{row.original.email}</span>,
		},
		{
			id: 'notify_method',
			header: '',
			accessorKey: '',
			cell: ({ row }) => {
				const _values = row.original
				return (
					<Stack flexDirection={'row'} gap={1}>
						<IconButton
							size="small"
							disabled={deleteLoading}
							onClick={() => {
								setIsAdd(false)
								setValue('address', _values.address)
								setValue('notify_method', _values.notify_method)
								setValue('description', _values.description)
								setValue('email', _values.email)
								setValue('notifyTransferTypes', _values.notifyTransferTypes)
								setShowModal(true)
							}}
						>
							<EditOutlined />
						</IconButton>
						<IconButton
							size="small"
							color="error"
							disabled={deleteLoading}
							onClick={() => {
								setDeleteValues(_values)
								setDialogOpen(true)
							}}
						>
							<DeleteOutlined />
						</IconButton>
					</Stack>
				)
			},
		},
	]

	const onDialogClose = () => {
		setShowModal(false)
		reset()
	}
	return (
		<Container>
			<PageTitle
				title="Watch List"
				subTitle="An Email notification can be sent to you when an address on your watch list sends or receives any transactions."
			/>
			<Card>
				<div className="mb-2 flex justify-between items-center p-4 sm:flex-col sm:items-start gap-2">
					<span className="text-sm text-muted-foreground">
						{data?.count ?? 0} address selected (out of {MAX_WATCH_LIMIT} max
						limit)
					</span>
					<Button
						className="sm:mt-[6px] sm:mb-3"
						onClick={() => {
							setIsAdd(true)
							setShowModal(true)
						}}
						disabled={data?.count === MAX_WATCH_LIMIT}
					>
						Add
					</Button>
				</div>
				<div className="w-full overflow-x-auto">
					<DataTable fetchResult={fetchResult} columns={columns} />
				</div>
			</Card>

			<ConfirmDialog
				title="Confirmation Required"
				content={`Are you sure you wish to unlink the address ${deleteValues?.address}?`}
				open={dialogOpen}
				onClose={() => setDialogOpen(false)}
				onConfirmClick={async () => {
					try {
						await deleteWatchAddress(deleteValues?.address)
						refetch()
						toast.success(
							`Successfully removed address ${deleteValues?.address} from the address watch list`,
						)
						return Promise.resolve()
					} catch (error) {
						console.error(error)
					}
				}}
				confirmActionText="Remove"
			/>

			<Dialog open={showModal} onClose={onDialogClose} fullWidth>
				<CardHeader
					title={`${isAdd ? 'Add New' : 'Edit'} Address`}
					action={
						<IconButton onClick={onDialogClose}>
							<XIcon size={20} />
						</IconButton>
					}
				/>
				<CardContent>
					<FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
						<Stack spacing={2}>
							<Stack spacing={1}>
								<FieldHeader title="Ethereum Address" necessary />
								<RHFTextField
									size="small"
									name="address"
									placeholder="Input your address..."
									disabled={!isAdd}
								/>
							</Stack>
							<Stack spacing={1}>
								<FieldHeader
									title="E-mail to receive notifications"
									necessary
								/>
								<RHFTextField
									size="small"
									name="email"
									placeholder="Input your E-mail..."
								/>
							</Stack>
							<Stack>
								<FieldHeader title="Description (Optional)" />
								<RHFTextField
									placeholder="Short description..."
									multiline
									rows={5}
									size="small"
									name="description"
									sx={{ mt: 1 }}
									inputProps={{
										maxLength: 300,
									}}
								></RHFTextField>
								<Typography
									variant="body2"
									color="text.secondary"
									sx={{ alignSelf: 'flex-end' }}
								>
									{values?.description?.length} / 300
								</Typography>
							</Stack>

							<Stack spacing={1}>
								<FieldHeader title="Notification Methods" />
								<RHFRadioGroup
									name="notify_method"
									sx={{ flexDirection: 'column' }}
									options={[
										{
											label: 'No Notification',
											value: NotificationMethod.NO_NOTIFICATION,
										},
										{
											label: 'Notify on Incoming & Outgoing Txns',
											value: NotificationMethod.INCOMING_OUTGOING,
										},
										{
											label: 'Notify on Incoming (Receive) Txns Only',
											value: NotificationMethod.INCOMING_ONLY,
										},
										{
											label: 'Notify on Outgoing (Sent) Txns Only',
											value: NotificationMethod.OUTGOING_ONLY,
										},
									]}
								/>
								<Typography variant="caption" color="text.secondary">
									You can monitor and receive an alert to your email when an
									address on your watchlist sends or receives any transactions
								</Typography>
							</Stack>

							<Stack spacing={1}>
								<FieldHeader title="Other Options" />
								<RHFMultiCheckbox
									name="notifyTransferTypes"
									options={[
										{
											label: 'Also Track ERC20 Token Transfers',
											value: ContractTypeEnum.ERC20,
										},
										{
											label: 'Also Track ERC721 Token Transfers',
											value: ContractTypeEnum.ERC721,
										},
										{
											label: 'Also Track ERC1155 Token Transfers',
											value: ContractTypeEnum.ERC1155,
										},
									]}
								/>
							</Stack>
						</Stack>
						<Stack flexDirection={'row'} gap={2} justifyContent={'flex-end'}>
							<Button variant="outline" onClick={onDialogClose}>
								Cancel
							</Button>
							<Button type="submit">
								{submitting ? 'Submitting...' : 'Submit'}
							</Button>
						</Stack>
					</FormProvider>
				</CardContent>
			</Dialog>
		</Container>
	)
}

export default MyWatchList
