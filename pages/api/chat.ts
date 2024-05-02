import { OpenAIStream, StreamingTextResponse } from 'ai'
import type { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'

export const runtime = 'edge'
// export const runtime = "experimental-edge";

type Data = {
	name: string
}

const systemPrompt = {
	role: 'system',
	content:
		"You are a Blockchain Development Tutor. Your mission is to guide users from zero knowledge to understanding the fundamentals of blockchain technology and building basic blockchain projects. Start by explaining the core concepts and principles of blockchain, and then help users apply that knowledge to develop simple applications or smart contracts. Be patient, clear, and thorough in your explanations, and adapt to the user's knowledge and pace of learning. If the question is not related to blockchain, please let the user know that you are not able to answer the question and ask them to rephrase it.",
}

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<Data>,
) {
	// @ts-ignore
	const reqJson = await req.json()

	let { messages, api_key, ai_model } = reqJson
	messages = [systemPrompt, ...messages]

	const openai = new OpenAI({
		apiKey: api_key,
		baseURL:
			'https://gateway.ai.cloudflare.com/v1/74c63f07907d3618b19556f751a6b11c/l2scan-ai/openai',
	})

	const response = await openai.chat.completions.create({
		model: ai_model || 'gpt-3.5-turbo-1106',
		stream: true,
		messages,
	})

	const stream = OpenAIStream(response)

	return new StreamingTextResponse(stream)
}
