import classNames from 'classnames'

import { formatNum } from '@/utils'

type Props = {
	value?: number
	isPercentage?: boolean
	className?: string
}

const ValueFluctuation: React.FC<Props> = ({
	value = 0,
	isPercentage = false,
	className = '',
}) => {
	const numValue = Number(value)
	const isZero = numValue === 0
	const isPositive = numValue > 0
	const textClass = isZero
		? '--'
		: isPositive
		  ? 'text-green-500'
		  : 'text-red-500'

	return (
		<div className={classNames(textClass, 'flex items-center', className)}>
			{!isZero && (
				<span
					className={`text-xs ${
						isPositive ? 'text-green-500' : 'text-red-500'
					}`}
				>
					{isPositive ? '+' : ''}
				</span>
			)}
			<span>{isZero ? '--' : formatNum(value)}</span>
			{isPercentage && <span>%</span>}
		</div>
	)
}

export default ValueFluctuation
