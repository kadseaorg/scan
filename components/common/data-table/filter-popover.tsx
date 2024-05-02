import * as React from 'react'

import { Button, IconButton, OutlinedInput, Select } from '@mui/material'
import Popover from '@mui/material/Popover'
import { DatePicker } from 'antd'
import dayjs from 'dayjs'
import { Filter, Plus } from 'lucide-react'
import {
	AlertCircle,
	ArrowLeft,
	ArrowRight,
	CheckCircle,
	Landmark,
} from 'lucide-react'

export interface AddressFilterPopoverProps {
	label: string
	onApply: (addresses: { address: string; include: boolean }[]) => void // add here
}

export function AddressFilterPopover({
	label,
	onApply,
}: AddressFilterPopoverProps) {
	const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null)
	const [addresses, setAddresses] = React.useState<
		{ address: string; include: boolean }[]
	>([{ address: '', include: true }])

	const open = Boolean(anchorEl)
	const id = open ? 'simple-popover' : undefined

	return (
		<div>
			<IconButton
				aria-describedby={id}
				onClick={(event: React.MouseEvent<HTMLButtonElement>) =>
					setAnchorEl(event.currentTarget)
				}
			>
				<Filter size={16} />
			</IconButton>
			<Popover
				id={id}
				open={open}
				anchorEl={anchorEl}
				onClose={() => setAnchorEl(null)}
				anchorOrigin={{
					vertical: 'bottom',
					horizontal: 'left',
				}}
			>
				<div className="flex flex-col gap-3 p-3">
					<span className="font-semibold">{label}</span>

					{addresses.map((addressObj, index) => (
						<div key={index}>
							<div className="flex gap-2">
								<OutlinedInput
									placeholder="e.g. 0x..."
									size="small"
									value={addressObj.address}
									onChange={(event) => {
										let newAddresses = [...addresses]
										newAddresses[index].address = event.target.value
										setAddresses(newAddresses)
									}}
								/>
								<Select
									native
									size="small"
									value={addressObj.include ? 'include' : 'exclude'}
									onChange={(event) => {
										let newAddresses = [...addresses]
										newAddresses[index].include =
											event.target.value === 'include'
										setAddresses(newAddresses)
									}}
								>
									<option value="include">Include</option>
									<option value="exclude">Exclude</option>
								</Select>
							</div>
						</div>
					))}
					<Button
						variant="text"
						className="font-normal justify-start"
						startIcon={<Plus size={16} />}
						onClick={() =>
							setAddresses([...addresses, { address: '', include: true }])
						}
					>
						Add Address
					</Button>
					<div className="flex gap-2 w-full">
						<Button
							variant="outlined"
							onClick={() => setAnchorEl(null)}
							className="w-full"
						>
							Cancel
						</Button>
						<Button
							variant="contained"
							color="primary"
							onClick={() => onApply(addresses)}
							className="w-full"
						>
							Apply
						</Button>
					</div>
				</div>
			</Popover>
		</div>
	)
}

export interface BlockFilterPopoverProps {
	onApply: (block: number) => void
}

export function BlockFilterPopover({ onApply }: BlockFilterPopoverProps) {
	const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null)
	const [block, setBlock] = React.useState<number | undefined>(undefined)

	const open = Boolean(anchorEl)
	const id = open ? 'simple-popover' : undefined

	return (
		<div>
			<IconButton
				aria-describedby={id}
				onClick={(event: React.MouseEvent<HTMLButtonElement>) =>
					setAnchorEl(event.currentTarget)
				}
			>
				<Filter size={16} />
			</IconButton>
			<Popover
				id={id}
				open={open}
				anchorEl={anchorEl}
				onClose={() => setAnchorEl(null)}
				anchorOrigin={{
					vertical: 'bottom',
					horizontal: 'left',
				}}
			>
				<div className="flex flex-col gap-3 p-3">
					<span className="font-semibold">Block</span>

					<div className="flex gap-2">
						<OutlinedInput
							placeholder="e.g. 4337"
							size="small"
							value={block}
							type="number"
							onChange={(event) => {
								setBlock(parseInt(event.target.value ?? 0))
							}}
						/>
					</div>
					<div className="flex gap-2 w-full">
						<Button
							variant="outlined"
							onClick={() => setAnchorEl(null)}
							className="w-full"
						>
							Cancel
						</Button>
						<Button
							variant="contained"
							color="primary"
							onClick={() => {
								if (block) onApply(block)
							}}
							className="w-full"
						>
							Apply
						</Button>
					</div>
				</div>
			</Popover>
		</div>
	)
}

interface TimestapFilterPopoverProps {
	onApply: (timespan: { from: number; to: number }) => void
}

export function TimeFilterPopover({ onApply }: TimestapFilterPopoverProps) {
	const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null)
	const [fromDate, setFromDate] = React.useState(dayjs(new Date()))
	const [toDate, setToDate] = React.useState(dayjs(new Date()))

	const durations = ['LAST 1H', 'LAST 24H', 'LAST 7D', 'LAST 30D', 'LAST 90D']

	const open = Boolean(anchorEl)
	const id = open ? 'simple-popover' : undefined

	let handleDateChange = (type: 'from' | 'to') => (date: any) => {
		if (!date) return
		if (type === 'from') setFromDate(date)
		else setToDate(date)
	}

	let handleDurationClick = (duration: string) => () => {
		let newFromDate = new Date()
		switch (duration) {
			case 'LAST 1H':
				newFromDate = new Date(new Date().getTime() - 1 * 60 * 60 * 1000)
				break
			case 'LAST 24H':
				newFromDate = new Date(new Date().getTime() - 24 * 60 * 60 * 1000)
				break
			case 'LAST 7D':
				newFromDate = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000)
				break
			case 'LAST 30D':
				newFromDate = new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000)
				break
			case 'LAST 90D':
				newFromDate = new Date(new Date().getTime() - 90 * 24 * 60 * 60 * 1000)
				break
		}

		// Call onApply directly without setting state
		onApply({
			from: Math.floor(newFromDate.getTime() / 1000),
			to: Math.floor(new Date().getTime() / 1000),
		})
	}

	return (
		<div>
			<IconButton
				aria-describedby={id}
				onClick={(event: React.MouseEvent<HTMLButtonElement>) =>
					setAnchorEl(event.currentTarget)
				}
			>
				<Filter size={16} />
			</IconButton>
			<Popover
				id={id}
				open={open}
				anchorEl={anchorEl}
				onClose={() => setAnchorEl(null)}
				className="z-10"
				classes={{ paper: '!overflow-visible' }}
				anchorOrigin={{
					vertical: 'bottom',
					horizontal: 'left',
				}}
			>
				<div className="flex flex-col gap-3 p-3">
					<span className="font-semibold">Set Duration</span>
					<div className="grid grid-cols-3 gap-2">
						{durations.map((duration) => (
							<Button
								key={duration}
								size="small"
								className="rounded-full"
								variant="outlined"
								onClick={handleDurationClick(duration)}
							>
								{duration}
							</Button>
						))}
					</div>
					<div className="flex flex-col gap-3 p-3">
						<span className="font-semibold">Custom Duration</span>

						<div className="flex flex-col gap-2">
							<span className="font-semibold text-xs">From</span>
							<DatePicker
								onChange={handleDateChange('from')}
								getPopupContainer={(trigger) => trigger}
							/>
							<span className="font-semibold text-xs">To</span>
							<DatePicker
								onChange={handleDateChange('to')}
								getPopupContainer={(trigger) => trigger}
							/>
						</div>
					</div>
					<div className="flex gap-2 w-full">
						<Button
							variant="outlined"
							onClick={() => setAnchorEl(null)}
							className="w-full"
						>
							Cancel
						</Button>
						<Button
							variant="contained"
							color="primary"
							onClick={() =>
								onApply({ from: fromDate.unix(), to: toDate.unix() })
							}
							className="w-full"
						>
							Apply
						</Button>
					</div>
				</div>
			</Popover>
		</div>
	)
}

export interface MethodFilterPopoverProps {
	onApply: (methodId: string) => void
}

export const topMethods = [
	{ id: '0xa9059cbb', name: 'transfer' },
	{ id: '0x095ea7b3', name: 'approve' },
	{ id: '0x23b872dd', name: 'transferFrom' },
	{ id: '0x18cbafe5', name: 'swapExactTokensForETH' },
	{ id: '0x7ff36ab5', name: 'swapExactETHForTokens' },
	{ id: '0x38ed1739', name: 'swapExactTokensForTokens' },
	{ id: '0x39509351', name: 'increaseAllowance' },
	{ id: '0xa457c2d7', name: 'decreaseAllowance' },
]

export function MethodFilterPopover({ onApply }: MethodFilterPopoverProps) {
	const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null)
	const [methodId, setMethodId] = React.useState<string | undefined>(undefined)

	const open = Boolean(anchorEl)
	const id = open ? 'simple-popover' : undefined

	return (
		<div>
			<IconButton
				aria-describedby={id}
				onClick={(event: React.MouseEvent<HTMLButtonElement>) =>
					setAnchorEl(event.currentTarget)
				}
			>
				<Filter size={16} />
			</IconButton>
			<Popover
				id={id}
				open={open}
				anchorEl={anchorEl}
				onClose={() => setAnchorEl(null)}
				anchorOrigin={{
					vertical: 'bottom',
					horizontal: 'left',
				}}
			>
				<div className="flex flex-col gap-7 p-3">
					<div className="flex flex-col gap-2 mx-3">
						<span className="font-semibold">Method Id</span>
						<OutlinedInput
							placeholder="e.g. 0xa9059cbb"
							size="small"
							value={methodId}
							onChange={(event) => {
								setMethodId(event.target.value)
							}}
							onKeyDown={(event) => {
								if (event.key === 'Enter') {
									if (methodId) onApply(methodId)
								}
							}}
						/>
					</div>
					<div className="flex flex-col">
						<span className="font-semibold mx-3">Popular Methods</span>
						{topMethods.map((method) => (
							<Button
								key={method.id}
								variant="text"
								className="flex gap-2 items-center justify-between"
								onClick={() => {
									onApply(method.id)
								}}
							>
								<div className="font-semibold text-left flex-1">
									{method.name}
								</div>
								<div className="text-muted-foreground dark:text-muted-foreground-dark text-xs text-right flex-1">
									{method.id}
								</div>
							</Button>
						))}
					</div>
				</div>
			</Popover>
		</div>
	)
}

export interface TxStatusFilterPopoverProps {
	onApply: (status: string) => void
	style?: React.CSSProperties
}
const TxStatusList = [
	{
		label: 'View Completed Txns',
		value: 'completed',
		icon: <CheckCircle size={16} />,
	},
	{
		label: 'View Failed Txns',
		value: 'failed',
		icon: <AlertCircle size={16} />,
	},
	{
		label: 'View Outgoing Txns',
		value: 'outgoing',
		icon: <ArrowRight size={16} />,
	},
	{
		label: 'View Incomming Txns',
		value: 'incomming',
		icon: <ArrowLeft size={16} />,
	},
	{
		label: 'View Contract Creation',
		value: 'creation',
		icon: <Landmark size={16} />,
	},
]
export function TxStatusFilterPopover({
	onApply,
	style,
}: TxStatusFilterPopoverProps) {
	const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null)
	const [status, setStatus] = React.useState<string | undefined>(undefined)
	const open = Boolean(anchorEl)
	const id = open ? 'simple-popover' : undefined

	return (
		<div style={{ ...style }}>
			<IconButton
				aria-describedby={id}
				onClick={(event: React.MouseEvent<HTMLButtonElement>) =>
					setAnchorEl(event.currentTarget)
				}
			>
				<Filter size={16} />
			</IconButton>
			<Popover
				id={id}
				open={open}
				anchorEl={anchorEl}
				onClose={() => setAnchorEl(null)}
				anchorOrigin={{
					vertical: 'bottom',
					horizontal: 'left',
				}}
			>
				<div className="flex flex-col gap-7 p-3">
					<ul className="flex-flex-col gap-2">
						{TxStatusList.map((item) => (
							<li
								key={item.value}
								className="flex items-center p-2 cursor-pointer hover:bg-gray-500"
								onClick={() => {
									setStatus(item.value)
									onApply(item.value)
									setAnchorEl(null)
								}}
							>
								{item.icon}
								<span className="ml-2">{item.label}</span>
							</li>
						))}
					</ul>
				</div>
			</Popover>
		</div>
	)
}
