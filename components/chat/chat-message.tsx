// Inspired by Chatbot-UI and modified to fit the needs of this project
// @see https://github.com/mckaywrigley/chatbot-ui/blob/main/components/Chat/ChatMessage.tsx
import { Message } from 'ai'
import { Smile, Sticker } from 'lucide-react'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

import { MemoizedReactMarkdown } from '@/components/chat/markdown'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion'
import { CodeBlock } from '@/components/ui/codeblock'
import { cn, parseQAbotMessages } from '@/lib/utils'

import { ChatMessageActions } from './chat-message-actions'

export interface ChatMessageProps {
	message: Message
	isLoading?: boolean
}

export function ChatMessage({
	message,
	isLoading,
	...props
}: ChatMessageProps) {
	const qabotParsedMessages =
		message.role === 'assistant' && parseQAbotMessages(message.content)
	const functionMsgs =
		qabotParsedMessages &&
		qabotParsedMessages.filter(
			(qabotParsedMessage) => qabotParsedMessage.type === 'function',
		)
	const finalAnswer =
		message.role === 'assistant'
			? qabotParsedMessages &&
			  qabotParsedMessages[qabotParsedMessages.length - 1]?.content
			: message.content
	return (
		<div
			className={cn('group relative mb-4 flex items-start md:-ml-12')}
			{...props}
		>
			<div
				className={cn(
					'flex gap-2 rounded-lg px-3 py-2 sm:px-0',
					message.role === 'user' ? 'ml-auto' : '',
				)}
			>
				<div className={cn('flex shrink-0 select-none p-2')}>
					{message.role === 'user' ? <Smile /> : <Sticker />}
				</div>
				<div
					className={cn(
						'flex gap-2 rounded-lg px-3 py-2 text-sm flex-col',
						message.role === 'user'
							? 'bg-primary text-primary-foreground'
							: 'bg-muted text-muted-foreground',
					)}
				>
					{functionMsgs && functionMsgs.length > 0 && (
						<Accordion type="single" collapsible>
							<AccordionItem value="item-1">
								<AccordionTrigger className="text-muted-foreground/70">
									Analyzing on-chain data
								</AccordionTrigger>
								<AccordionContent>
									{functionMsgs.map((qabotParsedMessage, index) => (
										<div key={index} className="flex gap-2">
											<p>{qabotParsedMessage.name}</p>
											<MemoizedReactMarkdown
												key={index}
												className="prose-invert break-words prose-p:leading-relaxed prose-pre:p-0 text-muted-foreground/70"
												remarkPlugins={[remarkGfm, remarkMath]}
												components={{
													p({ children }) {
														return <p className="mb-2 last:mb-0">{children}</p>
													},
													a({ node, children, ...props }) {
														return (
															<a
																className="underline"
																{...props}
																target="_blank"
															>
																{children}
															</a>
														)
													},
													code({
														node,
														inline,
														className,
														children,
														...props
													}) {
														if (children.length) {
															if (children[0] == '▍') {
																return (
																	<span className="mt-1 cursor-default animate-pulse">
																		▍
																	</span>
																)
															}

															children[0] = (children[0] as string).replace(
																'`▍`',
																'▍',
															)
														}

														const match = /language-(\w+)/.exec(className || '')

														if (inline) {
															return (
																<code className={className} {...props}>
																	{children}
																</code>
															)
														}

														return (
															<CodeBlock
																key={Math.random()}
																language={(match && match[1]) || ''}
																value={String(children).replace(/\n$/, '')}
																{...props}
															/>
														)
													},
												}}
											>
												{qabotParsedMessage.content}
											</MemoizedReactMarkdown>
										</div>
									))}
								</AccordionContent>
							</AccordionItem>
						</Accordion>
					)}

					<MemoizedReactMarkdown
						className="prose-invert break-words prose-p:leading-relaxed prose-pre:p-0"
						remarkPlugins={[remarkGfm, remarkMath]}
						components={{
							p({ children }) {
								return <p className="mb-2 last:mb-0">{children}</p>
							},
							a({ node, children, ...props }) {
								return (
									<a className="underline" {...props} target="_blank">
										{children}
									</a>
								)
							},
							code({ node, inline, className, children, ...props }) {
								if (children.length) {
									if (children[0] == '▍') {
										return (
											<span className="mt-1 cursor-default animate-pulse">
												▍
											</span>
										)
									}

									children[0] = (children[0] as string).replace('`▍`', '▍')
								}

								const match = /language-(\w+)/.exec(className || '')

								if (inline) {
									return (
										<code className={className} {...props}>
											{children}
										</code>
									)
								}

								return (
									<CodeBlock
										key={Math.random()}
										language={(match && match[1]) || ''}
										value={String(children).replace(/\n$/, '')}
										{...props}
									/>
								)
							},
						}}
					>
						{finalAnswer}
					</MemoizedReactMarkdown>
				</div>
				<ChatMessageActions message={message} />
			</div>
		</div>
	)
}
