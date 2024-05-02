import React, { useEffect, useState } from 'react'

import { ChevronsUpDown, Loader2, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { isAddress } from 'viem'

import AddressActivity from '@/components/address/activity'
import PageTitle from '@/components/common/page-title'
import { Button } from '@/components/ui/button'
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import Container from '@/layout/container'
import { trpc } from '@/utils/trpc'

export const MAX_WATCH_LIMIT = 50

const MyAccountsList: React.FC = () => {
	const {
		isFetching,
		data: myAccountsList,
		refetch,
	} = trpc.account.getMyAccountsList.useQuery()
	const { isLoading: addLoading, mutateAsync: addMyAccountsList } =
		trpc.account.addMyAccountsList.useMutation()
	const { isLoading: deleteLoading, mutateAsync: deleteMyAccountsList } =
		trpc.account.deleteMyAccountsList.useMutation()

	const [openDialog, setOpenDialog] = useState(false)
	const [activeAddress, setActiveAddress] = useState('')
	const [inputAddress, setInputAddress] = useState('')

	useEffect(() => {
		setActiveAddress(myAccountsList?.list?.[0] || '')
	}, [myAccountsList?.list])

	return (
		<Container>
			<PageTitle
				title={
					<div className="w-full flex justify-between items-center">
						<div className="mr-2">My Accounts</div>
						{!!!myAccountsList?.list?.length && (
							<Dialog
								open={openDialog}
								onOpenChange={(open) => setOpenDialog(open)}
							>
								<DialogTrigger asChild>
									<Button size="sm" onClick={() => setOpenDialog(true)}>
										Add Address
									</Button>
								</DialogTrigger>
								<DialogContent className="sm:max-w-[425px]">
									<DialogHeader>
										<DialogTitle>Add New Address</DialogTitle>
									</DialogHeader>
									<div className="grid grid-cols-2 items-center gap-4">
										<Input
											id="address"
											placeholder="Input your address..."
											className="col-span-3"
											onChange={({ target }) => setInputAddress(target.value)}
										/>
									</div>
									<DialogFooter>
										<Button
											type="submit"
											disabled={!!addLoading || !isAddress(inputAddress)}
											onClick={async () => {
												await addMyAccountsList(inputAddress)
												refetch()
												setOpenDialog(false)
												setActiveAddress(inputAddress)
												setInputAddress('')
												toast.success('Successfully added address')
											}}
										>
											{!!addLoading && (
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											)}
											Confirm
										</Button>
									</DialogFooter>
								</DialogContent>
							</Dialog>
						)}
					</div>
				}
			/>

			<div className="flex flex-col space-y-6">
				{isFetching && <Skeleton className="h-6 w-[300px] sm:w-[150px]" />}

				{myAccountsList?.list?.map((address) => (
					<Collapsible
						key={address}
						open={activeAddress === address}
						onOpenChange={(isOpen) => setActiveAddress(isOpen ? address : '')}
						className="space-y-2"
					>
						<div className="flex items-center text-base mb-4 space-x-4">
							<div className="flex items-center space-x-2">
								<div className="break-all sm:text-14">{address}</div>
								<Button
									className="w-6 h-6"
									size="icon"
									variant="destructive"
									disabled={deleteLoading}
									onClick={async () => {
										await deleteMyAccountsList(address)
										refetch()
										toast.success('Successfully delete address')
									}}
								>
									{deleteLoading ? (
										<Loader2 className="h-3 w-3 animate-spin" />
									) : (
										<Trash2 className="w-3 h-3" />
									)}
								</Button>
							</div>
							{/* <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-9 p-0">
                  <ChevronsUpDown className="h-4 w-4" />
                  <span className="sr-only">Toggle</span>
                </Button>
              </CollapsibleTrigger> */}
						</div>
						<CollapsibleContent>
							<AddressActivity address={address} />
						</CollapsibleContent>
					</Collapsible>
				))}
			</div>
		</Container>
	)
}

export default MyAccountsList
