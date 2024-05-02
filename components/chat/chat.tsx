import { type Message, useChat } from 'ai/react'
import { toast } from 'sonner'

import { ChatList } from '@/components/chat/chat-list'
import { ChatPanel } from '@/components/chat/chat-panel'
import { ChatScrollAnchor } from '@/components/chat/chat-scroll-anchor'
import { EmptyScreen } from '@/components/chat/empty-screen'
import { CHAIN_TYPE } from '@/constants'
import { cn } from '@/lib/utils'

const IS_PREVIEW = process.env.VERCEL_ENV === 'preview'
export interface ChatProps extends React.ComponentProps<'div'> {
	initialMessages?: Message[]
	id?: string
}

export function Chat({ id, initialMessages, className }: ChatProps) {
	const { messages, append, reload, stop, isLoading, input, setInput } =
		useChat({
			id: id,
			// api: '/api/retrieval_agents',
			// api: '/api/chat/retrieval',
			api: '/api/chat/qabot',
			// api: '/api/assistant',
			initialMessages,
			body: {
				id,
			},
			onResponse(response) {
				if (response.status === 401) {
					toast.error(response.statusText)
				}
			},
		})

	return (
		<div className="relative bg-background rounded-md">
			<div
				className={cn('pb-32 pt-4 md:pt-10', `theme-${CHAIN_TYPE}`, className)}
			>
				{messages.length ? (
					<>
						<ChatList messages={messages} isLoading={isLoading} />
						<ChatScrollAnchor trackVisibility={isLoading} />
					</>
				) : (
					<EmptyScreen setInput={setInput} />
				)}
			</div>
			<ChatPanel
				id={id}
				isLoading={isLoading}
				stop={stop}
				append={append}
				reload={reload}
				messages={messages}
				input={input}
				setInput={setInput}
			/>
		</div>
	)
}
