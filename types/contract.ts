import { IAIModels } from '@/components/contract/code-reader/types'

export enum ContractCompilerTypeEnum {
	// SoliditySourceCode = 'Solidity (Flattened source code)',
	SolidityFile = 'Solidity (Single file / Multi-Part files)',
	SolidityJson = 'Solidity (Standard-Json-Input)',
	VyperFile = 'Vyper (Single file / Multi-Part files)',
	VyperJson = 'Vyper (Standard-Json-Input)',
}

export enum ZkSyncContractCompilerTypeEnum {
	SoliditySourceCode = 'Solidity (Flattened source code)',
	// SolidityFile = 'Solidity (Single file / Multi-Part files)'
}

export enum ContractSubTabEnum {
	CODE = 'code',
	READ = 'read',
	WRITE = 'write',
	READ_AS_PROXY = 'read_as_proxy',
	WRITE_AS_PROXY = 'write_as_proxy',
}

export interface ICodeReaderFormKeys {
	api_key: string
	ai_model: IAIModels
	contract_address?: string
	source_code?: string
}
