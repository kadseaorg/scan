import * as React from 'react'

import { IconButton } from '@mui/material'
import { CheckIcon, CopyIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

interface CopyButtonProps extends React.HTMLAttributes<HTMLButtonElement> {
	value?: string
}

export async function copyToClipboardWithMeta(value: string) {
	// Navigator clipboard api needs a secure context (https)
	if (navigator.clipboard && window.isSecureContext) {
		await navigator.clipboard.writeText(value)
	} else {
		// Use the 'out of viewport hidden text area' trick
		const textArea = document.createElement('textarea')
		textArea.value = value

		// Move textarea out of the viewport so it's not visible
		textArea.style.position = 'absolute'
		textArea.style.left = '-999999px'

		document.body.prepend(textArea)
		textArea.select()

		try {
			document.execCommand('copy')
		} catch (error) {
			console.error(error)
		} finally {
			textArea.remove()
		}
	}
}

export function CopyButton({
	value = '',
	className,
	children,
}: CopyButtonProps) {
	const [hasCopied, setHasCopied] = React.useState(false)

	React.useEffect(() => {
		setTimeout(() => {
			setHasCopied(false)
		}, 2000)
	}, [hasCopied])

	return (
		<div className="flex items-center justify-center">
			{children}
			<IconButton
				size={'small'}
				className={cn(
					'relative z-10 text-zinc-50 hover:bg-zinc-700 hover:text-zinc-50',
					className,
				)}
				onClick={() => {
					copyToClipboardWithMeta(value)
					setHasCopied(true)
				}}
			>
				<span className="sr-only">Copy</span>
				{hasCopied ? (
					<CheckIcon className="h-3 w-3" />
				) : (
					<CopyIcon className="h-3 w-3" />
				)}
			</IconButton>
		</div>
	)
}
