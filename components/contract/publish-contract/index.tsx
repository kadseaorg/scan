import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { generatePath } from 'react-router-dom'

import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Button,
	Dialog,
	Divider,
	Grid,
	IconButton,
	MenuItem,
	Stack,
	TextField,
	Typography,
} from '@mui/material'
import classNames from 'classnames'
import { ChevronDownIcon, PaperclipIcon, Trash2Icon } from 'lucide-react'
import { usePlausible } from 'next-plausible'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { toast } from 'sonner'

import DotText from '@/components/common/dot-text'
import {
	RHFRadioGroup,
	RHFSelect,
	RHFTextField,
	RHFUpload,
} from '@/components/common/hook-form'
import FieldHeader from '@/components/common/hook-form/FieldHeader'
import FormProvider from '@/components/common/hook-form/FormProvider'
import Loading from '@/components/common/loading'
import { Textarea } from '@/components/ui/textarea'
import { IsZkSync } from '@/constants'
import ROUTES from '@/constants/routes'
import useTheme from '@/hooks/common/useTheme'
import { GLE_FOMRS } from '@/layout/menu/config'
import {
	ContractCompilerTypeEnum,
	ZkSyncContractCompilerTypeEnum,
} from '@/types/contract'
import { PlausibleEvents } from '@/types/events'
import { getImgSrc } from '@/utils'
import { trpc } from '@/utils/trpc'

const LICENSE_TYPE_OPTIONS = [
	'1) No License (None)',
	'2) The Unlicense (Unlicense)',
	'3) MIT License (MIT)',
	'4) GNU General Public License v2.0 (GNU GPLv2)',
	'5) GNU General Public License v3.0 (GNU GPLv3)',
	'6) GNU Lesser General Public License v2.1 (GNU LGPLv2.1)',
	'7) GNU Lesser General Public License v3.0 (GNU LGPLv3)',
	'8) BSD 2-clause "Simplified" license (BSD-2-Clause)',
	'9) BSD 3-clause "New" Or "Revised" license (BSD-3-Clause)',
	'10) Mozilla Public License 2.0 (MPL-2.0)',
	'11) Open Software License 3.0 (OSL-3.0)',
	'12) Apache 2.0 (Apache-2.0)',
	'13) GNU Affero General Public License (GNU AGPLv3)',
	'14) Business Source License (BSL 1.1)',
]

const evmVersionsSolidity = [
	'default',
	'homestead',
	'tangerineWhistle',
	'spuriousDragon',
	'byzantium',
	'constantinople',
	'petersburg',
	'istanbul',
	'berlin',
	'london',
]
const evmVersionsVyper = [
	'default',
	'byzantium',
	'constantinople',
	'petersburg',
	'istanbul',
]

const defaultOptimizeCount = 200

const ContractPublish: React.FC<{
	contractAddress: string
	contractCompilerVersion: string
	zksolcVersion: string | undefined
	contractCompilerType:
		| ContractCompilerTypeEnum
		| ZkSyncContractCompilerTypeEnum
	resetCompilerConfig: () => void
}> = ({
	contractAddress,
	contractCompilerVersion,
	zksolcVersion,
	contractCompilerType,
	resetCompilerConfig,
}) => {
	const router = useRouter()
	const plausible = usePlausible<PlausibleEvents>()
	const { isLight } = useTheme()

	const {
		isLoading: isVerifyJsonLoading,
		mutate: verifyJson,
		error: verifyJsonError,
	} = trpc.contract.verifyStandardJson.useMutation({
		async onSuccess(data) {
			if (data.status === '1') {
				setGuid(data.result)
			} else {
				toast.error(data.message)
			}
		},
	})

	const {
		isLoading: isVerifyMultiPartLoading,
		mutate: verifyMultiPart,
		error: verifyMultiPartError,
	} = trpc.contract.verifyMultiPart.useMutation({
		async onSuccess(data) {
			if (data.status === '1') {
				setGuid(data.result)
			} else {
				toast.error(data.message)
			}
		},
	})

	const { mutate: verifyZkSyncContract } =
		trpc.contract.verifyZkSyncContract.useMutation({
			async onSuccess(data) {
				if (data) {
					setGuid(data)
				} else {
					toast.error('Verify failed!')
				}
			},
		})

	const isSourceCodeType = useMemo(() => {
		if (IsZkSync) {
			return (
				ZkSyncContractCompilerTypeEnum.SoliditySourceCode ===
				contractCompilerType
			)
		} else {
			return false
		}
	}, [contractCompilerType])

	const isJsonType = useMemo(
		() =>
			[
				ContractCompilerTypeEnum.SolidityJson,
				ContractCompilerTypeEnum.VyperJson,
			].includes(contractCompilerType as any),
		[contractCompilerType],
	)

	const isVyper = useMemo(
		() => contractCompilerType?.includes('Vyper'),
		[contractCompilerType],
	)

	const evmVersions = useMemo(
		() => (isVyper ? evmVersionsVyper : evmVersionsSolidity),
		[isVyper],
	)

	const fileType = useMemo(
		() => (isJsonType ? 'Standard-Input-Json' : isVyper ? 'Vyper' : 'Solidity'),
		[isJsonType, isVyper],
	)

	const fileAccept = useMemo(
		() => (isJsonType ? '.json' : isVyper ? '.vy' : '.sol'),
		[isJsonType, isVyper],
	)

	const [contractSourceCode, setContractSourceCode] = useState('')
	const [fileList, setFileList] = useState<any[]>([])
	const [interfaceList, setInterfaceList] = useState<any[]>()
	const [libraries, setLibraries] = useState<[string, string][]>(
		Array.from({ length: 10 }, () => ['', '']),
	)

	const methods = useForm({
		defaultValues: {
			optimization: true,
			optimizeCount: 200,
			evm: evmVersions?.[0],
			license: LICENSE_TYPE_OPTIONS?.[0],
			contractName: '',
			contractPath: '',
			contructorArguments: '0x',
		},
	})

	const { watch, reset, handleSubmit } = methods
	const values = watch()

	const setLibraryInfo = useCallback(
		(index: number, keyOrValue: 'key' | 'value', info: string) => {
			const newLibraries = [...libraries]
			newLibraries[index][keyOrValue === 'key' ? 0 : 1] = info
			setLibraries(newLibraries)
		},
		[libraries],
	)

	const [publishResult, setPublishResult] = useState<
		'loading' | 'success' | 'fail'
	>('loading')
	const [showPublishResultModal, setShowPublishResultModal] = useState(false)
	const [guid, setGuid] = useState<string | number>()
	const { data: queryVerifyStatus, error: queryVerifyStatusError } =
		trpc.contract.checkverifystatus.useQuery(
			{
				module: 'contract',
				action: 'checkverifystatus',
				guid: guid as string,
			},
			{
				enabled: !!guid && publishResult === 'loading' && !IsZkSync,
				refetchInterval: 1000, // 1s
			},
		)
	const { data: queryZksyncVerifyStatus, error: queryZksyncVerifyStatusError } =
		trpc.contract.checkZkSyncVerifyStatus.useQuery(
			{
				id: guid as number,
			},
			{
				enabled: !!guid && publishResult === 'loading' && IsZkSync,
				refetchInterval: 1000, // 1s
			},
		)

	useEffect(() => {
		if (queryVerifyStatusError || verifyJsonError || verifyMultiPartError) {
			console.error(
				'verify error message: ',
				queryVerifyStatusError || verifyJsonError || verifyMultiPartError,
			)
			setPublishResult('fail')
		}
		if (
			queryVerifyStatus?.result === 'Pending in queue' ||
			queryZksyncVerifyStatus?.status === 'queue'
		) {
			setPublishResult('loading')
		} else if (
			queryVerifyStatus?.result === 'Pass - Verified' ||
			queryZksyncVerifyStatus?.status === 'successful'
		) {
			setPublishResult('success')
		} else if (
			queryVerifyStatus?.result.includes('Fail - Unable to verify') ||
			queryZksyncVerifyStatus?.status === 'failed'
		) {
			console.error(
				'verify error message: ',
				queryVerifyStatus?.result || queryZksyncVerifyStatus?.error,
			)
			setPublishResult('fail')
		}
	}, [
		queryVerifyStatus,
		queryVerifyStatusError,
		verifyJsonError,
		verifyMultiPartError,
		queryZksyncVerifyStatus,
		queryZksyncVerifyStatusError,
	])

	const onSubmit = useCallback(async () => {
		// cleanup publishResult
		setPublishResult('loading')

		if (isSourceCodeType && !!!contractSourceCode) {
			toast.error('Please input your contract source code to verify!')
			return
		}
		if (!isSourceCodeType && !!!fileList?.length) {
			toast.error(
				'Please select and upload the solidity/vyper files to verify!',
			)
			return
		}

		plausible('Verify Contract-Verify and Publish')

		// upload files
		if ((isJsonType || isSourceCodeType) && !IsZkSync) {
			let sourceCode = contractSourceCode

			if (!isSourceCodeType) {
				const blob = await fileList[0]?.arrayBuffer()
				sourceCode = new TextDecoder().decode(blob)
			}

			verifyJson({
				module: 'contract',
				action: 'verifysourcecode',
				contractaddress: contractAddress,
				sourceCode,
				codeformat: isVyper
					? 'vyper-standard-json-input'
					: 'solidity-standard-json-input',
				contractname: '',
				compilerversion: contractCompilerVersion,
			})
		} else {
			let files: Record<string, string> = {}
			let filesObj: Record<string, { content: string }> = {}
			await Promise.all(
				fileList.map(async (file: any) => {
					const blob = await file.arrayBuffer()
					const sourceCode = new TextDecoder().decode(blob)
					files[file.name] = sourceCode
					filesObj[file.name] = { content: sourceCode }
				}),
			)
			let interfaces: Record<string, string> = {}
			if (interfaceList?.length) {
				await Promise.all(
					interfaceList.map(async (file: any) => {
						const blob = await file.arrayBuffer()
						const sourceCode = new TextDecoder().decode(blob)
						interfaces[file.name] = sourceCode
					}),
				)
			}
			const librariesObj = libraries.reduce((acc: any, [key, value]) => {
				if (key && value) {
					acc[key] = value
				}
				return acc
			}, {})

			let verifyInputs: any = {
				contractAddress: contractAddress,
				compilerVersion: contractCompilerVersion,
				sourceFiles: files,
				// libraries: librariesObj
			}
			if (isVyper) {
				verifyInputs.lang = 'vyper'
				verifyInputs.interfaces = interfaceList
			} else {
				verifyInputs.lang = 'solidity'
				verifyInputs.libraries = librariesObj
			}

			verifyInputs.evmVersion = values.evm
			verifyInputs.optimizationRuns = !isNaN(Number(values.optimizeCount))
				? Number(values.optimizeCount)
				: defaultOptimizeCount
			if (IsZkSync) {
				if (isSourceCodeType) {
					verifyZkSyncContract({
						codeFormat: 'solidity-single-file',
						compilerSolcVersion: contractCompilerVersion,
						compilerZksolcVersion: zksolcVersion || '',
						constructorArguments: values.contructorArguments,
						contractAddress: contractAddress,
						contractName: `${values.contractPath}:${values.contractName}`,
						optimizationUsed: values.optimization,
						sourceCode: contractSourceCode,
					})
				} else {
					verifyZkSyncContract({
						codeFormat: 'solidity-standard-json-input',
						compilerSolcVersion: contractCompilerVersion,
						compilerZksolcVersion: zksolcVersion || '',
						constructorArguments: values.contructorArguments,
						contractAddress: contractAddress,
						contractName: `${Object.keys(filesObj)[0]}:${values.contractName}`,
						optimizationUsed: values.optimization,
						sourceCode: {
							language: 'Solidity',
							settings: {
								optimizer: { enabled: values.optimization },
							},
							sources: filesObj,
						},
					})
				}
			} else {
				verifyMultiPart(verifyInputs)
			}
		}

		!!!showPublishResultModal && setShowPublishResultModal(true)
	}, [
		contractSourceCode,
		isSourceCodeType,
		fileList,
		plausible,
		isJsonType,
		showPublishResultModal,
		verifyJson,
		contractAddress,
		isVyper,
		contractCompilerVersion,
		interfaceList,
		libraries,
		values,
		verifyMultiPart,
		verifyZkSyncContract,
		zksolcVersion,
	])

	return (
		<div>
			{(isVerifyJsonLoading || isVerifyMultiPartLoading) && <Loading />}

			<div className="px-[4%]">
				<FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
					{/* Common Data */}
					<Grid container spacing={2} sx={{ mt: 2 }}>
						{!isSourceCodeType && !isJsonType && (
							<Grid item sm={12} md={2}>
								<Stack spacing={1}>
									<Typography variant="subtitle2">Optimization</Typography>
									<RHFRadioGroup
										name="optimization"
										options={[
											{
												label: 'Yes',
												value: true,
											},
											{
												label: 'No',
												value: false,
											},
										]}
									/>
								</Stack>
							</Grid>
						)}
					</Grid>

					{/* Upload */}
					<div className="mb-6">
						{isSourceCodeType
							? `Please input the contract code source`
							: isJsonType
							  ? `Please upload the ${fileType} source`
							  : isVyper
								  ? `Please upload the main *.${fileType} source`
								  : `Please select the ${fileType} (*.${fileAccept}) files for upload`}
						<span className="text-red mx-3">*</span>
					</div>

					{isSourceCodeType && (
						<Textarea
							className="bg-transparent h-[400px] mb-6"
							placeholder="Type your contract code here."
							value={contractSourceCode}
							onChange={({ target }) => setContractSourceCode(target.value)}
						/>
					)}

					{!isSourceCodeType && (
						<div className="w-full mb-6">
							<RHFUpload
								name={'fileList'}
								onDrop={(fileList) => {
									if (
										fileList?.some(
											({ size }) =>
												(size ?? 0) > (isJsonType ? 1024 * 1024 : 1024 * 500),
										)
									) {
										toast.error(
											`File must smaller than ${isJsonType ? '1M' : '500KB'}!`,
										)
									}

									const data: any = {}
									fileList
										.filter(
											({ size }) =>
												!(
													(size ?? 0) > (isJsonType ? 1024 * 1024 : 1024 * 500)
												),
										)
										.forEach((file) => (data[file.name] = file))

									setFileList(Object.values(data))
								}}
								multiple={isJsonType ? false : true}
								accept={
									isJsonType
										? {
												'.json': [],
										  }
										: {
												'.sol': [],
												'.vy': [],
										  }
								}
							></RHFUpload>
							<Stack sx={{ mt: 2 }} spacing={1}>
								{fileList?.map((file, index) => {
									return (
										<Stack
											key={file.path}
											flexDirection={'row'}
											alignItems={'center'}
											gap={1}
											sx={{
												':hover': {
													bgcolor: 'background.neutral',
												},
											}}
										>
											<PaperclipIcon size={18} color="gray" />
											<Typography variant="body2">{file.name}</Typography>
											<IconButton
												sx={{ ml: 'auto' }}
												onClick={() => {
													let newFileList = [...fileList]
													newFileList.splice(index, 1)
													setFileList(newFileList)
												}}
											>
												<Trash2Icon size={18} color="gray" />
											</IconButton>
										</Stack>
									)
								})}
							</Stack>
						</div>
					)}

					{/* interfaces */}
					{isVyper && !isJsonType && !IsZkSync && (
						<>
							<div className="mb-6">
								Add any required interfaces for the main compiled contract
							</div>
							<div className="w-full mb-6">
								<RHFUpload
									name={'fileList'}
									onDrop={(fileList) => {
										if (
											fileList?.some(
												({ size }) =>
													(size ?? 0) > (isJsonType ? 1024 * 1024 : 1024 * 500),
											)
										) {
											toast.error(
												`File must smaller than ${
													isJsonType ? '1M' : '500KB'
												}!`,
											)
										}

										const data: any = {}
										fileList
											.filter(
												({ size }) =>
													!(
														(size ?? 0) >
														(isJsonType ? 1024 * 1024 : 1024 * 500)
													),
											)
											.forEach((file) => (data[file.name] = file))

										setInterfaceList(Object.values(data))
									}}
									multiple={!isJsonType}
									accept={
										isJsonType
											? {
													'.json': [],
											  }
											: {
													'.sol': [],
													'.vy': [],
											  }
									}
								></RHFUpload>
								<Stack sx={{ mt: 2 }} spacing={1}>
									{interfaceList?.map((file, index) => {
										return (
											<Stack
												key={file.path}
												flexDirection={'row'}
												alignItems={'center'}
												gap={1}
												sx={{
													':hover': {
														bgcolor: 'background.neutral',
													},
												}}
											>
												<PaperclipIcon size={18} color="gray" />
												<Typography variant="body2">{file.name}</Typography>
												<IconButton
													sx={{ ml: 'auto' }}
													onClick={() => {
														let newFileList = [...fileList]
														newFileList.splice(index, 1)
														setFileList(newFileList)
													}}
												>
													<Trash2Icon size={18} color="gray" />
												</IconButton>
											</Stack>
										)
									})}
								</Stack>
							</div>
						</>
					)}

					{/* Contract Library Address */}
					{!isJsonType && !isVyper && !IsZkSync && (
						<Accordion className="w-full mb-6 border-1-solid border-muted !rounded-md !bg-transparent">
							<AccordionSummary expandIcon={<ChevronDownIcon size={20} />}>
								<span>
									Contract Library Address (for contracts that use libraries,
									supports up to 10 libraries)
								</span>
							</AccordionSummary>
							<AccordionDetails>
								<div className="text-muted-foreground dark:text-muted-foreground-dark mb-[18px]">
									<b>
										Note: Library names are case sensitive and affects the
										keccak library hash
									</b>
								</div>
								<>
									{libraries?.map((data, index) => (
										<Grid
											container
											key={index}
											className="mb-3 sm:mb-10"
											spacing={2}
										>
											<Grid item xs={12} sm={5} md={5}>
												<div className="text-muted-foreground dark:text-muted-foreground-dark mb-[8px]">
													Library_{index + 1} Name:
												</div>
												<TextField
													size="small"
													fullWidth
													value={data[0]}
													onChange={({ target }) =>
														setLibraryInfo(index, 'key', target.value)
													}
												/>
											</Grid>
											<Grid item xs={12} sm={1} md={2}>
												<div className="w-full h-full flex items-center justify-center">
													<Image
														width={24}
														src={getImgSrc(
															`contract/arrow${isLight ? '' : '_dark'}`,
														)}
														alt=""
													/>
												</div>
											</Grid>
											<Grid item xs={12} sm={6} md={5}>
												<div className="text-muted-foreground dark:text-muted-foreground-dark mb-[8px]">
													Library_{index + 1} Contract Address:
												</div>
												<TextField
													size="small"
													fullWidth
													value={data[1]}
													onChange={({ target }) =>
														setLibraryInfo(index, 'value', target.value)
													}
												/>
											</Grid>
										</Grid>
									))}
								</>
							</AccordionDetails>
						</Accordion>
					)}

					{/* Misc Settings */}
					{!IsZkSync && (
						<Accordion className="w-full border-1-solid border-muted !rounded-md !bg-transparent">
							<AccordionSummary expandIcon={<ChevronDownIcon size={20} />}>
								<Typography variant="body1">{`Misc Settings (${
									isJsonType
										? 'License Type settings'
										: 'Runs, EvmVersion & License Type settings'
								})`}</Typography>
							</AccordionSummary>
							<AccordionDetails>
								<Grid container spacing={2}>
									{!isJsonType && (
										<>
											{!isVyper && (
												<Grid item xs={24} sm={12} md={4}>
													<Stack spacing={1}>
														<Typography variant="subtitle2">
															Runs (Optimizer)
														</Typography>
														<RHFTextField
															type="number"
															name="optimizeCount"
															size="small"
														/>
													</Stack>
												</Grid>
											)}
											<Grid item xs={24} sm={12} md={4}>
												<Stack spacing={1}>
													<Typography variant="subtitle2">
														EVM Version to target
													</Typography>
													<RHFSelect
														name="evm"
														size="small"
														InputLabelProps={{ shrink: true }}
														SelectProps={{
															native: false,
															sx: { textTransform: 'capitalize' },
														}}
													>
														{evmVersions?.map((version: string) => (
															<MenuItem key={version} value={version}>
																{version}
															</MenuItem>
														))}
													</RHFSelect>
												</Stack>
											</Grid>
										</>
									)}
									<Grid item xs={24} sm={12} md={4}>
										<Stack spacing={1}>
											<Typography variant="subtitle2">LicenseType</Typography>
											<RHFSelect
												name={`license`}
												size="small"
												InputLabelProps={{ shrink: true }}
												SelectProps={{
													native: false,
													sx: { textTransform: 'capitalize' },
												}}
											>
												{LICENSE_TYPE_OPTIONS?.map((license: string) => (
													<MenuItem key={license} value={license}>
														{license}
													</MenuItem>
												))}
											</RHFSelect>
										</Stack>
									</Grid>
								</Grid>
							</AccordionDetails>
						</Accordion>
					)}

					{/* Constructor Arguments */}
					{IsZkSync && (
						<div className="flex flex-col gap-1">
							<div>
								<FieldHeader title="Contract Name" />
								<RHFTextField
									placeholder="Name"
									size="small"
									name="contractName"
								></RHFTextField>
							</div>
							<div>
								<FieldHeader title="Contract Path" />
								<RHFTextField
									placeholder="/contracts/ContractFile.sol"
									size="small"
									name="contractPath"
								></RHFTextField>
							</div>
							<div>
								<FieldHeader title="Constructor Arguments" />
								<RHFTextField
									placeholder="0x"
									size="small"
									name="contructorArguments"
								></RHFTextField>
							</div>
						</div>
					)}
				</FormProvider>
			</div>

			<Divider sx={{ my: 5 }} />

			<Stack
				className="w-full px-6 pb-10 sm:!flex-col"
				flexDirection={'row'}
				alignItems="center"
				justifyContent="center"
				gap={1}
			>
				<Button
					className="w-[150px] sm:!mb-2 sm:w-full"
					onClick={handleSubmit(onSubmit)}
				>
					Verify and Publish
				</Button>
				<Button
					className="w-[150px] sm:w-full"
					color="inherit"
					onClick={() => {
						plausible('Verify Contract-Reset')
						resetCompilerConfig()
						reset()
					}}
				>
					Reset
				</Button>
			</Stack>

			<Dialog
				open={showPublishResultModal}
				onClose={() => {
					if ('success' === publishResult) {
						router.push(
							generatePath(ROUTES.BLOCK_CHAIN.DETAIL.ADDRESS, {
								address: contractAddress,
							}),
						)
					}
					setShowPublishResultModal(false)
				}}
			>
				<div className="flex-center flex-col p-10 dark:text-[#CDCDCD]">
					<Image
						style={{ animationDuration: '2s' }}
						className={classNames(
							'mb-[36px]',
							'loading' === publishResult && 'animate-spin',
						)}
						width={94}
						src={getImgSrc(
							`contract/${
								'loading' === publishResult
									? 'verify_loading'
									: 'fail' === publishResult
									  ? 'verify_failed'
									  : 'verify_success'
							}`,
						)}
						alt=""
					/>
					<div className="font-medium mb-[4px]">
						{'loading' === publishResult ? (
							<DotText text="Waiting" />
						) : 'fail' === publishResult ? (
							'Sorry.'
						) : (
							'Congratulation!'
						)}
					</div>
					<div className="font-normal">
						{'loading' === publishResult ? (
							<div>Your contract is under verification.</div>
						) : 'fail' === publishResult ? (
							<>
								<div>Your contract has not verified.</div>
								{/* <div className="mt-[4px]">Please check your submission again.</div> */}
								<div className="mt-[4px]">
									{queryVerifyStatus?.result || queryZksyncVerifyStatus?.error}
								</div>
							</>
						) : (
							<div className="flex flex-col justify-center items-center">
								<div>Your contract has verified.</div>
								<Link
									className="text-primary text-center underline"
									href={GLE_FOMRS.PUBLIC_TAG.route}
								>
									Submit your public tags
								</Link>
							</div>
						)}
					</div>
				</div>
			</Dialog>
		</div>
	)
}

export default ContractPublish
