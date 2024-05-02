import { EventFragment, FunctionFragment, Interface } from '@ethersproject/abi'
import { hexDataSlice } from '@ethersproject/bytes'
import { keccak256 } from '@ethersproject/keccak256'
import { toUtf8Bytes } from '@ethersproject/strings'

import zkSyncNodePrisma from './zksync_node_prisma'

// lang enum
export enum Lang {
	Solidity = 'solidity',
	Vyper = 'vyper',
}

export type VerifyStandardJsonInputParams = {
	bytecode: string
	bytecodeType: string
	compilerVersion: string
	input: string
}

export type VerifyMultiPartParams = {
	bytecode: string
	bytecodeType: string
	compilerVersion: string
	evmVersion?: string
	optimizationRuns?: number
	sourceFiles: Record<string, string>
	libraries?: Record<string, string> // only for solidity
	interfaces?: Record<string, string> // only for vyper
}

export function verifyStandardJsonInput(
	lang: Lang,
	params: VerifyStandardJsonInputParams,
) {
	const api =
		process.env.VERIFICATION_URL +
		`/api/v2/verifier/${lang}/sources:verify-standard-json`

	return fetch(api, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(params),
	})
}

export function verifyMultiPart(lang: Lang, params: VerifyMultiPartParams) {
	const api =
		process.env.VERIFICATION_URL +
		`/api/v2/verifier/${lang}/sources:verify-multi-part`
	return fetch(api, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(params),
	})
}

export function getCompilerVersions(lang: string) {
	const api = process.env.VERIFICATION_URL + `/api/v2/verifier/${lang}/versions`
	return fetch(api, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
		},
	})
}

export type FunctionInfo = {
	hash: string
	name: string
	abi: any // Replace 'any' with the specific type based on your JSON structure.
}

export type EventInfo = {
	topic0: string
	name: string
	abi: any // Replace 'any' with the specific type based on your JSON structure.
}

function generateFunctionNormalName(abis: FunctionFragment[]): string {
	const functionList: string[] = []

	for (const data of abis[0].inputs) {
		if (data.type === 'tuple') {
			functionList.push(getInnerEvent(data.components))
		} else {
			if ('internalType' in data) {
				functionList.push(`${data.internalType} ${data.name}`)
			} else {
				functionList.push(`${data.type} ${data.name}`)
			}
		}
	}

	return `${abis[0].name}(${functionList.join(', ')})`
}

function getInnerEvent(inputs: any[]): string {
	const mlist: string[] = []
	let topic = 1

	for (const data of inputs) {
		let prefix = ''

		if ('indexed' in data && data.indexed === true) {
			prefix = `index_topic_${topic} `
			topic++
		}

		if (data.type === 'tuple') {
			mlist.push(prefix + getInnerEvent(data.components))
		} else {
			mlist.push(`${prefix}${data.type} ${data.name}`)
		}
	}

	return `( ${mlist.join(', ')} )`
}

function generateFunctionNormalEvent(abis: EventFragment[]): string {
	const eventName = abis[0].name
	const innerEvent = getInnerEvent(abis[0].inputs)

	return `${eventName}${innerEvent}`
}

export function parseContractEventAbi(abi: string): {
	functions: FunctionInfo[]
	events: EventInfo[]
} {
	const abiInterface = new Interface(abi)
	try {
		const stringifyFunc = (key: string, value: any) => {
			if (typeof key === 'string' && key.startsWith('_')) {
				return undefined
			}
			return value
		}

		return {
			functions: (
				abiInterface.fragments?.filter((fragment) =>
					FunctionFragment.isFunctionFragment(fragment),
				) as FunctionFragment[]
			)?.map((fragment) => {
				const functionSignature = fragment.format()
				return {
					hash: hexDataSlice(keccak256(toUtf8Bytes(functionSignature)), 0, 4),
					name: generateFunctionNormalName([fragment]),
					abi: JSON.stringify(fragment, stringifyFunc),
				}
			}),
			events: (
				abiInterface.fragments?.filter((fragment) =>
					EventFragment.isEventFragment(fragment),
				) as EventFragment[]
			)?.map((fragment) => {
				const eventFullName = generateFunctionNormalEvent([fragment])
				return {
					name: eventFullName,
					abi: JSON.stringify(fragment, stringifyFunc),
					topic0: abiInterface.getEventTopic(fragment),
				}
			}),
		}
	} catch (error) {
		console.log(error)
		throw error
	}
}

// zksync
export enum Compiler {
	ZkSolc = 'zksolc',
	Solc = 'solc',
	ZkVyper = 'zkvyper',
	Vyper = 'vyper',
}

export async function getZkSyncCompilerVersions(
	compiler: Compiler,
): Promise<string[]> {
	const versions = await zkSyncNodePrisma.compiler_versions.findMany({
		where: {
			compiler: compiler,
		},
		select: {
			version: true,
		},
	})

	if (versions) {
		versions.sort((a, b) => {
			// This sorts the versions in descending order. Syntax -1, 0, 1 for sort.
			const aVersions = a.version.split('.')
			const bVersions = b.version.split('.')

			for (let i = 0; i < aVersions.length; i++) {
				if (aVersions[i] !== bVersions[i]) {
					return Number(bVersions[i]) - Number(aVersions[i])
				}
			}

			return 0
		})

		return versions.map((version) => version.version)
	} else {
		return []
	}
}

export interface VerificationIncomingRequest {
	contractAddress: Buffer
	sourceCodeData: any // Replace with your actual structure
	contractName: string
	compilerZksolcVersion: string
	compilerSolcVersion: string
	optimizationUsed?: boolean
	constructorArguments?: Buffer
}

export async function addContractVerificationRequest(
	query: VerificationIncomingRequest,
): Promise<any> {
	const constructorArguments = query.constructorArguments
		? `E'\\\\x${query.constructorArguments.toString('hex')}'`
		: 'NULL'
	const optimizationUsed =
		query.optimizationUsed !== undefined ? query.optimizationUsed : false

	const queryString = `INSERT INTO contract_verification_requests (
          contract_address,
          source_code,
          contract_name,
          zk_compiler_version,
          compiler_version,
          optimization_used,
          constructor_arguments,
          is_system,
          status,
          created_at,
          updated_at
      )
      VALUES (
          E'\\\\x${query.contractAddress.toString('hex')}',
          '${JSON.stringify(query.sourceCodeData)}',
          '${query.contractName}',
          '${query.compilerZksolcVersion}',
          '${query.compilerSolcVersion}',
          ${optimizationUsed},
          ${constructorArguments},
          false,
          'queued',
          now(),
          now()
      )
      RETURNING id;`

	const result = (await zkSyncNodePrisma.$queryRawUnsafe(queryString)) as any[]
	return result[0]['id']
}
