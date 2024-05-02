export default function GitHubIcon({
	className,
	height = 24,
	width = 24,
}: {
	className?: string
	height?: number
	width?: number
}) {
	return (
		<svg
			width={height}
			height={width}
			viewBox="0 0 24 24"
			fill="none"
			className={className}
			aria-label="GitHub"
		>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M12.0083 1.62451C6.38959 1.62451 1.84741 6.20781 1.84741 11.878C1.84741 16.4104 4.75774 20.2471 8.79514 21.605C9.29992 21.7071 9.48482 21.3844 9.48482 21.1129C9.48482 20.8752 9.46818 20.0604 9.46818 19.2115C6.64167 19.8227 6.05307 17.9892 6.05307 17.9892C5.59883 16.8009 4.92579 16.4954 4.92579 16.4954C4.00068 15.8673 4.99318 15.8673 4.99318 15.8673C6.01938 15.9352 6.55785 16.9198 6.55785 16.9198C7.46612 18.4815 8.92971 18.0402 9.51851 17.7686C9.60254 17.1065 9.87188 16.6482 10.1579 16.3936C7.90351 16.1559 5.53165 15.2732 5.53165 11.3347C5.53165 10.2142 5.93514 9.29758 6.57449 8.58467C6.47362 8.33009 6.12025 7.27739 6.67557 5.86844C6.67557 5.86844 7.5335 5.59678 9.46797 6.92093C10.2962 6.69649 11.1503 6.58231 12.0083 6.58135C12.8662 6.58135 13.7408 6.70031 14.5484 6.92093C16.4831 5.59678 17.341 5.86844 17.341 5.86844C17.8963 7.27739 17.5428 8.33009 17.4419 8.58467C18.0981 9.29758 18.4849 10.2142 18.4849 11.3347C18.4849 15.2732 16.1131 16.1388 13.8419 16.3936C14.2121 16.7161 14.5316 17.3271 14.5316 18.2948C14.5316 19.6698 14.5149 20.7733 14.5149 21.1127C14.5149 21.3844 14.7 21.7071 15.2046 21.6052C19.242 20.2469 22.1523 16.4104 22.1523 11.878C22.169 6.20781 17.6102 1.62451 12.0083 1.62451Z"
				fill="currentColor"
			/>
		</svg>
	)
}
