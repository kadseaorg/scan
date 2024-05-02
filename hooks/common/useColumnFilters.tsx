import { useCallback } from 'react'

import dayjs from 'dayjs'
import { X } from 'lucide-react'

import {
	AddressFilterPopover,
	BlockFilterPopover,
	MethodFilterPopover,
	TimeFilterPopover,
	TxStatusFilterPopover,
	topMethods,
} from '@/components/common/data-table/filter-popover'
import { Badge } from '@/components/ui/badge'

export const useColumnFilters = (setFetchParams: any) => {
	const filterHandlers = {
		Block: (block: number) =>
			setFetchParams((prevState) => ({ ...prevState, block_number: block })),
		From: (addresses: { address: string; include: boolean }[]) =>
			setFetchParams((prevState) => ({
				...prevState,
				from_addresses: addresses,
			})),
		To: (addresses: { address: string; include: boolean }[]) =>
			setFetchParams((prevState) => ({
				...prevState,
				to_addresses: addresses,
			})),
		Age: (timespan: { from: number; to: number }) =>
			setFetchParams((prevState) => ({ ...prevState, timespan: timespan })),
		Method: (methodId: string) =>
			setFetchParams((prevState) => ({ ...prevState, method_id: methodId })),
	}

	const popoverComponents = {
		Block: BlockFilterPopover,
		From: AddressFilterPopover,
		To: AddressFilterPopover,
		Age: TimeFilterPopover,
		Method: MethodFilterPopover,
	}

	const renderFilterTags = useCallback(
		(fetchParams: any) => {
			const iconClass =
				'w-3 h-3 ml-2 cursor-pointer transition-all hover:opacity-80'
			const clearParam = (apiKey: string) =>
				setFetchParams((pre: any) => {
					const param = { ...pre }
					delete param[apiKey]
					return param
				})

			const renderCommonLabel = (label: string, apiKey: string) =>
				!!fetchParams?.[apiKey] ? (
					<Badge className="flex-center" variant="secondary">
						{label}:{' '}
						{topMethods?.filter(({ id }) => id === fetchParams?.[apiKey])?.[0]
							?.name || fetchParams?.[apiKey]}
						<X className={iconClass} onClick={() => clearParam(apiKey)} />
					</Badge>
				) : null

			const renderAgeLabel = (label: string, apiKey: string) =>
				!!fetchParams?.[apiKey] ? (
					<Badge className="flex-center" variant="secondary">
						{label}:{' '}
						{`${dayjs(fetchParams?.[apiKey]?.from * 1000).format(
							'YYYY/MM/DD',
						)} - ${dayjs(fetchParams?.[apiKey]?.to * 1000).format(
							'YYYY/MM/DD',
						)}`}
						<X className={iconClass} onClick={() => clearParam(apiKey)} />
					</Badge>
				) : null

			const renderFromToLabel = (apiKey: string, isFrom = true) => {
				if (!!!fetchParams?.[apiKey]) return null

				return (
					<>
						{fetchParams?.[apiKey]?.map(({ address, include }: any) => (
							<Badge key={address} variant="secondary">
								{isFrom ? 'From' : 'To'}:{' '}
								{`${address} (${include ? 'include' : 'exclude'})`}
								<X
									className={iconClass}
									onClick={() =>
										setFetchParams((pre: any) => {
											const param = { ...pre }
											param[apiKey] = param[apiKey].filter(
												({ address: _address }: any) => _address !== address,
											)

											if (!!!param[apiKey]?.length) {
												delete param[apiKey]
											}

											return param
										})
									}
								/>
							</Badge>
						))}
					</>
				)
			}

			return (
				<div className="flex items-center gap-4 flex-wrap mb-2">
					{renderCommonLabel('Method', 'method_id')}

					{renderCommonLabel('Block', 'block_number')}

					{renderAgeLabel('Age', 'timespan')}

					{renderFromToLabel('from_addresses')}

					{renderFromToLabel('to_addresses', false)}
				</div>
			)
		},
		[setFetchParams],
	)

	return { filterHandlers, popoverComponents, renderFilterTags }
}
