import { CSSProperties, useEffect, useState } from 'react'

import { AvatarImage } from '@radix-ui/react-avatar'
import { Loader2, Search } from 'lucide-react'
import { usePlausible } from 'next-plausible'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useDebounce } from 'usehooks-ts'

import { Chat } from '@/components/chat/chat'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { LinkTypeEnum } from '@/types'
import { PlausibleEvents } from '@/types/events'
import { getImgSrc } from '@/utils'
import { trpc } from '@/utils/trpc'

import { getLinkRoute } from '../link'

let loading = false

const SearchInput: React.FC<{ style?: CSSProperties; className?: string }> = ({
	style,
	className,
}) => {
	const plausible = usePlausible<PlausibleEvents>()
	const router = useRouter()
	const [content, setContent] = useState<string>('')
	const { isLoading, mutateAsync: search } =
		trpc.util.searchMutation.useMutation()
	const [showErrorModal, setShowErrorModal] = useState(false)
	const [isPopoverOpen, setIsPopoverOpen] = useState(false)
	const [searchResults, setSearchResults] = useState<Array<{
		name: string
		value: string
		type: string
		token_type: string
	}> | null>(null)
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
	const debouncedContent = useDebounce(content, 500)
	const [chatId, setChatId] = useState<string>('')

	const doSearch = async () => {
		try {
			if (loading || !debouncedContent) return
			loading = true
			const { result } = await search(debouncedContent)
			if (typeof result === 'string') {
				router.push(
					getLinkRoute(
						(result as LinkTypeEnum) || LinkTypeEnum.ADDRESS,
						debouncedContent,
					),
				)
			} else if (result === null) {
				setShowErrorModal(true)
			} else if (Array.isArray(result)) {
				setSearchResults(result)
				setIsPopoverOpen(true)
				setShowErrorModal(false)
			}
		} catch (error) {
			console.error(error)
		} finally {
			loading = false
		}
	}

	const renderResults = (type?: string, tokenType?: string) => {
		if (type || tokenType) {
			let results: typeof searchResults | undefined
			if (tokenType) {
				results = searchResults?.filter(
					(item) => item.type === 'token' && item.token_type === tokenType,
				)
			} else if (type) {
				results = searchResults?.filter((item) => item.type.includes(type))
			}

			if (!results || results.length === 0) return null

			return (
				<div className="p-2">
					<div className="capitalize text-sm font-semibold text-muted-foreground mb-2">
						{type}
						<span className="uppercase px-1">
							{type === 'token' ? `(${tokenType})` : ''}
						</span>
					</div>
					<ResultList results={results} />
				</div>
			)
		}
		const tokensErc20 = searchResults?.filter(
			(item) => item.type === 'token' && item.token_type === 'erc20',
		)
		const tokensErc721 = searchResults?.filter(
			(item) => item.type === 'token' && item.token_type === 'erc721',
		)
		const tokensErc1155 = searchResults?.filter(
			(item) => item.type === 'token' && item.token_type === 'erc1155',
		)
		const contracts = searchResults?.filter((item) =>
			item.type.includes('contract'),
		)
		const dapps = searchResults?.filter((item) => item.type === 'dapp')

		return (
			<div>
				{tokensErc20 && tokensErc20.length > 0 && (
					<GroupedList title="Tokens (ERC20)" results={tokensErc20} />
				)}
				{tokensErc721 && tokensErc721?.length > 0 && (
					<GroupedList title="Tokens (ERC721)" results={tokensErc721} />
				)}
				{tokensErc1155 && tokensErc1155?.length > 0 && (
					<GroupedList title="Tokens (ERC1155)" results={tokensErc1155} />
				)}
				{contracts && contracts?.length > 0 && (
					<GroupedList title="Contracts" results={contracts} />
				)}
				{dapps && dapps?.length > 0 && (
					<GroupedList title="Dapps" results={dapps} />
				)}
			</div>
		)
	}

	const GroupedList = ({ title, results }: { title: string; results: any }) => (
		<div className="p-2">
			<div className="capitalize text-sm font-semibold text-muted-foreground mb-2">
				{title}
			</div>
			<ResultList results={results} />
		</div>
	)

	const ResultList = ({ results }: { results: any }) => (
		<ul>
			{results?.map((item: any, index: number) => (
				<li
					className="flex items-center justify-between py-2 border-b"
					key={index}
				>
					<div className="flex items-center">
						<div className="flex flex-row items-center gap-2">
							{item.logo && (
								<Avatar className="w-8 h-8">
									<AvatarImage src={item.logo} alt="" />
								</Avatar>
							)}
							{item.type === 'dapp' ? (
								<Link
									className="text-sm font-semibold text-primary"
									href={getLinkRoute(item.type as LinkTypeEnum, item.value)}
								>
									{item.name}
								</Link>
							) : (
								<div className="flex flex-col">
									<p className="text-sm font-semibold">{item.name}</p>
									<Link
										className="text-sm text-primary"
										href={getLinkRoute(item.type as LinkTypeEnum, item.value)}
									>
										{item.value}
									</Link>
								</div>
							)}
						</div>
					</div>
				</li>
			))}
		</ul>
	)

	return (
		<section
			style={style}
			className={cn('flex items-center gap-1 text-muted-foreground', className)}
		>
			<Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
				<PopoverTrigger />
				<Search size={24} />
				<Input
					className="border-none focus-visible:ring-0 sm:text-sm outline-none"
					placeholder="Search by Address / Txn Hash / Block / Token"
					onInput={(e) => setContent(e.currentTarget.value)}
					onKeyDown={(e) => e.key === 'Enter' && doSearch()}
				/>
				{content && !isLoading && (
					<kbd className="p-1 text-xs rounded-sm border">Enter</kbd>
				)}
				{isLoading && <Loader2 className="animate-spin" size={24} />}
				<PopoverContent
					className="w-[520px] h-[350px] overflow-auto rounded-2xl shadow-xl p-4"
					align="start"
					sideOffset={20}
				>
					<div className="flex flex-row gap-2">
						<Button
							variant={'outline'}
							size={'sm'}
							className="text-xs"
							onClick={() => setSelectedCategory(null)}
						>
							All
						</Button>
						<Button
							variant={'outline'}
							size={'sm'}
							className="text-xs"
							onClick={() => setSelectedCategory('erc20')}
						>
							Tokens (ERC 20)
						</Button>
						<Button
							variant={'outline'}
							size={'sm'}
							className="text-xs"
							onClick={() => setSelectedCategory('erc721')}
						>
							NFTs (ERC 721 & 1155)
						</Button>
						<Button
							variant={'outline'}
							size={'sm'}
							className="text-xs"
							onClick={() => setSelectedCategory('contract')}
						>
							Contracts
						</Button>
						<Button
							variant={'outline'}
							size={'sm'}
							className="text-xs"
							onClick={() => setSelectedCategory('dapp')}
						>
							Dapps
						</Button>
					</div>

					<div className="py-3">
						{selectedCategory === null && renderResults()}
						{selectedCategory === 'erc20' && renderResults('token', 'erc20')}
						{selectedCategory === 'erc721' && renderResults('token', 'erc721')}
						{selectedCategory === 'erc721' && renderResults('token', 'erc1155')}
						{selectedCategory === 'contract' && renderResults('contract')}
						{selectedCategory === 'dapp' && renderResults('dapp')}
					</div>
				</PopoverContent>
			</Popover>

			<Dialog>
				<DialogTrigger asChild>
					<Button
						size="sm"
						variant="outline"
						className="rounded-xl whitespace-nowrap"
						onClick={() => {
							plausible('AI-Ask')
							// set chatId to a random string to force the chat to reload
							setChatId(Math.random().toString(36).substring(7))
						}}
					>
						Ask AI
					</Button>
				</DialogTrigger>
				<DialogContent
					onInteractOutside={(e) => e.preventDefault()}
					className="max-w-6xl h-[calc(100vh-56px)] sm:h-[calc(100vh-56px-36px)] rounded-2xl z-50 backdrop-blur-sm overflow-y-scroll sm:px-0"
				>
					<Chat id={chatId} />
				</DialogContent>
			</Dialog>

			<Dialog
				open={showErrorModal}
				onOpenChange={(open) => {
					setShowErrorModal(open)
					setContent('')
				}}
			>
				<DialogContent>
					<div className="flex-center flex-col py-[30px]">
						<Image
							className="mb-[36px]"
							width={94}
							src={getImgSrc('contract/verify_failed')}
							alt=""
						/>
						<div className="font-medium mb-[4px]">Search not found</div>
						<div className="font-normal">
							Oops! This is an invalid search string.
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</section>
	)
}

export default SearchInput
