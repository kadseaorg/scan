import { useMemo, useState } from 'react'

import { CircularProgress } from '@mui/material'
import { AlertCircleIcon, CheckIcon, Clock, ExternalLink } from 'lucide-react'

import { CHAIN_TYPE, CURRENT_CHAIN_ITEM, IsKadsea, IsZkSync } from '@/constants'
import { cn } from '@/lib/utils'
import { L1StatusTypeEnum, TxStatusTypeEnum } from '@/types'
import { EnumChainType } from '@/types/chain'
import { getL1ExplorerUrl } from '@/utils'

import { LabelColor } from '../common/label'
import Label from '../common/label/Label'
import { Badge } from '../ui/badge'

interface ITxsInfoStatusProps {
	status?: TxStatusTypeEnum
	l1Status?: L1StatusTypeEnum
	l1_commit_tx_hash?: string
	l1_prove_tx_hash?: string
	l1_execute_tx_hash?: string
}

const TxsInfoStatus = (props: ITxsInfoStatusProps) => {
	const {
		status,
		l1Status,
		l1_commit_tx_hash,
		l1_prove_tx_hash,
		l1_execute_tx_hash,
	} = props
	const { title, l1Title } = CURRENT_CHAIN_ITEM
	const [showL1StatusList, setShowL1StatusList] = useState(false)

	const l2Failed = status === TxStatusTypeEnum.FAILED
	const l2Succeed = status === TxStatusTypeEnum.SUCCEED

	const l2Info: {
		color: LabelColor
		statusText: string
		startIcon: JSX.Element
	} = useMemo(() => {
		if (l2Succeed) {
			return {
				color: 'bg-green-600',
				startIcon: <CheckIcon size={14} />,
				statusText: 'Processed',
			}
		} else if (status === null) {
			return {
				color: 'bg-secondary',
				startIcon: <CircularProgress size={14} color="inherit" />,
				statusText: 'Indexing',
			}
		} else {
			return {
				color: 'bg-secondary',
				startIcon: <CircularProgress size={14} color="inherit" />,
				statusText: 'Pending',
			}
		}
	}, [l2Succeed, status])

	const l1StatusText = useMemo(() => {
		switch (l1Status) {
			case L1StatusTypeEnum.FINALIZED:
				return 'Finalized'
			case L1StatusTypeEnum.COMMITTED:
				return 'Committed'
			case L1StatusTypeEnum.SEALED:
				return 'Sealed'
			case L1StatusTypeEnum.UNCOMMITTED:
				return 'Uncommitted'
			case L1StatusTypeEnum.VERIFIED:
				return IsZkSync ? 'Executed' : 'Verified'
			case L1StatusTypeEnum.INCLUDED:
				return 'Included'
			case L1StatusTypeEnum.PENDING:
				return 'Pending'
			case L1StatusTypeEnum.FAILED:
				return 'Failed'
			default:
				if (
					CHAIN_TYPE! === EnumChainType.LINEA ||
					CHAIN_TYPE === EnumChainType.SCROLL_SEPOLIA ||
					CHAIN_TYPE === EnumChainType.SCROLL ||
					CHAIN_TYPE === EnumChainType.BASE
				) {
					return 'Uncommitted'
				}
				if (CHAIN_TYPE === EnumChainType.ZKSYNC) {
					return 'Sending'
				}
				return 'Uncommitted'
		}
	}, [l1Status])

	const l1Info: {
		color: LabelColor
		startIcon: JSX.Element
	} = useMemo(() => {
		switch (l1Status) {
			case L1StatusTypeEnum.FINALIZED:
			case L1StatusTypeEnum.COMMITTED:
			case L1StatusTypeEnum.SEALED:
			case L1StatusTypeEnum.VERIFIED:
			case L1StatusTypeEnum.INCLUDED:
				return {
					color: 'bg-green-600',
					startIcon: <CheckIcon size={14} />,
				}
			case L1StatusTypeEnum.PENDING:
				return {
					color: 'bg-primary',
					startIcon: <CircularProgress size={14} color="inherit" />,
				}
			case L1StatusTypeEnum.FAILED:
				return {
					color: 'bg-destructive',
					startIcon: <AlertCircleIcon size={14} />,
				}
			case L1StatusTypeEnum.UNCOMMITTED:
			default:
				return {
					color: 'bg-muted-foreground',
					startIcon: <Clock size={14} />,
				}
		}
	}, [l1Status])

	const prevL1StatusList = useMemo(() => {
		if (!l1_commit_tx_hash) {
			return []
		}
		if (l1_commit_tx_hash && !l1_prove_tx_hash && !l1_execute_tx_hash) {
			return [{ status: 'Sent', link: getL1ExplorerUrl(l1_commit_tx_hash) }]
		}
		if (l1_commit_tx_hash && l1_prove_tx_hash) {
			return [
				{ status: 'Sent', link: getL1ExplorerUrl(l1_commit_tx_hash) },
				{ status: 'Validated', link: getL1ExplorerUrl(l1_prove_tx_hash) },
			]
		}
		return []
	}, [l1_commit_tx_hash, l1_prove_tx_hash, l1_execute_tx_hash])

	const postL1StatusList = useMemo(() => {
		if (!l1_commit_tx_hash) {
			return [
				{ status: 'Validating', link: '' },
				{ status: 'Executing', link: '' },
			]
		}
		if (l1_commit_tx_hash && !l1_prove_tx_hash && !l1_execute_tx_hash) {
			return [{ status: 'Executing', link: '' }]
		}
		if (l1_commit_tx_hash && l1_prove_tx_hash) {
			return []
		}
		return []
	}, [l1_commit_tx_hash, l1_prove_tx_hash, l1_execute_tx_hash])

	const currentL1Status = useMemo(() => {
		if (!IsZkSync) return null
		if (!l1_commit_tx_hash) {
			return {
				status: 'Sending',
				link: '',
				startIcon: <CircularProgress size={14} color="inherit" />,
			}
		}
		if (l1_commit_tx_hash && !l1_prove_tx_hash && !l1_execute_tx_hash) {
			return {
				status: 'Validating',
				link: '',
				startIcon: <CircularProgress size={14} color="inherit" />,
			}
		}
		if (l1_commit_tx_hash && l1_prove_tx_hash && !l1_execute_tx_hash) {
			return {
				status: 'Executing',
				link: '',
				startIcon: <CircularProgress size={14} color="inherit" />,
			}
		}
		if (l1_commit_tx_hash && l1_prove_tx_hash && l1_execute_tx_hash) {
			return {
				status: 'Executed',
				link: getL1ExplorerUrl(l1_execute_tx_hash),
				startIcon: <CheckIcon size={14} />,
			}
		}
	}, [l1_commit_tx_hash, l1_prove_tx_hash, l1_execute_tx_hash])

	const L1StatusListItem = ({
		status,
		link,
	}: { status: string; link: string }) => {
		return (
			<li
				key={status}
				onClick={() => window.open(link, '_blank')}
				className={cn(
					'flex items-center px-2.5 py-2 text-xs font-semibold ',
					link ? 'cursor-pointer' : '',
				)}
			>
				{link && <CheckIcon size={14} />}
				<span className="mr-auto">{status}</span>
				{link && <ExternalLink size={14} />}
			</li>
		)
	}

	return l2Failed ? (
		<Label
			color="error"
			variant="filled"
			startIcon={<AlertCircleIcon size={14} />}
		>
			Failed
		</Label>
	) : (
		<div className="flex flex-row sm:flex-col items-start gap-2 w-full">
			{status && (
				<div className={cn(l2Info.color, 'flex rounded-sm')}>
					<Badge className={cn('rounded-sm rounded-r-none')}>{title}</Badge>
					<Badge className={cn(l2Info.color, 'rounded-sm gap-1')}>
						{l2Info.startIcon}
						{l2Info.statusText}
					</Badge>
				</div>
			)}
			{!IsKadsea && (
				<div className={cn(l1Info.color, 'flex rounded-sm ')}>
					<Badge className="rounded-sm rounded-r-none">{l1Title}</Badge>
					<div
						className="flex relative"
						onMouseLeave={() => setShowL1StatusList(false)}
					>
						{IsZkSync && showL1StatusList && (
							<ul className="absolute left-0 right-0 bottom-[100%] z-10 border border-secondary rounded-t border-b-0">
								{prevL1StatusList.map((item) => (
									<L1StatusListItem
										status={item.status}
										link={item.link}
										key={item.link}
									/>
								))}
							</ul>
						)}
						<Badge
							className={cn(
								'rounded-sm gap-1',
								l1StatusText.includes('ing') ? '' : 'cursor-pointer',
								showL1StatusList ? 'pr-4' : '',
								l1Info.color,
							)}
							onMouseOver={() => setShowL1StatusList(true)}
							onClick={() =>
								currentL1Status &&
								currentL1Status.link &&
								window.open(currentL1Status.link, '_blank')
							}
						>
							{IsZkSync ? currentL1Status?.startIcon : l1Info.startIcon}
							{IsZkSync ? currentL1Status?.status : l1StatusText}
							{showL1StatusList && currentL1Status && currentL1Status.link && (
								<ExternalLink size={14} />
							)}
						</Badge>
						{IsZkSync && showL1StatusList && (
							<ul className="absolute left-0 right-0 top-[100%] z-10 border border-secondary rounded-t border-b-0">
								{postL1StatusList.map((item) => (
									<L1StatusListItem
										status={item.status}
										link={item.link}
										key={item.link}
									/>
								))}
							</ul>
						)}
					</div>
				</div>
			)}
		</div>
	)
}

export default TxsInfoStatus
