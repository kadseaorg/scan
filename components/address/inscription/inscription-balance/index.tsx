import { Grid, Stack, Tooltip, Typography } from '@mui/material'

import Loading from '@/components/common/loading'
import { Card } from '@/components/ui/card'
import { formatNum } from '@/utils'
import { trpc } from '@/utils/trpc'

interface InscriptionBalanceProps {
	address: string
}
const InscriptionBalance: React.FC<InscriptionBalanceProps> = (
	props: InscriptionBalanceProps,
) => {
	const { address } = props

	const { isLoading, data } =
		trpc.inscription.getInscriptionsForAddress.useQuery(
			{ address },
			{ enabled: !!address },
		)

	return (
		<Grid container spacing={3} columns={12}>
			{isLoading && <Loading />}
			{!isLoading && data?.length === 0 && (
				<Grid item xs={12}>
					<Card className="px-4 py-4">
						<Typography variant="body1">
							No inscriptions found for this address
						</Typography>
					</Card>
				</Grid>
			)}
			{!isLoading &&
				data?.map((item) => (
					<Grid item xs={12} sm={6} md={3} key={item.tick}>
						<div className="px-4 py-2 rounded-lg bg-secondary">
							<Stack direction="column" spacing={3}>
								<Typography variant="h4">{item.tick}</Typography>
								<Typography>Balance: {formatNum(item.balance)}</Typography>
							</Stack>
						</div>
					</Grid>
				))}
		</Grid>
	)
}

export default InscriptionBalance
