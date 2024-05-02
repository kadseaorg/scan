import { Queue, Worker } from 'bullmq'

import { VerifyStatus } from '@/constants/api'
import {
	getByteCode,
	insertVerifyStatus,
	updateContract,
	updateVerifyStatus,
} from '@/server/prisma'
import redis from '@/server/redis'
import {
	Lang,
	VerifyMultiPartParams,
	VerifyStandardJsonInputParams,
	verifyMultiPart,
	verifyStandardJsonInput,
} from '@/server/verify'

import startListening from '../server/listener'

startListening() // TODO: figure out a smarter way to start the listener

export interface VerifyJob {
	type: string
	lang: Lang
	params: StandardJsonVerifyParams | MultiPartVerifyParams
	sourceCode: string
	uid: string
}

export type StandardJsonVerifyParams = {
	contractaddress: string
	contractname: string
	compilerversion: string
	constructorArguements: unknown[] // You may replace this with a more specific type
}

export type MultiPartVerifyParams = {
	contractAddress: string
	compilerVersion: string
	evmVersion?: string
	optimizationRuns?: number
	sourceFiles: Record<string, string>
	libraries?: Record<string, string> // only for solidity
	interfaces?: Record<string, string> // only for vyper
}

export type VyperMultiPartVerifyParams = {
	contractAddress: string
	compilerVersion: string
	evmVersion?: string
	sourceFiles: Record<string, string>
}

// queue
export const queueName = 'VerifyContract'
export const queue = new Queue(queueName, { connection: redis })
export enum VerifyJobType {
	VerifyStandardJson = 'VerifyStandardJson',
	VerifyMultiPart = 'VerifyMultiPart',
}

const updateContractInfo = async (
	res: Response,
	job: any,
	contractAddress: string,
): Promise<void> => {
	try {
		const resData = await (res.headers
			.get('content-type')
			?.includes('application/json')
			? res.json()
			: res.text())

		if (res.ok && resData.status === 'SUCCESS') {
			await Promise.all([
				updateContract(
					job.name,
					job.data.lang,
					contractAddress,
					resData.source,
					job.data.sourceCode,
				),
				updateVerifyStatus(job.data.uid, VerifyStatus.Pass),
			])
		} else {
			console.error(
				`❌ Worker ${worker.name} job ${job?.id} - ${
					job?.name
				} failed(res): ${JSON.stringify(resData)}`,
			)
			await updateVerifyStatus(
				job.data.uid,
				VerifyStatus.Fail,
				JSON.stringify(resData),
			)
		}
	} catch (err) {
		console.error(
			`❌ Worker ${worker.name} job ${job?.id} - ${job?.name} failed: ${err}`,
		)
		await updateVerifyStatus(
			job.data.uid,
			VerifyStatus.Fail,
			JSON.stringify(err),
		)
	}
}

// worker
export const worker = new Worker<VerifyJob, any>(
	queueName,
	async (job) => {
		switch (job.name) {
			case VerifyJobType.VerifyStandardJson: {
				// insert status
				const verifyParams = job.data.params as StandardJsonVerifyParams
				await insertVerifyStatus(
					job.data.uid,
					VerifyStatus.Pending,
					verifyParams.contractaddress,
				)

				const bytecode = await getByteCode(verifyParams.contractaddress)
				const params: VerifyStandardJsonInputParams = {
					bytecode,
					bytecodeType: 'CREATION_INPUT', // TODO: support DEPLOYED_BYTECODE
					compilerVersion: verifyParams.compilerversion,
					input: job.data.sourceCode,
				}
				const res = await verifyStandardJsonInput(job.data.lang, params)
				await updateContractInfo(res, job, verifyParams.contractaddress)
				break
			}
			case VerifyJobType.VerifyMultiPart: {
				// insert status
				const { contractAddress, ...verifyParams } = job.data
					.params as MultiPartVerifyParams
				await insertVerifyStatus(
					job.data.uid,
					VerifyStatus.Pending,
					contractAddress,
				)

				const bytecode = await getByteCode(contractAddress)
				const params: VerifyMultiPartParams = {
					bytecode,
					bytecodeType: 'CREATION_INPUT', // TODO: support DEPLOYED_BYTECODE
					...verifyParams,
				}
				console.log('Verifying the contract(multipart) - input: ', params)
				const res = await verifyMultiPart(job.data.lang, params)
				await updateContractInfo(res, job, contractAddress)
				break
			}
			default:
				console.log(worker.name, 'Got job with unknown name', job.name)
				break
		}
	},
	{ connection: redis },
)

worker.on('completed', (job) => {
	console.info(
		'🎉 Worker',
		worker.name,
		'job',
		job.id,
		'-',
		job.name,
		'completed',
	)
})
worker.on('failed', (job, err) => {
	console.error(
		'❌ Worker',
		worker.name,
		'job',
		job?.id,
		'-',
		job?.name,
		'failed',
		err,
	)
})
worker.on('error', (err) => {
	console.error('🔥 Worker', worker.name, 'error', err)
})
worker.on('stalled', (jobId) => {
	console.warn('🚨 Worker', worker.name, 'job', jobId, 'stalled')
})
// worker.on('active', job => {
// console.info('Worker', worker.name, 'job', job.id, 'active')
// })
worker.on('paused', () => {
	console.warn('⏸️ Worker', worker.name, 'paused')
})
// worker.on('drained', () => {
// console.warn('Worker', worker.name, 'drained')
// })
