import { useEffect, useState } from 'react'

import { Collapse } from '@mui/material'
import { useRouter } from 'next/router'

import { IRouteMenuItem } from '../types'
import NavItem from './NavItem'

type NavListRootProps = {
	data: IRouteMenuItem
	depth: number
	hasChild: boolean
}

export default function NavList({ data, depth, hasChild }: NavListRootProps) {
	const { pathname } = useRouter()
	const active = pathname === data.route
	const isExternalLink = data.route?.includes('http')

	const [open, setOpen] = useState(active)

	useEffect(() => {
		if (!active) {
			handleClose()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pathname])

	const handleToggle = () => {
		setOpen(!open)
	}

	const handleClose = () => {
		setOpen(false)
	}

	return (
		<>
			<NavItem
				item={data}
				depth={depth}
				open={open}
				active={active}
				isExternalLink={isExternalLink}
				onClick={handleToggle}
			/>

			{hasChild && (
				<Collapse className="!min-h-fit" in={open} unmountOnExit>
					<NavSubList data={data.children} depth={depth} />
				</Collapse>
			)}
		</>
	)
}

type NavListSubProps = {
	data?: IRouteMenuItem[]
	depth: number
}

function NavSubList({ data, depth }: NavListSubProps) {
	return (
		<>
			{data &&
				data.map((list) => (
					<NavList
						key={list.key}
						data={list}
						depth={depth + 1}
						hasChild={!!list.children}
					/>
				))}
		</>
	)
}
