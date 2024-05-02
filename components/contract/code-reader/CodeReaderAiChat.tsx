import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'

import {
	Box,
	Button,
	Card,
	Divider,
	IconButton,
	Stack,
	TextField,
	Typography,
} from '@mui/material'
import { SendIcon } from 'lucide-react'

import { useCodeReaderContext } from './CodeReaderProvider'
import ButtonMenuPopoverPrompts from './button-menu-popover/ButtonMenuPopoverPrompts'

const CodeReaderAiChat = () => {
	const { messages, questions, sendPrompts, methods, isLoading } =
		useCodeReaderContext()

	const [inputPrompts, setInputPrompts] = useState('')
	const containerRef = useRef<any>(null)

	useEffect(() => {
		if (containerRef.current) {
			const container = containerRef.current
			container.scrollTop = container.scrollHeight
		}
	}, [messages])

	return (
		<Stack
			className="relative"
			sx={{
				height: '78vh',
			}}
		>
			<Stack
				position={'absolute'}
				zIndex={1}
				ref={containerRef}
				sx={{
					width: '100%',
					height: `calc(100% - 64px)`,
					overflowY: 'scroll',
				}}
				spacing={2}
			>
				{messages.map((m) => {
					const find = questions.find((item) => item.id === m.id)
					const { role, content, id } = m
					return (
						<Stack key={id}>
							{role === 'user' && (
								<Stack flexDirection={'row'} gap={2} alignItems={'center'}>
									<Stack
										color={'primary'}
										alignItems={'center'}
										justifyContent={'center'}
										sx={{
											height: 28,
											width: 28,
											bgcolor: 'primary.main',
											borderRadius: '4px',
										}}
									>
										<Typography
											variant="subtitle1"
											color={'primary.contrastText'}
										>
											Q
										</Typography>
									</Stack>
									<Typography variant="subtitle1">{find?.question}</Typography>
								</Stack>
							)}
							{role === 'assistant' && (
								<Stack flexDirection={'row'} gap={2} alignItems={'baseline'}>
									<Stack
										color={'primary'}
										alignItems={'center'}
										justifyContent={'center'}
										sx={{
											height: 28,
											width: 28,
											border: '1px solid',
											borderColor: 'primary.main',
											borderRadius: '4px',
										}}
									>
										<Typography variant="subtitle1" color={'primary.main'}>
											A
										</Typography>
									</Stack>
									<Stack sx={{ flex: 1 }}>
										<ReactMarkdown>{content}</ReactMarkdown>
									</Stack>
								</Stack>
							)}
						</Stack>
					)
				})}
			</Stack>
			<Card
				sx={{
					position: 'absolute',
					zIndex: 10,
					bottom: 0,
				}}
			>
				<Stack
					flexDirection={'row'}
					alignItems={'center'}
					gap={2}
					sx={{ height: 56 }}
				>
					<ButtonMenuPopoverPrompts />
					<Divider className="sm:hidden" orientation="vertical" />
					<TextField
						size="small"
						sx={{ flex: 1 }}
						value={inputPrompts}
						disabled={isLoading}
						onKeyDown={(e) => {
							if (e.key === 'Enter') {
								methods.handleSubmit(() => {
									sendPrompts(inputPrompts)
									setInputPrompts('')
								})(e)
							}
						}}
						onChange={(e) => setInputPrompts(e.target.value)}
					/>
					<IconButton
						disabled={isLoading}
						onClick={() => {
							methods.handleSubmit(() => sendPrompts(inputPrompts))
							setInputPrompts('')
						}}
					>
						<SendIcon size={20} />
					</IconButton>
				</Stack>
			</Card>
		</Stack>
	)
}

export default CodeReaderAiChat
