import { PropsWithChildren, ReactNode } from 'react'

import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip'

const SimpleTooltip: React.FC<
	PropsWithChildren<{ maxWidth?: string; content?: ReactNode }>
> = ({ maxWidth = '600px', content, children }) => {
	return (
		<Tooltip>
			<TooltipTrigger asChild>{children}</TooltipTrigger>
			<TooltipContent
				style={{ maxWidth }}
				className="break-words bg-zinc-900 text-zinc-50 px-2"
			>
				<div className="text-center">{content}</div>
			</TooltipContent>
		</Tooltip>
	)
}

export default SimpleTooltip
