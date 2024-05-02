import { ReactNode } from 'react'

import { Grid, Stack, Tooltip } from '@mui/material'
import { HelpCircle } from 'lucide-react'
import Image from 'next/image'

import { cn } from '@/lib/utils'
import { getImgSrc } from '@/utils'
import classNames from 'classnames'

type OverviewCardsProps = {
	className?: string
	data: {
		img: string
		content: {
			label: string
			value: string | ReactNode
			tooltip?: string
		}[]
		xs?: number | undefined
		sm?: number | undefined
		colSpan?: number
	}[]
}

export const OverviewCards: React.FC<OverviewCardsProps> = ({
	className = '',
	data,
}) => (
	<Grid
		container
		spacing={2}
		className={classNames('w-full lmd:!ml-[0px]', className)}
	>
		{data?.map(({ img, content, xs = 12, sm = 6, colSpan = 3 }) => (
			<Grid
				item
				key={img}
				xs={xs ?? colSpan}
				sm={sm ?? colSpan}
				md={colSpan}
				className={classNames('w-full lmd:!p-[0] ')}
			>
				<div className="flex gap-2 py-2 px-6 items-center border rounded lmd:px-[10px]">
					<div
						className={cn(
							'flex items-center gap-2',
							(content?.length ?? 0) > 1 && 'sm:flex-wrap',
						)}
					>
						{content?.map(({ label, value, tooltip }, index) => (
							<Stack key={label}>
								<Stack
									flexDirection={'row'}
									alignItems={'center'}
									sx={{ height: 32 }}
									gap={1}
								>
									<div className="text-muted-foreground text-sm whitespace-nowrap">
										{label}
									</div>
									{!!tooltip && (
										<Tooltip title={tooltip}>
											<HelpCircle
												className="cursor-pointer text-muted-foreground"
												size={14}
											/>
										</Tooltip>
									)}
								</Stack>
								<div className="text-foreground">{value}</div>
							</Stack>
						))}
					</div>
					<Image
						className="ml-auto"
						width={36}
						src={getImgSrc(`overview/${img}`)}
						alt=""
					/>
				</div>
			</Grid>
		))}
	</Grid>
)

export type OverviewCellContentType = {
	label: string
	tooltip?: string | undefined
	value: string | ReactNode | undefined
	xs?: number | undefined
	sm?: number | undefined
	colSpan?: number | undefined
}[]

type OverviewCellContentProps = {
	className?: string
	data: OverviewCellContentType
}

export const OverviewCellContent: React.FC<OverviewCellContentProps> = ({
	className = '',
	data,
}) => (
	<Grid container spacing={4} className={className}>
		{data?.map(({ label, tooltip, value, xs = 12, sm = 12, colSpan = 6 }) => (
			<Grid item key={label} xs={xs ?? colSpan} sm={sm ?? colSpan} md={colSpan}>
				<div className="flex items-center mb-[6px] gap-2">
					<div className="text-muted-foreground">{label}:</div>
					{!!tooltip && (
						<Tooltip title={tooltip}>
							<HelpCircle
								className="cursor-pointer text-muted-foreground"
								size={14}
							/>
						</Tooltip>
					)}
				</div>
				<div className="text-foreground font-medium break-words whitespace-normal leading-7">
					{value}
				</div>
			</Grid>
		))}
	</Grid>
)
