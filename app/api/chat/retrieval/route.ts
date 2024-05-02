import { createClient } from '@supabase/supabase-js'
import { StreamingTextResponse } from 'ai'
import { ChatOpenAI } from 'langchain/chat_models/openai'
import { Document } from 'langchain/document'
import { OpenAIEmbeddings } from 'langchain/embeddings/openai'
import { PromptTemplate } from 'langchain/prompts'
import {
	BytesOutputParser,
	StringOutputParser,
} from 'langchain/schema/output_parser'
import { RunnableSequence } from 'langchain/schema/runnable'
import { SupabaseVectorStore } from 'langchain/vectorstores/supabase'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import { PRIVY_TOKEN } from '@/constants'
import { privy } from '@/server/context'

const combineDocumentsFn = (docs: Document[], separator = '\n\n') => {
	const serializedDocs = docs.map((doc) => doc.pageContent)
	return serializedDocs.join(separator)
}

const formatVercelMessages = (chatHistory: VercelChatMessage[]) => {
	const formattedDialogueTurns = chatHistory.map((message) => {
		if (message.role === 'user') {
			return `Human: ${message.content}`
		} else if (message.role === 'assistant') {
			return `Assistant: ${message.content}`
		} else {
			return `${message.role}: ${message.content}`
		}
	})
	return formattedDialogueTurns.join('\n')
}

const CONDENSE_QUESTION_TEMPLATE = `Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question, in its original language.

<chat_history>
  {chat_history}
</chat_history>

Follow Up Input: {question}
Standalone question:`
const condenseQuestionPrompt = PromptTemplate.fromTemplate(
	CONDENSE_QUESTION_TEMPLATE,
)

const ANSWER_TEMPLATE = `You are a Blockchain Development Tutor. Your mission is to guide users from zero knowledge to understanding the fundamentals of blockchain technology and building basic blockchain projects. Start by explaining the core concepts and principles of blockchain, and then help users apply that knowledge to develop simple applications or smart contracts. Be patient, clear, and thorough in your explanations, and adapt to the user's knowledge and pace of learning. If the question is not related to blockchain, please let the user know that you are not able to answer the question and ask them to rephrase it.

Answer the question based only on the following context and chat history:
<context>
  {context}
</context>

<chat_history>
  {chat_history}
</chat_history>

Question: {question}
`
const answerPrompt = PromptTemplate.fromTemplate(ANSWER_TEMPLATE)

/**
 * This handler initializes and calls a retrieval chain. It composes the chain using
 * LangChain Expression Language. See the docs for more information:
 *
 * https://js.langchain.com/docs/guides/expression_language/cookbook#conversational-retrieval-chain
 */
export async function POST(req: NextRequest) {
	try {
		const cookieStore = cookies()
		let token
		if (cookieStore.get(PRIVY_TOKEN)) {
			token = cookieStore.get(PRIVY_TOKEN)?.value
		}
		if (!token) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
		try {
			const verifiedClaims = await privy.verifyAuthToken(token)
		} catch (error) {
			console.log(`Token verification failed with error ${error}.`)
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
		// const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
		// const {
		//   data: { session }
		// } = await supabase.auth.getSession()
		// const userId = session?.user?.id

		// if (!userId) {
		//   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		// }

		const body = await req.json()
		const messages = body.messages ?? []
		const previousMessages = messages.slice(0, -1)
		const currentMessageContent = messages[messages?.length - 1].content
		const model = new ChatOpenAI({
			modelName: 'gpt-3.5-turbo-1106',
			temperature: 0.2,
			configuration: {
				baseURL:
					'https://gateway.ai.cloudflare.com/v1/74c63f07907d3618b19556f751a6b11c/l2scan-ai/openai',
			},
		})

		const client = createClient(
			process.env.SUPABASE_URL!,
			process.env.SUPABASE_SERVICE_KEY!,
		)
		const vectorstore = new SupabaseVectorStore(new OpenAIEmbeddings(), {
			client,
			tableName: 'documents',
			queryName: 'match_documents',
		})

		/**
		 * We use LangChain Expression Language to compose two chains.
		 * To learn more, see the guide here:
		 *
		 * https://js.langchain.com/docs/guides/expression_language/cookbook
		 */
		const standaloneQuestionChain = RunnableSequence.from([
			condenseQuestionPrompt,
			model,
			new StringOutputParser(),
		])

		let resolveWithDocuments: (value: Document[]) => void
		const documentPromise = new Promise<Document[]>((resolve) => {
			resolveWithDocuments = resolve
		})

		const retriever = vectorstore.asRetriever({
			callbacks: [
				{
					handleRetrieverEnd(documents) {
						resolveWithDocuments(documents)
					},
				},
			],
		})

		const retrievalChain = retriever.pipe(combineDocumentsFn)

		const answerChain = RunnableSequence.from([
			{
				context: RunnableSequence.from([
					(input) => input.question,
					retrievalChain,
				]),
				chat_history: (input) => input.chat_history,
				question: (input) => input.question,
			},
			answerPrompt,
			model,
		])

		const conversationalRetrievalQAChain = RunnableSequence.from([
			{
				question: standaloneQuestionChain,
				chat_history: (input) => input.chat_history,
			},
			answerChain,
			new BytesOutputParser(),
		])

		const stream = await conversationalRetrievalQAChain.stream({
			question: currentMessageContent,
			chat_history: formatVercelMessages(previousMessages),
		})

		const documents = await documentPromise
		const serializedSources = Buffer.from(
			JSON.stringify(
				documents.map((doc) => {
					return {
						pageContent: doc.pageContent.slice(0, 50) + '...',
						metadata: doc.metadata,
					}
				}),
			),
		).toString('base64')

		console.log('Returning response')

		return new StreamingTextResponse(stream, {
			headers: {
				'x-message-index': (previousMessages?.length + 1).toString(),
				'x-sources': serializedSources,
			},
		})
	} catch (e: any) {
		return NextResponse.json({ error: e.message }, { status: 500 })
	}
}
