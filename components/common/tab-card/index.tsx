import { ReactNode, useEffect, useState } from 'react'

import { Tab, Tabs } from '@mui/material'
import { styled } from '@mui/material/styles'
import { useRouter } from 'next/router'

import { Card } from '@/components/ui/card'

export type TabCardListProps = {
	label: string | ReactNode
	children: ReactNode
}[]

type TabCardPropsType = {
	className?: string
	defaultActiveKey?: string
	tabList: TabCardListProps
}

const StyledTabs = styled(Tabs)({
	'&.MuiTabs-scrollButtons.Mui-disabled': {
		opacity: 0.3,
		width: '20px',
	},
})

const TabCard: React.FC<TabCardPropsType> = ({
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
		<>
			<Tabs
				value={activeKey}
				onChange={(event, newValue) => setActiveKey(newValue)}
				sx={{ mb: 2, px: 1 }}
			>
				{tabList?.map((tab, index) => (
					<Tab key={index} value={tab.label} label={tab.label} />
				))}
			</Tabs>
			<Card className="p-6">
				{tabList?.map((tab) => tab.label === activeKey && tab.children)}
			</Card>
		</>
	)
}

export default TabCard
