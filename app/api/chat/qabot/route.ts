import { PRIVY_TOKEN } from '@/constants'
import { privy } from '@/server/context'
import { StreamingTextResponse } from 'ai'
import { RemoteRunnable } from 'langchain/runnables/remote'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
	try {
		const cookieStore = cookies()
		let token: string | undefined
		if (cookieStore.get(PRIVY_TOKEN)) {
			token = cookieStore.get(PRIVY_TOKEN)?.value
		}
		if (!token) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
		try {
			await privy.verifyAuthToken(token)
		} catch (error) {
			console.log(`Token verification failed with error ${error}.`)
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const body = await req.json()
		const id = body.id ?? '1'
		const messages = body.messages ?? []
		const currentMessageContent = messages[messages?.length - 1].content
		const chain = new RemoteRunnable({
			url: process.env.QABOT_API_URL ?? 'http://localhost:3000',
			options: { timeout: 10000000 },
		})

		const stream = await chain.stream(
			{ input: currentMessageContent },
			{ configurable: { session_id: id } },
		)

		let first_entry_skipped = false
		const transformStream = new TransformStream({
			transform(chunk, controller) {
				// console.log('chunk', chunk)
				if (!first_entry_skipped) {
					first_entry_skipped = true
				} else {
					controller.enqueue(JSON.stringify(chunk.messages[0]))
				}
			},
		})

		return new StreamingTextResponse(stream.pipeThrough(transformStream))
	} catch (e: any) {
		return NextResponse.json({ error: e.message }, { status: 500 })
	}
}
