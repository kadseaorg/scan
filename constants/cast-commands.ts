import { CHAIN_MAP, CHAIN_TYPE } from './chain'

interface Argument {
	name: string
	arg?: string
	description: string
	type: string
	placeholder?: string
	defaultValue?: string
	samples?: string[]
}

interface CastCommand {
	name: string
	description: string
	arguments?: Argument[]
	options?: Argument[]
}

const defaultRPC = CHAIN_MAP[CHAIN_TYPE].rpcUrl || 'Your RPC URL'

const abiCommands: CastCommand[] = [
	// ABI Commands
	{
		name: '4byte',
		description:
			'Get the function signatures for the given selector from https://sig.eth.samczsun.com.',
		arguments: [
			{
				name: 'sig',
				description: 'The selector to retrieve the function signature for.',
				type: 'string',
				placeholder: '4byte selector',
				samples: ['0xa9059cbb'],
			},
		],
	},
	{
		name: '4byte-decode',
		description:
			'Decode ABI-encoded calldata using https://sig.eth.samczsun.com.',
		arguments: [
			{
				name: 'calldata',
				description: 'The ABI-encoded calldata to decode.',
				type: 'string',
				placeholder: 'ABI-encoded calldata',
				samples: [
					'0xa9059cbb000000000000000000000000e78388b4ce79068e89bf8aa7f218ef6b9ab0e9d00000000000000000000000000000000000000000000000000174b37380cea000',
				],
			},
		],
	},
	{
		name: '4byte-event',
		description:
			'Get the event signature for a given topic 0 from https://sig.eth.samczsun.com.',
		arguments: [
			{
				name: 'topic_0',
				description: 'The topic 0 to retrieve the event signature for.',
				type: 'string',
				placeholder: 'topic 0',
				samples: [
					'0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
				],
			},
		],
	},
	{
		name: 'abi-encode',
		description:
			'ABI encode the given function arguments, excluding the selector.',
		arguments: [
			{
				name: 'sig',
				description:
					'The function signature in the form <function name>(<types...>).',
				type: 'string',
				placeholder: 'function signature',
				samples: ['someFunc(address,uint256)'],
			},
			{
				name: 'args',
				description: 'The function arguments to encode.',
				type: 'string[]',
				placeholder: 'function arguments',
				samples: ['0x0000000000000000000000000000000000000000 1'],
			},
		],
	},
	{
		name: 'calldata',
		description: 'ABI-encode a function with arguments.',
		arguments: [
			{
				name: 'sig',
				description:
					'The function signature in the form <function name>(<types...>).',
				type: 'string',
				placeholder: 'function signature',
				samples: ['someFunc(address,uint256)'],
			},
			{
				name: 'args',
				description: 'The function arguments to encode.',
				type: 'string[]',
				placeholder: 'function argument',
				samples: ['0x0000000000000000000000000000000000000000 1'],
			},
		],
	},
	{
		name: 'pretty-calldata',
		description: 'Pretty print calldata.',
		arguments: [
			{
				name: 'calldata',
				description: 'The calldata to pretty print.',
				type: 'string',
				samples: [
					'0xa9059cbb000000000000000000000000e78388b4ce79068e89bf8aa7f218ef6b9ab0e9d00000000000000000000000000000000000000000000000000174b37380cea000',
				],
			},
		],
	},
]

const eip1967Commands: CastCommand[] = [
	// eip-1967 Commands
	{
		name: 'admin',
		description: 'Fetch the EIP-1967 admin account.',
		arguments: [
			{
				name: 'WHO',
				description: 'The address you want to get the nonce for.',
				type: 'string',
				placeholder: 'address',
				samples: ['0xb75d7e84517e1504C151B270255B087Fd746D34C'],
			},
		],
		options: [
			{
				name: 'rpc',
				arg: '--rpc-url',
				description: 'The RPC endpoint to use.',
				type: 'string',
				defaultValue: defaultRPC,
				placeholder: defaultRPC,
			},
		],
	},
	{
		name: 'implementation',
		description: 'Fetch the EIP-1967 implementation account.',
		arguments: [
			{
				name: 'WHO',
				description: 'The address you want to get the nonce for.',
				type: 'string',
				placeholder: 'address',
				samples: ['0xb75d7e84517e1504C151B270255B087Fd746D34C'],
			},
		],
		options: [
			{
				name: 'rpc',
				arg: '--rpc-url',
				description: 'The RPC endpoint to use.',
				type: 'string',
				defaultValue: defaultRPC,
				placeholder: defaultRPC,
			},
		],
	},
]

const transactionCommands: CastCommand[] = [
	// transaction Commands
	{
		name: 'call',
		description:
			'Perform a call on an account without publishing a transaction.',
		arguments: [
			{
				name: 'to',
				description: 'The destination address or ENS name.',
				type: 'string',
				placeholder: 'address or ENS name',
				samples: ['0xa1EA0B2354F5A344110af2b6AD68e75545009a03'],
			},
			{
				name: 'sig',
				description: 'The function signature or selector and encoded calldata.',
				type: 'string',
				placeholder: 'function signature or selector and encoded calldata',
				samples: [
					'balanceOf(address)(uint256)',
					'0xcdba2fd40000000000000000000000000000000000000000000000000000000000007a69',
				],
			},
			{
				name: 'args',
				description: 'The function arguments.',
				type: 'string',
				placeholder: 'function argument',
				samples: ['0xa1EA0B2354F5A344110af2b6AD68e75545009a03'],
			},
		],
		options: [
			{
				name: 'rpc',
				arg: '--rpc-url',
				description: 'The RPC endpoint to use.',
				type: 'string',
				defaultValue: defaultRPC,
				placeholder: defaultRPC,
			},
		],
	},
	{
		name: 'estimate',
		description: 'Estimate the gas cost of a transaction.',
		arguments: [
			{
				name: 'to',
				description: 'The destination (to) can be an ENS name or an address.',
				type: 'string',
				samples: ['0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'],
			},
			{
				name: 'sig',
				description:
					'The signature (sig) can be a fragment (e.g. someFunction(uint256,bytes32)), a selector and encoded calldata (e.g. 0xcdba2fd40000000000000000000000000000000000000000000000000000000000007a69), or only the function name (in which case Cast will try to fetch the function signature from Etherscan).',
				type: 'string',
				samples: ['deposit()'],
			},
			{
				name: 'args',
				description: 'Arguments for the function call.',
				type: 'string[]',
			},
		],
		options: [
			{
				name: 'value(Ether)',
				arg: '--value',
				description:
					'Ether to send in the transaction. Either specified as an integer (wei), or as a string with a unit (e.g. 1ether, 10gwei, 0.01ether).',
				type: 'string',
				samples: ['1ether', '10gwei', '0.01ether'],
				defaultValue: '0.01ether',
			},
			{
				name: 'rpc',
				arg: '--rpc-url',
				description: 'The RPC endpoint to use.',
				type: 'string',
				defaultValue: defaultRPC,
				placeholder: defaultRPC,
			},
		],
	},
	{
		name: 'publish',
		description: 'Publish a raw transaction to the network.',
		arguments: [
			{
				name: 'tx',
				description: 'The raw pre-signed transaction to publish.',
				type: 'string',
			},
		],
		options: [
			{
				name: 'rpc',
				arg: '--rpc-url',
				description: 'The RPC endpoint to use.',
				type: 'string',
				defaultValue: defaultRPC,
				placeholder: defaultRPC,
			},
		],
	},
	{
		name: 'rpc',
		description: 'Perform a raw JSON-RPC request',
		arguments: [
			{
				name: 'method',
				description: 'The JSON-RPC method to call.',
				type: 'string',
				samples: ['eth_getBlockByNumber'],
			},
			{
				name: 'params',
				description: 'The parameters to pass to the JSON-RPC method.',
				type: 'string[]',
				samples: ['latest false'],
			},
		],
		options: [
			{
				name: 'rpc',
				arg: '--rpc-url',
				description: 'The RPC endpoint to use.',
				type: 'string',
				defaultValue: defaultRPC,
				placeholder: defaultRPC,
			},
		],
	},
]

const chainCommands: CastCommand[] = [
	// Chain Commands
	{
		name: 'chain',
		description: 'Get the symbolic chain name of the current chain.',
		options: [
			{
				name: 'rpc',
				arg: '--rpc-url',
				description: 'The RPC endpoint to use.',
				type: 'string',
				defaultValue: defaultRPC,
				placeholder: defaultRPC,
			},
		],
	},
	{
		name: 'chain-id',
		description: 'Get the chain ID.',
		options: [
			{
				name: 'rpc',
				arg: '--rpc-url',
				description: 'The RPC endpoint to use.',
				type: 'string',
				defaultValue: defaultRPC,
				placeholder: defaultRPC,
			},
		],
	},
	{
		name: 'client',
		description: 'Get the current client version.',
		options: [
			{
				name: 'rpc',
				arg: '--rpc-url',
				description: 'The RPC endpoint to use.',
				type: 'string',
				defaultValue: defaultRPC,
				placeholder: defaultRPC,
			},
		],
	},
]

const utilityCommands: CastCommand[] = [
	// Utility Commands
	{
		name: 'compute-address',
		description:
			'Compute the contract address from a given nonce and deployer address.',
		arguments: [
			{
				name: 'address',
				description: 'The deployer address.',
				type: 'string',
				placeholder: 'deployer address',
				samples: ['0xb75d7e84517e1504C151B270255B087Fd746D34C'],
			},
		],
		options: [
			{
				name: 'nonce',
				arg: '--nonce',
				description:
					'The nonce of the account. Defaults to the latest nonce, fetched from the RPC.',
				type: 'number',
				placeholder: 'nonce',
			},
			{
				name: 'rpc',
				arg: '--rpc-url',
				description: 'The RPC endpoint to use.',
				type: 'string',
				defaultValue: defaultRPC,
				placeholder: defaultRPC,
			},
		],
	},
	{
		name: 'create2',
		description: 'Generate a deterministic contract address using CREATE2',
		options: [
			{
				name: 'starts-with',
				arg: '--starts-with',
				description: 'Prefix for the contract address.',
				type: 'string',
				placeholder: 'HEX',
			},
			{
				name: 'ends-with',
				arg: '--ends-with',
				description: 'Suffix for the contract address.',
				type: 'string',
				placeholder: 'HEX',
			},
			{
				name: 'matching',
				arg: '--matching',
				description: 'Sequence that the address has to match',
				type: 'string',
				placeholder: 'HEX',
			},
			// {
			//   name: 'case-sensitive',
			//   arg: '--case-sensitive',
			//   description: '',
			//   type: 'boolean',
			//   placeholder: 'true'
			// },
			{
				name: 'deployer',
				arg: '--deployer=',
				description: 'Address of the contract deployer.',
				type: 'string',
				placeholder: 'ADDRESS',
			},
			{
				name: 'init-code',
				arg: '--init-code',
				description: 'Init code of the contract to be deployed.',
				type: 'string',
				defaultValue: '',
				placeholder: 'HEX',
			},
			{
				name: 'init-code-hash',
				arg: '--init-code-hash',
				description: 'Init code hash the contract to be deployed.',
				type: 'string',
				placeholder: 'HEX',
			},
		],
	},
	{
		name: 'index',
		description: 'Compute the storage slot location for an entry in a mapping.',
		arguments: [
			{
				name: 'key_type',
				description: 'The type of the mapping key.',
				type: 'string',
				samples: ['string'],
			},
			{
				name: 'key',
				description: 'The key of the mapping entry.',
				type: 'string',
				samples: ['"hello"'],
			},
			{
				name: 'slot',
				description: 'The slot number of the mapping.',
				type: 'string',
				samples: ['1'],
			},
		],
	},
	{
		name: 'keccak',
		description: 'Hash arbitrary data using keccak-256.',
		arguments: [
			{
				name: 'data',
				description: 'The data to hash.',
				type: 'string',
				samples: ['WAGMI'],
			},
		],
		options: [],
	},
	{
		name: 'sig',
		description: 'Get the selector for a function.',
		arguments: [
			{
				name: 'sig',
				description:
					'The function signature in the form <function name>(<types...>).',
				type: 'string',
				samples: ['transfer(address,uint256)'],
			},
		],
	},
	// TODO: Implement this until we don't split the input with spaces
	// {
	//   name: 'sig-event',
	//   description: 'Generate event signatures from event string.',
	//   arguments: [
	//     {
	//       name: 'event',
	//       description: 'The event string to generate the signature from.',
	//       type: 'string',
	//       samples: ['Transfer(address indexed from, address indexed to, uint256 amount)']
	//     }
	//   ]
	// },
]

const blockCommands: CastCommand[] = [
	// Block Commands
	{
		name: 'find-block',
		description: 'Get the block number closest to the provided timestamp.',
		arguments: [
			{
				name: 'timestamp',
				description: 'The timestamp to search for the closest block to.',
				type: 'string',
				placeholder: 'timestamp',
				samples: ['1687182062'],
			},
		],
		options: [
			{
				name: 'rpc',
				arg: '--rpc-url',
				description: 'The RPC endpoint to use.',
				type: 'string',
				defaultValue: defaultRPC,
				placeholder: defaultRPC,
			},
		],
	},
	{
		name: 'gas-price',
		description: 'Get the current gas price.',
		options: [
			{
				name: 'rpc',
				arg: '--rpc-url',
				description: 'The RPC endpoint to use.',
				type: 'string',
				defaultValue: defaultRPC,
				placeholder: defaultRPC,
			},
		],
	},
]

const accountCommands: CastCommand[] = [
	// Account Commands
	{
		name: 'nonce',
		description: 'Get the nonce for an account.',
		arguments: [
			{
				name: 'who',
				description: 'The address or ENS name of the account.',
				type: 'string',
				samples: ['0xb75d7e84517e1504C151B270255B087Fd746D34C'],
			},
		],
		options: [
			{
				name: 'rpc',
				arg: '--rpc-url',
				description: 'The RPC endpoint to use.',
				type: 'string',
				defaultValue: defaultRPC,
				placeholder: defaultRPC,
			},
		],
	},
	{
		name: 'proof',
		description: 'Generate a storage proof for a given storage slot.',
		arguments: [
			{
				name: 'address',
				description: 'The address or ENS name of the account.',
				type: 'string',
				samples: ['0xb75d7e84517e1504C151B270255B087Fd746D34C'],
			},
			{
				name: 'slots',
				description: 'The storage slots to generate proofs for.',
				type: 'string[]',
				samples: ['0'],
			},
		],
		options: [
			{
				name: 'rpc',
				arg: '--rpc-url',
				description: 'The RPC endpoint to use.',
				type: 'string',
				defaultValue: defaultRPC,
				placeholder: defaultRPC,
			},
		],
	},
	{
		name: 'storage',
		description: "Get the raw value of a contract's storage slot.",
		arguments: [
			{
				name: 'address',
				description:
					'The address of the contract. Can be an ENS name or an address.',
				type: 'string',
				samples: ['0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'],
			},
			{
				name: 'slot',
				description:
					'The storage slot to retrieve. Slot locations greater than 18446744073709551615 (u64::MAX) should be given as hex. Use cast index to compute mapping slots.',
				type: 'string',
				samples: ['0'],
			},
		],
		options: [
			{
				name: 'rpc',
				arg: '--rpc-url',
				description: 'The RPC endpoint to use.',
				type: 'string',
				defaultValue: defaultRPC,
				placeholder: defaultRPC,
			},
		],
	},
]

const conversionCommands: CastCommand[] = [
	// Conversion Commands
	{
		name: 'shl',
		description: 'Perform a left shifting operation.',
		arguments: [
			{
				name: 'value',
				description: 'The value to shift.',
				type: 'string',
				samples: ['61'],
			},
			{
				name: 'shift',
				description: 'The number of positions to shift the value.',
				type: 'number',
				samples: ['3'],
			},
		],
	},
	{
		name: 'shr',
		description: 'Perform a right shifting operation.',
		arguments: [
			{
				name: 'value',
				description: 'The value to shift.',
				type: 'string',
				samples: ['488'],
			},
			{
				name: 'shift',
				description: 'The number of positions to shift the value.',
				type: 'number',
				samples: ['3'],
			},
		],
	},
]

interface CastCommandGroup {
	name: string
	commands: CastCommand[]
}

const castCommandsGrouop: CastCommandGroup[] = [
	{
		name: 'ABI',
		commands: abiCommands,
	},
	{
		name: 'Block',
		commands: blockCommands,
	},
	{
		name: 'Chain',
		commands: chainCommands,
	},
	{
		name: 'Transaction',
		commands: transactionCommands,
	},
	{
		name: 'Utility',
		commands: utilityCommands,
	},
	{
		name: 'Account',
		commands: accountCommands,
	},
	{
		name: 'EIP-1967',
		commands: eip1967Commands,
	},
	{
		name: 'Conversion',
		commands: conversionCommands,
	},
]

const castCommands: CastCommand[] = castCommandsGrouop.reduce(
	(acc: CastCommand[], group: CastCommandGroup) => {
		return [...acc, ...group.commands]
	},
	[],
)

export { castCommands, castCommandsGrouop }
