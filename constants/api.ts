// status enum
export const VerifyStatus = {
	Pending: 1,
	Pass: 2,
	Fail: 3,
} as const

export const publicApiBasePath = '/beta'
export const redisApiKeysPrefix = 'api:ratelimit:'
