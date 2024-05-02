import { Prisma, PrismaClient } from '@/lib/generated/prisma/external'

declare global {
	var externalPrisma:
		| PrismaClient<
				Prisma.PrismaClientOptions,
				'query' | 'info' | 'warn' | 'error'
		  >
		| undefined
}

const externalPrisma =
	global.externalPrisma ||
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
	global.externalPrisma = externalPrisma

export default externalPrisma
