const ROUTES = {
	LOGIN: '/login',
	HOME: '/',
	PORTAL: {
		BRIDGE: '/bridge/official',
		WALLET: {
			INDEX: '/wallet',
		},
		SWAP: '/swap',
		FAUCET: '/faucet',
	},
	FAUCET: '/faucet',
	BLOCK_CHAIN: {
		TXNS: '/txs',
		BRIDGE: '/bridge',
		PENDING_TXNS: '/txsPending',
		CONTRACT_TXNS: '/txsInternal',
		BLOCKS: '/blocks',
		BATCHES: '/batches',
		TopAccounts: '/top-accounts',
		VerifiedContracts: '/verified-contracts',
		DETAIL: {
			TX: '/tx/:tx',
			BLOCK: '/blocks/:block',
			BATCH: '/batches/:batch',
			ADDRESS: '/address/:address',
			TOKEN: '/token/:token',
			BATCH_BLOCKS: '/batches/:batch/blocks',
		},
	},
	CONTRACT: {
		VERIFY: '/verifyContract',
	},
	TOKENS: {
		ERC20: '/tokens',
		ERC20_TRANS: '/tokentxns',
		ERC721: '/tokens-nft',
		ERC721_TRANS: '/tokentxns-nft',
		ERC1155: '/tokens-nft1155',
		ERC1155_TRANS: '/tokentxns-nft1155',
	},
	INSCRIPTIONS: {
		INDEX: '/inscriptions',
		DETAIL: {
			INSCRIPTION: '/inscription/:tick',
		},
	},
	CHARTS: {
		INDEX: '/charts',
		DETAIL: '/charts/:chart',
	},
	DAPPS: {
		INDEX: '/dapps',
		DETAIL: {
			DAPP: '/dapp/:id',
		},
	},
	DEVTOOLS: {
		INDEX: '/devtools',
	},
	CODEREADER: {
		INDEX: '/code-reader',
	},
	LABEL: {
		INDEX: '/labels',
		LABEL: '/label/:name',
	},
	ACCOUNT: {
		MY_ACCOUNTS: '/account/my-accounts',
		WATCH_LIST: '/account/watch-list',
		NAME_TAGS: '/account/name-tags',
		TXN_PRIVATE_NOTES: '/account/txn-private-notes',
		API_KEY: '/account/api-key',
		FAVORITE_TOKENS: '/account/favorite-tokens',
		FAVORITE_DAPPS: '/account/favorite-dapps',
		SETTINGS: '/account/settings',
	},
}

export default ROUTES
