import { ReactNode } from 'react'

import Image from 'next/image'
import { useRouter } from 'next/router'

import AdvertisementBanner, {
	AdvertisementBannerEnum,
} from '@/components/common/advertisement-banner'
import { cn } from '@/lib/utils'
import { getImgSrc } from '@/utils'
import { IsKadsea } from '@/constants'

type PageTitleProps = {
	title: ReactNode | string
	subTitle?: ReactNode | string
	showBack?: boolean
	backUrl?: string
	adBannerProps?: {
		positionAbsolute?: boolean
		type: AdvertisementBannerEnum
		ratio?: number
		className?: string
	}
}

const PageTitle: React.FC<PageTitleProps> = ({
	title,
	showBack = false,
	backUrl,
	subTitle,
	adBannerProps,
}) => {
	const router = useRouter()

	return (
		<div className="mb-6 px-3 lmd:px-[0]">
			<div className="w-full flex justify-between sm:flex-col gap-4">
				<div className="w-full flex items-center text-2xl font-medium sm:text-[20px] whitespace-nowrap">
					{showBack && (
						<Image
							className="mr-4 cursor-pointer transition-all duration-300 hover:opacity-70 sm:hidden"
							height={18}
							src={getImgSrc('back')}
							alt="back_icon"
							onClick={() => (backUrl ? router.push(backUrl) : router.back())}
						/>
					)}
					<div>{title}</div>
				</div>

				{!!adBannerProps && (
					<div
						className={cn(
							'flex-1 flex justify-end items-center sm:justify-center min-w-[40%] sm:relative',
							!!adBannerProps?.positionAbsolute && 'absolute top-3 right-6',
						)}
					>
						{!IsKadsea && (
							<AdvertisementBanner
								type={adBannerProps.type}
								height={100}
								ratio={adBannerProps.ratio ?? 3}
								className={adBannerProps.className}
							/>
						)}
					</div>
				)}
			</div>

			{!!subTitle && (
				<div className="mt-3 text-base text-[#333] sm:text-sm dark:text-muted-foreground-dark">
					{subTitle}
				</div>
			)}
		</div>
	)
}

export default PageTitle
