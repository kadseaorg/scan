import { usePlausible } from 'next-plausible'
import Image from 'next/image'

import { CURRENT_CHAIN_ITEM } from '@/constants'
import useTheme from '@/hooks/common/useTheme'
import { PlausibleEvents } from '@/types/events'

const ThemeSwitcher: React.FC = () => {
	const plausible = usePlausible<PlausibleEvents>()
	const { isLight, changeTheme } = useTheme()

	return !CURRENT_CHAIN_ITEM.darkOnly ? (
		<div
			className="flex-center cursor-pointer"
			onClick={() => {
				const newMode = isLight ? 'dark' : 'light'
				plausible('Explorer-Change Mode', { props: { Mode: newMode } })
				changeTheme(newMode)
			}}
		>
			{isLight ? (
				// <LightSvg className="h-6" /> : <DarkSvg className="h-6" />}
				<Image src="/svgs/light.svg" width={20} height={20} alt="light" />
			) : (
				<Image src="/svgs/dark.svg" width={20} height={20} alt="dark" />
			)}
		</div>
	) : (
		<></>
	)
}

export default ThemeSwitcher
