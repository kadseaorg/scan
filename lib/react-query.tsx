// Utils

type RecursiveDeps<deps extends readonly unknown[]> = deps extends [
	infer dep,
	...infer rest,
]
	? [dep] | [dep, ...RecursiveDeps<rest>]
	: []

export function createQueryKey<
	key extends string,
	deps extends readonly unknown[],
>(id: key) {
	return (deps?: RecursiveDeps<deps>) =>
		[id, ...(deps ? deps : [])] as unknown as [key, ...deps]
}
