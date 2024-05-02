import { generatePath } from 'react-router-dom'

import { Forward } from 'lucide-react'
import { usePlausible } from 'next-plausible'
import Image from 'next/image'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import ROUTES from '@/constants/routes'
import { PlausibleEvents } from '@/types/events'
import { trpc } from '@/utils/trpc'

const BridgeExternal = () => {
	const plausible = usePlausible<PlausibleEvents>()
	const { data } = trpc.bridge.getExternalBridges.useQuery()

	return (
		<div className="flex flex-col">
			<div className="grid grid-cols-2 gap-4 sm:grid-cols-1">
				{data?.map(
					(
						{
							name,
							logo,
							introduction: description,
							tags = [],
							external_link,
							dappId,
						},
						index,
					) => (
						<Link
							key={index}
							href={external_link}
							target="_blank"
							onClick={() =>
								plausible('Portal-Bridge Name', { props: { BridgeName: name } })
							}
						>
							<Card className="w-full h-full cursor-pointer transition-all duration-300 hover:opacity-80 flex flex-col justify-between">
								<CardHeader>
									<CardTitle className="mb-4">
										<div className="flex items-center justify-between">
											<div className="flex gap-4 items-center">
												{!!logo && (
													<Image
														className="rounded-full"
														width={56}
														height={56}
														src={logo}
														alt="logo"
													/>
												)}
												{name}
											</div>
											<Forward />
										</div>
									</CardTitle>
									<CardDescription>{description}</CardDescription>
								</CardHeader>
								<CardContent className="space-x-4">
									{tags?.map((tag, index) => (
										<Badge key={index} variant="secondary">
											{tag}
										</Badge>
									))}
								</CardContent>
								<CardFooter>
									<Link
										className="w-full"
										href={generatePath(ROUTES.DAPPS.DETAIL.DAPP, {
											id: dappId,
										})}
									>
										<Button variant="outline" className="w-full rounded-2xl">
											Learn More
										</Button>
									</Link>
								</CardFooter>
							</Card>
						</Link>
					),
				)}
			</div>
		</div>
	)
}

export default BridgeExternal
