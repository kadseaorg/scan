import type { SummaryType } from '@/components/ai-summary-card'

type PromptsDefinition = {
	[key in SummaryType]: string[]
}

export const prompts: PromptsDefinition = {
	transaction: [
		'Summarize the information for this transaction.',
		'How much does this transaction cost?',
		'Show me the related addresses of this transaction.',
	],
	address: [
		'Summarize the information for this account',
		'How many tokens does this account have?',
		'How many transactions does this account have?',
	],
	block: [
		'Summarize the information for this block',
		'How many transactions does this block have?',
		'What is the date of this block?',
	],
	token: [
		'Summarize the information for this token',
		'How many transfers does this token have?',
		// 'Who are the top 5 holders of this token?'
	],
}
