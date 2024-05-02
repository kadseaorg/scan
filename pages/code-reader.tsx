import { Card, Stack } from '@mui/material'

import FormProvider from '@/components/common/hook-form/FormProvider'
import PageTitle from '@/components/common/page-title'
import CodeReaderAiChat from '@/components/contract/code-reader/CodeReaderAiChat'
import CodeReaderConfiguration from '@/components/contract/code-reader/CodeReaderConfiguration'
import CodeReaderProvider, {
	useCodeReaderContext,
} from '@/components/contract/code-reader/CodeReaderProvider'
import Container from '@/layout/container'

const CodeReaderMain: React.FC = () => {
	const { methods } = useCodeReaderContext()

	return (
		<Container>
			<PageTitle title={'Code Reader'} />

			<FormProvider methods={methods}>
				<Stack
					flexDirection={{
						sm: 'column',
						md: 'row',
					}}
					sx={{
						mt: 3,
					}}
					gap={2}
				>
					<Card sx={{ p: 2, flex: 1 }}>
						<CodeReaderConfiguration />
					</Card>
					<Card sx={{ p: 3, flex: 2 }}>
						<CodeReaderAiChat />
					</Card>
				</Stack>
			</FormProvider>
		</Container>
	)
}

const CodeReader = () => {
	return (
		<CodeReaderProvider>
			<CodeReaderMain />
		</CodeReaderProvider>
	)
}

export default CodeReader
