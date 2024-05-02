const NoDataSvg = ({
	strokeColor = '#A7570F',
	width = '48',
	height = '45',
}) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width={width}
		height={height}
		viewBox="0 0 48 45"
		fill="none"
	>
		<g clipPath="url(#clip0_59_11138)">
			<path
				d="M37.8844 17.5645L39.6089 11.1245C40.1822 8.99116 42.3733 7.72449 44.5067 8.29783C46.64 8.87116 47.9067 11.0623 47.3333 13.1956L45.6089 19.6356L37.88 17.5645H37.8844Z"
				fill="#141213"
			/>
			<path
				d="M26.6711 43.9511C28.8045 44.5245 31 43.2578 31.5689 41.1245L39.6089 11.1245C40.1822 8.99115 42.3733 7.72448 44.5067 8.29781L17.4622 1.04893C15.3289 0.475592 13.1333 1.74226 12.5644 3.87559L3.48889 37.7378L26.6711 43.9511Z"
				fill="#2F2A2C"
			/>
			<path
				d="M26.6711 43.9511C24.5378 43.3778 23.2711 41.1867 23.8444 39.0534L25.3378 33.4711L2.15554 27.2578L0.662207 32.84C0.0888732 34.9734 1.35554 37.1689 3.48887 37.7378L26.6711 43.9511Z"
				fill="url(#paint0_linear_59_11138)"
			/>
			<path
				d="M39.1282 32.5055L37.8711 33.7626L40.3853 36.2767L41.6423 35.0197L39.1282 32.5055Z"
				fill="#3D3639"
			/>
			<path
				d="M41.2515 34.7847L40.1516 35.8847C39.761 36.2752 39.761 36.9084 40.1516 37.2989L43.7657 40.913C44.1562 41.3035 44.7894 41.3035 45.1799 40.913L46.2798 39.8131C46.6703 39.4225 46.6703 38.7894 46.2798 38.3988L42.6657 34.7847C42.2752 34.3942 41.642 34.3942 41.2515 34.7847Z"
				fill="#52484C"
			/>
			<path
				d="M16.3289 16.7067L30.6489 20.5467"
				stroke="#666062"
				strokeWidth="0.622222"
				strokeMiterlimit="10"
				strokeLinecap="round"
			/>
			<path
				d="M15.2755 20.64L24.0977 23.0045"
				stroke="#666062"
				strokeWidth="0.622222"
				strokeMiterlimit="10"
				strokeLinecap="round"
			/>
			<path
				d="M17.2045 13.4355L20.9156 10.8933C22.0311 10.1289 23.44 10.5644 23.9467 11.8266L24.5778 13.3955C25.0711 14.6222 26.4222 15.0711 27.5289 14.3822L33.2622 10.8044"
				stroke="#666062"
				strokeWidth="0.622222"
				strokeMiterlimit="10"
				strokeLinecap="round"
			/>
			<g filter="url(#filter0_b_59_11138)">
				<path
					d="M33.7823 35.5289C37.7096 35.5289 40.8934 32.3451 40.8934 28.4178C40.8934 24.4904 37.7096 21.3066 33.7823 21.3066C29.8549 21.3066 26.6711 24.4904 26.6711 28.4178C26.6711 32.3451 29.8549 35.5289 33.7823 35.5289Z"
					fill="white"
					fillOpacity="0.12"
				/>
				<path
					d="M40.1934 28.4178C40.1934 31.9585 37.323 34.8289 33.7823 34.8289C30.2415 34.8289 27.3711 31.9585 27.3711 28.4178C27.3711 24.877 30.2415 22.0066 33.7823 22.0066C37.323 22.0066 40.1934 24.877 40.1934 28.4178Z"
					stroke={strokeColor}
					strokeWidth="1.4"
				/>
			</g>
			<path
				d="M32.5189 24.7119C31.5173 25.1453 30.7067 25.9366 30.2483 26.9245"
				stroke="white"
				strokeWidth="0.8"
				strokeMiterlimit="10"
				strokeLinecap="round"
			/>
		</g>
		<defs>
			<filter
				id="filter0_b_59_11138"
				x="24.6711"
				y="19.3066"
				width="18.2222"
				height="18.2222"
				filterUnits="userSpaceOnUse"
				colorInterpolationFilters="sRGB"
			>
				<feFlood floodOpacity="0" result="BackgroundImageFix" />
				<feGaussianBlur in="BackgroundImageFix" stdDeviation="1" />
				<feComposite
					in2="SourceAlpha"
					operator="in"
					result="effect1_backgroundBlur_59_11138"
				/>
				<feBlend
					mode="normal"
					in="SourceGraphic"
					in2="effect1_backgroundBlur_59_11138"
					result="shape"
				/>
			</filter>
			<linearGradient
				id="paint0_linear_59_11138"
				x1="13.5977"
				y1="27.2578"
				x2="13.5977"
				y2="43.9511"
				gradientUnits="userSpaceOnUse"
			>
				<stop stopColor="#474043" />
				<stop offset="1" stopColor="#2F2A2C" />
			</linearGradient>
			<clipPath id="clip0_59_11138">
				<rect
					width="46.9511"
					height="43.1778"
					fill="white"
					transform="translate(0.524414 0.911133)"
				/>
			</clipPath>
		</defs>
	</svg>
)

export default NoDataSvg
