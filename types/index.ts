import { Hash } from 'viem'

import { ContractCompilerTypeEnum } from './contract'

export type ApiResponse<T = any> = (T & Record<string, any>) | string

export type ApiPaginationResponse<T = any> = {
	count: number
	list: T[]
}

export type ApiPaginationParams<T = any> = {
	page: number
	limit: number
} & T

export type PaginationParams = {
	take: number
	before: number | undefined
	after: number | undefined
	isLast: boolean
}

export type PaginationCursorParams = {
	cursor?: number | undefined
	take: number
	desc: boolean
}

export enum LinkTypeEnum {
	URL = 'url',
	DAPP = 'dapp',
	BLOCK = 'block',
	BLOCKS = 'blocks',
	BATCH = 'batch',
	BATCHES = 'batches',
	BATCHBLOCKS = 'batch-blocks',
	CONTRACT_INTERNAL_TXS = 'txs',
	TX = 'transaction',
	CONTRACT = 'address-contract',
	ADDRESS = 'address-user',
	TOKEN = 'token',
	CROSS_BROWSER_TX = 'cross-browser-tx',
	CHARTS = 'charts',
	INSCRIPTION = 'inscription',
}

export enum L1StatusTypeEnum {
	// scroll status
	COMMITTED = 'committed',
	FINALIZED = 'finalized',

	// zksync-era status
	PENDING = 'pending',
	INCLUDED = 'included',
	SEALED = 'sealed',
	UNCOMMITTED = 'uncommitted',
	VERIFIED = 'verified',
	FAILED = 'failed',
}

export const L1StatusType = ['Uncommitted', 'Committed', 'Finalized', 'Skipped']

export type BlockType = {
	number: number
	hash: string
	transaction_count: number
	internal_transaction_count: number | null
	validator: string
	difficult: number | null
	total_difficult: number | null
	size: number
	gas_used: number
	gas_limit: number
	extra_data: string
	parent_hash: string
	sha3_uncle: string
	timestamp: number
	l1_batch_number: number
	l1_batch_timestamp: number
	l1_status: string
}

export type BlockListType = ApiPaginationResponse<BlockType>

export enum TxStatusTypeEnum {
	FAILED = 0,
	SUCCEED = 1,
}

export const TxStatusType = ['Failed', 'Success']

export enum TxCrossTransferTypeEnum {
	DEPOSIT = 0,
	WITHDRAW = 1,
}

export const TxCrossTransferType = ['Deposit', 'Withdraw']

export type TokensTransferItemType = {
	token_address: string
	token_type: string
	decimals: number
	from_address: string
	name: string
	symbol: string
	to_address: string
	token_id: string
	value: string
	logo_path: string
}

export type CrossTransferItemType = {
	type: TxCrossTransferTypeEnum
	l1TransactionHash: string
	l1Token: string
	l2Token: string
	from_: string
	to: string
	amount: string
	symbol: string
	decimals: number
}

export type InternalTxType = {
	blockHash: string
	blockNumber: number
	from: string
	from_tag: string | null
	gasLimit: number | null
	op: string
	parentTransactionHash: string
	to: string
	to_tag: string | null
	typeTraceAddress: string
	value: string
}

export type InternalTxListType = ApiPaginationResponse<InternalTxType>

export type TxType = {
	hash: string
	block_hash: string
	block_number: number
	from_address: string
	to_address: string
	value: string
	fee: string
	l1fee: null | number
	gas_used: number
	gas_price: number
	gas_limit: number
	method_id: string
	input: string
	nonce: number
	status: number
	transaction_index: number
	transaction_type: string
	max_priority: null
	max_fee: null
	revert_reason: null
	l1_batch_number: number
	l1_batch_tx_index: number
	l1_status: string
	methodName: string
	timestamp: number
}

export type DecodedInputDataType = {
	index: number
	internalType: string
	name: string
	type: string
	value: string
}

export type TxListType = ApiPaginationResponse<TxType>

export type TxLogItemType = {
	address: string
	blockHash: string
	blockNumber: string
	data: string
	log_index: number
	removed: boolean
	topics: string[]
	topic0?: string
	topic1?: string
	topic2?: string
	topic3?: string
	topic4?: string
	transactionHash: string
	transactionIndex: number
	abi?: string
	eventAbi?: string
	eventFullName?: string
	eventName?: string
	guessedEventName?: string
}

export type TxLogType = {
	list: TxLogItemType[]
}

export type BatchType = {
	number: number
	root_hash: string
	commit_tx_hash: string
	committed_at: string
	prove_tx_hash: string
	proven_at: string
	l1_tx_count: number
	l2_tx_count: number
	status: string
}

export type BatchListType = ApiPaginationResponse<BatchType>

// token list
export enum TokenTypeEnum {
	ERC20 = 'erc20',
	ERC721 = 'erc721',
	ERC1155 = 'erc1155',
}

export type TokenType = {
	id: bigint
	name?: string
	symbol?: string
	address: string
	decimals?: number
	total_supply?: string
	token_type?: string
}

export type ContractType = {
	id: bigint
	name?: string
	address: string
	deployer?: string
	creation_tx_hash?: string
	bytecode?: string
	abi?: any
	constructor_arguments?: string
	sourcecode?: string
	compiler_version?: string
	optimization?: boolean
	optimization_runs?: number
	evm_version?: string
	is_verified?: boolean
}

export type TokenDetailType = TokenType & {
	holders: number
	contractAddress_tag: string | null
}

export type TokenListType = ApiPaginationResponse<TokenType>

// token tx list
export type TokenTxType = {
	id: number
	transaction_hash: string
	log_index: number
	token_address: string
	block_number: number
	block_hash: string
	from_address: string
	to_address: string
	value: string
	amount: null | any
	token_id: null | any
	amounts: null | any
	token_ids: null | any
	token_type: string
	timestamp: null | any
	name: string
	symbol: string
	decimals: number
	logo_path?: string
}

export type TokenTxListType = ApiPaginationResponse<TokenTxType>

// token holders list
export type TokenHolderType = {
	address: string
	address_tag: string
	percentage: string
	balance: string
	tokenId: string
}

export type TokenHoldersListType = ApiPaginationResponse<TokenHolderType>

export enum ContractTypeEnum {
	ERC20 = 1,
	ERC721 = 2,
	ERC1155 = 3,
}

export type ContractDetailType = {
	id: bigint
	name: string | null
	address: string
	creator: string | null
	creation_tx_hash: string | null
	creation_bytecode: string | null
	deployed_bytecode: string | null
	bytecode?: string // zksync era specific
	abi: any
	constructor_arguments: string | null
	codeSources: { name: string; content: string }[]
	sourcecode: string | null
	outlineAst: {
		children: any[]
		type: string
		loc: any
	}
	compiler_version: string | null
	optimization: boolean | null
	optimization_runs: number | null
	evm_version: string | null
	is_verified: boolean | null
	inserted_at: Date
	updated_at: Date
}

export type ContractVerifyParamsType = {
	contractCompilerType: ContractCompilerTypeEnum
	upload_id: string
	contract_address: string
	compiler: string
	optimization?: boolean
	optimize_count?: number
	librarys?: {}
	evm?: string
	license?: string
}

export enum ContractVerifyStatus {
	FAILED = -1,
	UNPROCESSED = 0,
	SUCCESS = 1,
	VERIFIED = 2,
	PROCESSION = 3,
}

export type Last14DaysTxCountStatisticsType = {
	last2weeks_count: number[][]
}

export type TxCountStatisticsType = {
	count: number[][]
}

export type StatisticsTimeQueryType = {
	timeStart: number
	timeEnd: number
}

export type CountStatisticsType = {
	date: string
	count: number
}[]

export type AddressTokenBalanceType = {
	name: string
	symbol: string
	token_address: string
	logo_path: string
	balance: string
	token_id: string
	decimals: number
}

// account

export enum NotificationMethod {
	NO_NOTIFICATION = 'NO_NOTIFICATION',
	INCOMING_OUTGOING = 'INCOMING_OUTGOING',
	INCOMING_ONLY = 'INCOMING_ONLY',
	OUTGOING_ONLY = 'OUTGOING_ONLY',
}

export type TraceTransactionSchema = {
	Parameters: [
		hash: Hash,
		options:
			| {
					disableStorage?: boolean
					disableStack?: boolean
					enableMemory?: boolean
					enableReturnData?: boolean
					tracer?: string
			  }
			| {
					timeout?: string
					tracerConfig?: {
						onlyTopCall?: boolean
						withLog?: boolean
					}
			  }
			| undefined,
	]
	ReturnType: CallTrace
}

export type CallTrace = {
	type: string
	from: string
	to: string
	value: string
	gas: string
	gasUsed: string
	input: string
	output: string
	method?: string
	calls?: CallTrace[]
}
