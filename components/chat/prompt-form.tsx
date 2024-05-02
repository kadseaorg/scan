import * as React from 'react'

import { usePrivy } from '@privy-io/react-auth'
import { useSession } from '@supabase/auth-helpers-react'
import { UseChatHelpers } from 'ai/react'
import { Loader2, Send } from 'lucide-react'
import Router from 'next/router'

import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { CHAIN_TYPE } from '@/constants'
import { useLogin } from '@privy-io/react-auth'
import { useEnterSubmit } from '@/lib/hooks/use-enter-submit'
import { cn } from '@/lib/utils'

import { Button } from '../ui/button'
import { Input } from '../ui/input'

const predefinedPrompts = [
	'What is the KAD price today?',
	'When is the KAD halving scheduled to occur',
	'What is EIP 4844, and how can it benefit Ethereum',
	'What is the latest block number?',
	'Show transactions with values greater than 1 ETH between June 23 and June 25, 2023',
	'Show the balance of address 0x4C0926FF5252A435FD19e10ED15e5a249Ba19d79',
	'Show me all information about batch number 2161294?',
	'Show the source code of contract 0x...?',
	'Show the detail of transaction 0x...?',
	'Show the blocks between 10000 and 10010?',
	'Show all transactions in block 10010?',
]

export interface PromptProps
	extends Pick<UseChatHelpers, 'input' | 'setInput'> {
	onSubmit: (value: string) => Promise<void>
	isLoading: boolean
}

export function PromptForm({
	onSubmit,
	input,
	setInput,
	isLoading,
}: PromptProps) {
	const { formRef, onKeyDown } = useEnterSubmit()
	const inputRef = React.useRef<HTMLTextAreaElement>(null)

	// const session = useSession()
	// const isLogin = !!session?.user
	const { ready, authenticated, user } = usePrivy()
	const isLogin = ready && authenticated

	React.useEffect(() => {
		if (inputRef.current) {
			inputRef.current.focus()
		}
	}, [])

	const { login } = useLogin()

	return (
		<form
			onSubmit={async (e) => {
				e.preventDefault()
				if (!input?.trim()) {
					return
				}
				setInput('')
				await onSubmit(input)
			}}
			ref={formRef}
		>
			{isLogin ? (
				<div className="flex w-full items-center space-x-2 flex-grow">
					<Select onValueChange={(value) => setInput(value)}>
						<SelectTrigger className="w-32">
							<SelectValue placeholder="Prompts">Prompts</SelectValue>
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								{predefinedPrompts.map((prompt, index) => (
									<SelectItem key={index} value={prompt}>
										{prompt}
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
					<Input
						className="w-full"
						onChange={(e) => setInput(e.target.value)}
						value={input}
						type="text"
						placeholder="Send a message"
					/>
					<Button variant="outline" size="sm" type="submit">
						{isLoading ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<Send className="h-4 w-4" />
						)}
					</Button>
				</div>
			) : (
				<Button
					className={cn(
						'flex justify-between items-center mx-auto',
						`theme-${CHAIN_TYPE}`,
					)}
					size="sm"
					onClick={() => {
						login()
					}}
				>
					Login to chat
				</Button>
			)}
		</form>
	)
}
