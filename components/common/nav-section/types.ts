import { ReactNode } from 'react'

import { ListItemButtonProps, StackProps } from '@mui/material'

export interface IRouteMenuItem {
	key: string
	label: string
	route?: string
	icon?: ReactNode
	children?: { key: string; label: string; route: string }[]
}

export type INavItem = {
	item: IRouteMenuItem
	depth: number
	open?: boolean
	active?: boolean
	isExternalLink?: boolean
}

export type NavItemProps = INavItem & ListItemButtonProps

export interface NavSectionProps extends StackProps {
	data: {
		subheader: string
		items: IRouteMenuItem[]
	}[]
}
