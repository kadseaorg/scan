import { CSSProperties, useEffect, useMemo, useState } from 'react'
import Slider from 'react-slick'

import classNames from 'classnames'
import { usePlausible } from 'next-plausible'
import Image from 'next/image'
import Link from 'next/link'

import { AspectRatio } from '@/components/ui/aspect-ratio'
import { IsKadsea } from '@/constants'
import { cn } from '@/lib/utils'
import { PlausibleEvents } from '@/types/events'
import { trpc } from '@/utils/trpc'

import 'slick-carousel/slick/slick-theme.css'
import 'slick-carousel/slick/slick.css'
import { Card } from '@/components/ui/card'
import NoDataSvg from '../svg-icon/no-data'
import { GLE_FOMRS } from '@/layout/menu/config'
import { themeColor } from '@/theme/colors'

// 0-home 1-transaction list/transaction detail 2-dapp
export enum AdvertisementBannerEnum {
	HOME = 'HOME',
	TRANSACTION_ADDRESS = 'TRANSACTION_ADDRESS',
	DAPP = 'DAPP',
}

export interface IAdvertisementBanner {
	style?: CSSProperties
	className?: string
	type: AdvertisementBannerEnum
	height: number
	ratio?: number
	isSlotMobile?: boolean
}

const AdvertisementBanner: React.FC<IAdvertisementBanner> = ({
	style,
	className,
	type,
	height,
	ratio = 3,
	isSlotMobile = true,
}) => {
	const plausible = usePlausible<PlausibleEvents>()
	const { data: bannerList } = trpc.util.getAds.useQuery({ type })

	const maxWidth = useMemo(() => height * ratio, [height, ratio])

	const [hiddenAd, sethiddenAd] = useState(true)
	useEffect(() => {
		// setTimeout(() => {
		// sethiddenAd(false)
		// }, 1500)
	}, [])

	const [showView, setshowView] = useState(false)
	useEffect(() => {
		// setshowView(true)
	}, [])

	return (
		<>
			{showView && (
				<div style={style} className={cn(className)}>
					{IsKadsea ? (
						!!bannerList?.length ? (
							<div
								style={{ height: `${height}px` }}
								className="w-full flex justify-center items-center"
							>
								<div className="w-full" style={{ maxWidth: `${maxWidth}px` }}>
									<Slider
										className="overflow-hidden"
										arrows={false}
										speed={500}
										infinite
										autoplay
									>
										{bannerList?.map(({ id, url, href }) => (
											<div
												className="!flex justify-center items-center"
												key={id}
											>
												<Link
													style={{ height: `${height}px` }}
													className="w-full flex justify-center items-center"
													href={href}
													onClick={() =>
														plausible('AD-Click', {
															props: { ProjectLink: href },
														})
													}
													target="_blank"
												>
													<AspectRatio className="rounded-lg" ratio={ratio}>
														<Image
															style={{
																objectFit: 'cover',
																borderRadius: 'var(--radius)',
															}}
															src={url}
															alt="banner"
															fill
														/>
													</AspectRatio>
												</Link>
											</div>
										))}
									</Slider>
								</div>
							</div>
						) : (
							<Card
								style={{ height: `${height}px` }}
								className="w-full flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-primary/50"
							>
								<Link
									className="w-full h-full p-7"
									href={GLE_FOMRS.AD.key}
									target="_blank"
								>
									<div className="w-full h-full flex items-center justify-between gap-1">
										<div className="text-xl font-bold text-foreground">
											Advertise your brand here !
										</div>
										<NoDataSvg
											strokeColor={themeColor.dark.primary.main}
											width="100"
											height="100"
										/>
									</div>
								</Link>
							</Card>
						)
					) : (
						<div className="w-full flex items-center justify-center cursor-pointer transition-all duration-200">
							<div className="w-full h-full flex justify-end llg:justify-start lmd:!justify-center">
								{/* <div className="text-xl font-bold text-foreground">Advertise your brand here !</div> */}
								{isSlotMobile ? (
									<iframe
										className={classNames('rounded-[10px]', {
											invisible: hiddenAd,
										})}
										width="270px"
										height="90px"
										src="https://v1.slise.xyz/serve?pub=pub-31&size=270x90&slot=mobile&path=%2Fad&rnd=3z8w79bnrfda4jahpsmrhh8s15u3u0r1td99jx6jny&host=localhost%3A3001"
									></iframe>
								) : (
									<div className="flex justify-center items-center h-[90px]">
										<iframe
											className={classNames('md:hidden rounded-[10px]', {
												invisible: hiddenAd,
											})}
											width="270px"
											height="90px"
											src="https://v1.slise.xyz/serve?pub=pub-31&size=270x90&slot=mobile&path=%2Fad&rnd=3z8w79bnrfda4jahpsmrhh8s15u3u0r1td99jx6jny&host=localhost%3A3001"
										></iframe>
										<iframe
											className={classNames('lmd:hidden rounded-[10px]', {
												invisible: hiddenAd,
											})}
											width="728px"
											height="90px"
											src="https://v1.slise.xyz/serve?pub=pub-31&size=728x90&slot=leaderboard&path=%2Fad&rnd=64ujsg2piexcjv4fqyf5bn29mskh2qwwsguz8sz2o&host=localhost%3A3001"
										></iframe>
									</div>
								)}
							</div>
						</div>
					)}
				</div>
			)}
		</>
	)
}

export default AdvertisementBanner
