import { createContext, useContext, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { zodResolver } from '@hookform/resolvers/zod'
import { useChat } from 'ai/react'

import { codeReaderSchema } from '@/constants/form/contract'
import { ICodeReaderFormKeys } from '@/types/contract'
import { nanoid } from '@/utils/nanoid'

import { ICodeReaderContext, IQuestionItem } from './types'

export const CodeReaderContext = createContext<ICodeReaderContext | null>(null)

export const useCodeReaderContext = () => {
	const context = useContext(CodeReaderContext)
	if (!context)
		throw new Error(
			'useCodeReaderContext must be use inside CodeReaderProvider',
		)

	return context
}

type Props = { children: React.ReactNode }

const CodeReaderProvider = ({ children }: Props) => {
	const methods = useForm<ICodeReaderFormKeys>({
		resolver: zodResolver(codeReaderSchema),
		defaultValues: {
			api_key: '',
			contract_address: '',
			source_code: '',
			ai_model: 'gpt-3.5-turbo',
		},
	})
	const { watch, setValue } = methods
	const values = watch()
	const { source_code, api_key, ai_model } = values

	const { messages, append, isLoading } = useChat()

	const [questions, setQuestions] = useState<IQuestionItem[]>([])

	const sendPrompts = (prompts: string) => {
		const id = nanoid()
		const item = {
			id,
			question: prompts,
		}
		setQuestions([...questions, item])
		append(
			{
				id,
				content: (source_code ? source_code + '\n' : '') + item.question,
				role: 'user',
			},
			{
				options: {
					body: {
						api_key,
						ai_model,
					},
				},
			},
		)
	}

	return (
		<CodeReaderContext.Provider
			value={{ methods, questions, sendPrompts, messages, isLoading }}
		>
			{children}
		</CodeReaderContext.Provider>
	)
}
export default CodeReaderProvider
