import { TreeItem, TreeView } from '@mui/x-tree-view'
import {
	ArrowRight,
	Database,
	MinusSquare,
	PlusSquare,
	SquareDot,
} from 'lucide-react'
import { hexToNumber } from 'viem'

import Link from '@/components/common/link'
import Loading from '@/components/common/loading'
import SimpleTooltip from '@/components/common/simple-tooltip'
import { CallTrace, LinkTypeEnum } from '@/types'
import { trpc } from '@/utils/trpc'
import { IsKadsea } from '@/constants'
import { ReactElement } from 'react'

const typeColor = 'text-gray-700 dark:text-[#999]'

function mapToTreeDataNodes(
	callTrace: CallTrace | undefined,
	keys: string[] = [],
): { node: any; keys: string[] } {
	if (!callTrace) return { node: [], keys }

	const { type, from, to, value, gas, gasUsed, input, output, calls, method } =
		callTrace
	const key = `${type}-${from}-${to}-${value}-${gas}-${gasUsed}-${input}-${output}`
	const lowertype = type.trim().toLowerCase()

	const treeDataNode = {
		title: (
			<div className="flex flex-wrap items-center gap-2 text-muted-foreground">
				<span className={typeColor + ` lowercase`}>{lowertype}</span>

				<SimpleTooltip content="gasUsed">
					<div>
						<span>[</span>
						<b>{hexToNumber(gasUsed as any)}</b>
						<span>]</span>
					</div>
				</SimpleTooltip>

				<SimpleTooltip content={from}>
					<Link type={LinkTypeEnum.ADDRESS} value={from} ellipsis />
				</SimpleTooltip>

				<ArrowRight size={13} />

				<SimpleTooltip content={to}>
					<Link type={LinkTypeEnum.ADDRESS} value={to} ellipsis />
				</SimpleTooltip>

				{method && (
					<SimpleTooltip content={input}>
						<div>
							<span>[</span>
							<b>{method}</b>
							<span>]</span>
						</div>
					</SimpleTooltip>
				)}

				{value && (
					<div>
						<span>[</span>
						<span>value:</span>
						<b>{hexToNumber(value as any)}</b>
						<span>]</span>
					</div>
				)}
				{/* <span className="text-red">[gas: {hexToNumber(gas as any)}]</span> */}
			</div>
		),
		key,
		children: [],
	}
	keys.push(key)

	if (calls) {
		treeDataNode.children = calls.map(
			(call) => mapToTreeDataNodes(call, keys).node,
		) as any
	}

	return { node: treeDataNode, keys }
}

const TxInternalDetailTable: React.FC<{
	from: string
	to: string
	tx: string
}> = ({ from, to, tx }) => {
	const { isLoading, data: txDetail } =
		trpc.transaction.getInternalTransactionDetail.useQuery(tx, {
			enabled: !!tx,
		})
	const renderTree = (nodes: any) => (
		<TreeItem
			classes={{
				content: 'mb-2 !bg-transparent !cursor-default',
			}}
			key={nodes.key}
			nodeId={nodes.key}
			label={nodes.title}
		>
			{Array.isArray(nodes.children)
				? nodes.children.map((node: any) => renderTree(node))
				: null}
		</TreeItem>
	)

	if (isLoading) return <Loading />

	let treeElement: ReactElement | ReactElement[]
	let keys: string[]

	if (IsKadsea) {
		keys = []
		treeElement = (txDetail as CallTrace[])?.map((node) =>
			renderTree(mapToTreeDataNodes(node, keys).node),
		)
	} else {
		const { node: callTraces, keys: _keys } = mapToTreeDataNodes(
			txDetail as CallTrace,
		)
		keys = _keys
		treeElement = renderTree(callTraces)
	}

	return (
		<div>
			<div className="flex items-center flex-wrap gap-2 text-sm">
				<Database size={13} />
				<span>The contract call</span>
				<span>From</span>
				<Link
					type={LinkTypeEnum.ADDRESS}
					className="text-primary"
					value={from}
					ellipsis
				/>
				<span>To</span>
				<Link
					type={LinkTypeEnum.ADDRESS}
					className="text-primary"
					value={to}
					ellipsis
				/>
				{/* <span className="ml-[4px]">
          produced {txDetail?.length} Internal Transaction{(txDetail?.length ?? 0) > 1 ? 's' : ''}
        </span> */}
			</div>

			<div className="p-3 mt-3 border-1-solid rounded-md">
				<TreeView
					defaultExpanded={keys}
					defaultCollapseIcon={
						<MinusSquare
							className="cursor-pointer text-muted-foreground"
							size={13}
						/>
					}
					defaultExpandIcon={
						<PlusSquare
							className="cursor-pointer text-muted-foreground"
							size={13}
						/>
					}
					defaultEndIcon={
						<SquareDot className="text-muted-foreground" size={13} />
					}
					sx={{ flexGrow: 1, overflowY: 'auto' }}
				>
					{treeElement}
				</TreeView>
			</div>
		</div>
	)
}

export default TxInternalDetailTable
