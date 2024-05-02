import { Box, Link, ListItemText, Tooltip } from '@mui/material'
import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react'
import RouterLink from 'next/link'

import { NavItemProps } from '../types'
import { StyledDotIcon, StyledIcon, StyledItem } from './styles'

export default function NavItem({
	item,
	depth,
	open,
	active,
	isExternalLink,
	...other
}: NavItemProps) {
	const { label, route, icon, children } = item

	const subItem = depth !== 1

	const renderContent = (
		<StyledItem depth={depth} active={active} {...other}>
			{icon && <StyledIcon>{icon}</StyledIcon>}

			{subItem && (
				<StyledIcon>
					<StyledDotIcon active={active && subItem} />
				</StyledIcon>
			)}

			<ListItemText
				primary={label}
				// secondary={
				//   caption && (
				//     <Tooltip title={caption} placement="top-start">
				//       <span>{caption}</span>
				//     </Tooltip>
				//   )
				// }
				primaryTypographyProps={{
					noWrap: true,
					component: 'span',
					variant: active ? 'subtitle2' : 'body2',
				}}
				secondaryTypographyProps={{
					noWrap: true,
					variant: 'caption',
				}}
			/>

			{!!children && (
				<Box sx={{ ml: 1 }}>
					{open ? (
						<ChevronDownIcon size={16} />
					) : (
						<ChevronRightIcon size={16} />
					)}
				</Box>
			)}
		</StyledItem>
	)

	// ExternalLink
	if (isExternalLink)
		return (
			<Link href={route} target="_blank" rel="noopener" underline="none">
				{renderContent}
			</Link>
		)

	// Has child
	if (children) {
		return renderContent
	}

	// Default
	return route ? (
		<RouterLink href={route} style={{ textDecoration: 'none' }}>
			{renderContent}
		</RouterLink>
	) : (
		renderContent
	)
}
