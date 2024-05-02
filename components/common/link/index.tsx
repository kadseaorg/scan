import { CSSProperties, ReactNode } from 'react'
import { generatePath } from 'react-router-dom'

import { getAddress, isAddress } from '@ethersproject/address'
import classNames from 'classnames'
import Image from 'next/image'

import SimpleTooltip from '@/components/common/simple-tooltip'
import ROUTES from '@/constants/routes'
import { cn } from '@/lib/utils'
import { LinkTypeEnum } from '@/types'
import { getL1ExplorerUrl, stringifyQueryUrl } from '@/utils'

import { CopyButton } from '../copy-button'

type LinkPropsType = {
	style?: CSSProperties
	className?: string
	title?: string
	type: LinkTypeEnum
	value: string | number | undefined | null
	children?: ReactNode
	ellipsis?: boolean
	width?: number | string
	target?: string
	withTooltip?: boolean
}

export const getLinkRoute = (
	type: LinkTypeEnum | undefined,
	value: any = '',
) => {
	const _value = isAddress(value) ? getAddress(value) : value

	switch (type) {
		case LinkTypeEnum.URL:
			return _value
		case LinkTypeEnum.DAPP:
			return generatePath(ROUTES.DAPPS.DETAIL.DAPP, { id: _value })
		case LinkTypeEnum.BLOCK:
			return generatePath(ROUTES.BLOCK_CHAIN.DETAIL.BLOCK, { block: _value })

		case LinkTypeEnum.BLOCKS:
			// TODO: is this wrong?
			return stringifyQueryUrl(ROUTES.BLOCK_CHAIN.TXNS, { block: _value })

		case LinkTypeEnum.BATCH:
			return generatePath(ROUTES.BLOCK_CHAIN.DETAIL.BATCH, { batch: _value })

		case LinkTypeEnum.BATCHES:
			return stringifyQueryUrl(ROUTES.BLOCK_CHAIN.BATCHES, { batch: _value })

		case LinkTypeEnum.BATCHBLOCKS:
			return generatePath(ROUTES.BLOCK_CHAIN.DETAIL.BATCH_BLOCKS, {
				batch: _value,
			})

		case LinkTypeEnum.CONTRACT_INTERNAL_TXS:
			return stringifyQueryUrl(ROUTES.BLOCK_CHAIN.TXNS, {
				internalBlock: _value,
			})

		case LinkTypeEnum.TX:
			return generatePath(ROUTES.BLOCK_CHAIN.DETAIL.TX, { tx: _value })

		case LinkTypeEnum.CONTRACT:
			return generatePath(ROUTES.BLOCK_CHAIN.DETAIL.ADDRESS, {
				address: _value,
			})

		case LinkTypeEnum.ADDRESS:
			return generatePath(ROUTES.BLOCK_CHAIN.DETAIL.ADDRESS, {
				address: _value,
			})

		case LinkTypeEnum.TOKEN:
			return generatePath(ROUTES.BLOCK_CHAIN.DETAIL.TOKEN, { token: _value })

		case LinkTypeEnum.CROSS_BROWSER_TX:
			return getL1ExplorerUrl(_value)

		case LinkTypeEnum.CHARTS:
			return generatePath(ROUTES.CHARTS.DETAIL, { chart: _value })

		case LinkTypeEnum.URL:
			return _value

		case LinkTypeEnum.INSCRIPTION:
			return generatePath(ROUTES.INSCRIPTIONS.DETAIL.INSCRIPTION, {
				tick: _value,
			})

		default:
			return ROUTES.HOME
	}
}

const Link: React.FC<LinkPropsType> = ({
	style = {},
	className = '',
	title = '',
	type,
	value,
	children,
	ellipsis = false,
	width = 150,
	target,
	withTooltip = true,
}) => {
	const _value: any = children ?? value
	const data = isAddress(_value || '') ? getAddress(_value || '') : _value
	if (data === undefined || data === null) {
		return <div>-</div>
	}

	const Content = () => {
		if (
			[LinkTypeEnum.BLOCK, LinkTypeEnum.BLOCKS].includes(type) ||
			!withTooltip
		) {
			return ellipsis ? (
				<div
					style={{ width: `${width}px` }}
					className="ellipsis dark:text-primary"
				>
					{data}
				</div>
			) : (
				<>{data}</>
			)
		} else {
			return (
				<SimpleTooltip content={title || data}>
					{ellipsis ? (
						<div
							style={{ width: `${width}px` }}
							className="ellipsis dark:text-primary"
						>
							{data}
						</div>
					) : (
						<>{data}</>
					)}
				</SimpleTooltip>
			)
		}
	}

	return (
		<a
			style={{
				...style,
			}}
			className={cn('text-accent sm:break-all', className)}
			href={getLinkRoute(
				type,
				isAddress((value as any) || '')
					? getAddress((value as any) || '')
					: value,
			)}
			target={target}
			onClick={(e) => e.stopPropagation()}
		>
			<Content />
		</a>
	)
}

export default Link

export const AddressLinkWithCopy: React.FC<{
	address: string
	className?: string
	width?: number
}> = ({ address, className, width }) => {
	return (
		<div className={classNames('flex items-center', className)}>
			<Link
				type={LinkTypeEnum.ADDRESS}
				value={address}
				ellipsis={true}
				width={width}
			/>
			<CopyButton value={address} />
		</div>
	)
}

export const TokenLink: React.FC<{
	className?: string
	name?: string
	symbol?: string
	tokenAddress: string
	ellipsis?: boolean
	img?: string
	imgSize?: number
	imgLineHeight?: number
	desc?: string
}> = ({
	className = '',
	name = '',
	symbol = '',
	tokenAddress,
	ellipsis = false,
	img,
	imgSize = 18,
	desc = '',
}) => {
	return (
		<>
			<div className={classNames('flex items-center', className)}>
				{!!img && (
					<Image
						className="mr-[8px] mb-[1px]"
						width={imgSize}
						height={imgSize}
						src={img}
						alt=""
					/>
				)}
				<Link
					type={LinkTypeEnum.TOKEN}
					value={tokenAddress}
					ellipsis={!!name || !!symbol ? false : ellipsis}
				>
					{!!name || !!symbol
						? `${name?.replace(/&#39;/g, `'`)}${
								!!name && !!symbol ? ' (' : ''
						  }${symbol}${!!name && !!symbol ? ')' : ''}`
						: tokenAddress}
				</Link>
			</div>
			{!!desc && (
				<div
					style={{ paddingLeft: `${imgSize + 8}px` }}
					className="text-xs text-[#999] mt-[2px] max-w-[800px] break-words"
				>
					{desc}
				</div>
			)}
		</>
	)
}
