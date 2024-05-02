import React, { useEffect, useState } from 'react'

import { useRouter } from 'next/router'

import { cn } from '@/lib/utils'

import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { usePathname, useSearchParams } from 'next/navigation'

export interface LinkableTabProps {
	label: string
	children: React.ReactNode
	value?: string
}

interface LinkableTabsProps {
	classNames?: {
		wrapper?: string
		trigger?: string
		content?: string
	}
	tabs: LinkableTabProps[]
}

const LinkableTabs: React.FC<LinkableTabsProps> = ({ classNames, tabs }) => {
	const router = useRouter()
	const initialTab = router.query.tab as string
	const [activeTab, setActiveTab] = useState(initialTab || tabs[0].value)
	const searchParams = useSearchParams()
	const pathname = usePathname()

	const handleTabChange = (value: string) => {
		setActiveTab(value)
		if (!searchParams) return
		// sync tab value to query param
		const newSearchParams = new URLSearchParams(searchParams)
		newSearchParams.set('tab', value)
		router.push(`${pathname}?${newSearchParams.toString()}`)
	}

	useEffect(() => {
		const initialTab = searchParams?.get('tab')
		typeof initialTab === 'string' && setActiveTab(initialTab)
	}, [searchParams])

	return (
		<Tabs
			className={cn('p-3 lmd:px-[0]', classNames?.wrapper)}
			value={activeTab}
			defaultValue={tabs[0].value || tabs[0].label}
			onValueChange={handleTabChange}
		>
			<TabsList className={'bg-transparent p-0'}>
				{tabs.map((tab, index) => (
					<TabsTrigger
						className={cn(
							activeTab === tab.value &&
								'border-b border-b-primary rounded-none',
							classNames?.trigger,
						)}
						key={`trigger-${tab.value}`}
						value={tab.value || tab.label}
					>
						{tab.label}
					</TabsTrigger>
				))}
			</TabsList>
			{tabs.map((tab, index) => (
				<TabsContent
					className={classNames?.content}
					key={`content-${tab.value}`}
					value={tab.value || tab.label}
				>
					{tab.children}
				</TabsContent>
			))}
		</Tabs>
	)
}

export default LinkableTabs
