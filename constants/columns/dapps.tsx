import { Box, Stack, Typography } from '@mui/material'
import { ColumnDef } from '@tanstack/react-table'
import { Loader2, Star } from 'lucide-react'
import Image from 'next/image'

import Label from '@/components/common/label/Label'
import Link from '@/components/common/link'
import SimpleTooltip from '@/components/common/simple-tooltip'
import ValueFluctuation from '@/components/common/value/ValueFluctuation'
import { LinkTypeEnum } from '@/types'
import { EnumChainType } from '@/types/chain'
import { formatNumWithSymbol } from '@/utils'

import { CHAIN_TYPE } from '../chain'

export const dappsTableColumns: ColumnDef<any>[] = [
	{
		header: '#',
		accessorKey: '',
		cell: ({ row }) => {
			return <Typography variant="body1">{row.index + 1}</Typography>
		},
	},
	{
		header: 'Dapp',
		accessorKey: 'name',
		cell: ({ row }) => {
			const id = row.original.id
			const logo = row.original.logo
			return (
				<div className="flex gap-3 items-center">
					<Image
						className="object-contain rounded-md"
						alt=""
						width={28}
						height={28}
						src={logo}
					/>
					<Link
						type={LinkTypeEnum.DAPP}
						value={id}
						className="flex items-center flex-col whitespace-nowrap"
					>
						<span>{row.getValue('name')}</span>
					</Link>
				</div>
			)
		},
	},
	{
		header: 'Category',
		accessorKey: 'categories',
		cell: ({ row }) => {
			const categories = (row.getValue('categories') as any) || []
			return (
				<Stack flexDirection={'row'} gap={1}>
					{categories.map((tag: string) => (
						<Label className="rounded-xl opacity-100 px-3" key={tag}>
							{tag.toUpperCase()}
						</Label>
					))}
				</Stack>
			)
		},
	},
	{
		// header: ({ column }) => {
		//   const isSorted = column.getIsSorted()
		//   const isAsc = isSorted === 'asc'

		//   return (
		//     <Button
		//       variant="text"
		//       color="inherit"
		//       endIcon={
		//         <Stack>
		//           <ChevronUpIcon height={16} color={isSorted && isAsc ? 'red' : 'gray'} />
		//           <ChevronDownIcon height={16} color={isSorted && !isAsc ? 'red' : 'gray'} />
		//         </Stack>
		//       }
		//       onClick={() => {
		//         column.toggleSorting(isAsc)
		//       }}>
		//       UAW
		//     </Button>
		//   )
		// },
		header: 'UAW',
		accessorKey: 'uaw_count',
		cell: ({ row }) => {
			const uaw_growth_percentage = row.original.uaw_growth_percentage
			const value = row.original.uaw_count
			return (
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'space-between',
						flexDirection: 'row',
						flexWrap: 'wrap',
						width: '70%',
					}}
				>
					<span>{formatNumWithSymbol(value)}</span>
					<span>
						{
							<ValueFluctuation
								value={uaw_growth_percentage}
								isPercentage={true}
							/>
						}
					</span>
				</Box>
			)
		},
	},
	{
		// header: ({ column }) => {
		//   const isSorted = column.getIsSorted()
		//   const isAsc = isSorted === 'asc'

		//   return (
		//     <Button
		//       variant="text"
		//       color="inherit"
		//       endIcon={
		//         <Stack>
		//           <ChevronUpIcon height={16} color={isSorted && isAsc ? 'red' : 'gray'} />
		//           <ChevronDownIcon height={16} color={isSorted && !isAsc ? 'red' : 'gray'} />
		//         </Stack>
		//       }
		//       onClick={() => {
		//         column.toggleSorting(isAsc)
		//       }}>
		//       TXN
		//     </Button>
		//   )
		// },
		header: 'TXN',
		accessorKey: 'txn_count',
		cell: ({ row }) => {
			const txn_growth_percentage = row.original.txn_growth_percentage
			const value = row.original.txn_count
			return (
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'space-between',
						flexDirection: 'row',
						flexWrap: 'wrap',
						width: '70%',
					}}
				>
					<span>{formatNumWithSymbol(value)}</span>
					<span>
						{
							<ValueFluctuation
								value={txn_growth_percentage}
								isPercentage={true}
							/>
						}
					</span>
				</Box>
			)
		},
	},
].filter(
	// dont show uaw if chain is zksync
	(column) =>
		!(
			CHAIN_TYPE === EnumChainType.ZKSYNC && column.accessorKey === 'uaw_count'
		),
)

export const getDappTableColumns = (
	handleAddFavorite?: (id: number, isAdd: boolean) => void,
) => {
	return [
		...dappsTableColumns,
		{
			id: 'add_favorite',
			header: '',
			cell: ({ row }) =>
				row.original.isUpdating ? (
					<Loader2 size={16} className="animate-spin" />
				) : (
					<SimpleTooltip
						content={
							row.original.is_favorite
								? 'Remove from favorite tokens'
								: 'Add to favorite tokens'
						}
					>
						<Star
							className="cursor-pointer"
							size={16}
							fill={row.original.is_favorite ? 'yellow' : undefined}
							onClick={() =>
								handleAddFavorite?.(row.original.id, !row.original.is_favorite)
							}
						/>
					</SimpleTooltip>
				),
		},
	]
}
