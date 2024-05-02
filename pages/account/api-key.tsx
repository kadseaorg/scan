import React, { useState } from 'react'

import { KeyRound } from 'lucide-react'
import { toast } from 'sonner'

import { CopyButton } from '@/components/common/copy-button'
import ConfirmDialog from '@/components/common/dialog/ConfirmDialog'
import Loading from '@/components/common/loading'
import PageTitle from '@/components/common/page-title'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Container from '@/layout/container'
import { trpc } from '@/utils/trpc'

const ApiKey: React.FC = () => {
	const { data: apikey, refetch } = trpc.account.getOrApplyForApiKey.useQuery()
	const { mutate: reset, isLoading: resetting } =
		trpc.account.resetApiKey.useMutation()
	const [dialogOpen, setDialogOpen] = useState(false)

	if (!apikey || resetting) {
		return (
			<Container>
				<Loading />
			</Container>
		)
	}

	return (
		<Container>
			<PageTitle
				title="API KEY (BETA)"
				subTitle="A unique Api key for your account to access our multi-chain APIs"
			/>

			<Card>
				<CardContent className="p-7">
					<div className="flex flex-col items-start justify-between mx-auto gap-7">
						<div className="flex gap-5 items-center justify-between">
							<div className="font-semibold text-md">Playground</div>
							<a
								href="https://swagger.l2scan.co"
								className="items-center flex py-auto text-primary"
								target="_blank"
								rel="noreferrer"
							>
								https://swagger.l2scan.co
							</a>
						</div>
						<div className="flex gap-5 items-center justify-between">
							<div className="font-semibold text-md">Free</div>
							<div className="items-center flex py-auto">30 req/s</div>
						</div>
						<div className="flex gap-5 items-center justify-between">
							<span className="font-semibold">Bearer Token</span>

							<div className="items-center flex py-auto">{apikey}</div>
							<CopyButton className="text-main text-32" value={apikey} />
						</div>
						<Button
							onClick={() => {
								setDialogOpen(true)
							}}
						>
							<KeyRound className="mr-2" size={17} />
							Reset
						</Button>
					</div>
				</CardContent>
			</Card>

			<ConfirmDialog
				title="Confirmation Required"
				content={`Are you sure you wish to reset the token ${apikey}?`}
				open={dialogOpen}
				onClose={() => setDialogOpen(false)}
				onConfirmClick={async () => {
					try {
						await reset()
						refetch()
						toast.success(`Successfully reset token`)
					} catch (error: any) {
						toast.error(error.message)
					}
				}}
				confirmActionText="Confirm"
			/>
		</Container>
	)
}

export default ApiKey
