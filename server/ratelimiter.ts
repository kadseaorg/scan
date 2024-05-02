import { TRPCError } from '@trpc/server'
import Redis, { Redis as RedisInstance } from 'ioredis'
import { LRUCache } from 'lru-cache'

import { redisApiKeysPrefix } from '@/constants/api'

import redis from './redis'
import sharePrisma from './share_prisma'

interface Headers {
	'X-RateLimit-Limit': number
	'X-RateLimit-Remaining': number
	'X-RateLimit-Reset': number
}

class RateLimiter {
	maxRequests: number
	perSeconds: number
	redis: RedisInstance

	constructor(
		maxRequests: number,
		perSeconds: number,
		redisInstance?: RedisInstance,
	) {
		this.maxRequests = maxRequests
		this.perSeconds = perSeconds
		this.redis = redisInstance || new Redis()
	}

	async isAllowed(token: string): Promise<boolean> {
		const key = `${redisApiKeysPrefix}${token}`
		const currentCount = await this.redis.incr(key)

		if (currentCount > this.maxRequests) {
			return false
		} else {
			if (currentCount === 1) {
				await this.redis.expire(key, this.perSeconds)
			}
			return true
		}
	}

	async getHeaders(token: string): Promise<Headers> {
		const key = `${redisApiKeysPrefix}${token}`
		const remaining = await this.redis.ttl(key)
		const currentLimit = await this.redis.get(key)

		return {
			'X-RateLimit-Limit': this.maxRequests,
			'X-RateLimit-Remaining': Math.max(
				0,
				Number(this.maxRequests) - Number(currentLimit),
			),
			'X-RateLimit-Reset': new Date(Date.now() + remaining * 1000).getTime(),
		}
	}
}

const rateLimiter = new RateLimiter(30, 1, redis)
// Set up the LRU cache
const lruCache = new LRUCache<string, boolean>({
	max: 500, // Define max cache size
	ttl: 1000 * 60 * 60, // Define max age of entries
})

async function verifyToken(token: string): Promise<boolean> {
	let tokenExists = lruCache.get(token)

	if (tokenExists === undefined) {
		// Check Redis
		const key = `${redisApiKeysPrefix}${token}`
		tokenExists = Boolean(await redis.exists(key))

		if (!tokenExists) {
			// Fall back to database query
			const res = await sharePrisma.api_keys.findUnique({
				where: { api_key: token },
				select: { api_key: true },
			})
			tokenExists = Boolean(res?.api_key)
		}

		lruCache.set(token, tokenExists)
	}

	return tokenExists
}

export const withRateLimiter = async ({ next, ctx }: any) => {
	const { req, res } = ctx
	// Extract token from the Authorization header
	let token: string | null = null
	if (
		req.headers.authorization &&
		req.headers.authorization.split(' ')[0] === 'Bearer'
	) {
		token = req.headers.authorization.split(' ')[1]
	}

	// If no token provided in Authorization header, consider as unauthorized
	if (!token || !(await verifyToken(token))) {
		throw new TRPCError({ code: 'UNAUTHORIZED' })
	}

	// Check if request should be allowed with rate limiting
	const isAllowed = await rateLimiter.isAllowed(token)
	const headers = await rateLimiter.getHeaders(token)

	res.setHeader('X-RateLimit-Limit', headers['X-RateLimit-Limit'])
	res.setHeader('X-RateLimit-Remaining', headers['X-RateLimit-Remaining'])
	res.setHeader('X-RateLimit-Reset', headers['X-RateLimit-Reset'])

	// If request is rate-limited - abort request
	if (!isAllowed) {
		throw new TRPCError({
			code: 'TOO_MANY_REQUESTS',
			message: 'Too many requests, please try again later.',
		})
	}

	// After ratelimit checking, continue with the next operation
	return next({ ctx: { ...ctx } })
}
