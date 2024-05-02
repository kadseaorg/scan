import { ReactNode, useEffect, useState } from 'react'

import { Box, Button } from '@mui/material'
import { useRouter } from 'next/router'

import { Card, CardContent } from '@/components/ui/card'

export type TabCardV2ListProps = {
	label: string | ReactNode
	children: ReactNode
}[]

type TabCardV2PropsType = {
	className?: string
	defaultActiveKey?: string
	tabList: TabCardV2ListProps
}

const TabCardV2: React.FC<TabCardV2PropsType> = ({
	className = '',
	defaultActiveKey,
	tabList,
}) => {
	const router = useRouter()
	const search: any = router?.query

	const [activeKey, setActiveKey] = useState(
		defaultActiveKey || tabList[0].label,
	)

	useEffect(() => {
		setActiveKey(defaultActiveKey || tabList[0].label)
	}, [defaultActiveKey, search, tabList])

	return (
		<Card className={className}>
			<CardContent>
				{tabList?.map((tab, index) => {
					const isActive = tab.label === activeKey
					return (
						<Button
							key={index}
							sx={{
								borderRadius: 100,
								color: isActive ? 'primary' : 'text.primary',
							}}
							variant={isActive ? 'soft' : 'text'}
							onClick={() => setActiveKey(tab.label)}
						>
							{tab.label}
						</Button>
					)
				})}

				<Box sx={{ mt: 2 }}>
					<div className="w-full overflow-auto">
						{tabList?.map((tab) => tab.label === activeKey && tab.children)}
					</div>{' '}
				</Box>
			</CardContent>
		</Card>
	)
}

export default TabCardV2
