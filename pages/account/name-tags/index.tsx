import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { zodResolver } from '@hookform/resolvers/zod'
import {
	Button,
	Card,
	CardContent,
	CardHeader,
	IconButton,
	Stack,
} from '@mui/material'
import { ColumnDef } from '@tanstack/react-table'
import { PlusIcon } from 'lucide-react'
import { toast } from 'sonner'

import NameTagAddDialog from '@/components/account/name-tag/NameTagAddDialog'
import AddressAvatar from '@/components/common/address-avatar'
import { CopyButton } from '@/components/common/copy-button'
import { DataTable } from '@/components/common/data-table/data-table'
import ConfirmDialog from '@/components/common/dialog/ConfirmDialog'
import FormProvider from '@/components/common/hook-form/FormProvider'
import Label from '@/components/common/label/Label'
import Link from '@/components/common/link'
import PageTitle from '@/components/common/page-title'
import { MAX_TAG_LIMIT } from '@/constants'
import { nameTagAddSchema } from '@/constants/form/account'
import Container from '@/layout/container'
import { LinkTypeEnum } from '@/types'
import { trpc } from '@/utils/trpc'

const MyNameTags: React.FC = (props) => {
	const [dialogOpen, setDialogOpen] = useState(false)

	const [isAdd, setIsAdd] = useState(true)
	const [showDialog, setShowDialog] = useState(false)

	const fetchResult = trpc.account.getTags.useQuery(undefined, {
		staleTime: 0,
		refetchOnMount: true,
	})
	const { data, refetch } = fetchResult
	const {
		isLoading,
		mutateAsync: addressTagMutation,
		error,
	} = trpc.account.createAddressTag.useMutation()
	const { isLoading: deleteLoading, mutateAsync: deleteAddressTag } =
		trpc.account.deleteAddressTag.useMutation()

	useEffect(() => {
		!!error?.message && toast.error(error?.message)
	}, [error])

	const methods = useForm<{
		address: string
		tag: string
		note: string | undefined
	}>({
		resolver: zodResolver(nameTagAddSchema),
		defaultValues: { address: '', tag: '', note: '' },
	})
	const { watch, reset, setValue } = methods
	const [deleteValues, setDeleteValues] = useState<any>()

	const columns: ColumnDef<any>[] = [
		{
			header: 'Address',
			accessorKey: 'address',
			cell: ({ row }) => (
				<div className="flex items-center">
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
					<CopyButton value={row.original.address ?? ''} />
				</div>
			),
		},
		{
			header: 'Private Name Tag',
			accessorKey: 'tag',
			cell: ({ row }) => <Label>{row.original.tag}</Label>,
		},
		{
			id: 'delete',
			header: '',
			accessorKey: '',
			cell: ({ row }) => {
				const _values = row.original
				return (
					<Stack flexDirection={'row'} gap={2}>
						<IconButton
							type="button"
							color="primary"
							size="small"
							disabled={deleteLoading}
							onClick={() => {
								setIsAdd(false)
								setValue('address', _values.address)
								setValue('tag', _values.tag)
								setValue('note', _values.note)
								setShowDialog(true)
							}}
						>
							<EditOutlined />
						</IconButton>
						<IconButton
							type="button"
							color="error"
							size="small"
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

	return (
		<Container>
			<PageTitle
				title="Address Private Name Tags"
				subTitle="A private name tag (up to 35 chars) and memo (up to 500 chars) for individual addresses can be saved and is useful for labelling addresses of interest."
			/>
			<Card>
				<CardHeader
					title={
						<div className="flex justify-between items-center sm:flex-col sm:items-start gap-2">
							<span className="text-sm text-[#666] sm:mt-[6px]">
								{data?.count ?? 0} addresses tagged (out of {MAX_TAG_LIMIT} max
								limit)
							</span>

							<Button
								className="ml-auto sm:mt-[6px] sm:mb-3"
								startIcon={<PlusIcon size={18} />}
								onClick={() => {
									setIsAdd(true)
									reset()
									setShowDialog(true)
								}}
								disabled={data?.count === MAX_TAG_LIMIT}
							>
								Add
							</Button>
							<FormProvider methods={methods}>
								<NameTagAddDialog
									methods={methods}
									open={showDialog}
									onClose={() => setShowDialog(false)}
									isAdd={isAdd}
									refreshList={refetch}
								/>
							</FormProvider>
						</div>
					}
				/>
				<div className="w-full overflow-x-auto">
					<DataTable fetchResult={fetchResult} columns={columns} />
				</div>
			</Card>

			<ConfirmDialog
				title="Confirmation Required"
				content={`Are you sure you wish to remove the address tag ${deleteValues?.address}?`}
				open={dialogOpen}
				onClose={() => setDialogOpen(false)}
				onConfirmClick={async () => {
					try {
						await deleteAddressTag(deleteValues?.address)
						refetch()
						toast.success('Successfully removed private name tag')
						return Promise.resolve()
					} catch (error) {
						console.error(error)
					}
				}}
				confirmActionText="Remove"
			/>
		</Container>
	)
}

export default MyNameTags
