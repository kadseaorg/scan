import { useRef, useState } from 'react'
import CopyToClipboard from 'react-copy-to-clipboard'

import { Grid, Stack } from '@mui/material'
import classNames from 'classnames'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { toast } from 'sonner'

import { TextAreaRow } from '@/components/common/table-col-components'
import { TIPS } from '@/constants'
import { getImgSrc } from '@/utils'

import { useContractTabContext } from './ContractTabProvider'
import ButtonMenuPopoverOpenIn from './button-menu-popover/ButtonMenuPopoverOpenIn'
import ButtonMenuPopoverOutline from './button-menu-popover/ButtonMenuPopoverOutline'

const AceEditor = dynamic(
	() => import('../../common/editor/AceEditorWithRef'),
	{
		ssr: false,
	},
)

const ICON_CLASS = 'cursor-pointer transition-all duration-300 hover:opacity-70'

const ContractTabCode = () => {
	const { contractDetail } = useContractTabContext()
	const aceRef = useRef(null)
	const [editorInstance, setEditorInstance] = useState(null)

	const codeSources = contractDetail?.codeSources

	let source
	try {
		source = JSON.parse(contractDetail?.sourcecode as string)
	} catch (error) {
		source = null
	}

	return (
		<Stack spacing={2}>
			<div className="flex items-center gap-2 sm:flex-col sm:items-start">
				<div className="flex items-center gap-2">
					<Image width={16} src={getImgSrc('contract/right')} alt="" />
					<span className="font-medium">Contract Source Code Verified</span>
				</div>
				<span className="font-normal ml-[4px] text-[#999]">(Exact Match)</span>
			</div>
			<Grid
				container
				spacing={2}
				className="mb-6 px-[34px] py-[14px] rounded sm:px-0 sm:pt-0 sm:space-y-4"
			>
				{[
					{ label: 'Contract Name', value: contractDetail?.name },
					{
						label: 'Contract Version',
						value: contractDetail?.compiler_version,
					},
					{
						label: 'Optimization Enabled',
						value: contractDetail?.optimization_runs,
					},
					{ label: 'Other Settings', value: 'default evmVersion' },
				]?.map(({ label, value }) => (
					<Grid className="sm:!p-0" item key={label} xs={12} sm={6} md={3}>
						<div className="font-normal">
							<div className="text-[#666] mb-[6px]">{label}:</div>
							<div>{value}</div>
						</div>
					</Grid>
				))}
			</Grid>
			<div className="flex items-center gap-2 sm:flex-col sm:items-start">
				<div className="flex items-center">
					<span className="font-medium">Contract Source Code</span>
					<span className="font-normal ml-[4px] text-[#999]">
						({source?.language ?? 'Solidity'})
					</span>
				</div>
				<div className="flex items-center sm:items-start gap-2">
					<ButtonMenuPopoverOpenIn />
					<ButtonMenuPopoverOutline editorInstance={editorInstance} />
				</div>
			</div>
			{codeSources?.map(({ name, content }) => (
				<div key={name}>
					<div className="flex justify-between items-center text-xs text-[#666] mb-3">
						<span className="sm:break-all sm:mr-4">{name}</span>
						<div className="flex-center">
							<CopyToClipboard
								text={content}
								onCopy={() => toast.success(TIPS.copied)}
							>
								<Image
									className={classNames(ICON_CLASS, 'mr-[16px] sm:mr-2')}
									width={28}
									src={getImgSrc('contract/copy')}
									alt=""
								/>
							</CopyToClipboard>

							<CopyToClipboard
								text={location?.href}
								onCopy={() => toast.success(TIPS.copied)}
							>
								<Image
									className={ICON_CLASS}
									width={28}
									src={getImgSrc('contract/link')}
									alt=""
								/>
							</CopyToClipboard>

							{/* <Image className={ICON_CLASS} width={28} src={getImgSrc('contract/full')} alt="" /> */}
						</div>
					</div>
					<AceEditor
						ref={aceRef}
						className="border-1px border-border border-solid"
						mode="typescript"
						theme="xcode"
						onMount={setEditorInstance}
						editorProps={{ $blockScrolling: true }}
						style={{ width: '100%' }}
						value={content}
						showPrintMargin={false}
						readOnly
					/>
				</div>
			))}
			<div className="flex justify-between items-center mt-[34px] mb-3">
				<div className="font-medium">Contract ABI</div>
				<CopyToClipboard
					text={(contractDetail?.abi as string) ?? ''}
					onCopy={() => toast.success(TIPS.copied)}
				>
					<Image
						className={classNames(ICON_CLASS, 'mr-[16px]')}
						width={28}
						src={getImgSrc('contract/copy')}
						alt=""
					/>
				</CopyToClipboard>
			</div>
			<TextAreaRow
				className="w-full mb-3"
				value={contractDetail?.abi as string}
			/>
		</Stack>
	)
}

export default ContractTabCode
