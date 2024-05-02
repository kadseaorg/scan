import { useEffect, useState } from 'react'
import CopyToClipboard from 'react-copy-to-clipboard'
import { useForm } from 'react-hook-form'

import { Stack, TextField, Tooltip, Typography } from '@mui/material'
import { Loader2 } from 'lucide-react'
import { usePlausible } from 'next-plausible'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { toast } from 'sonner'

import { RHFTextField } from '@/components/common/hook-form'
import FieldHeader from '@/components/common/hook-form/FieldHeader'
import FormProvider from '@/components/common/hook-form/FormProvider'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { castCommands } from '@/constants/cast-commands'
import Container from '@/layout/container'
import { PlausibleEvents } from '@/types/events'
import { shortAddress } from '@/utils'
import { trpc } from '@/utils/trpc'

export default function Tool() {
	const plausible = usePlausible<PlausibleEvents>()
	const router = useRouter()
	const { name } = router.query
	const command = castCommands.find((command) => command.name === name)
	const [output, setOutput] = useState<string>('')
	const [hasError, setHasError] = useState<boolean>(false)

	const methods = useForm()
	const { handleSubmit, watch, setValue } = methods
	const values = watch()

	const { isLoading, mutate: execute } = trpc.cast.execute.useMutation({
		async onSuccess(data: any) {
			if (data.ok) {
				setHasError(false)
				setOutput(data.output)
			} else {
				if (data.error) {
					setHasError(true)
					setOutput(data.error)
				} else {
					setOutput(data)
				}
			}
		},
	})

	useEffect(() => {
		if (command?.options) {
			command.options.forEach((item) => {
				if (item.arg) {
					setValue(item.arg, item.defaultValue)
				}
			})
		}
	}, [command, setValue])

	if (!command) {
		return null
	}

	const onSubmit = async () => {
		try {
			const entries = Object.entries(values)
			// parse args and options(if has - or -- prefix), filter out empty values
			const args = entries
				.filter(([key]) => !key.startsWith('-'))
				.map(([, value]) => value)
				.filter((value) => value)
			const options = entries
				.filter(([key]) => key.startsWith('-'))
				.map(([key, value]) => `${key}${value ? `=${value}` : ''}`)
				.filter((value) => value)

			plausible('Dev Tools-Submit', { props: { Command: command.name } })
			execute({
				command: command.name,
				args: args as string[],
				options: options,
			})
		} catch (error: any) {
			setHasError(true)
			setOutput(error)
		}
	}

	return (
		<Container>
			<div className="flex flex-col gap-8 mx-auto my-8 justify-center items-center">
				<Link
					href="/devtools"
					className="font-bold text-center text-primary dark:text-foreground text-2xl"
				>
					Development Tools
				</Link>
				<div className="flex flex-col gap-7 mx-auto w-full max-w-3xl">
					<div className="flex flex-wrap gap-3">
						{castCommands.map((command) => (
							<Button
								key={command.name}
								variant={command.name === name ? 'default' : 'outline'}
								size="sm"
							>
								<Link href={`/devtools/${command.name}`}>{command.name}</Link>
							</Button>
						))}
					</div>
					<Card>
						<CardHeader>
							<CardTitle>{command.name}</CardTitle>
							<CardDescription>{command.description}</CardDescription>
						</CardHeader>
						<CardContent>
							<FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
								<Stack spacing={2}>
									{/* arguments */}
									{command.arguments?.map((argument) => (
										<Stack spacing={1} key={argument.name}>
											<FieldHeader title={argument.name} necessary />
											<RHFTextField
												size="small"
												name={argument.name}
												placeholder={argument.placeholder}
											/>
											<div className="flex gap-2 text-gray-400">
												{argument.samples && <span>examples:</span>}
												{argument.samples?.map((sample) => (
													<CopyToClipboard
														key={sample}
														text={sample}
														onCopy={() => toast.success('Copied!')}
													>
														<Tooltip title={sample} className="cursor-pointer">
															<Typography variant="body2">
																{sample.length > 8
																	? shortAddress(sample)
																	: sample}
															</Typography>
														</Tooltip>
													</CopyToClipboard>
												))}
											</div>
										</Stack>
									))}

									{/* options */}
									{command.options?.map((option) => (
										<Stack spacing={1} key={option.name}>
											<FieldHeader title={option.name} necessary />
											<RHFTextField
												size="small"
												name={option.arg || ''}
												defaultValue={option.defaultValue}
												placeholder={option.placeholder || option.defaultValue}
											/>
											<div className="flex gap-2 text-gray-400">
												{option.samples && <span>examples:</span>}
												{option.samples?.map((sample) => (
													<CopyToClipboard
														key={sample}
														text={sample}
														onCopy={() => toast.success('Copied!')}
													>
														<Tooltip title={sample} className="cursor-pointer">
															<Typography variant="body2">
																{' '}
																{shortAddress(sample)}
															</Typography>
														</Tooltip>
													</CopyToClipboard>
												))}
											</div>
										</Stack>
									))}
									<Button type="submit" className="w-fit">
										{isLoading && (
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										)}
										Submit
									</Button>
								</Stack>
							</FormProvider>
							{output && (
								<div className="mt-1 flex flex-col gap-2">
									<span className="font-bold">Result</span>
									<TextField
										className={hasError ? 'text-red' : ''}
										value={output}
										multiline
										rows={3}
										variant="outlined"
									/>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</Container>
	)
}
