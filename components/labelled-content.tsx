import { ReactNode } from 'react'

export function LabelledContent({
	children,
	label,
	labelRight,
	width,
}: {
	children: ReactNode
	label: string | ReactNode
	labelRight?: ReactNode
	width?: string // Use Tailwind CSS width classes
}) {
	return (
		<div className={`flex flex-col ${width ? width : ''} gap-2 p-2`}>
			{' '}
			{/* Adjust gap using Tailwind spacing classes */}
			<div className="flex flex-row items-end gap-1 relative text-xs">
				{typeof label === 'string' ? (
					<p className="whitespace-nowrap text-muted-foreground uppercase">
						{label}
					</p>
				) : (
					label
				)}
				<div className="mb-2">{labelRight}</div>{' '}
				{/* Use Tailwind's negative margin utility */}
			</div>
			<div>{children}</div>
		</div>
	)
}
