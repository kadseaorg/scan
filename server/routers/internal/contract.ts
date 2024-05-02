import { AbiCoder } from '@ethersproject/abi'
import { isAddress, toHex } from 'viem'
import { z } from 'zod'

import { VerifyStatus } from '@/constants/api'
import { isJson } from '@/lib/utils'
import zkSyncNodePrisma from '@/server/zksync_node_prisma'
import { generateUid } from '@/utils'
import { VerifyJobType, queue } from '@/worker'

import prisma, { wrapMethodNames } from '../../prisma'
import { internalProcedure, router } from '../../trpc'
import {
	Compiler,
	VerificationIncomingRequest,
	addContractVerificationRequest,
	getCompilerVersions,
	getZkSyncCompilerVersions,
} from '../../verify'
import { wrapTxAddressOnPublicTag } from './../../share_prisma'

const parser = require('@solidity-parser/parser')

export const contractRouter = router({
	getContractDetail: internalProcedure
		.input(z.string())
		.query(async ({ input }) => {
			const address = input.trim().toLowerCase()

			const contract = await prisma.contracts.findFirst({ where: { address } })
			if (!contract) {
				return null
			}

			let codeSources: { name: string; content: string }[] = []
			let outlineAst = null

			if (contract) {
				try {
					const { sourcecode } = contract
					if (isJson(sourcecode)) {
						const standardJson = JSON.parse(sourcecode as string)
						codeSources = Object.keys(standardJson?.sources)?.map((key) => ({
							name: key,
							content: standardJson?.sources?.[key]?.content,
						}))
					} else {
						codeSources = [
							{
								name: contract?.name,
								content: sourcecode,
							},
						] as any
					}
					if (codeSources.length === 1 && codeSources[0].content) {
						outlineAst = parser.parse(codeSources[0].content, { loc: true })
					} else if (codeSources.length > 1) {
						const children: any = []
						for (const source of codeSources) {
							if (source && source.content) {
								const ast = parser.parse(source.content, { loc: true })
								for (const child of ast.children) {
									if (child && ['interface', 'contract'].includes(child.kind)) {
										children.push(child)
									}
								}
							}
						}
						outlineAst = { children }
					}
				} catch (e) {
					console.log('Error parsing contract', e)
				}
				const token = await prisma.tokens.findFirst({ where: { address } })

				return {
					...contract,
					codeSources,
					outlineAst,
					token,
				}
			} else {
				return null
			}
		}),
	getContractTxs: internalProcedure
		.input(
			z.object({
				address: z.string(),
				take: z.number().int().max(50).default(20).optional(),
				cursor: z.number().nullish(),
				desc: z.boolean().default(true),
				status: z.string().optional(),
				from_addresses: z
					.array(z.object({ address: z.string(), include: z.boolean() }))
					.optional(),
				to_addresses: z
					.array(z.object({ address: z.string(), include: z.boolean() }))
					.optional(),
			}),
		)
		.query(async ({ input }) => {
			const address = input.address.trim().toLowerCase()
			const { take, cursor, desc, status, from_addresses, to_addresses } = input
			//fetch contract create tx
			const abiCoder = new AbiCoder()
			const encodedAddress = abiCoder.encode(['uint'], [address])

			let whereClause = `1 = 1`
			if (status !== undefined) {
				if (status === 'completed') {
					whereClause += `AND transactions.status = 1`
				} else if (status === 'failed') {
					whereClause += `AND transactions.status = 0`
				} else if (status === 'outgoing') {
					whereClause += `AND transactions.from_address = '${address}'`
				} else if (status === 'incoming') {
					whereClause += `AND transactions.to_address = '${address}'`
				} else if (status === 'creation') {
					const createTx = (await prisma.$queryRawUnsafe(`
          SELECT t.*, l1_batches.status AS l1_status
        FROM transactions t
        INNER JOIN contracts tl ON t.hash = tl.creation_tx_hash
        LEFT JOIN l1_batches ON t.l1_batch_number = l1_batches.number
        WHERE tl.address = '${address}';
          `)) as any[]

					const wrappedTxs = await wrapMethodNames([...createTx])
					let wrapTxAddressOnPublicTagTxs: any[] = wrappedTxs
					try {
						wrapTxAddressOnPublicTagTxs =
							await wrapTxAddressOnPublicTag(wrappedTxs)
					} catch (e) {
						console.log(e)
					}
					return {
						list: wrapTxAddressOnPublicTagTxs,
						nextCursor: null,
					}
				}
			}

			if (from_addresses !== undefined && from_addresses.length > 0) {
				for (const item of from_addresses) {
					item.include === true
						? (whereClause += ` AND transactions.from_address = '${item.address}'`)
						: (whereClause += ` AND transactions.from_address != '${item.address}'`)
				}
			}
			if (to_addresses !== undefined && to_addresses.length > 0) {
				for (const item of to_addresses) {
					item.include === true
						? (whereClause += ` AND transactions.from_address = '${item.address}'`)
						: (whereClause += ` AND transactions.from_address != '${item.address}'`)
				}
			}

			const sql = `
      SELECT transactions.*, l1_batches.status as l1_status
      FROM transactions
      LEFT JOIN l1_batches ON transactions.l1_batch_number = l1_batches.number
      WHERE transactions.to_address = '${address}'
      AND ${whereClause}
      ${
				cursor ? `AND transactions.timestamp ${desc ? '<' : '>'} ${cursor}` : ''
			}
      ORDER BY transactions.timestamp ${desc ? 'DESC' : 'ASC'}
      LIMIT ${take}
      `
			const txs = (await prisma.$queryRawUnsafe(sql)) as any[]

			if (take && txs.length < take) {
				// the last page
				const createTx = (await prisma.$queryRawUnsafe(`
        SELECT t.*, l1_batches.status AS l1_status
        FROM transactions t
        INNER JOIN contracts tl ON t.hash = tl.creation_tx_hash
        LEFT JOIN l1_batches ON t.l1_batch_number = l1_batches.number
        WHERE tl.address = '${address}';
        `)) as any[]
				txs.push(createTx[0])
			}

			const wrappedTxs = await wrapMethodNames([...txs])
			let wrapTxAddressOnPublicTagTxs: any[] = wrappedTxs
			try {
				wrapTxAddressOnPublicTagTxs = await wrapTxAddressOnPublicTag(wrappedTxs)
			} catch (e) {
				console.log(e)
			}
			return {
				list: wrapTxAddressOnPublicTagTxs,
				nextCursor:
					txs.length > 0 && txs.length === take
						? txs[txs.length - 1].timestamp
						: null,
			}
		}),
	getContractInternalTxs: internalProcedure
		.input(
			z.object({
				address: z.string(),
				take: z.number().int().max(50).default(20).optional(),
				cursor: z.number().nullish(),
				desc: z.boolean().default(true),
			}),
		)
		.query(async ({ input }) => {
			const address = input.address.trim().toLowerCase()
			const { take, cursor, desc } = input

			const txs = (await prisma.$queryRawUnsafe(`
                        SELECT *
                        FROM internal_transactions
                        WHERE (internal_transactions.from_address = '${address}' OR internal_transactions.to_address = '${address}')
                        ${
													cursor
														? `AND internal_transactions.timestamp ${
																desc ? '<' : '>'
														  } ${cursor}`
														: ''
												}
                        ORDER BY internal_transactions.timestamp ${
													desc ? 'DESC' : 'ASC'
												}
                        LIMIT ${take}
                        `)) as any[]
			let wrapTxAddressOnPublicTagTxs: any[] = txs
			try {
				wrapTxAddressOnPublicTagTxs = await wrapTxAddressOnPublicTag(txs)
			} catch (e) {}
			return {
				list: wrapTxAddressOnPublicTagTxs,
				nextCursor:
					txs.length > 0 && txs.length === take
						? txs[txs.length - 1].timestamp
						: null,
			}
		}),
	getCompilerVersions: internalProcedure
		.input(
			z.object({
				lang: z.enum(['solidity', 'vyper']).default('solidity'),
			}),
		)
		.query(async ({ input }) => {
			const res = await getCompilerVersions(input.lang)
			const jsonRes = await res.json()
			return jsonRes.compilerVersions
		}),
	verifyMultiPart: internalProcedure
		.input(
			z.object({
				lang: z.enum(['solidity', 'vyper']).default('solidity'),
				contractAddress: z.string().refine(isAddress, 'Invalid address'),
				compilerVersion: z.string(),
				sourceFiles: z.any(),
				evmVersion: z.string().optional(),
				optimizationRuns: z.number().optional(),
				libraries: z.record(z.string(), z.string()).optional(),
				interfaces: z.any().optional(),
			}),
		)
		.output(
			z.object({
				message: z.string(),
				result: z.string(),
				status: z.string(),
			}),
		)
		.mutation(async ({ input }) => {
			// TODO: Check if contract is already verified
			const uid = generateUid(input.contractAddress)
			try {
				await queue.add(VerifyJobType.VerifyMultiPart, {
					lang: input.lang,
					type: 'json_api',
					params: input,
					uid,
				})
			} catch (e) {
				console.error('Failed to add job to queue', e)
				return {
					message: 'Failed to add job to queue',
					result: uid,
					status: '0',
				}
			}

			return {
				message: 'OK',
				result: uid,
				status: '1',
			}
		}),
	// Etherscan style api for contract verification
	// ?module=contract&action=verifysourcecode&codeformat={solidity-standard-json-input}&contractaddress={contractaddress}&contractname={contractname}&compilerversion={compilerversion}&sourceCode={sourceCode}
	verifyStandardJson: internalProcedure
		.meta({
			openapi: {
				method: 'POST',
				path: '/contract',
				tags: ['Verification | Contract'],
				summary:
					'Etherscan style api for contract verification - verifysourcecode',
			},
		})
		.input(
			z.object({
				module: z.literal('contract'),
				action: z.literal('verifysourcecode'),
				contractaddress: z.string().length(42),
				sourceCode: z.string(),
				codeformat: z.enum([
					'solidity-standard-json-input',
					'vyper-standard-json-input',
				]),
				contractname: z.string(),
				compilerversion: z.string(),
				constructorArguements: z.string().optional(),
			}),
		)
		.output(
			z.object({
				message: z.string(),
				result: z.string(),
				status: z.string(),
			}),
		)
		.mutation(async ({ input }) => {
			// TODO: Check if contract is already verified
			console.log('verifyStandardJson', input)

			const uid = generateUid(input.contractaddress)
			await queue.add(VerifyJobType.VerifyStandardJson, {
				lang: input.codeformat.includes('vyper') ? 'vyper' : 'solidity',
				type: 'json_api',
				params: {
					contractaddress: input.contractaddress,
					contractname: input.contractname,
					compilerversion: input.compilerversion,
					constructorArguements: input.constructorArguements,
				},
				sourceCode: input.sourceCode,
				uid,
			})

			return {
				message: 'OK',
				result: uid,
				status: '1',
			}
		}),
	// ?module=contract&action=checkverifystatus&guid=0x95ad51f4406bf2AF31e3A2e2d75262EE19432261643b13f1
	checkverifystatus: internalProcedure
		.meta({
			openapi: {
				method: 'GET',
				path: '/contract',
				tags: ['Verification | Contract'],
				summary:
					'Etherscan style api for contract verification - checkverifystatus',
			},
		})
		.input(
			z.object({
				module: z.literal('contract'),
				action: z.literal('checkverifystatus'),
				guid: z.string(),
			}),
		)
		.output(
			z.object({
				message: z.string(),
				result: z.string(),
				status: z.string(),
			}),
		)
		.query(async ({ input }) => {
			const status = await prisma.contract_verify_job.findFirst({
				where: {
					uid: input.guid,
				},
				select: {
					status: true,
					failed_reason: true,
				},
			})
			let result = 'Pending in queue'
			switch (status?.status) {
				case VerifyStatus.Pass: {
					result = 'Pass - Verified'
					break
				}
				case VerifyStatus.Pending: {
					result = 'Pending in queue'
					break
				}
				case VerifyStatus.Fail: {
					result = 'Fail - Unable to verify, reason: ' + status.failed_reason
					break
				}
			}

			return {
				message: 'OK',
				result: result,
				status: '1',
			}
		}),
	// ?module=contract&action=getabi&address=0xa33319ad3eb90547b305c2922c15d646bc70d3b8
	getabi: internalProcedure
		.meta({
			openapi: {
				method: 'GET',
				path: '/beta/contract',
				tags: ['Verification | Contract'],
				summary: 'Etherscan style api for contract verification - getabi',
			},
		})
		.input(
			z.object({
				module: z.literal('contract'),
				action: z.literal('getabi'),
				address: z.string().length(42),
			}),
		)
		.output(
			z.object({
				message: z.string(),
				result: z.any(),
				status: z.string(),
			}),
		)
		.query(async ({ input }) => {
			const res = await prisma.contracts.findFirst({
				where: {
					address: input.address.toLowerCase(),
				},
				select: {
					abi: true,
				},
			})
			if (!res?.abi) {
				return {
					message: 'Contract abi not found',
					result: 'Contract source code not verified',
					status: '0',
				}
			}

			return {
				message: 'OK',
				result: res.abi,
				status: '1',
			}
		}),
	// zksync contract verification api for compatible with zksync-hardware-plugin
	getZkSyncSolcVersions: internalProcedure
		.meta({
			openapi: {
				method: 'GET',
				path: '/zksync_contract_verification/solc_versions',
				tags: ['Verification | Contract'],
				summary: 'zksync contract verification api - get solc versions',
			},
		})
		.input(z.object({}))
		.output(z.array(z.string()))
		.query(async () => {
			return await getZkSyncCompilerVersions(Compiler.Solc)
		}),
	getAllZkSyncCompilerVersions: internalProcedure
		.input(z.object({}))
		.output(z.record(z.string(), z.array(z.string())))
		.query(async () => {
			const compilerKeys = Object.values(Compiler)
			const versionsOfAllCompilers: Record<Compiler, string[]> = {
				[Compiler.ZkSolc]: [],
				[Compiler.Solc]: [],
				[Compiler.ZkVyper]: [],
				[Compiler.Vyper]: [],
			}

			for (const compiler of compilerKeys) {
				const versions = await getZkSyncCompilerVersions(compiler)
				versionsOfAllCompilers[compiler] = versions
			}

			return versionsOfAllCompilers
		}),
	verifyZkSyncContract: internalProcedure
		.meta({
			openapi: {
				method: 'POST',
				path: '/zksync_contract_verification',
				tags: ['Verification | Contract'],
				summary:
					'zksync style api for contract verification - verifysourcecode',
			},
		})
		.input(
			z.object({
				contractAddress: z.string().min(2), // Hex string
				sourceCode: z.any(),
				codeFormat: z.enum([
					'solidity-standard-json-input',
					'solidity-single-file',
				]),
				contractName: z.string(),
				compilerSolcVersion: z.string(),
				compilerZksolcVersion: z.string(),
				constructorArguments: z.string().optional(), // Hex string
				optimizationUsed: z.boolean().optional(),
			}),
		)
		.output(z.number())
		.mutation(async ({ input }) => {
			console.log('verifyZkSyncContract', JSON.stringify(input))

			const contractVerificationQuery: VerificationIncomingRequest = {
				contractAddress: Buffer.from(input.contractAddress.slice(2), 'hex'), // convert from hex to buffer
				sourceCodeData: {
					codeFormat: input.codeFormat,
					sourceCode: input.sourceCode,
				},
				contractName: input.contractName,
				compilerZksolcVersion: input.compilerZksolcVersion,
				compilerSolcVersion: input.compilerSolcVersion,
				optimizationUsed: input.optimizationUsed,
				constructorArguments: input.constructorArguments
					? Buffer.from(input.constructorArguments.slice(2), 'hex')
					: undefined, // convert from hex to buffer
			}

			try {
				const res = await addContractVerificationRequest(
					contractVerificationQuery,
				)
				return Number(res)
			} catch (e) {
				console.log('error', e)
				throw e
			}
		}),
	checkZkSyncVerifyStatus: internalProcedure
		.meta({
			openapi: {
				method: 'GET',
				path: '/zksync_contract_verification/{id}',
				tags: ['Verification | Contract'],
				summary:
					'zksync style api for contract verification - checkverifystatus',
			},
		})
		.input(z.object({ id: z.number() }))
		.output(
			z.object({
				status: z.string(),
				error: z.string().optional(),
			}),
		)
		.query(async ({ input }) => {
			const res =
				await zkSyncNodePrisma.contract_verification_requests.findFirst({
					where: {
						id: input.id,
					},
					select: {
						status: true,
						error: true,
						contract_address: true,
					},
				})

			// update explorer db contract if status is successful
			if (res?.status === 'successful') {
				const contract =
					await zkSyncNodePrisma.contracts_verification_info.findUnique({
						where: {
							address: res.contract_address,
						},
					})

				if (contract) {
					const hexAddress = toHex(res.contract_address)

					const info = contract?.verification_info as any

					await prisma.contracts.upsert({
						where: {
							address: hexAddress, // Assuming contract_address is a buffer
						},
						update: {
							is_verified: true,
							name: info.request.contractName.split(':')[1],
							sourcecode: JSON.stringify(info.request.sourceCode),
							abi: JSON.stringify(info.artifacts.abi),
							optimization: info.request.optimizationUsed,
							compiler_version: info.request.compilerSolcVersion,
							constructor_arguments: info.request.constructorArguments,
						},
						create: {
							address: hexAddress, // Assuming contract_address is a buffer
							is_verified: true,
							name: info.request.contractName.split(':')[1],
							sourcecode: JSON.stringify(info.request.sourceCode),
							abi: JSON.stringify(info.artifacts.abi),
							optimization: info.request.optimizationUsed,
							compiler_version: info.request.compilerSolcVersion,
							constructor_arguments: info.request.constructorArguments,
						},
					})

					console.log('updated contract in explorer db', hexAddress)
				}
			}
			return {
				status: res?.status || 'unknown',
				error: res?.error || undefined,
			}
		}),
	getVerifiedContracts: internalProcedure
		.input(
			z.object({
				take: z.number().int().max(50).default(20).optional(),
				cursor: z.number().nullish(),
			}),
		)
		.query(async ({ input }) => {
			const { take, cursor } = input

			const sql = `
      SELECT name, address, creator, creation_tx_hash, creation_timestamp, compiler_version, evm_version FROM contracts WHERE IS_VERIFIED = true
      ${cursor ? `AND creation_timestamp < ${cursor}` : ''}
      ORDER BY creation_timestamp DESC
      LIMIT ${take}
      `
			const contracts = (await prisma.$queryRawUnsafe(sql)) as any[]

			// TODO: find a efficient way to get txn count and balance
			// const txnPromises = contracts.map(contract => getContractTxnStats(contract.address))
			// const balancePromises = contracts.map(async contract => {
			//   const data = (await prisma.$queryRaw`
			//   SELECT * from address_balances WHERE address = ${contract.address}
			//             `) as { balance: number; address: string }[]
			//   return data[0]?.balance || 0
			// })

			// const txnObjList = await Promise.all(txnPromises)
			// const balanceObjList = await Promise.all(balancePromises)

			// const list = txnObjList.map((txnObj, i) => {
			//   return {
			//     ...contracts[i],
			//     balance: balanceObjList[0],
			//     txn_count: txnObj.total_count
			//   }
			// })

			return {
				list: contracts,
				nextCursor:
					contracts.length > 0 && contracts.length === take
						? contracts[contracts.length - 1].creation_timestamp
						: null,
			}
		}),
})
