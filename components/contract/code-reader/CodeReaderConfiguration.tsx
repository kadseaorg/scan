import { useEffect, useState } from 'react'

import { LoadingButton } from '@mui/lab'
import {
	Card,
	Checkbox,
	IconButton,
	List,
	ListItem,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	MenuItem,
	Stack,
	Typography,
} from '@mui/material'

import { RHFSelect, RHFTextField } from '@/components/common/hook-form'
import Label from '@/components/common/label/Label'
import Link from '@/components/common/link'
import { LinkTypeEnum } from '@/types'
import { trpc } from '@/utils/trpc'

import { useCodeReaderContext } from './CodeReaderProvider'
import { IAIModels } from './types'

const AiModels: { label: string; value: IAIModels }[] = [
	{
		label: 'GPT-3.5',
		value: 'gpt-3.5-turbo',
	},
	{
		label: 'GPT-4',
		value: 'gpt-4',
	},
]

const CodeReaderConfiguration = () => {
	const { methods } = useCodeReaderContext()
	const { watch, setValue } = methods
	const { contract_address = '', source_code } = watch()

	const api_key_url =
		'https://help.openai.com/en/articles/4936850-where-do-i-find-my-secret-api-key'

	const {
		isFetching,
		data: contractDetail,
		refetch,
	} = trpc.contract.getContractDetail.useQuery(contract_address, {
		enabled: false,
	})

	const codeSources = contractDetail?.codeSources

	function loadContractAddress() {
		refetch()
	}

	const [checked, setChecked] = useState([0])

	useEffect(() => {
		if (codeSources) {
			const newCode = checked
				.map((index) => codeSources[index].content)
				.join('\n')
			setValue('source_code', newCode)
		}
	}, [codeSources, checked, setValue])

	const handleToggle = (value: number) => () => {
		const currentIndex = checked.indexOf(value)
		const newChecked = [...checked]

		if (currentIndex === -1) {
			newChecked.push(value)
		} else {
			newChecked.splice(currentIndex, 1)
		}

		setChecked(newChecked)
	}

	return (
		<Stack spacing={2} sx={{ width: '100%' }}>
			<Stack spacing={1}>
				<Stack flexDirection={'row'} alignItems={'center'}>
					<Typography variant="body1">API Key</Typography>
					<Link className="ml-auto" type={LinkTypeEnum.URL} value={api_key_url}>
						Get API Key
					</Link>
				</Stack>
				<RHFTextField
					name="api_key"
					size="small"
					placeholder="Please fill in the API key"
				/>
			</Stack>
			<Stack spacing={1}>
				<Typography variant="body1">AI Model</Typography>
				<RHFSelect
					name={`ai_model`}
					size="small"
					defaultValue={AiModels[0].value}
					InputLabelProps={{ shrink: true }}
					SelectProps={{
						native: false,
						sx: { textTransform: 'capitalize' },
					}}
				>
					{AiModels.map((item) => (
						<MenuItem key={item.value} value={item.value}>
							{item.label}
						</MenuItem>
					))}
				</RHFSelect>
			</Stack>
			<Stack spacing={1}>
				<Typography variant="body1">Contract Address</Typography>
				<RHFTextField
					name="contract_address"
					size="small"
					placeholder="Please fill in the Contract Address"
				/>
				<LoadingButton
					loading={isFetching}
					onClick={loadContractAddress}
					disabled={!contract_address}
					loadingIndicator="Loading..."
				>
					Load
				</LoadingButton>
			</Stack>
			{codeSources && (
				<Stack spacing={1}>
					<Stack flexDirection={'row'} alignItems={'center'}>
						<Typography variant="body1">Choose Contract Files</Typography>
						<Label sx={{ ml: 1 }}>{codeSources.length} Files</Label>
					</Stack>
					<Card>
						<List
							sx={{
								width: '100%',
								maxHeight: 160,
								overflowY: 'scroll',
								bgcolor: 'background.paper',
							}}
						>
							{codeSources.map((item, index) => {
								const labelId = `checkbox-list-label-${item.name}`

								return (
									<ListItem key={index} disablePadding>
										<ListItemButton
											role={undefined}
											onClick={handleToggle(index)}
											dense
										>
											<ListItemIcon>
												<Checkbox
													edge="start"
													checked={checked.indexOf(index) !== -1}
													tabIndex={-1}
													disableRipple
													inputProps={{ 'aria-labelledby': labelId }}
												/>
											</ListItemIcon>
											<ListItemText id={labelId} primary={item.name} />
										</ListItemButton>
									</ListItem>
								)
							})}
						</List>
					</Card>
				</Stack>
			)}

			<Stack spacing={1}>
				<List>
					<Typography variant="body1">Source Code</Typography>
				</List>
				<RHFTextField
					name="source_code"
					sx={{
						'& .MuiInputBase-inputMultiline': {
							fontSize: '12px',
						},
					}}
					multiline
					rows={10}
					inputProps={{
						maxLength: 5000,
					}}
					placeholder="// Contract Source Code ..."
				/>
				<Typography
					variant="body2"
					color="text.secondary"
					sx={{ alignSelf: 'flex-end' }}
				>
					{source_code?.length} / 5000
				</Typography>
			</Stack>
		</Stack>
	)
}

export default CodeReaderConfiguration
