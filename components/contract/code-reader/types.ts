import { UseFormReturn } from 'react-hook-form'

import { Message } from 'ai/react/dist'

import { ICodeReaderFormKeys } from '@/types/contract'

export interface ICodeReaderContext {
	methods: UseFormReturn<ICodeReaderFormKeys, any, undefined>
	questions: IQuestionItem[]
	sendPrompts: (prompts: string) => void
	messages: Message[]
	isLoading: boolean
}

export interface IQuestionItem {
	id: string
	question: string
}

export type IAIModels = 'gpt-4' | 'gpt-3.5-turbo'
