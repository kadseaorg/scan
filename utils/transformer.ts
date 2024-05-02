/**
 * If you need to add transformers for special data types like `Temporal.Instant` or `Temporal.Date`, `Decimal.js`, etc you can do so here.
 * Make sure to import this file rather than `superjson` directly.
 * @see https://github.com/blitz-js/superjson#recipes
 */
import SuperJSON from 'superjson'
import { SuperJSONResult, SuperJSONValue } from 'superjson/dist/types'
import { Decimal } from 'decimal.js'
import { isPlainObject, map, mapValues } from 'lodash-es'

export function replaceBigIntAndDecimalToNumber<T>(val: T): T {
	if (typeof val === 'bigint') {
		return Number(val) as unknown as T
	}

	if (Decimal.isDecimal(val)) {
		return val.toNumber() as unknown as T
	}

	if (Array.isArray(val)) {
		return map(val, replaceBigIntAndDecimalToNumber) as unknown as T
	}
	if (isPlainObject(val)) {
		return mapValues(
			val as object,
			replaceBigIntAndDecimalToNumber,
		) as unknown as T
	}

	return val
}

SuperJSON.registerCustom(
	{
		isApplicable: (v): v is Decimal => Decimal.isDecimal(v),
		serialize: (v) => v.toJSON(),
		deserialize: (v) => new Decimal(v),
	},
	'decimal',
)

export const transformer = {
	input: SuperJSON,
	output: {
		serialize: (object: SuperJSONValue) => {
			return SuperJSON.serialize(object)
		},

		deserialize(value: SuperJSONResult) {
			const parsed = SuperJSON.deserialize(value)
			return replaceBigIntAndDecimalToNumber(parsed)
		},
	},
}
