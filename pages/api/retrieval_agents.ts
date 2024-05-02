import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { Message as VercelChatMessage, streamToResponse } from 'ai'
import { initializeAgentExecutorWithOptions } from 'langchain/agents'
import {
	OpenAIAgentTokenBufferMemory,
	createRetrieverTool,
} from 'langchain/agents/toolkits'
import { ChatOpenAI } from 'langchain/chat_models/openai'
import { OpenAIEmbeddings } from 'langchain/embeddings/openai'
import { ChatMessageHistory } from 'langchain/memory'
import { AIMessage, ChatMessage, HumanMessage } from 'langchain/schema'
import { SupabaseVectorStore } from 'langchain/vectorstores/supabase'
import { NextApiRequest, NextApiResponse } from 'next'
import { cookies } from 'next/headers'

import { PRIVY_TOKEN } from '@/constants'
import { privy } from '@/server/context'

const convertVercelMessageToLangChainMessage = (message: VercelChatMessage) => {
	if (message.role === 'user') {
		return new HumanMessage(message.content)
	} else if (message.role === 'assistant') {
		return new AIMessage(message.content)
	} else {
		return new ChatMessage(message.content, message.role)
	}
}

const TEMPLATE = `You are a knowledge base QA robot named l2scan ai,  use the available tools to look up relevant information.
If you don't know how to answer a question, just say "Sorry, I don't know."`

/**
 * This handler initializes and calls a retrieval agent. It requires an OpenAI
 * Functions model. See the docs for more information:
 *
 * https://js.langchain.com/docs/use_cases/question_answering/conversational_retrieval_agents
 */
export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	// const supabase = createPagesServerClient({ req, res })
	// const {
	//   data: { session }
	// } = await supabase.auth.getSession()
	// const userId = session?.user?.id

	// if (!userId) {
	//   return res.status(401).json({ error: 'Unauthorized' })
	// }
	const cookieStore = cookies()
	let token
	if (cookieStore.get(PRIVY_TOKEN)) {
		token = cookieStore.get(PRIVY_TOKEN)?.value
	}
	if (!token) {
		return res.status(401).json({ error: 'Unauthorized' })
	}
	try {
		const verifiedClaims = await privy.verifyAuthToken(token)
	} catch (error) {
		console.log(`Token verification failed with error ${error}.`)
		return res.status(401).json({ error: 'Unauthorized' })
	}

	try {
		// const body = await req.json()
		const { messages: bodyMsgs, show_intermediate_steps } = JSON.parse(req.body)

		/**
		 * We represent intermediate steps as system messages for display purposes,
		 * but don't want them in the chat history.
		 */
		const messages = (bodyMsgs ?? []).filter(
			(message: VercelChatMessage) =>
				message.role === 'user' || message.role === 'assistant',
		)
		const returnIntermediateSteps = show_intermediate_steps
		const previousMessages = messages.slice(0, -1)
		const currentMessageContent = messages[messages.length - 1].content

		const model = new ChatOpenAI({
			modelName: 'gpt-3.5-turbo-16k',
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

		const chatHistory = new ChatMessageHistory(
			previousMessages.map(convertVercelMessageToLangChainMessage),
		)

		/**
		 * This is a special type of memory specifically for conversational
		 * retrieval agents.
		 * It tracks intermediate steps as well as chat history up to a
		 * certain number of tokens.
		 *
		 * The default OpenAI Functions agent prompt has a placeholder named
		 * "chat_history" where history messages get injected - this is why
		 * we set "memoryKey" to "chat_history". This will be made clearer
		 * in a future release.
		 */
		const memory = new OpenAIAgentTokenBufferMemory({
			llm: model,
			memoryKey: 'chat_history',
			outputKey: 'output',
			chatHistory,
		})

		const retriever = vectorstore.asRetriever()

		/**
		 * Wrap the retriever in a tool to present it to the agent in a
		 * usable form.
		 */
		const tool = createRetrieverTool(retriever, {
			name: 'search_latest_knowledge',
			description: 'Searches and returns up-to-date general information.',
		})

		const executor = await initializeAgentExecutorWithOptions([tool], model, {
			agentType: 'openai-functions',
			memory,
			returnIntermediateSteps: true,
			verbose: true,
			agentArgs: {
				prefix: TEMPLATE,
			},
		})

		const result = await executor.call({
			input: currentMessageContent,
		})

		if (returnIntermediateSteps) {
			return res.status(200).json({
				output: result.output,
				intermediate_steps: result.intermediateSteps,
			})
		} else {
			// Agent executors don't support streaming responses (yet!), so stream back the complete response one
			// character at a time to simluate it.
			const textEncoder = new TextEncoder()
			const fakeStream = new ReadableStream({
				async start(controller) {
					for (const character of result.output) {
						controller.enqueue(textEncoder.encode(character))
						await new Promise((resolve) => setTimeout(resolve, 20))
					}
					controller.close()
				},
			})

			return streamToResponse(fakeStream, res)
		}
	} catch (e: any) {
		return res.status(500).json({ error: e.message })
	}
}
