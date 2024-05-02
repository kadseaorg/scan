import { useState } from 'react'

import { Button, ListItemButton, Stack } from '@mui/material'
import { ChevronDownIcon } from 'lucide-react'

import MenuPopover from '@/components/common/menu-popover/MenuPopover'

import { useCodeReaderContext } from '../CodeReaderProvider'

const ButtonMenuPopoverPrompts = () => {
	const { sendPrompts, methods, isLoading } = useCodeReaderContext()

	const [openPopover, setOpenPopover] = useState<HTMLElement | null>(null)

	const handleOpenPopover = (event: React.MouseEvent<HTMLElement>) => {
		setOpenPopover(event.currentTarget)
	}

	const handleClosePopover = () => {
		setOpenPopover(null)
	}
	const prompts = [
		'What does this contract do?',
		'What are the functions available in this contract?',
		'How can I mint this token?',
		`How does SafeMath change the contract's state`,
	]
	return (
		<Stack>
			<Button
				variant="soft"
				disabled={isLoading}
				endIcon={<ChevronDownIcon size={16} />}
				onClick={handleOpenPopover}
			>
				Prompts
			</Button>
			<MenuPopover
				arrow="bottom-right"
				disabledArrow
				open={openPopover}
				onClose={handleClosePopover}
				sx={{ width: 320, p: 1 }}
			>
				{prompts.map((prompt) => {
					return (
						<ListItemButton
							key={prompt}
							onClick={methods.handleSubmit(() => {
								sendPrompts(prompt)
								handleClosePopover()
							})}
						>
							{prompt}
						</ListItemButton>
					)
				})}
			</MenuPopover>
		</Stack>
	)
}

export default ButtonMenuPopoverPrompts
