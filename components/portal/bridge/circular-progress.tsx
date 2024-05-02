import React from 'react'

interface CircularProgressProps {
	value: number
	strokeWidth: number
	size: number
}

const CircularProgress: React.FC<CircularProgressProps> = ({
	value,
	strokeWidth,
	size,
}) => {
	const radius = (size - strokeWidth) / 2
	const circumference = radius * 2 * Math.PI
	const offset = circumference - (value / 100) * circumference

	return (
		<div className="flex items-center justify-center">
			<svg width={size} height={size}>
				<circle
					stroke="lightblue"
					fill="transparent"
					strokeWidth={strokeWidth}
					strokeDasharray={circumference + ' ' + circumference}
					style={{ strokeDashoffset: offset }}
					strokeLinecap="round"
					cx={size / 2}
					cy={size / 2}
					r={radius}
				/>
			</svg>
		</div>
	)
}

export default CircularProgress
