import { useState } from 'react'

import { Button, ListItemButton, Stack } from '@mui/material'
import { ChevronDownIcon } from 'lucide-react'
import { useRouter } from 'next/router'

import MenuPopover from '@/components/common/menu-popover/MenuPopover'

const ButtonMenuPopoverOpenIn = () => {
	const router = useRouter()
	const [openPopover, setOpenPopover] = useState<HTMLElement | null>(null)

	const handleOpenPopover = (event: React.MouseEvent<HTMLElement>) => {
		setOpenPopover(event.currentTarget)
	}

	const handleClosePopover = () => {
		setOpenPopover(null)
	}
	return (
		<>
			<Button
				variant="soft"
				endIcon={<ChevronDownIcon size={16} />}
				onClick={handleOpenPopover}
			>
				Open In
			</Button>
			<MenuPopover
				disabledArrow
				open={openPopover}
				onClose={handleClosePopover}
				sx={{ width: 180, p: 1 }}
			>
				<ListItemButton
					onClick={() => {
						router.push('/code-reader')
						handleClosePopover()
					}}
				>
					🤖️ Code reader
				</ListItemButton>
			</MenuPopover>
		</>
	)
}

export default ButtonMenuPopoverOpenIn
