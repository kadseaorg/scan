import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Card, CardHeader, IconButton, Stack } from '@mui/material'
import { ColumnDef } from '@tanstack/react-table'
import { PlusIcon } from 'lucide-react'
import { toast } from 'sonner'

import TxnPrivateNoteAddDialog from '@/components/account/txn-private-note/TxnPrivateNoteDialog'
import AddressAvatar from '@/components/common/address-avatar'
import { CopyButton } from '@/components/common/copy-button'
import { DataTable } from '@/components/common/data-table/data-table'
import ConfirmDialog from '@/components/common/dialog/ConfirmDialog'
import FormProvider from '@/components/common/hook-form/FormProvider'
import Label from '@/components/common/label/Label'
import Link from '@/components/common/link'
import PageTitle from '@/components/common/page-title'
import { MAX_TAG_LIMIT } from '@/constants'
import { txnNoteSchema } from '@/constants/form/account'
import Container from '@/layout/container'
import { LinkTypeEnum } from '@/types'
import { trpc } from '@/utils/trpc'

const TxnPrivateNodes: React.FC = (props) => {
	const [dialogOpen, setDialogOpen] = useState(false)

	const [isAdd, setIsAdd] = useState(true)
	const [showDialog, setShowDialog] = useState(false)

	const fetchResult = trpc.account.getTransactionNotes.useQuery(undefined, {
		staleTime: 0,
		refetchOnMount: true,
	})
	const { data, refetch } = fetchResult
	const {
		isLoading,
		mutateAsync: txnNoteMutation,
		error,
	} = trpc.account.UpsertTransactionNote.useMutation()
	const { isLoading: deleteLoading, mutateAsync: deleteTxnNote } =
		trpc.account.deleteTransactionTag.useMutation()

	useEffect(() => {
		!!error?.message && toast.error(error?.message)
	}, [error])

	const methods = useForm<{
		transaction_hash: string
		note: string
	}>({
		resolver: zodResolver(txnNoteSchema),
		defaultValues: { transaction_hash: '', note: '' },
	})
	const { watch, reset, setValue } = methods

	const [deleteValues, setDeleteValues] = useState<any>()

	const columns: ColumnDef<any>[] = [
		{
			header: 'Transaction Hash',
			accessorKey: 'transaction_hash',
			cell: ({ row }) => (
				<div className="flex items-center">
					<AddressAvatar
						className="rounded-full"
						address={row.original.transaction_hash}
						size={24}
					/>
					<Link
						className="mx-[6px] whitespace-nowrap"
						type={LinkTypeEnum.TX}
						value={row.original.transaction_hash}
					/>
					<CopyButton value={row.original.transaction_hash ?? ''} />
				</div>
			),
		},
		{
			header: 'Private Note',
			accessorKey: 'note',
			cell: ({ row }) => <Label>{row.original.note}</Label>,
		},
		{
			id: 'delete',
			header: '',
			accessorKey: '',
			cell: ({ row }) => (
				<Stack flexDirection={'row'} gap={2}>
					<IconButton
						type="button"
						color="primary"
						size="small"
						disabled={deleteLoading}
						onClick={() => {
							setIsAdd(false)
							setValue('transaction_hash', row.original.transaction_hash)
							setValue('note', row.original.note)
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
							setDeleteValues(row.original)
							setDialogOpen(true)
						}}
					>
						<DeleteOutlined />
					</IconButton>
				</Stack>
			),
		},
	]

	return (
		<Container>
			<PageTitle
				title="Transaction Private Note"
				subTitle="A private transaction note can be saved and is useful for transaction tracking."
			/>
			<Card>
				<CardHeader
					title={
						<div className="flex justify-between items-center sm:flex-col sm:items-start">
							<span className="text-sm text-[#666] sm:mt-[6px]">
								{data?.count ?? 0} notes added (out of {MAX_TAG_LIMIT} max
								limit)
							</span>

							<Button
								className="ml-auto sm:my-[6px]"
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
								<TxnPrivateNoteAddDialog
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
				content={`Are you sure you wish to remove the txn note ${deleteValues?.transaction_hash}?`}
				open={dialogOpen}
				onClose={() => setDialogOpen(false)}
				onConfirmClick={async () => {
					try {
						await deleteTxnNote(deleteValues?.transaction_hash)
						refetch()
						toast.success('Successfully removed private note')
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

export default TxnPrivateNodes
