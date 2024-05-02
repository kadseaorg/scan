import { type UseChatHelpers } from 'ai/react'
import { usePlausible } from 'next-plausible'

import { ButtonScrollToBottom } from '@/components/chat/button-scroll-to-bottom'
import { PromptForm } from '@/components/chat/prompt-form'
import { Button } from '@/components/ui/button'
import { IconRefresh, IconStop } from '@/components/ui/icons'
import { PlausibleEvents } from '@/types/events'

export interface ChatPanelProps
	extends Pick<
		UseChatHelpers,
		| 'append'
		| 'isLoading'
		| 'reload'
		| 'messages'
		| 'stop'
		| 'input'
		| 'setInput'
	> {
	id?: string
}

export function ChatPanel({
	id,
	isLoading,
	stop,
	append,
	reload,
	input,
	setInput,
	messages,
}: ChatPanelProps) {
	const plausible = usePlausible<PlausibleEvents>()

	return (
		<div className="absolute inset-x-0 bottom-0 gap-2">
			<ButtonScrollToBottom />
			<div className="w-full mx-auto sm:px-4">
				<div className="flex h-10 items-center justify-center m-2">
					{isLoading ? (
						<Button variant="outline" onClick={() => stop()}>
							<IconStop className="mr-2" />
							Stop generating
						</Button>
					) : (
						messages?.length > 0 && (
							<Button variant="outline" onClick={() => reload()}>
								<IconRefresh className="mr-2" />
								Regenerate response
							</Button>
						)
					)}
				</div>
				<PromptForm
					onSubmit={async (value) => {
						await append({
							id,
							content: value,
							role: 'user',
						})
						plausible('AI-Ask Question', { props: { Question: value } })
					}}
					input={input}
					setInput={setInput}
					isLoading={isLoading}
				/>
			</div>
		</div>
	)
}
