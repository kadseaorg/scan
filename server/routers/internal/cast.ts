import { spawn } from 'child_process'
import { z } from 'zod'

import { internalProcedure, router } from '../../trpc'

export const castRouter = router({
	execute: internalProcedure
		.input(
			z.object({
				command: z.string(),
				args: z.array(z.string()).optional(),
				options: z.array(z.string()).optional(),
			}),
		)
		.mutation(async ({ input }) => {
			// splite the arg if one of the args is a string with spaces
			const args = input.args
				? input.args.reduce((acc, arg): any => {
						if (arg.includes(' ')) {
							return [...acc, ...arg.split(' ')]
						} else {
							return [...acc, arg]
						}
				  }, [])
				: []
			const options = input.options || []

			const process = spawn('cast', [input.command, ...args, ...options])
			let output = ''

			process.stdout.on('data', (data) => {
				output += data.toString()
			})

			process.stderr.on('data', (data) => {
				output += data.toString()
			})

			return new Promise((resolve) => {
				process.on('close', (code) => {
					console.log('output', output)
					const out = output
						.trim() // remove trailing newlines
						.replace(/\u001b\[[0-9;]*[mGK]/g, '') // remove ansi colors
						.split('\n\n') // split into paragraphs

					const errorMessage = out[0] || 'Unknown error'
					const usageMessage = out.slice(1).join('\n').trim() || null
					const result = {
						output: out,
						error: errorMessage,
						usage: usageMessage,
						ok: code === 0,
					}
					resolve(result)
				})
			})
		}),
})
