import { Prisma, PrismaClient } from '@/lib/generated/prisma/zksync_node'

declare global {
	var zkSyncNodePrisma:
		| PrismaClient<
				Prisma.PrismaClientOptions,
				'query' | 'info' | 'warn' | 'error'
		  >
		| undefined
}

const zkSyncNodePrisma =
	global.zkSyncNodePrisma ||
	new PrismaClient({
		log: [
			{
				emit: 'event',
				level: 'query',
			},
			{
				emit: 'stdout',
				level: 'error',
			},
			{
				emit: 'stdout',
				level: 'info',
			},
			{
				emit: 'stdout',
				level: 'warn',
			},
		],
	})

if (process.env.NODE_ENV === 'development')
	global.zkSyncNodePrisma = zkSyncNodePrisma

export default zkSyncNodePrisma
