import React from 'react'

import { Star } from 'lucide-react'

import SimpleTooltip from '@/components/common/simple-tooltip'

const AddFavoriteIcon: React.FC<{
	is_favorite: boolean
	onClick: () => void
	addText: string
	removeText: string
}> = (props) => {
	const { is_favorite, onClick, addText, removeText } = props
	return (
		<SimpleTooltip content={is_favorite ? removeText : addText}>
			<Star
				className="cursor-pointer"
				size={16}
				fill={is_favorite ? 'yellow' : undefined}
				onClick={onClick}
			/>
		</SimpleTooltip>
	)
}

export default AddFavoriteIcon
