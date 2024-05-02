import * as React from 'react'

import { TextField, Typography } from '@mui/material'
import { usePrivy } from '@privy-io/react-auth'
import { useSession } from '@supabase/auth-helpers-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useLogin } from '@privy-io/react-auth'
import { trpc } from '@/utils/trpc'

interface Props {
	txHash: string
}

const TxnPrivateNoteInput: React.FC<Props> = ({ txHash }) => {
	// const session = useSession()
	// const isLogin = !!session

	const { ready, authenticated, user } = usePrivy()
	const isLogin = ready && authenticated

	const { data: txNote } = trpc.account.getTransactionNote.useQuery(txHash, {
		enabled: !!txHash && isLogin,
	})
	const { isLoading, mutateAsync: txNoteMutate } =
		trpc.account.UpsertTransactionNote.useMutation()

	const [note, setNote] = React.useState<string>(txNote?.note || '')
	const handleNoteChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setNote(event.target.value)
	}

	const handleKeyDown = async (event: React.KeyboardEvent) => {
		if (event.key === 'Enter') {
			try {
				await txNoteMutate({ transaction_hash: txHash, note: note })
				toast.success('Successfully added new transaction private note')
			} catch (error: any) {
				toast.error(
					error?.message || 'Failed to add new transaction private note',
				)
				console.error(error)
			}
		}
	}

	React.useEffect(() => {
		if (txNote) {
			setNote(txNote?.note || '')
		}
	}, [txNote])
	const { login } = useLogin()

	if (!isLogin) {
		// must login tips and redirect link
		return (
			<div className="flex flex-col space-y-2 w-full">
				<Typography variant="caption" color="text.secondary">
					Please <span className="font-bold">login</span> to add private note.
				</Typography>
				<Typography variant="caption" color="text.secondary">
					<button
						type="button"
						onClick={login}
						className="text-blue-500 hover:underline"
					>
						Login
					</button>
				</Typography>
			</div>
		)
	}

	return (
		<div className="flex flex-col space-y-2 w-full">
			<TextField
				id={txHash}
				value={note}
				onChange={handleNoteChange}
				onKeyDown={handleKeyDown}
				variant="outlined"
				disabled={isLoading}
				size="small"
				sx={{ width: '100%' }}
			/>
			<Typography variant="caption" color="text.secondary">
				A private note (up to 500 characters) can be attached to this
				transaction. Please <span className="font-bold">DO NOT</span> store any
				passwords or private keys here.
			</Typography>
		</div>
	)
}

export default TxnPrivateNoteInput
