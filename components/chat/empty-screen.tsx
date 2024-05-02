import { UseChatHelpers } from 'ai/react'
import { ArrowRight } from 'lucide-react'

import { ExternalLink } from '@/components/chat/external-link'
import { Button } from '@/components/ui/button'
import { SOCIAL_LINKS } from '@/layout/menu/config'
import { l2scan } from '@/constants/text'

const exampleMessages = [
	{
		heading: 'What is Uniswap?',
		message: `What is Uniswap?`,
	},
	{
		heading: 'How can I learn Solidity?',
		message: 'How can I learn Solidity?',
	},
	{
		heading: 'How can I fetch the address balance using Ethereum JSON-RPC?',
		message: `How can I fetch the address balance using Ethereum JSON-RPC?`,
	},
]

export function EmptyScreen({ setInput }: Pick<UseChatHelpers, 'setInput'>) {
	return (
		<div className="p-8">
			<div className="rounded-lg p-8">
				<h1 className="mb-2 text-lg font-semibold">
					{`Welcome to ${l2scan} AI Chatbot!`}
				</h1>
				<p className="mb-2 leading-normal text-muted-foreground">
					This is an AI chatbot app powered by{' '}
					<ExternalLink href="https://openai.com/">OpenAI</ExternalLink> 
					{/* and{' '}
					<ExternalLink href={SOCIAL_LINKS.TWITTER}>L2Scan</ExternalLink> */}
				</p>
				<p className="leading-normal">
					You can start a conversation here or try the following examples:
				</p>
				<div className="mt-4 flex flex-col items-start space-y-2">
					{exampleMessages.map((message, index) => (
						<Button
							key={index}
							variant="link"
							className="h-auto p-0 text-base"
							onClick={() => setInput(message.message)}
						>
							<ArrowRight className="mr-2" />
							{message.heading}
						</Button>
					))}
				</div>
			</div>
		</div>
	)
}
