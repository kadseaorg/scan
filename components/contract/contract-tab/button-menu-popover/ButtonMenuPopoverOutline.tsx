import { useMemo, useState } from 'react'

import { Button, List, ListItemButton, Stack, Typography } from '@mui/material'
import { BookOpenIcon, ChevronDownIcon } from 'lucide-react'

import MenuPopover from '@/components/common/menu-popover/MenuPopover'

import { useContractTabContext } from '../ContractTabProvider'

const targetTypes = ['interface', 'library', 'contract']

interface IButtonMenuPopoverOutlineProps {
	editorInstance: any
}

const ButtonMenuPopoverOutline = (props: IButtonMenuPopoverOutlineProps) => {
	const { contractDetail } = useContractTabContext()
	const { editorInstance } = props

	const outlineAst = contractDetail?.outlineAst

	const targetOutline = useMemo(() => {
		if (outlineAst) {
			return outlineAst.children.filter(
				(item) => item.kind && targetTypes.includes(item.kind),
			)
		} else {
			;[]
		}
	}, [outlineAst])

	const [openPopover, setOpenPopover] = useState<HTMLElement | null>(null)

	const handleOpenPopover = (event: React.MouseEvent<HTMLElement>) => {
		setOpenPopover(event.currentTarget)
	}

	const handleClosePopover = () => {
		setOpenPopover(null)
	}

	function gotoLine(loc: any) {
		const { start } = loc
		if (editorInstance) {
			editorInstance.gotoLine(start.line)
		}
	}
	return (
		<>
			<Button
				variant="soft"
				endIcon={<ChevronDownIcon size={16} />}
				onClick={handleOpenPopover}
			>
				Outline
			</Button>
			<MenuPopover
				open={openPopover}
				onClose={handleClosePopover}
				sx={{ width: 350, height: 500, overflowY: 'auto' }}
			>
				<List>
					{targetOutline?.map((node, index1) => {
						const { kind, name, subNodes = [] as any[], loc } = node as any
						const filteredSubNodes = subNodes?.filter(
							(item: any) => item.type === 'FunctionDefinition',
						)
						return (
							<Stack key={index1}>
								<ListItemButton onClick={() => gotoLine(loc)}>
									<BookOpenIcon size={16} />
									<Typography
										variant="subtitle1"
										sx={{ ml: 1 }}
									>{`${kind} ${name}`}</Typography>
								</ListItemButton>
								<Stack sx={{ pl: 1 }}>
									{filteredSubNodes.map((subNode: any, index2: number) => {
										const { parameters = [] } = subNode
										return (
											<ListItemButton
												key={`${index1} - ${name} - ${index2} - ${
													subNode.name || subNode.type
												}`}
												onClick={() => gotoLine(subNode.loc)}
											>
												<Typography
													className="line-clamp-1"
													variant="body2"
												>{`- function ${subNode.name}(${parameters.map(
													(p: any) => `${p.typeName.name} ${p.name}`,
												)})`}</Typography>
											</ListItemButton>
										)
									})}
								</Stack>
							</Stack>
						)
					})}
				</List>
			</MenuPopover>
		</>
	)
}

export default ButtonMenuPopoverOutline
