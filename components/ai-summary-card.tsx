import { useEffect, useState } from 'react'

import { useChat } from 'ai/react'
import { Sparkles } from 'lucide-react'
import { nanoid } from 'nanoid'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { toast } from 'sonner'
import { formatEther, formatUnits } from 'viem'

import { MemoizedReactMarkdown } from '@/components/chat/markdown'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { CHAIN_TOKEN_NAME, CURRENT_CHAIN_ITEM, IsKadsea } from '@/constants'
import { prompts } from '@/constants/prompts'
import { cn } from '@/lib/utils'
import BigNumber from 'bignumber.js'
import SuperJSON from 'superjson'

export type SummaryType = 'transaction' | 'address' | 'block' | 'token'

const createUserMessage = (content: any, type: SummaryType) => {
	switch (type) {
		case 'transaction':
			return {
				hash: content?.hash,
				block_hash: content?.block_hash,
				block_number: content?.block_number,
				from_address: content?.from_address,
				to_address: content?.to_address,
				to_contract: content?.to_contract,
				to_contract_verified: content?.to_contract_verified,
				to_contract_name: content?.to_contract_name,
				value:
					content?.value &&
					`${formatEther(BigInt(content?.value))} ${CHAIN_TOKEN_NAME}`,
				fee:
					content?.fee &&
					`${formatEther(BigInt(content?.fee))} ${CHAIN_TOKEN_NAME}`,
				gas_used:
					content?.gas_used &&
					`${formatEther(BigInt(content?.gas_used))} ${CHAIN_TOKEN_NAME}`,
				gas_price:
					content?.gas_price &&
					`${formatEther(BigInt(content?.gas_price))} ${CHAIN_TOKEN_NAME}`,
				gas_limit: content?.gas_limit,
				nonce: content?.nonce,
				l2_status: content?.status === 1 ? 'success' : 'failed',
				revert_reason: content?.revert_reason,
				transaction_index: content?.transaction_index,
				date: new Date(content?.timestamp * 1000).toLocaleString(),
				l1_batch_number: content?.l1_batch_number,
				l1_status: content?.l1_status,
				l1_commit_tx_hash: content?.l1_commit_tx_hash,
				l1_prove_tx_hash: content?.l1_prove_tx_hash,
				function_name: content?.function_name,
				token_transfers: content?.token_transfers.map((transfer: any) => ({
					log_index: transfer?.log_index,
					token_address: transfer?.token_address,
					from_address: transfer?.from_address,
					to_address: transfer?.to_address,
					token_type: transfer?.token_type,
					amount:
						transfer?.token_type === 'erc20'
							? formatUnits(
									BigInt(BigNumber(transfer.value.toString()).toFixed()),
									transfer?.decimals,
							  )
							: Intl.NumberFormat().format(Number(transfer?.amount)),
					token_id: transfer?.token_id,
					erc1155_amounts: transfer?.amounts,
					erc1155_token_ids: transfer?.token_ids,
					name: transfer?.name,
					symbol: transfer?.symbol,
					address: transfer?.address,
				})),
			}
		case 'address':
			return {
				address_type: content?.address_type?.result,
				balance:
					content?.addressSummary?.balance &&
					`${formatEther(
						BigInt(content?.addressSummary?.balance),
					)} ${CHAIN_TOKEN_NAME}`,
				gas_used: content?.addressSummary?.gas_used,
				token_transfer_count: content?.addressSummary?.token_transfer_count,
				transaction_count: content?.txsCount,
				owned_erc20_tokens_count: content?.erc20TokenBalance?.length,
				owned_erc20_tokens_name: content?.erc20TokenBalance?.map(
					(token: any) => token?.name,
				),
				owned_erc721_tokens_count: content?.erc721TokenBalance?.length,
				owned_erc721_tokens_name: content?.erc721TokenBalance?.map(
					(token: any) => token?.name,
				),
				owned_erc1155_tokens_count: content?.erc1155TokenBalance?.length,
				owned_erc1155_tokens_name: content?.erc1155TokenBalance?.map(
					(token: any) => token?.name,
				),
			}
		case 'block':
			return {
				block_number: content?.number,
				date: new Date(content?.timestamp * 1000).toLocaleString(),
				transaction_count: content?.transaction_count,
				internal_transaction_count: content?.internal_transaction_count,
				size: content?.size,
				gas_used: content?.gas_used,
				gas_limit: content?.gas_limit,
				difficulty: content?.difficulty,
				total_difficulty: content?.total_difficulty,
				parent_hash: content?.parent_hash,
				l1_batch_number: content?.l1_batch_number,
				l1_batch_date: new Date(
					content?.l1_batch_timestamp * 1000,
				).toLocaleString(),
				l1_status: content?.l1_status,
				l1_commit_tx_hash: content?.l1_commit_tx_hash,
				l1_prove_tx_hash: content?.l1_prove_tx_hash,
			}
		case 'token':
			return {
				name: content?.name,
				symbol: content?.symbol,
				decimals: content?.decimals,
				total_supply:
					content?.total_supply &&
					`${formatUnits(
						BigInt(BigNumber(content?.total_supply.toString()).toFixed()),
						content?.decimals,
					)} ${content?.symbol}`,
				token_type: content?.token_type,
				holders: content?.holders,
				transfer_count: content?.transfer_count,
			}

		default:
			return {}
	}
}

const getInitSystemMessage = (type: SummaryType) => {
	switch (type) {
		case 'block':
			return `Explain the block in a few sentences. let it be short and clear.
            Must follow the rules below:
            - use coherent sentence structure
            - use emojis
            - hightlight(bold) numbers
            - address link: [hash](${CURRENT_CHAIN_ITEM.blockExplorerUrl}/address/{address})
            - don't use links for l1 info
            `
		case 'transaction':
			return `Explain the transaction in a few sentences. let it be short and clear.
            Must follow the rules below:
            - use coherent sentence structure
            - use emojis
            - hightlight(bold) numbers
            - include both l1 status and l2 status
            - address link: ${CURRENT_CHAIN_ITEM.blockExplorerUrl}/address/{address}
            - when showing an address, always display the literal address.
            - never show transaction hash
            `
		case 'address':
			return `Explain the address info in a few sentences. let it be short and clear.
            Must follow the rules below:
            - use coherent sentence structure
            - use emojis
            - hightlight(bold) numbers
            `
		case 'token':
			return `Explain the token in a few sentences. let it be short and clear.
            Must follow the rules below:
            - use coherent sentence structure
            - use emojis
            - hightlight(bold) numbers
            `
		default:
			return ''
	}
}

export interface SummaryContentProps {
	type: SummaryType
	content: any
}

let previousContent: any = null

// AISumamry Wrapper Component - disable/hide AISummaryCard for some chains
const AISummaryCard: React.FC<SummaryContentProps> = ({ type, content }) => {
	if (!IsKadsea) {
		return (
			<div className="py-3">
				<AISummary type={type} content={content} />
			</div>
		)
	}
	return null
}

const AISummary: React.FC<SummaryContentProps> = ({ type, content }) => {
	const predefinedPrompts = prompts[type]
	const [currentPrompt, setCurrentPrompt] = useState<string>(
		predefinedPrompts[0],
	)
	const id = nanoid()
	const formatedContent = createUserMessage(content, type)
	const { messages, setMessages, reload, stop } = useChat({
		onResponse(response) {
			if (response.status !== 200) {
				toast.error(response.statusText)
			}
		},
	})
	const summaryContent = [...messages]
		.reverse()
		.find((message) => message.role === 'assistant')?.content
	useEffect(() => {
		// Check if content is null, undefined, or has not changed
		if (!content || content === previousContent) {
			return
		}
		setMessages([
			{
				id: id,
				role: 'system',
				content: getInitSystemMessage(type),
			},
			{
				id: id,
				role: 'system',
				content: SuperJSON.stringify(formatedContent),
			},
			{
				id: id,
				role: 'user',
				content: predefinedPrompts[0],
			},
		])
		reload()

		previousContent = content
	}, [content])

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-sm">
					<Sparkles size={18} />
					<div>AI Summary</div>
					<Badge variant="outline" className="border-primary/70">
						beta
					</Badge>
				</CardTitle>
				<CardDescription className="flex flex-auto gap-3 p-3 sm:flex-col sm:px-0">
					{predefinedPrompts.map((prompt, index) => (
						<form
							key={index}
							onSubmit={(e) => {
								e.preventDefault()
								setCurrentPrompt(prompt)
								setMessages([
									{
										id: id,
										role: 'system',
										content: getInitSystemMessage(type),
									},
									{
										id: id,
										role: 'system',
										content: JSON.stringify(formatedContent),
									},
									{ id: id, role: 'user', content: prompt },
								])
								stop()
								reload()
							}}
						>
							<Button
								type="submit"
								className={cn(
									'rounded-full whitespace-nowrap sm:whitespace-normal sm:text-xs sm:w-full',
								)}
								variant={prompt === currentPrompt ? 'default' : 'secondary'}
								size="sm"
							>
								{prompt}
							</Button>
						</form>
					))}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<MemoizedReactMarkdown
					className="break-words leading-relaxed mx-3"
					remarkPlugins={[remarkGfm, remarkMath]}
					components={{
						a({ node, children, ...props }) {
							return (
								<a
									className="text-primary"
									{...props}
									target="_blank"
									rel="noopener noreferrer"
								>
									{children}
								</a>
							)
						},
					}}
				>
					{summaryContent}
				</MemoizedReactMarkdown>
			</CardContent>
		</Card>
	)
}

export default AISummaryCard
