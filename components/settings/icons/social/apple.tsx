export default function AppleIcon({
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
			aria-label="Apple"
		>
			<path
				d="M12.7949 2.37537C13.5156 1.44684 14.9671 0.578768 15.9927 0.46512C16.3178 0.42885 16.3581 0.431268 16.4312 0.501391L16.4967 0.56426L16.4816 0.992252C16.4564 1.65963 16.3682 2.12873 16.1716 2.6341C15.9751 3.13705 15.6198 3.71738 15.3426 3.97852C15.2594 4.06074 15.1007 4.22516 14.9948 4.34848C14.5563 4.84901 13.939 5.20205 13.0973 5.4366C12.7823 5.52606 12.7596 5.52848 12.3917 5.52606C11.9482 5.52365 11.8852 5.51156 11.8524 5.43176C11.8398 5.39791 11.8272 5.18996 11.8222 4.9675L11.8171 4.56127L11.923 4.17922C12.1347 3.41512 12.3791 2.90733 12.7949 2.37537Z"
				fill="currentColor"
			/>
			<path
				d="M12.9512 6.20812C13.9163 5.84541 15.2595 5.48754 15.7584 5.46336C16.1616 5.4416 16.7966 5.49238 17.2225 5.57943C17.6383 5.66164 17.9357 5.76078 18.3666 5.96148C19.0571 6.28308 19.6442 6.71349 20.1104 7.2382C20.4582 7.62992 20.4783 7.6807 20.3397 7.81127C20.2944 7.8548 20.1885 7.92492 20.1054 7.97086C19.9542 8.05066 19.3368 8.54636 19.3368 8.58746C19.3368 8.59714 19.236 8.71078 19.1125 8.8341C18.7068 9.25 18.5279 9.58611 18.2683 10.4252C18.2078 10.6186 18.1448 10.8725 18.1272 10.9934C18.0566 11.4577 18.0919 12.125 18.2154 12.7344C18.2885 13.1044 18.5808 13.7306 18.8706 14.1489C19.2763 14.7317 19.8786 15.2491 20.4909 15.5514C20.816 15.7086 21 15.8464 21 15.9334C21 15.96 20.9773 16.0205 20.9521 16.064C20.9244 16.1075 20.8866 16.2164 20.8639 16.3034C20.811 16.521 20.501 17.244 20.307 17.5971C19.5862 18.9052 18.8731 19.8748 18.1095 20.5833C17.3611 21.2725 16.6606 21.582 15.9348 21.5385C15.4359 21.5094 14.9596 21.3934 14.2842 21.1322C13.7248 20.917 13.5081 20.8493 13.2939 20.8203C13.188 20.8058 12.9915 20.7768 12.8604 20.7574C12.4774 20.697 12.2254 20.6921 11.9533 20.7478C11.0461 20.9267 11.0133 20.9364 10.5144 21.1371C9.72309 21.4562 9.30729 21.5578 8.7907 21.5578C8.3875 21.5602 8.19598 21.5143 7.75751 21.3087C7.36943 21.125 7.09476 20.9315 6.75456 20.5978C6.42948 20.2811 6.20521 20.0151 5.76421 19.4323C4.68818 18.0081 4.52187 17.7276 3.99519 16.4582C3.78612 15.9546 3.69971 15.7502 3.63026 15.5402C3.57498 15.373 3.53043 15.2023 3.44332 14.8744C3.23164 14.074 3.20896 13.9869 3.20896 13.8709C3.20896 13.8153 3.18628 13.675 3.16108 13.5565C2.94184 12.5917 2.94688 11.0007 3.17116 10.1713C3.32236 9.61271 3.52648 9.088 3.80367 8.55119C4.42863 7.3325 5.21738 6.5539 6.37404 6.01226C6.75708 5.8309 7.04436 5.74627 7.55339 5.65922C7.79027 5.62054 8.05234 5.56976 8.1355 5.54799C8.34214 5.49238 8.81842 5.49963 9.10569 5.56008C9.79112 5.71 10.2548 5.84058 10.7059 6.01226C11.5551 6.34111 12.049 6.47894 12.2506 6.4475C12.2692 6.44441 12.2848 6.44181 12.3002 6.43872C12.3815 6.42252 12.4601 6.39294 12.9512 6.20812Z"
				fill="currentColor"
			/>
		</svg>
	)
}