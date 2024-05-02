import { type Message } from 'ai'
import { Loader2 } from 'lucide-react'

import { ChatMessage } from '@/components/chat/chat-message'

export interface ChatList {
	messages: Message[]
	isLoading?: boolean
}

export function ChatList({ messages, isLoading }: ChatList) {
	if (!messages.length) {
		return null
	}

	return (
		<div className="relative mx-auto px-4 sm:px-0">
			{messages.map((message, index) => (
				<ChatMessage key={index} message={message} isLoading={isLoading} />
			))}
			{isLoading && (
				<div className="flex gap-1 mr-auto items-center ml-7">
					<Loader2 className="h-4 w-4 animate-spin" />
				</div>
			)}
		</div>
	)
}
